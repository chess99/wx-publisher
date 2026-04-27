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
  // 生图配置
  image_provider: string
  image_provider_url: string
  image_api_key: string
  image_model: string
  image_text_model: string
  image_size: "1024x1024" | "1792x1024" | "1024x1792"
  image_candidates: number
}

const DEFAULTS: Config = {
  wechat_appid: "",
  wechat_secret: "",
  default_theme: "default",
  image_provider: "openai",
  image_provider_url: "https://api.openai.com/v1",
  image_api_key: "",
  image_model: "gpt-image-2",
  image_text_model: "gpt-4o-mini",
  image_size: "1792x1024",
  image_candidates: 4,
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

  const imageCandidatesRaw = process.env["WXP_IMAGE_CANDIDATES"] ?? file.image_candidates
  const imageCandidates = typeof imageCandidatesRaw === "number"
    ? imageCandidatesRaw
    : imageCandidatesRaw !== undefined ? parseInt(String(imageCandidatesRaw), 10) : DEFAULTS.image_candidates

  return {
    wechat_appid:      process.env["WXP_APPID"]              ?? file.wechat_appid      ?? DEFAULTS.wechat_appid,
    wechat_secret:     process.env["WXP_SECRET"]             ?? file.wechat_secret     ?? DEFAULTS.wechat_secret,
    default_theme:     process.env["WXP_THEME"]              ?? file.default_theme     ?? DEFAULTS.default_theme,
    image_provider:    process.env["WXP_IMAGE_PROVIDER"]     ?? file.image_provider    ?? DEFAULTS.image_provider,
    image_provider_url:process.env["WXP_IMAGE_PROVIDER_URL"] ?? file.image_provider_url ?? DEFAULTS.image_provider_url,
    image_api_key:     process.env["OPENAI_API_KEY"]         ?? file.image_api_key     ?? DEFAULTS.image_api_key,
    image_model:       process.env["WXP_IMAGE_MODEL"]        ?? file.image_model       ?? DEFAULTS.image_model,
    image_text_model:  process.env["WXP_IMAGE_TEXT_MODEL"]   ?? file.image_text_model  ?? DEFAULTS.image_text_model,
    image_size:       (process.env["WXP_IMAGE_SIZE"]         ?? file.image_size        ?? DEFAULTS.image_size) as Config["image_size"],
    image_candidates:  isNaN(imageCandidates) ? DEFAULTS.image_candidates : Math.min(4, Math.max(1, imageCandidates)),
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
