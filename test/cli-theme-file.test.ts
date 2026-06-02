import { describe, expect, it } from "vitest"
import { spawn } from "child_process"
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { shellQuote } from "../src/converter/preview-html.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolveRun) => {
    const proc = spawn(
      "node",
      ["--import", "tsx/esm", "src/cli/index.ts", ...args],
      {
        cwd: repoRoot,
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
    proc.on("close", (code) => resolveRun({ stdout, stderr, exitCode: code ?? 1 }))
  })
}

const articlePath = "test/fixtures/benchmark.md"
const validThemePath = "test/fixtures/external-theme-valid.json"
const invalidThemePath = "test/fixtures/external-theme-missing-style.json"

describe("CLI external theme files", () => {
  it("prints the external theme schema", async () => {
    const { stdout, exitCode } = await runCli(["theme", "schema"])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data.schema.properties.styles.required).toContain("preCode")
  })

  it("validates a valid external theme file", async () => {
    const { stdout, exitCode } = await runCli(["theme", "validate", "--file", validThemePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data.valid).toBe(true)
    expect(payload.data.theme.name).toBe("fixture-theme")
  })

  it("returns a JSON error for an invalid external theme file", async () => {
    const { stderr, exitCode } = await runCli(["theme", "validate", "--file", invalidThemePath])
    const payload = JSON.parse(stderr)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(JSON.stringify(payload)).toContain("styles.td is required")
  })

  it("converts Markdown with an external theme file", async () => {
    const { stdout, exitCode } = await runCli(["convert", "--file", articlePath, "--theme-file", validThemePath])

    expect(exitCode).toBe(0)
    expect(stdout).toContain("border-left:4px solid #b8870c")
    expect(stdout).toContain("写给开发者的排版指南")
  })

  it("rejects conflicting built-in and external theme options", async () => {
    const { stderr, exitCode } = await runCli([
      "convert",
      "--file",
      articlePath,
      "--theme",
      "github-readme",
      "--theme-file",
      validThemePath,
    ])
    const payload = JSON.parse(stderr)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(JSON.stringify(payload)).toContain("主题参数冲突")
  })

  it("includes an external theme in preview JSON", async () => {
    const { stdout, exitCode } = await runCli([
      "preview",
      "--file",
      articlePath,
      "--theme-file",
      validThemePath,
      "--no-open",
    ])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data.themes).toContainEqual({ theme: "fixture-theme", ok: true })
  })

  it("keeps external theme file in generated preview publish command", async () => {
    const outputPath = resolve("/tmp", `wxp-cli-theme-file-${Date.now()}.html`)
    const { stdout, exitCode } = await runCli([
      "preview",
      "--file",
      articlePath,
      "--theme-file",
      validThemePath,
      "--output",
      outputPath,
      "--no-open",
    ])
    const payload = JSON.parse(stdout)
    const html = readFileSync(payload.data.path, "utf-8")

    expect(exitCode).toBe(0)
    expect(html).toContain("--theme-file")
    expect(html).toContain("test/fixtures/external-theme-valid.json")
  })

  it("quotes paths with spaces in generated preview publish commands", async () => {
    const tempDir = resolve(tmpdir(), `wxp cli theme file ${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    const spacedArticlePath = resolve(tempDir, "article with spaces.md")
    const outputPath = resolve(tempDir, "preview output.html")
    writeFileSync(spacedArticlePath, readFileSync(resolve(repoRoot, articlePath), "utf-8"), "utf-8")

    const { stdout, exitCode } = await runCli([
      "preview",
      "--file",
      spacedArticlePath,
      "--output",
      outputPath,
      "--no-open",
    ])
    const payload = JSON.parse(stdout)
    const html = readFileSync(payload.data.path, "utf-8")

    expect(exitCode).toBe(0)
    expect(html).toContain(`wxp publish --file ${shellQuote(spacedArticlePath)} --theme default`)
    expect(html).toContain("shellQuote(cover)")
  })

  it("advertises external theme file capabilities", async () => {
    const { stdout, exitCode } = await runCli(["capabilities"])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.data.features.external_theme_file).toBe(true)
    expect(payload.data.commands.convert.optional_flags).toContain("--theme-file")
    expect(payload.data.commands.publish.optional_flags).toContain("--theme-file")
    expect(payload.data.commands.preview.optional_flags).toContain("--theme-file")
  })
})
