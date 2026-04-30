import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { writeFileSync, mkdirSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { spawn } from "child_process"

function makeTempDir() {
  const dir = join(tmpdir(), `wxp-test-${randomUUID()}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeMdFile(dir: string, content = "# Test Article\n\nSome content.") {
  const path = join(dir, "final.md")
  writeFileSync(path, content, "utf-8")
  return path
}

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn(
      "node",
      ["--import", "tsx/esm", "src/cli/index.ts", ...args],
      {
        cwd: "/Users/zcs/code2/wx-publisher",
        env: {
          ...process.env,
          OPENAI_API_KEY: "sk-test-fake",
          WXP_IMAGE_CANDIDATES: "2",
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

describe("gen-cover 文件夹模式", () => {
  let dir: string

  beforeEach(() => { dir = makeTempDir() })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  it("--output-dir 参数被正确识别（不报 unknown option）", async () => {
    const mdPath = makeMdFile(dir)
    const outputDir = join(dir, "output")

    const { exitCode, stderr } = await runCli([
      "gen-cover",
      "--file", mdPath,
      "--output-dir", outputDir,
    ])

    // 因为测试用假 API key，生图会失败（401），所以 exitCode 是 1
    // 但不应该有 "unknown option" 错误（那说明参数定义有问题）
    expect(exitCode).toBe(1)
    expect(stderr).not.toContain("unknown option")
    expect(stderr).not.toContain("--output-dir")
  }, 30000)

  it("--output 旧参数已不存在（报 unknown option）", async () => {
    const mdPath = makeMdFile(dir)

    const { stderr } = await runCli([
      "gen-cover",
      "--file", mdPath,
      "--output", "/tmp/cover.jpg",
    ])

    // 旧的 --output 参数已移除，commander 应该报 unknown option
    expect(stderr).toContain("unknown option")
  }, 30000)
})
