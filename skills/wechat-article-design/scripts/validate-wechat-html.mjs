#!/usr/bin/env node

import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { dirname, isAbsolute, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const FORBIDDEN_TAGS = ["script", "iframe", "object", "embed", "link"]
const NAMED_CHARACTER_REFERENCES = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["colon", ":"],
  ["gt", ">"],
  ["lt", "<"],
  ["newline", "\n"],
  ["tab", "\t"],
  ["quot", '"'],
])

function uniquePush(list, value) {
  if (!list.includes(value)) {
    list.push(value)
  }
}

function getAttributeValue(tag, attributeName) {
  const attribute = parseAttributes(tag).find((candidate) => {
    return candidate.name.toLowerCase() === attributeName.toLowerCase()
  })
  return attribute?.value ?? null
}

function parseTags(html) {
  const tags = []
  const tagPattern = /<\s*(\/?)\s*([a-zA-Z][\w:-]*)(?:"[^"]*"|'[^']*'|[^'">])*>/g
  let match

  while ((match = tagPattern.exec(html)) !== null) {
    tags.push({
      raw: match[0],
      closing: match[1] === "/",
      name: match[2].toLowerCase(),
    })
  }

  return tags
}

function parseAttributes(tag) {
  const attributes = []
  const openTagMatch = tag.match(/^<\s*\/?\s*[a-zA-Z][\w:-]*/)
  if (!openTagMatch) {
    return attributes
  }

  const source = tag.slice(openTagMatch[0].length, tag.endsWith(">") ? -1 : undefined)
  const attributePattern = /\s+([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match

  while ((match = attributePattern.exec(source)) !== null) {
    attributes.push({
      name: match[1],
      value: match[2] ?? match[3] ?? match[4] ?? "",
    })
  }

  return attributes
}

function isIgnoredImageSource(src) {
  const trimmed = src.trim()
  const lower = trimmed.toLowerCase()

  return (
    lower === "" ||
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("//") ||
    lower.startsWith("data:") ||
    lower.startsWith("blob:") ||
    lower.includes("mmbiz.qpic.cn") ||
    lower.includes("qpic.cn") ||
    lower.includes("mmbiz/")
  )
}

function isRemoteHttpSource(src) {
  return /^https?:\/\//i.test(src.trim())
}

function isProtocolRelativeSource(src) {
  return src.trim().startsWith("//")
}

function isDataOrBlobSource(src) {
  const lower = src.trim().toLowerCase()
  return lower.startsWith("data:") || lower.startsWith("blob:")
}

function stripQueryAndHash(src) {
  const queryIndex = src.indexOf("?")
  const hashIndex = src.indexOf("#")
  const suffixIndexes = [queryIndex, hashIndex].filter((index) => index >= 0)
  const suffixStart = suffixIndexes.length > 0 ? Math.min(...suffixIndexes) : src.length
  return src.slice(0, suffixStart)
}

function decodeHtmlCharacterReferences(value) {
  return value.replace(
    /&(?:#(\d+);?|#x([0-9a-f]+);?|([a-z]+);)/gi,
    (reference, decimal, hex, namedReference) => {
      if (decimal) {
        return String.fromCodePoint(Number.parseInt(decimal, 10))
      }
      if (hex) {
        return String.fromCodePoint(Number.parseInt(hex, 16))
      }

      const named = NAMED_CHARACTER_REFERENCES.get(namedReference.toLowerCase())
      return named ?? reference
    }
  )
}

export function normalizeCssUrlSource(value) {
  const decoded = decodeHtmlCharacterReferences(value).trim()
  const quote = decoded[0]

  if ((quote === '"' || quote === "'") && decoded.endsWith(quote)) {
    return decoded.slice(1, -1).trim()
  }

  return decoded
}

function validateLocalImages(html, filePath, errors, warnings) {
  const baseDir = filePath ? dirname(filePath) : null
  for (const tag of parseTags(html)) {
    if (tag.closing || tag.name !== "img") {
      continue
    }

    const src = getAttributeValue(tag.raw, "src")

    if (src === null) {
      continue
    }

    if (isDataOrBlobSource(src)) {
      warnings.push(`image src uses non-uploadable data/blob asset: ${src}`)
      continue
    }

    if (isProtocolRelativeSource(src)) {
      warnings.push(`image src uses protocol-relative asset that should be uploaded or rewritten before publishing: ${src}`)
      continue
    }

    if (isIgnoredImageSource(src)) {
      continue
    }

    if (!baseDir) {
      continue
    }

    const localSrc = stripQueryAndHash(src)
    if (localSrc.trim() === "") {
      continue
    }

    const imagePath = isAbsolute(localSrc) ? localSrc : resolve(baseDir, localSrc)
    if (!existsSync(imagePath)) {
      errors.push(`local image does not exist: ${src}`)
    }
  }
}

function isJavaScriptUrl(value) {
  return normalizeCssUrlSource(value)
    .trim()
    .replace(/[\u0000-\u0020]+/g, "")
    .toLowerCase()
    .startsWith("javascript:")
}

function extractCssUrlsFromCss(css) {
  const urls = []
  const urlPattern = /url\(/gi
  let match

  while ((match = urlPattern.exec(css)) !== null) {
    let cursor = urlPattern.lastIndex
    while (cursor < css.length && /\s/.test(css[cursor])) {
      cursor += 1
    }

    const quote = css[cursor]
    if (quote === '"' || quote === "'") {
      const valueStart = cursor + 1
      let valueEnd = valueStart
      while (valueEnd < css.length) {
        if (css[valueEnd] === "\\" && valueEnd + 1 < css.length) {
          valueEnd += 2
          continue
        }
        if (css[valueEnd] === quote) {
          break
        }
        valueEnd += 1
      }

      urls.push(normalizeCssUrlSource(css.slice(valueStart, valueEnd)))
      urlPattern.lastIndex = valueEnd + 1
      continue
    }

    const valueStart = cursor
    let valueEnd = valueStart
    while (valueEnd < css.length && css[valueEnd] !== ")") {
      valueEnd += 1
    }

    urls.push(normalizeCssUrlSource(css.slice(valueStart, valueEnd)))
    urlPattern.lastIndex = valueEnd + 1
  }

  return urls
}

export function cssUrlSources(html) {
  const sources = []

  for (const tag of parseTags(html)) {
    if (tag.closing) {
      continue
    }

    const style = getAttributeValue(tag.raw, "style")
    if (style !== null) {
      sources.push(...extractCssUrlsFromCss(style))
    }
  }

  const styleBlockPattern = /<style\b(?:"[^"]*"|'[^']*'|[^'">])*?>([\s\S]*?)<\/style\s*>/gi
  let match
  while ((match = styleBlockPattern.exec(html)) !== null) {
    sources.push(...extractCssUrlsFromCss(match[1]))
  }

  return sources
}

function validateCssUrls(html, filePath, errors, warnings) {
  const baseDir = filePath ? dirname(filePath) : null

  for (const src of cssUrlSources(html)) {
    if (src.trim() === "") {
      continue
    }

    if (isJavaScriptUrl(src)) {
      errors.push("forbidden javascript: URL detected in CSS url()")
      continue
    }

    if (isDataOrBlobSource(src)) {
      warnings.push(`CSS url() uses non-uploadable data/blob asset: ${src}`)
      continue
    }

    if (isRemoteHttpSource(src) || isProtocolRelativeSource(src)) {
      warnings.push(`CSS url() uses remote asset that should be uploaded or rewritten before publishing: ${src}`)
      continue
    }

    if (!baseDir) {
      continue
    }

    const localSrc = stripQueryAndHash(src)
    if (localSrc.trim() === "") {
      continue
    }

    const assetPath = isAbsolute(localSrc) ? localSrc : resolve(baseDir, localSrc)
    if (!existsSync(assetPath)) {
      errors.push(`local CSS url() asset does not exist: ${src}`)
    }
  }
}

export function validateWechatHtml(html, options = {}) {
  const errors = []
  const warnings = []
  const tags = parseTags(html)

  for (const tagName of FORBIDDEN_TAGS) {
    if (tags.some((tag) => tag.name === tagName)) {
      errors.push(`forbidden tag detected: <${tagName}>`)
    }
  }

  for (const tag of tags) {
    if (tag.closing) {
      continue
    }

    for (const attribute of parseAttributes(tag.raw)) {
      if (/^on[a-z][\w:-]*$/i.test(attribute.name)) {
        uniquePush(errors, `inline event handler attribute detected: ${attribute.name}`)
      }
      if (isJavaScriptUrl(attribute.value)) {
        errors.push(`forbidden javascript: URL attribute detected: ${attribute.name}`)
      }
    }
  }

  if (/<\s*style\b/i.test(html)) {
    warnings.push("<style> blocks may not be preserved by WeChat")
  }
  if (/\bposition\s*:\s*fixed\b/i.test(html)) {
    warnings.push("risky CSS detected: position: fixed")
  }
  if (/\banimation(?:-[a-z-]+)?\s*:|@keyframes\b/i.test(html)) {
    warnings.push("risky CSS detected: animation or @keyframes")
  }
  if (/@font-face\b/i.test(html)) {
    warnings.push("risky CSS detected: @font-face")
  }
  if (/@import\b/i.test(html)) {
    warnings.push("risky CSS detected: @import")
  }

  validateLocalImages(html, options.filePath, errors, warnings)
  validateCssUrls(html, options.filePath, errors, warnings)

  const valid = errors.length === 0
  return {
    success: valid,
    data: {
      valid,
      errors,
      warnings,
    },
  }
}

function parseArgs(args) {
  const result = {
    file: null,
    pretty: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--pretty") {
      result.pretty = true
      continue
    }

    if (arg === "--file" || arg === "-f") {
      const value = args[index + 1]
      if (!value || value.startsWith("-")) {
        throw new Error(`${arg} requires a file path`)
      }
      result.file = value
      index += 1
      continue
    }

    throw new Error(`unknown argument: ${arg}`)
  }

  if (!result.file) {
    throw new Error("missing required --file argument")
  }

  return result
}

function printJson(payload, pretty) {
  process.stdout.write(`${JSON.stringify(payload, null, pretty ? 2 : 0)}\n`)
}

async function main() {
  let pretty = false

  try {
    const args = parseArgs(process.argv.slice(2))
    pretty = args.pretty
    const filePath = resolve(process.cwd(), args.file)
    const html = await readFile(filePath, "utf8")
    const payload = validateWechatHtml(html, { filePath })

    printJson(payload, pretty)
    process.exitCode = payload.success ? 0 : 1
  } catch (error) {
    const payload = {
      success: false,
      error: "HTML validation failed",
      details: error instanceof Error ? error.message : String(error),
    }

    printJson(payload, pretty)
    process.exitCode = 1
  }
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await main()
}
