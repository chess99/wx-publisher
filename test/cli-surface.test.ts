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
    let exitCode = 1
    let closed = false
    let stdoutEnded = false
    let stderrEnded = false
    const finish = () => {
      if (closed && stdoutEnded && stderrEnded) {
        resolve({ stdout, stderr, exitCode })
      }
    }
    proc.stdout.on("end", () => {
      stdoutEnded = true
      finish()
    })
    proc.stderr.on("end", () => {
      stderrEnded = true
      finish()
    })
    proc.on("close", (code) => {
      exitCode = code ?? 1
      closed = true
      finish()
    })
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
    expect(payload.data.features.professional_themes).toBe(true)
    expect(payload.data.coverage.themes.professional).toBe(48)
    expect(payload.data.coverage.advanced_modules.public).toBe(43)
    expect(payload.data.coverage.advanced_modules.enhanced).toBe(3)
    expect(payload.data.commands.serve.endpoints).toContain("POST /api/v1/convert")
    expect(payload.data.themes).toHaveLength(48)
    expect(payload.data.themes).toContain("github-readme")
    expect(payload.data.themes).not.toContain("studio")
    expect(payload.data.theme_reference).toContainEqual(expect.objectContaining({
      name: "github-readme",
      collection: "modern",
      density: "medium",
      contrast: "medium",
    }))
  })

  it("keeps theme selection metadata in verbose theme output", async () => {
    const { stdout, exitCode } = await runCli(["themes", "--verbose"])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data.count).toBe(48)
    expect(payload.data.themes).toContainEqual(expect.objectContaining({
      name: "github-readme",
      collection: "modern",
      density: "medium",
      contrast: "medium",
      accent: "#0969da",
      styles: expect.objectContaining({
        h2: expect.any(String),
      }),
    }))
  })

  it("rejects unknown runtime theme ids instead of falling back silently", async () => {
    const { stderr, exitCode } = await runCli(["convert", "--file", "test/fixtures/benchmark.md", "--theme", "legacy-theme"])
    const payload = JSON.parse(stderr)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(JSON.stringify(payload)).toContain("未知主题: legacy-theme")
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
