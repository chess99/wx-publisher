#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { cssUrlSources, normalizeCssUrlSource, validateWechatHtml } from "./validate-wechat-html.mjs"

function parseArgs(args) {
  const result = {
    html: null,
    title: null,
    cover: null,
    coverUrl: null,
    author: "",
    digest: "",
    dryRun: false,
    noUploadImages: false,
    pretty: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--dry-run") {
      result.dryRun = true
      continue
    }
    if (arg === "--no-upload-images") {
      result.noUploadImages = true
      continue
    }
    if (arg === "--pretty") {
      result.pretty = true
      continue
    }

    if (
      arg === "--html" ||
      arg === "--title" ||
      arg === "--cover" ||
      arg === "--cover-url" ||
      arg === "--author" ||
      arg === "--digest"
    ) {
      const value = args[index + 1]
      if (!value || value.startsWith("-")) {
        throw new Error(`${arg} requires a value`)
      }
      if (arg === "--html") result.html = value
      if (arg === "--title") result.title = value
      if (arg === "--cover") result.cover = value
      if (arg === "--cover-url") result.coverUrl = value
      if (arg === "--author") result.author = value
      if (arg === "--digest") result.digest = value
      index += 1
      continue
    }

    throw new Error(`unknown argument: ${arg}`)
  }

  if (!result.html) throw new Error("missing required --html argument")
  if (!result.title) throw new Error("missing required --title argument")
  if (result.cover && result.coverUrl) throw new Error("use only one of --cover or --cover-url")

  return result
}

function validateDigest(digest) {
  const length = Array.from(digest).length
  if (length > 120) {
    throw new Error(`digest cannot exceed 120 characters: received ${length}`)
  }
}

function printJson(payload, pretty = false) {
  process.stdout.write(`${JSON.stringify(payload, null, pretty ? 2 : 0)}\n`)
}

function parseTags(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b(?:"[^"]*"|'[^']*'|[^'">])*>`, "gi")
  return html.match(pattern) ?? []
}

function getAttributeValue(tag, attributeName) {
  const openTagMatch = tag.match(/^<\s*\/?\s*[a-zA-Z][\w:-]*/)
  if (!openTagMatch) return null
  const source = tag.slice(openTagMatch[0].length, tag.endsWith(">") ? -1 : undefined)
  const attributePattern = /\s+([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match

  while ((match = attributePattern.exec(source)) !== null) {
    if (match[1].toLowerCase() === attributeName.toLowerCase()) {
      return match[2] ?? match[3] ?? match[4] ?? ""
    }
  }

  return null
}

function imageSources(html) {
  return parseTags(html, "img")
    .map((tag) => getAttributeValue(tag, "src"))
    .filter((src) => src !== null)
}

function isWechatImageSource(src) {
  const lower = src.toLowerCase()
  return lower.includes("mmbiz.qpic.cn") || lower.includes("qpic.cn") || lower.includes("mmbiz/")
}

function isRemoteHttpSource(src) {
  return /^https?:\/\//i.test(src)
}

function isProtocolRelativeSource(src) {
  return src.trim().startsWith("//")
}

function toRemoteUploadUrl(src) {
  return isProtocolRelativeSource(src) ? `https:${src.trim()}` : src
}

function isSkippableImageSource(src) {
  const lower = src.trim().toLowerCase()
  return (
    lower === "" ||
    lower.startsWith("data:") ||
    lower.startsWith("blob:") ||
    isWechatImageSource(lower)
  )
}

function stripQueryAndHash(src) {
  const queryIndex = src.indexOf("?")
  const hashIndex = src.indexOf("#")
  const suffixIndexes = [queryIndex, hashIndex].filter((index) => index >= 0)
  const suffixStart = suffixIndexes.length > 0 ? Math.min(...suffixIndexes) : src.length
  return src.slice(0, suffixStart)
}

function resolveImagePath(src, htmlPath) {
  const cleanSrc = stripQueryAndHash(src)
  return isAbsolute(cleanSrc) ? cleanSrc : resolve(dirname(htmlPath), cleanSrc)
}

function unique(values) {
  return [...new Set(values)]
}

function articleImageSources(html) {
  return [...imageSources(html), ...cssUrlSources(html)]
}

function uploadCandidates(html, htmlPath) {
  return unique(articleImageSources(html)).filter((src) => {
    if (isSkippableImageSource(src)) return false
    if (isRemoteHttpSource(src) || isProtocolRelativeSource(src)) return true
    return existsSync(resolveImagePath(src, htmlPath))
  })
}

export function rewriteImageSources(html, replacements) {
  if (replacements.size === 0) return html

  return html.replace(/<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi, (tag) => {
    return tag.replace(/(\ssrc\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i, (match, prefix, doubleQuoted, singleQuoted, unquoted) => {
      const src = doubleQuoted ?? singleQuoted ?? unquoted ?? ""
      const replacement = replacements.get(src)
      if (!replacement) return match
      if (doubleQuoted !== undefined) return `${prefix}"${replacement}"`
      if (singleQuoted !== undefined) return `${prefix}'${replacement}'`
      return `${prefix}"${replacement}"`
    })
  })
}

function rewriteCssUrlValue(css, replacements, unquotedUrlQuote = '"') {
  if (replacements.size === 0) return css

  return css.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi, (match, doubleQuoted, singleQuoted, unquoted) => {
    const source = normalizeCssUrlSource(doubleQuoted ?? singleQuoted ?? unquoted ?? "")
    const replacement = replacements.get(source)
    if (!replacement) return match
    if (doubleQuoted !== undefined) return `url("${replacement}")`
    if (singleQuoted !== undefined) return `url('${replacement}')`
    return `url(${unquotedUrlQuote}${replacement}${unquotedUrlQuote})`
  })
}

export function rewriteCssUrlSources(html, replacements) {
  if (replacements.size === 0) return html

  const withStyleBlocks = html.replace(
    /(<style\b(?:"[^"]*"|'[^']*'|[^'">])*?>)([\s\S]*?)(<\/style\s*>)/gi,
    (match, open, css, close) => `${open}${rewriteCssUrlValue(css, replacements)}${close}`
  )

  return withStyleBlocks.replace(/<\s*[a-zA-Z][\w:-]*(?:"[^"]*"|'[^']*'|[^'">])*>/g, (tag) => {
    return tag.replace(
      /(\sstyle\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
      (match, prefix, doubleQuoted, singleQuoted, unquoted) => {
        const css = doubleQuoted ?? singleQuoted ?? unquoted ?? ""
        const quoteForUnquotedCssUrl = doubleQuoted !== undefined ? "'" : '"'
        const rewritten = rewriteCssUrlValue(css, replacements, quoteForUnquotedCssUrl)
        if (doubleQuoted !== undefined) return `${prefix}"${rewritten}"`
        if (singleQuoted !== undefined) return `${prefix}'${rewritten}'`
        return `${prefix}"${rewritten}"`
      }
    )
  })
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return {}
  }
}

function loadCredentials() {
  const globalConfig = readJsonIfExists(join(homedir(), ".config", "wx-publisher", "config.json"))
  const localConfig = readJsonIfExists(resolve(process.cwd(), ".wxp.json"))
  const fileConfig = { ...globalConfig, ...localConfig }
  const appid = process.env.WXP_APPID || process.env.WECHAT_APPID || fileConfig.wechat_appid || ""
  const secret = process.env.WXP_SECRET || process.env.WECHAT_SECRET || fileConfig.wechat_secret || ""

  return { appid, secret }
}

async function writePlaceholderCover() {
  const { PLACEHOLDER_COVER_BASE64, PLACEHOLDER_COVER_FILENAME } = await import(
    "../../../dist/converter/placeholder-cover.js"
  )
  const dir = mkdtempSync(join(tmpdir(), "wxp-placeholder-cover-"))
  const filePath = join(dir, PLACEHOLDER_COVER_FILENAME)
  writeFileSync(filePath, Buffer.from(PLACEHOLDER_COVER_BASE64, "base64"))
  return filePath
}

async function uploadCover(client, args) {
  if (args.cover) {
    const coverPath = resolve(process.cwd(), args.cover)
    const result = await client.uploadImage(coverPath)
    return {
      thumbMediaId: result.media_id,
      usedPlaceholderCover: false,
      coverSource: coverPath,
    }
  }

  if (args.coverUrl) {
    const result = await client.uploadImageFromUrl(args.coverUrl)
    return {
      thumbMediaId: result.media_id,
      usedPlaceholderCover: false,
      coverSource: args.coverUrl,
    }
  }

  const placeholderPath = await writePlaceholderCover()
  const result = await client.uploadImage(placeholderPath)
  return {
    thumbMediaId: result.media_id,
    usedPlaceholderCover: true,
    coverSource: placeholderPath,
  }
}

async function uploadAndRewriteImages(client, html, htmlPath, noUploadImages) {
  const sources = articleImageSources(html)
  const candidates = noUploadImages ? [] : uploadCandidates(html, htmlPath)
  const replacements = new Map()
  const uploaded = []
  const warnings = []

  for (const src of candidates) {
    try {
      const result = isRemoteHttpSource(src) || isProtocolRelativeSource(src)
        ? await client.uploadImageFromUrl(toRemoteUploadUrl(src))
        : await client.uploadImage(resolveImagePath(src, htmlPath))

      if (result.url) {
        replacements.set(src, result.url)
        uploaded.push({ source: src, url: result.url })
      } else {
        warnings.push(`uploaded image but WeChat did not return a replacement URL: ${src}`)
      }
    } catch (error) {
      throw new Error(`failed to upload article image ${src}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return {
    html: rewriteCssUrlSources(rewriteImageSources(html, replacements), replacements),
    imageCount: sources.length,
    uploaded,
    warnings,
  }
}

async function main() {
  let pretty = false

  try {
    const args = parseArgs(process.argv.slice(2))
    pretty = args.pretty
    validateDigest(args.digest)
    const htmlPath = resolve(process.cwd(), args.html)
    const html = await readFile(htmlPath, "utf8")
    const validation = validateWechatHtml(html, { filePath: htmlPath })

    if (!validation.success) {
      printJson({
        success: false,
        error: "HTML validation failed",
        details: validation.data.errors.join("; "),
        data: validation.data,
      }, pretty)
      process.exitCode = 1
      return
    }

    const images = articleImageSources(html)
    const candidates = uploadCandidates(html, htmlPath)
    const coverSource = args.cover ? resolve(process.cwd(), args.cover) : args.coverUrl || null

    if (args.dryRun) {
      printJson({
        success: true,
        data: {
          dry_run: true,
          html: htmlPath,
          title: args.title,
          author: args.author || null,
          digest: args.digest || null,
          image_count: images.length,
          upload_images: !args.noUploadImages,
          would_upload_image_count: args.noUploadImages ? 0 : candidates.length,
          cover: coverSource,
          used_placeholder_cover: !coverSource,
          warnings: validation.data.warnings,
          message: "dry run only; no credentials, network, uploads, or draft creation attempted",
        },
      }, pretty)
      return
    }

    const credentials = loadCredentials()
    if (!credentials.appid || !credentials.secret) {
      throw new Error("missing WeChat credentials: set WXP_APPID/WXP_SECRET, WECHAT_APPID/WECHAT_SECRET, or wx-publisher config")
    }

    const { WechatClient } = await import("../../../dist/wechat/client.js")
    const client = new WechatClient(credentials)
    const cover = await uploadCover(client, args)
    const rewrite = await uploadAndRewriteImages(client, html, htmlPath, args.noUploadImages)
    const finalValidation = validateWechatHtml(rewrite.html, { filePath: htmlPath })

    if (!finalValidation.success) {
      printJson({
        success: false,
        error: "HTML validation failed after image rewrite",
        details: finalValidation.data.errors.join("; "),
        data: finalValidation.data,
      }, pretty)
      process.exitCode = 1
      return
    }

    const draft = await client.createDraft([
      {
        title: args.title,
        author: args.author,
        digest: args.digest,
        content: rewrite.html,
        thumb_media_id: cover.thumbMediaId,
        need_open_comment: 0,
        only_fans_can_comment: 0,
      },
    ])

    printJson({
      success: true,
      data: {
        media_id: draft.media_id,
        title: args.title,
        image_count: rewrite.imageCount,
        images_uploaded: rewrite.uploaded.length,
        uploaded_images: rewrite.uploaded,
        image_upload_disabled: args.noUploadImages,
        used_placeholder_cover: cover.usedPlaceholderCover,
        cover: cover.coverSource,
        warnings: [...validation.data.warnings, ...rewrite.warnings],
        message: "草稿已创建，请在微信公众号后台发布",
      },
    }, pretty)
  } catch (error) {
    printJson({
      success: false,
      error: "Draft publish failed",
      details: error instanceof Error ? error.message : String(error),
    }, pretty)
    process.exitCode = 1
  }
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await main()
}
