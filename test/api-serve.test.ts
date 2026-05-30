import { describe, expect, it } from "vitest"
import { spawn, type ChildProcessWithoutNullStreams } from "child_process"

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForServer(port: number, proc: ChildProcessWithoutNullStreams): Promise<void> {
  let lastError = ""
  for (let i = 0; i < 40; i++) {
    if (proc.exitCode !== null) throw new Error(`server exited early with ${proc.exitCode}`)
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`)
      if (res.ok) return
      lastError = `HTTP ${res.status}`
    } catch (e) {
      lastError = String(e)
    }
    await wait(100)
  }
  throw new Error(`server did not start: ${lastError}`)
}

describe("wxp serve API", () => {
  it("converts markdown through POST /api/v1/convert", async () => {
    const port = 19000 + Math.floor(Math.random() * 1000)
    const proc = spawn("node", ["--import", "tsx/esm", "src/cli/index.ts", "serve", "--port", String(port)], {
      cwd: "/Users/zcs/code2/wx-publisher",
      env: {
        ...process.env,
        WXP_APPID: "",
        WXP_SECRET: "",
        WXP_THEME: "",
      },
    })

    try {
      await waitForServer(port, proc)
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: ":::hero\ntitle: API Title\nsubtitle: API body\n:::",
          theme: "studio",
          fontSize: "medium",
          convertVersion: "v1",
        }),
      })
      const payload = await res.json() as {
        success: boolean
        data: { html: string; theme: string; warnings: string[] }
      }

      expect(res.status).toBe(200)
      expect(payload.success).toBe(true)
      expect(payload.data.theme).toBe("studio")
      expect(payload.data.html).toContain('data-mpa-action-id="hero"')
      expect(payload.data.warnings).toEqual([])
    } finally {
      proc.kill()
    }
  })

  it("sanitizes unsafe URLs through POST /api/v1/convert", async () => {
    const port = 21000 + Math.floor(Math.random() * 1000)
    const proc = spawn("node", ["--import", "tsx/esm", "src/cli/index.ts", "serve", "--port", String(port)], {
      cwd: "/Users/zcs/code2/wx-publisher",
      env: {
        ...process.env,
        WXP_APPID: "",
        WXP_SECRET: "",
        WXP_THEME: "",
      },
    })

    try {
      await waitForServer(port, proc)
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: "[bad](javascript:alert(1))\n\n![bad](javascript:alert(1))",
          theme: "studio",
        }),
      })
      const payload = await res.json() as { success: boolean; data: { html: string } }

      expect(res.status).toBe(200)
      expect(payload.success).toBe(true)
      expect(payload.data.html).not.toContain("javascript:")
      expect(payload.data.html).toContain("[图片已移除: bad]")
    } finally {
      proc.kill()
    }
  })

  it("returns 400 for invalid JSON", async () => {
    const port = 22000 + Math.floor(Math.random() * 1000)
    const proc = spawn("node", ["--import", "tsx/esm", "src/cli/index.ts", "serve", "--port", String(port)], {
      cwd: "/Users/zcs/code2/wx-publisher",
      env: {
        ...process.env,
        WXP_APPID: "",
        WXP_SECRET: "",
        WXP_THEME: "",
      },
    })

    try {
      await waitForServer(port, proc)
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      })
      const payload = await res.json() as { success: boolean; error: string }

      expect(res.status).toBe(400)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe("invalid JSON body")
    } finally {
      proc.kill()
    }
  })

  it("returns JSON config errors for draft endpoints", async () => {
    const port = 20000 + Math.floor(Math.random() * 1000)
    const proc = spawn("node", ["--import", "tsx/esm", "src/cli/index.ts", "serve", "--port", String(port)], {
      cwd: "/Users/zcs/code2/wx-publisher",
      env: {
        ...process.env,
        WXP_APPID: "",
        WXP_SECRET: "",
        WXP_THEME: "",
      },
    })

    try {
      await waitForServer(port, proc)
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/article-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: "# Title", theme: "studio" }),
      })
      const payload = await res.json() as { success: boolean; error: string; details: string[] }

      expect(res.status).toBe(400)
      expect(payload.success).toBe(false)
      expect(payload.error).toContain("配置不完整")
      expect(payload.details.join("\n")).toContain("wechat_appid")
    } finally {
      proc.kill()
    }
  })
})
