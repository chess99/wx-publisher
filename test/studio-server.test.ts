import { afterEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { createStudioServer, type StudioServer } from "../src/studio/server.js"

const servers: StudioServer[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => server.close()))
  vi.unstubAllEnvs()
})

function writeArticle(markdown: string): string {
  const dir = mkdtempSync(join(tmpdir(), "wxp-studio-test-"))
  const file = join(dir, "article.md")
  writeFileSync(file, markdown, "utf-8")
  return file
}

async function start(markdown: string): Promise<StudioServer> {
  const server = await createStudioServer({
    articlePath: writeArticle(markdown),
    host: "127.0.0.1",
    port: 0,
    openBrowser: false,
  })
  servers.push(server)
  return server
}

describe("Studio server", () => {
  it("binds to 127.0.0.1 and returns initial state without exposing secrets", async () => {
    vi.stubEnv("WXP_APPID", "wx_test_app")
    vi.stubEnv("WXP_SECRET", "secret_should_not_leave_server")
    const server = await start("# Hello")

    expect(server.host).toBe("127.0.0.1")
    expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)

    const response = await fetch(`${server.url}/api/state`)
    const payload = await response.json() as {
      success: boolean
      data: {
        article: { markdown: string }
        advancedModules: { public: string[]; enhanced: string[]; total: number }
        config: { wechat_appid: string; wechat_secret_configured: boolean }
      }
    }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.article.markdown).toBe("# Hello")
    expect(payload.data.config.wechat_appid).toBe("wx_test_app")
    expect(payload.data.config.wechat_secret_configured).toBe(true)
    expect(payload.data.advancedModules.public).toContain("hero")
    expect(payload.data.advancedModules.enhanced).toContain("dialogue")
    expect(payload.data.advancedModules.total).toBe(
      payload.data.advancedModules.public.length + payload.data.advancedModules.enhanced.length,
    )
    expect(JSON.stringify(payload)).not.toContain("secret_should_not_leave_server")
  })

  it("converts Markdown through the local API and reports article image sources", async () => {
    const server = await start("![remote](https://example.com/a.png)\n\n![local](./local.png)")

    const response = await fetch(`${server.url}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: "![remote](https://example.com/a.png)\n\n![local](./local.png)",
        theme: "github-readme",
      }),
    })
    const payload = await response.json() as {
      success: boolean
      data: { html: string; externalImages: string[]; localImages: string[] }
    }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.html).toContain("<img")
    expect(payload.data.externalImages).toEqual(["https://example.com/a.png"])
    expect(payload.data.localImages).toEqual(["./local.png"])
  })

  it("rejects unknown runtime theme ids through the local convert API", async () => {
    const server = await start("# Hello")

    const response = await fetch(`${server.url}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: "# Hello",
        theme: "legacy-theme",
      }),
    })
    const payload = await response.json() as { success: boolean; error: string }

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error).toContain("未知主题: legacy-theme")
  })

  it("returns a normalized JSON error when publishing without WeChat credentials", async () => {
    vi.stubEnv("WXP_APPID", "")
    vi.stubEnv("WXP_SECRET", "")
    const server = await start("# Draft")

    const response = await fetch(`${server.url}/api/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: "# Draft",
        theme: "default",
        title: "Draft",
      }),
    })
    const payload = await response.json() as { success: boolean; error: string; details: string[] }

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error).toBe("配置不完整")
    expect(payload.details).toContain("wechat_appid 未配置（或设置环境变量 WXP_APPID）")
  })

  it("rejects digests longer than 120 characters before publishing", async () => {
    vi.stubEnv("WXP_APPID", "wx_test")
    vi.stubEnv("WXP_SECRET", "secret")
    const server = await start("# Draft")

    const response = await fetch(`${server.url}/api/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: "# Draft",
        theme: "default",
        title: "Draft",
        digest: "长".repeat(121),
      }),
    })
    const payload = await response.json() as { success: boolean; error: string; details: { max: number } }

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error).toBe("摘要不能超过 120 个字符")
    expect(payload.details.max).toBe(120)
  })

  it("returns 404 for unknown routes", async () => {
    const server = await start("# Hello")
    const response = await fetch(`${server.url}/missing`)
    const payload = await response.json() as { success: boolean; error: string }

    expect(response.status).toBe(404)
    expect(payload).toEqual({ success: false, error: "Not found" })
  })

  it("serves built Studio assets when a static directory is provided", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wxp-studio-assets-"))
    writeFileSync(join(dir, "index.html"), "<!doctype html><title>Studio</title>", "utf-8")
    const server = await createStudioServer({
      articlePath: writeArticle("# Hello"),
      host: "127.0.0.1",
      port: 0,
      openBrowser: false,
      staticDir: dir,
    })
    servers.push(server)

    const response = await fetch(`${server.url}/`)

    expect(response.status).toBe(200)
    expect(await response.text()).toContain("<title>Studio</title>")
  })
})
