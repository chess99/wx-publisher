/**
 * 微信公众号 API 客户端
 *
 * 官方文档：https://developers.weixin.qq.com/doc/offiaccount/
 *
 * 主要能力：
 * - access_token 获取与本地缓存（有效期 7200s，提前 5min 刷新）
 * - 图片上传到素材库（获取永久 media_id 和 URL）
 * - 创建图文草稿
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { createReadStream, statSync } from "fs"
import { Readable } from "stream"

const WX_API = "https://api.weixin.qq.com"
const TOKEN_CACHE_PATH = join(homedir(), ".config", "wx-publisher", "token_cache.json")

interface TokenCache {
  access_token: string
  expires_at: number // unix timestamp ms
}

export interface WxConfig {
  appid: string
  secret: string
}

export interface UploadResult {
  media_id: string
  url: string
}

export interface DraftArticle {
  title: string
  /** 微信格式 HTML，所有样式内联 */
  content: string
  /** 封面图 media_id（必须先上传到素材库） */
  thumb_media_id: string
  author?: string
  digest?: string
  /** 是否只显示封面图，不显示正文图片 */
  show_cover_pic?: 0 | 1
  need_open_comment?: 0 | 1
}

export interface CreateDraftResult {
  media_id: string
}

export class WechatClient {
  private config: WxConfig
  private tokenCache: TokenCache | null = null

  constructor(config: WxConfig) {
    this.config = config
    this.loadTokenCache()
  }

  // ─── access_token ────────────────────────────────────────────────────────

  async getAccessToken(): Promise<string> {
    const now = Date.now()
    // 提前 5 分钟刷新
    if (this.tokenCache && this.tokenCache.expires_at - now > 5 * 60 * 1000) {
      return this.tokenCache.access_token
    }

    const url = `${WX_API}/cgi-bin/token?grant_type=client_credential&appid=${this.config.appid}&secret=${this.config.secret}`
    const res = await fetch(url)
    const data = await res.json() as { access_token?: string; expires_in?: number; errcode?: number; errmsg?: string }

    if (!data.access_token) {
      throw new Error(`获取 access_token 失败: ${data.errmsg ?? JSON.stringify(data)}`)
    }

    this.tokenCache = {
      access_token: data.access_token,
      expires_at: now + data.expires_in! * 1000,
    }
    this.saveTokenCache()
    return data.access_token
  }

  // ─── 图片上传 ─────────────────────────────────────────────────────────────

  /**
   * 上传本地图片到微信永久素材库
   * 返回 media_id（用于草稿封面）和 url（用于文章正文 img src）
   */
  async uploadImage(filePath: string): Promise<UploadResult> {
    const token = await this.getAccessToken()
    const url = `${WX_API}/cgi-bin/material/add_material?access_token=${token}&type=image`

    const boundary = `----WxPublisherBoundary${Date.now()}`
    const filename = filePath.split("/").pop() ?? "image.jpg"
    const fileBuffer = readFileSync(filePath)
    const mimeType = guessMimeType(filename)

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ])

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    })

    const data = await res.json() as { media_id?: string; url?: string; errcode?: number; errmsg?: string }
    if (!data.media_id) {
      throw new Error(`上传图片失败: ${data.errmsg ?? JSON.stringify(data)}`)
    }

    return { media_id: data.media_id, url: data.url ?? "" }
  }

  /**
   * 下载外部图片并上传到微信素材库
   * 用于处理文章中的外链图片
   */
  async uploadImageFromUrl(imageUrl: string): Promise<UploadResult> {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`下载图片失败: ${imageUrl} (${res.status})`)

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    const ext = contentType.split("/")[1]?.split(";")[0] ?? "jpg"
    const filename = `image_${Date.now()}.${ext}`

    const token = await this.getAccessToken()
    const url = `${WX_API}/cgi-bin/material/add_material?access_token=${token}&type=image`

    const boundary = `----WxPublisherBoundary${Date.now()}`
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ])

    const uploadRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    })

    const data = await uploadRes.json() as { media_id?: string; url?: string; errcode?: number; errmsg?: string }
    if (!data.media_id) {
      throw new Error(`上传图片失败: ${data.errmsg ?? JSON.stringify(data)}`)
    }

    return { media_id: data.media_id, url: data.url ?? "" }
  }

  // ─── 草稿 ─────────────────────────────────────────────────────────────────

  /**
   * 创建图文草稿（不发布，存入草稿箱）
   */
  async createDraft(articles: DraftArticle[]): Promise<CreateDraftResult> {
    const token = await this.getAccessToken()
    const url = `${WX_API}/cgi-bin/draft/add?access_token=${token}`

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles }),
    })

    const data = await res.json() as { media_id?: string; errcode?: number; errmsg?: string }
    if (!data.media_id) {
      throw new Error(`创建草稿失败: ${data.errmsg ?? JSON.stringify(data)}`)
    }

    return { media_id: data.media_id }
  }

  /**
   * 获取草稿列表（最新的 N 篇）
   * 返回包含 media_id 的列表，用于 QA Agent 定位最新草稿
   */
  async listDrafts(count = 5): Promise<Array<{ media_id: string; update_time: number; title: string }>> {
    const token = await this.getAccessToken()
    const url = `${WX_API}/cgi-bin/draft/batchget?access_token=${token}`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offset: 0, count, no_content: 1 }),
    })
    const data = await res.json() as {
      item?: Array<{ media_id: string; update_time: number; content: { news_item: Array<{ title: string }> } }>
      errcode?: number; errmsg?: string
    }
    if (data.errcode) throw new Error(`获取草稿列表失败: ${data.errmsg}`)
    return (data.item ?? []).map(item => ({
      media_id: item.media_id,
      update_time: item.update_time,
      title: item.content?.news_item?.[0]?.title ?? "",
    }))
  }

  // ─── token 缓存 ───────────────────────────────────────────────────────────

  private loadTokenCache(): void {
    try {
      if (existsSync(TOKEN_CACHE_PATH)) {
        const raw = readFileSync(TOKEN_CACHE_PATH, "utf-8")
        this.tokenCache = JSON.parse(raw)
      }
    } catch {
      this.tokenCache = null
    }
  }

  private saveTokenCache(): void {
    try {
      const dir = join(homedir(), ".config", "wx-publisher")
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(this.tokenCache), "utf-8")
    } catch {
      // 缓存写失败不影响主流程
    }
  }
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  }
  return map[ext ?? ""] ?? "image/jpeg"
}
