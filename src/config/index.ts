/**
 * 配置管理
 * 配置文件：~/.config/wx-publisher/config.json
 * 优先级：环境变量 > 配置文件 > 默认值
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const CONFIG_DIR = join(homedir(), ".config", "wx-publisher")
const CONFIG_PATH = join(CONFIG_DIR, "config.json")

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

export function loadConfig(): Config {
  let file: Partial<Config> = {}
  if (existsSync(CONFIG_PATH)) {
    try {
      file = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"))
    } catch {
      // 解析失败用默认值
    }
  }

  return {
    wechat_appid:  process.env["WXP_APPID"]  ?? file.wechat_appid  ?? DEFAULTS.wechat_appid,
    wechat_secret: process.env["WXP_SECRET"] ?? file.wechat_secret ?? DEFAULTS.wechat_secret,
    default_theme: process.env["WXP_THEME"]  ?? file.default_theme ?? DEFAULTS.default_theme,
  }
}

export function saveConfig(updates: Partial<Config>): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  const current = loadConfig()
  const next = { ...current, ...updates }
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), "utf-8")
}

export function getConfigPath(): string {
  return CONFIG_PATH
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = []
  if (!config.wechat_appid)  errors.push("wechat_appid 未配置（或设置环境变量 WXP_APPID）")
  if (!config.wechat_secret) errors.push("wechat_secret 未配置（或设置环境变量 WXP_SECRET）")
  return errors
}
