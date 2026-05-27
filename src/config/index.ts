/**
 * 配置管理
 *
 * 配置文件查找顺序（优先级从高到低）：
 *   1. 环境变量（WXP_APPID、WXP_SECRET、WXP_THEME）
 *   2. 当前目录 .wxp.json（per-project，建议加入 .gitignore）
 *   3. ~/.config/wx-publisher/config.json（全局配置）
 *   4. 内置默认值
 *
 * 直接编辑配置文件：
 *   cp .wxp.example.json .wxp.json && $EDITOR .wxp.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join, resolve } from "path"
import { homedir } from "os"

const CONFIG_DIR = join(homedir(), ".config", "wx-publisher")
const GLOBAL_CONFIG_PATH = join(CONFIG_DIR, "config.json")

// 每次调用时解析，避免模块加载时 cwd 和运行时 cwd 不一致（测试环境、process.chdir 等）
function getLocalConfigPath(): string {
  return resolve(process.cwd(), ".wxp.json")
}

export interface Config {
  wechat_appid: string
  wechat_secret: string
  default_theme: string
}

const DEFAULTS: Config = {
  wechat_appid: "",
  wechat_secret: "",
  default_theme: "default",
}

function readConfigFile(path: string): Partial<Config> {
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, "utf-8"))
  } catch {
    process.stderr.write(`警告：配置文件解析失败，已忽略：${path}\n`)
    return {}
  }
}

export function loadConfig(): Config {
  // 本地配置覆盖全局配置（浅合并）
  const globalFile = readConfigFile(GLOBAL_CONFIG_PATH)
  const localFile  = readConfigFile(getLocalConfigPath())
  const file = { ...globalFile, ...localFile }

  return {
    wechat_appid:      process.env["WXP_APPID"]              ?? file.wechat_appid      ?? DEFAULTS.wechat_appid,
    wechat_secret:     process.env["WXP_SECRET"]             ?? file.wechat_secret     ?? DEFAULTS.wechat_secret,
    default_theme:     process.env["WXP_THEME"]              ?? file.default_theme     ?? DEFAULTS.default_theme,
  }
}

export function saveConfig(updates: Partial<Config>): void {
  // 写入全局配置（wxp config set 的行为）。
  // 故意用 readConfigFile(GLOBAL) 而不是 loadConfig()，避免把本地 .wxp.json 的值
  // 合并进全局配置——两个文件应该保持独立。
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  const current = readConfigFile(GLOBAL_CONFIG_PATH)
  const next = { ...current, ...updates }
  writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(next, null, 2), "utf-8")
}

export function getConfigPath(): string {
  // 注意：当 .wxp.json 和全局配置同时存在时，两个文件都参与合并。
  // 此函数返回优先级最高的文件路径，仅供显示用途（wxp config get）。
  const local = getLocalConfigPath()
  return existsSync(local) ? local : GLOBAL_CONFIG_PATH
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = []
  if (!config.wechat_appid)  errors.push("wechat_appid 未配置（或设置环境变量 WXP_APPID）")
  if (!config.wechat_secret) errors.push("wechat_secret 未配置（或设置环境变量 WXP_SECRET）")
  return errors
}
