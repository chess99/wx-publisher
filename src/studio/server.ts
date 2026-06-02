import { createServer, type IncomingMessage, type Server, type ServerResponse } from "http"
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync, unlinkSync } from "fs"
import { dirname, extname, isAbsolute, join, resolve } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { spawn } from "child_process"
import { fileURLToPath } from "url"
import { convertMarkdown } from "../converter/index.js"
import { getTheme, hasTheme, listThemes, type Theme } from "../converter/themes.js"
import { getPlaceholderCoverBase64 } from "../converter/placeholder-cover.js"
import { loadConfig, validateConfig } from "../config/index.js"
import { WechatClient } from "../wechat/client.js"
import { formatCliError } from "../cli/errors.js"
import { ENHANCED_ADVANCED_MODULES, PUBLIC_ADVANCED_MODULES } from "../converter/advanced-layout/parser.js"
import { deriveStudioTheme, type StudioThemeSettings } from "./theme-settings.js"

export interface CreateStudioServerOptions {
  articlePath: string
  host?: string
  port?: number
  openBrowser?: boolean
  staticDir?: string
}

export interface StudioServer {
  host: string
  port: number
  url: string
  close: () => Promise<void>
}

interface StudioRequestPayload {
  markdown?: unknown
  theme?: unknown
  themeSettings?: unknown
  title?: unknown
  author?: unknown
  digest?: unknown
  cover?: unknown
}

interface StudioCoverPayload {
  type?: unknown
  value?: unknown
}

interface StudioEnvelope {
  success: boolean
  [key: string]: unknown
}

export async function createStudioServer(options: CreateStudioServerOptions): Promise<StudioServer> {
  const host = options.host ?? "127.0.0.1"
  const articlePath = resolve(options.articlePath)
  if (!existsSync(articlePath)) {
    throw new Error(`Markdown 文件不存在: ${options.articlePath}`)
  }

  const articleDir = dirname(articlePath)
  const staticDir = options.staticDir ?? defaultStaticDir()
  const server = createServer((req, res) => {
    void handleRequest(req, res, { articlePath, articleDir, staticDir })
  })
  const port = await listen(server, host, options.port ?? 0)
  const url = `http://${host}:${port}`

  if (options.openBrowser !== false) {
    openUrl(url)
  }

  return {
    host,
    port,
    url,
    close: () => new Promise(resolveClose => server.close(() => resolveClose())),
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  context: { articlePath: string; articleDir: string; staticDir: string },
): Promise<void> {
  try {
    const url = new URL(req.url ?? "/", "http://127.0.0.1")
    if (req.method === "GET" && url.pathname === "/api/state") {
      return json(res, 200, buildState(context.articlePath))
    }
    if (req.method === "POST" && url.pathname === "/api/convert") {
      return json(res, 200, await handleConvert(await readJson(req)))
    }
    if (req.method === "POST" && url.pathname === "/api/publish") {
      const result = await handlePublish(await readJson(req), context.articleDir)
      return json(res, result.success ? 200 : 400, result)
    }
    if (req.method === "GET" || req.method === "HEAD") {
      return serveStatic(req, res, context.staticDir, url.pathname)
    }
    return json(res, 404, { success: false, error: "Not found" })
  } catch (error) {
    const status = error instanceof StudioRequestError ? error.status : 500
    return json(res, status, error instanceof StudioRequestError
      ? formatCliError(error.message)
      : formatCliError("Studio request failed", String(error)))
  }
}

function buildState(articlePath: string): { success: true; data: unknown } {
  const config = loadConfig()
  return {
    success: true,
    data: {
      article: {
        path: articlePath,
        name: articlePath.split("/").pop() ?? articlePath,
        markdown: readFileSync(articlePath, "utf-8"),
      },
      themes: listThemes().map(name => {
        const theme = getTheme(name)
        return { name: theme.name, description: theme.description }
      }),
      advancedModules: {
        public: PUBLIC_ADVANCED_MODULES,
        enhanced: ENHANCED_ADVANCED_MODULES,
        total: PUBLIC_ADVANCED_MODULES.length + ENHANCED_ADVANCED_MODULES.length,
      },
      config: {
        wechat_appid: config.wechat_appid || "(未设置)",
        wechat_secret_configured: Boolean(config.wechat_secret),
        default_theme: config.default_theme,
      },
    },
  }
}

async function handleConvert(payload: unknown): Promise<{ success: true; data: unknown }> {
  const request = asPayload(payload)
  const markdown = stringField(request.markdown, "")
  const theme = resolveStudioTheme(request.theme, request.themeSettings)
  const result = await convertMarkdown(markdown, {
    theme: theme.name,
    themeDefinition: theme,
  })

  return {
    success: true,
    data: {
      html: result.html,
      externalImages: result.externalImages,
      localImages: result.localImages,
    },
  }
}

async function handlePublish(payload: unknown, articleDir: string): Promise<StudioEnvelope> {
  const request = asPayload(payload)
  const markdown = stringField(request.markdown, "")
  const title = stringField(request.title, extractTitle(markdown) ?? "未命名文章").trim() || "未命名文章"
  const author = optionalString(request.author)
  const digest = optionalString(request.digest)

  if (digest && Array.from(digest).length > 120) {
    return formatCliError("摘要不能超过 120 个字符", { length: Array.from(digest).length, max: 120 }) as unknown as StudioEnvelope
  }

  const theme = resolveStudioTheme(request.theme, request.themeSettings)
  const config = loadConfig()
  const errors = validateConfig(config)
  if (errors.length > 0) {
    return formatCliError("配置不完整", errors) as unknown as StudioEnvelope
  }
  const client = new WechatClient({ appid: config.wechat_appid, secret: config.wechat_secret })
  const converted = await convertMarkdown(markdown, {
    theme: theme.name,
    themeDefinition: theme,
  })

  let thumbMediaId: string
  let usedPlaceholderCover = false
  const cover = asCoverPayload(request.cover)
  if (cover.type === "path" && cover.value) {
    const upload = await client.uploadImage(resolve(String(cover.value)))
    thumbMediaId = upload.media_id
  } else if (cover.type === "url" && cover.value) {
    const upload = await client.uploadImageFromUrl(String(cover.value))
    thumbMediaId = upload.media_id
  } else {
    const tmpPath = resolve(tmpdir(), `wx-publisher-placeholder-${randomUUID()}.png`)
    writeFileSync(tmpPath, Buffer.from(getPlaceholderCoverBase64(), "base64"))
    try {
      const upload = await client.uploadImage(tmpPath)
      thumbMediaId = upload.media_id
      usedPlaceholderCover = true
    } finally {
      try { unlinkSync(tmpPath) } catch {}
    }
  }

  let finalHtml = converted.html
  const imageMap = new Map<string, string>()
  for (const imgUrl of converted.externalImages) {
    const uploaded = await client.uploadImageFromUrl(imgUrl)
    imageMap.set(imgUrl, uploaded.url)
  }
  for (const imgPath of converted.localImages) {
    const absPath = isAbsolute(imgPath) ? imgPath : resolve(articleDir, imgPath)
    const uploaded = await client.uploadImage(absPath)
    imageMap.set(imgPath, uploaded.url)
  }
  for (const [original, wxUrl] of imageMap) {
    finalHtml = finalHtml.replaceAll(original, wxUrl)
  }

  const draft = await client.createDraft([{
    title,
    content: finalHtml,
    thumb_media_id: thumbMediaId,
    author,
    digest,
    show_cover_pic: 1,
    need_open_comment: 0,
  }])

  return {
    success: true,
    data: {
      media_id: draft.media_id,
      title,
      digest,
      theme: theme.name,
      images_detected: converted.externalImages.length + converted.localImages.length,
      images_uploaded: imageMap.size,
      external_images: converted.externalImages,
      local_images: converted.localImages,
      message: "草稿已创建，请在微信公众号后台发布",
      used_placeholder_cover: usedPlaceholderCover,
      ...(usedPlaceholderCover && { warning: "未提供封面图，已使用内置占位图。建议指定真实封面图后重新发布。" }),
    },
  }
}

function resolveStudioTheme(themeName: unknown, rawSettings: unknown): Theme {
  const name = (typeof themeName === "string" && themeName.trim() ? themeName : loadConfig().default_theme || "default").trim() || "default"
  if (!hasTheme(name)) {
    throw new StudioRequestError(`未知主题: ${name}`, 400)
  }
  const theme = getTheme(name)
  return deriveStudioTheme(theme, asThemeSettings(rawSettings))
}

class StudioRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

function asThemeSettings(value: unknown): StudioThemeSettings {
  if (!isRecord(value)) return {}
  return {
    primaryColor: typeof value.primaryColor === "string" ? value.primaryColor : undefined,
    fontSize: typeof value.fontSize === "number" ? value.fontSize : undefined,
    fontFamily: value.fontFamily === "serif" || value.fontFamily === "mono" || value.fontFamily === "system" ? value.fontFamily : undefined,
    codeBlockStyle: value.codeBlockStyle === "light" || value.codeBlockStyle === "dark" ? value.codeBlockStyle : undefined,
  }
}

function asPayload(value: unknown): StudioRequestPayload {
  return isRecord(value) ? value : {}
}

function asCoverPayload(value: unknown): StudioCoverPayload {
  return isRecord(value) ? value : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringField(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() ?? null
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolveRead, reject) => {
    let body = ""
    req.setEncoding("utf8")
    req.on("data", chunk => {
      body += chunk
      if (body.length > 2_000_000) {
        reject(new Error("request body too large"))
        req.destroy()
      }
    })
    req.on("end", () => {
      if (!body.trim()) return resolveRead({})
      try {
        resolveRead(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    req.on("error", reject)
  })
}

function json(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2)
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  })
  res.end(body)
}

function serveStatic(req: IncomingMessage, res: ServerResponse, staticDir: string, pathname: string): void {
  const safePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "")
  const filePath = resolve(staticDir, safePath)
  if (!filePath.startsWith(resolve(staticDir)) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    return json(res, 404, { success: false, error: "Not found" })
  }

  res.writeHead(200, {
    "Content-Type": contentType(filePath),
    "Cache-Control": "no-store",
  })
  if (req.method === "HEAD") {
    res.end()
  } else {
    createReadStream(filePath).pipe(res)
  }
}

function contentType(filePath: string): string {
  const map: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  }
  return map[extname(filePath)] ?? "application/octet-stream"
}

function listen(server: Server, host: string, preferredPort: number): Promise<number> {
  return new Promise((resolveListen, reject) => {
    server.once("error", reject)
    server.listen(preferredPort, host, () => {
      server.off("error", reject)
      const address = server.address()
      if (typeof address === "object" && address) {
        resolveListen(address.port)
      } else {
        reject(new Error("failed to resolve Studio server address"))
      }
    })
  })
}

function openUrl(url: string): void {
  const cmd = process.platform === "darwin" ? "open"
    : process.platform === "win32" ? "start"
    : "xdg-open"
  spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref()
}

function defaultStaticDir(): string {
  const compiledDir = fileURLToPath(new URL("../studio-app", import.meta.url))
  if (existsSync(compiledDir)) return compiledDir

  const cwdDist = resolve(process.cwd(), "dist", "studio-app")
  if (existsSync(cwdDist)) return cwdDist

  return resolve(process.cwd(), "studio-app", "dist")
}
