import { describe, it, expect } from "vitest"
import { spawn } from "child_process"

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn(
      "node",
      ["--import", "tsx/esm", "src/cli/index.ts", ...args],
      {
        cwd: "/Users/zcs/code2/wx-publisher",
        env: {
          ...process.env,
          WXP_APPID: "",
          WXP_SECRET: "",
          WXP_THEME: "",
        },
      }
    )
    let stdout = ""
    let stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 1 }))
  })
}

describe("CLI surface", () => {
  it("capabilities does not expose gen-cover", async () => {
    const { stdout, exitCode } = await runCli(["capabilities"])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data.commands).not.toHaveProperty("gen-cover")
  })

  it("advertises advanced layout and local API capabilities", async () => {
    const { stdout, exitCode } = await runCli(["capabilities"])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data.features.advanced_layout).toBe(true)
    expect(payload.data.features.gfm_alerts).toBe(true)
    expect(payload.data.features.footnotes).toBe(true)
    expect(payload.data.commands.serve.endpoints).toContain("POST /api/v1/convert")
    expect(payload.data.themes).toContain("studio")
  })

  it("config get does not expose image generation config", async () => {
    const { stdout, exitCode } = await runCli(["config", "get"])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data).not.toHaveProperty("image_provider")
    expect(payload.data).not.toHaveProperty("image_api_key")
    expect(payload.data).not.toHaveProperty("image_model")
  })

  it("gen-cover is not a registered command", async () => {
    const { stderr, exitCode } = await runCli(["gen-cover"])

    expect(exitCode).not.toBe(0)
    expect(stderr).toContain("unknown command")
  })
})
