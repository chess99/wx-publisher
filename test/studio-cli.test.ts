import { createServer, type Server } from "http"
import { describe, expect, it } from "vitest"
import { spawn } from "child_process"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const articlePath = "test/fixtures/benchmark.md"

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolveRun) => {
    const proc = spawn("node", ["--import", "tsx/esm", "src/cli/index.ts", ...args], {
      cwd: repoRoot,
      env: {
        ...process.env,
        WXP_APPID: "",
        WXP_SECRET: "",
        WXP_THEME: "",
      },
    })
    let stdout = ""
    let stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => resolveRun({ stdout, stderr, exitCode: code ?? 1 }))
  })
}

function startStudioCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolveRun) => {
    const proc = spawn("node", ["--import", "tsx/esm", "src/cli/index.ts", ...args], {
      cwd: repoRoot,
      env: {
        ...process.env,
        WXP_APPID: "",
        WXP_SECRET: "",
        WXP_THEME: "",
      },
    })
    let stdout = ""
    let stderr = ""
    let resolved = false
    const finish = (exitCode: number | null) => {
      if (resolved) return
      resolved = true
      resolveRun({ stdout, stderr, exitCode })
    }

    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString()
      if (stdout.includes("url")) {
        proc.kill()
        finish(null)
      }
    })
    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString()
    })
    proc.on("close", code => finish(code))
    setTimeout(() => {
      proc.kill()
      finish(null)
    }, 5000)
  })
}

function listenOn127(server: Server): Promise<number> {
  return new Promise((resolveListen, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (typeof address === "object" && address) resolveListen(address.port)
      else reject(new Error("missing server address"))
    })
  })
}

describe("CLI studio", () => {
  it("returns JSON error when the Markdown file is missing", async () => {
    const { stderr, exitCode } = await runCli(["studio", "--file", "missing.md", "--no-open"])
    const payload = JSON.parse(stderr)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.error).toBe("启动 Studio 失败")
    expect(payload.details).toContain("Markdown 文件不存在")
  })

  it("starts a localhost Studio server and prints its URL", async () => {
    const { stdout } = await startStudioCli(["studio", "--file", articlePath, "--no-open"])
    const payload = JSON.parse(stdout)

    expect(payload.success).toBe(true)
    expect(payload.data.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(payload.data.file).toContain("benchmark.md")
  })

  it("returns JSON error when the requested port is already in use", async () => {
    const blocker = createServer((_req, res) => res.end("busy"))
    const port = await listenOn127(blocker)
    try {
      const { stderr, exitCode } = await runCli(["studio", "--file", articlePath, "--port", String(port), "--no-open"])
      const payload = JSON.parse(stderr)

      expect(exitCode).not.toBe(0)
      expect(payload.success).toBe(false)
      expect(payload.error).toBe("启动 Studio 失败")
      expect(payload.details).toContain("EADDRINUSE")
    } finally {
      await new Promise(resolveClose => blocker.close(resolveClose))
    }
  })

  it("advertises the studio command in capabilities", async () => {
    const { stdout, exitCode } = await runCli(["capabilities"])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data.commands.studio.required_flags).toContain("--file")
    expect(payload.data.commands.studio.optional_flags).toContain("--port")
  })
})
