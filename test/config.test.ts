import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

// 每个测试用独立临时目录模拟 cwd 和 HOME
let testDir: string
let globalConfigDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `wxp-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  globalConfigDir = join(testDir, "global", ".config", "wx-publisher")
  mkdirSync(join(testDir, "project"), { recursive: true })
  mkdirSync(globalConfigDir, { recursive: true })

  // 重定向 HOME 和 cwd
  vi.spyOn(process, "cwd").mockReturnValue(join(testDir, "project"))
  vi.stubEnv("HOME", join(testDir, "global"))

  // 清除所有 WXP_* 和 OPENAI_API_KEY 环境变量，避免测试间干扰
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("WXP_") || key === "OPENAI_API_KEY" || key === "MINIMAX_API_KEY") {
      vi.stubEnv(key, "")
    }
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  rmSync(testDir, { recursive: true, force: true })
})

async function freshLoadConfig() {
  // 强制重新导入（绕过 Node 模块缓存）
  vi.resetModules()
  const { loadConfig } = await import("../src/config/index.js")
  return loadConfig()
}

async function freshSaveConfig(updates: Record<string, unknown>) {
  vi.resetModules()
  const { saveConfig } = await import("../src/config/index.js")
  return saveConfig(updates as Parameters<typeof saveConfig>[0])
}

async function freshGetConfigPath() {
  vi.resetModules()
  const { getConfigPath } = await import("../src/config/index.js")
  return getConfigPath()
}

describe("loadConfig", () => {
  it("没有任何配置文件时使用默认值", async () => {
    const config = await freshLoadConfig()
    expect(config.image_provider).toBe("openai")
    expect(config.image_model).toBe("gpt-image-2")
    expect(config.image_size).toBe("1536x1024")
    expect(config.image_candidates).toBe(4)
  })

  it("全局配置文件生效", async () => {
    writeFileSync(
      join(globalConfigDir, "config.json"),
      JSON.stringify({ wechat_appid: "wx_global", image_model: "image-01" })
    )
    const config = await freshLoadConfig()
    expect(config.wechat_appid).toBe("wx_global")
    expect(config.image_model).toBe("image-01")
  })

  it("本地 .wxp.json 覆盖全局配置", async () => {
    writeFileSync(
      join(globalConfigDir, "config.json"),
      JSON.stringify({ wechat_appid: "wx_global", image_model: "image-01" })
    )
    writeFileSync(
      join(testDir, "project", ".wxp.json"),
      JSON.stringify({ wechat_appid: "wx_local", image_provider: "minimax" })
    )
    const config = await freshLoadConfig()
    // 本地覆盖
    expect(config.wechat_appid).toBe("wx_local")
    expect(config.image_provider).toBe("minimax")
    // 全局提供（本地未覆盖）
    expect(config.image_model).toBe("image-01")
  })

  it("没有本地配置时全局配置生效", async () => {
    writeFileSync(
      join(globalConfigDir, "config.json"),
      JSON.stringify({ wechat_appid: "wx_only_global" })
    )
    const config = await freshLoadConfig()
    expect(config.wechat_appid).toBe("wx_only_global")
  })
})

describe("saveConfig", () => {
  it("写入全局配置，不影响本地 .wxp.json", async () => {
    writeFileSync(
      join(testDir, "project", ".wxp.json"),
      JSON.stringify({ image_provider: "minimax" })
    )
    await freshSaveConfig({ wechat_appid: "wx_saved" })

    const globalRaw = JSON.parse(
      require("fs").readFileSync(join(globalConfigDir, "config.json"), "utf-8")
    )
    expect(globalRaw.wechat_appid).toBe("wx_saved")
    // 本地文件不应被修改
    const localRaw = JSON.parse(
      require("fs").readFileSync(join(testDir, "project", ".wxp.json"), "utf-8")
    )
    expect(localRaw.image_provider).toBe("minimax")
    expect(localRaw.wechat_appid).toBeUndefined()
  })

  it("不把本地 .wxp.json 的值合并进全局", async () => {
    writeFileSync(
      join(testDir, "project", ".wxp.json"),
      JSON.stringify({ image_api_key: "local-secret-key" })
    )
    await freshSaveConfig({ wechat_appid: "wx_test" })

    const globalRaw = JSON.parse(
      require("fs").readFileSync(join(globalConfigDir, "config.json"), "utf-8")
    )
    // local-secret-key 不应出现在全局配置里
    expect(globalRaw.image_api_key).toBeUndefined()
    expect(globalRaw.wechat_appid).toBe("wx_test")
  })
})

describe("getConfigPath", () => {
  it("本地 .wxp.json 存在时返回本地路径", async () => {
    writeFileSync(join(testDir, "project", ".wxp.json"), "{}")
    const path = await freshGetConfigPath()
    expect(path).toContain(".wxp.json")
  })

  it("本地 .wxp.json 不存在时返回全局路径", async () => {
    const path = await freshGetConfigPath()
    expect(path).toContain("config.json")
    expect(path).not.toContain(".wxp.json")
  })
})
