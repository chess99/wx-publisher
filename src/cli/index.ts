#!/usr/bin/env node
/**
 * wx-publisher CLI
 * 命令行入口，所有输出为 JSON，方便 AI Agent 解析
 *
 * 用法：
 *   wxp publish --file article.md [--theme tech] [--cover /path/to/cover.jpg]
 *   wxp convert --file article.md [--theme tech]
 *   wxp config set wechat_appid wx123...
 *   wxp config get
 *   wxp themes
 */

import { program } from "commander"
import { readFileSync } from "fs"
import { resolve } from "path"
import { convertMarkdown } from "../converter/index.js"
import { WechatClient } from "../wechat/client.js"
import { loadConfig, saveConfig, getConfigPath, validateConfig } from "../config/index.js"
import { listThemes, getTheme } from "../converter/themes.js"

// ─── 输出格式 ─────────────────────────────────────────────────────────────────

function ok(data: unknown): never {
  console.log(JSON.stringify({ success: true, data }, null, 2))
  process.exit(0)
}

function fail(message: string, details?: unknown): never {
  console.error(JSON.stringify({ success: false, error: message, details }, null, 2))
  process.exit(1)
}

// ─── CLI 定义 ─────────────────────────────────────────────────────────────────

program
  .name("wxp")
  .description("Markdown → 微信公众号草稿，无需第三方 API Key")
  .version("0.1.0")

// ── publish：完整流程（转换 + 上传图片 + 创建草稿） ──────────────────────────

program
  .command("publish")
  .description("将 Markdown 文件发布到微信公众号草稿箱")
  .requiredOption("-f, --file <path>", "Markdown 文件路径")
  .option("-t, --theme <name>", "排版主题（默认读配置，fallback: default）")
  .option("-c, --cover <path>", "封面图本地路径（必须提供，否则草稿无封面）")
  .option("--cover-url <url>", "封面图 URL（与 --cover 二选一）")
  .option("--title <title>", "文章标题（默认从 Markdown h1 提取）")
  .option("--author <author>", "作者名")
  .option("--no-upload-images", "不自动上传文章中的外链图片")
  .action(async (opts) => {
    const config = loadConfig()
    const errors = validateConfig(config)
    if (errors.length > 0) fail("配置不完整", errors)

    // 读取 Markdown
    let markdown: string
    try {
      markdown = readFileSync(resolve(opts.file), "utf-8")
    } catch (e) {
      fail(`读取文件失败: ${opts.file}`, String(e))
    }

    const theme = opts.theme ?? config.default_theme
    const client = new WechatClient({ appid: config.wechat_appid, secret: config.wechat_secret })

    // 转换 Markdown
    const { html, externalImages } = await convertMarkdown(markdown, { theme })

    // 提取标题（从 Markdown 第一个 h1，或用文件名）
    const title = opts.title ?? extractTitle(markdown) ?? opts.file

    // 处理封面图
    let thumbMediaId: string
    if (opts.cover) {
      const result = await client.uploadImage(resolve(opts.cover)).catch(e => fail(`上传封面图失败`, String(e)))
      thumbMediaId = result.media_id
    } else if (opts.coverUrl) {
      const result = await client.uploadImageFromUrl(opts.coverUrl).catch(e => fail(`下载并上传封面图失败`, String(e)))
      thumbMediaId = result.media_id
    } else {
      fail("必须提供封面图：--cover <本地路径> 或 --cover-url <URL>")
    }

    // 上传文章内外链图片，替换为微信 URL
    let finalHtml = html
    if (opts.uploadImages !== false && externalImages.length > 0) {
      const imageMap = new Map<string, string>()
      for (const imgUrl of externalImages) {
        try {
          const result = await client.uploadImageFromUrl(imgUrl)
          imageMap.set(imgUrl, result.url)
        } catch (e) {
          // 上传失败不中断，保留原 URL（微信可能无法显示）
          console.error(JSON.stringify({ warning: `图片上传失败，保留原 URL: ${imgUrl}`, error: String(e) }))
        }
      }
      // 替换 HTML 中的图片 URL
      for (const [original, wxUrl] of imageMap) {
        finalHtml = finalHtml.replaceAll(original, wxUrl)
      }
    }

    // 创建草稿
    const draft = await client.createDraft([
      {
        title,
        content: finalHtml,
        thumb_media_id: thumbMediaId,
        author: opts.author,
        show_cover_pic: 1,
        need_open_comment: 0,
      },
    ]).catch(e => fail(`创建草稿失败`, String(e)))

    ok({
      media_id: draft.media_id,
      title,
      theme,
      images_uploaded: externalImages.length,
      message: "草稿已创建，请在微信公众号后台发布",
    })
  })

// ── convert：仅转换，不发布 ───────────────────────────────────────────────────

program
  .command("convert")
  .description("将 Markdown 转换为微信 HTML（不发布）")
  .requiredOption("-f, --file <path>", "Markdown 文件路径")
  .option("-t, --theme <name>", "排版主题")
  .option("-o, --output <path>", "输出 HTML 文件路径（不指定则输出到 stdout）")
  .action(async (opts) => {
    let markdown: string
    try {
      markdown = readFileSync(resolve(opts.file), "utf-8")
    } catch (e) {
      fail(`读取文件失败: ${opts.file}`, String(e))
    }

    const config = loadConfig()
    const theme = opts.theme ?? config.default_theme
    const { html, externalImages } = await convertMarkdown(markdown, { theme })

    if (opts.output) {
      const { writeFileSync } = await import("fs")
      writeFileSync(resolve(opts.output), html, "utf-8")
      ok({ output: opts.output, theme, external_images: externalImages })
    } else {
      // 直接输出 HTML（不包 JSON），方便 pipe
      process.stdout.write(html)
      process.exit(0)
    }
  })

// ── config ────────────────────────────────────────────────────────────────────

const configCmd = program.command("config").description("管理配置")

configCmd
  .command("set <key> <value>")
  .description("设置配置项（wechat_appid / wechat_secret / default_theme）")
  .action((key, value) => {
    const allowed = ["wechat_appid", "wechat_secret", "default_theme"]
    if (!allowed.includes(key)) {
      fail(`未知配置项: ${key}`, { allowed })
    }
    saveConfig({ [key]: value } as never)
    ok({ key, value: key.includes("secret") ? "***" : value })
  })

configCmd
  .command("get")
  .description("查看当前配置（secret 脱敏）")
  .action(() => {
    const config = loadConfig()
    ok({
      wechat_appid: config.wechat_appid || "(未设置)",
      wechat_secret: config.wechat_secret ? "***" : "(未设置)",
      default_theme: config.default_theme,
      config_path: getConfigPath(),
    })
  })

configCmd
  .command("path")
  .description("输出配置文件路径")
  .action(() => {
    ok({ path: getConfigPath() })
  })

// ── themes ────────────────────────────────────────────────────────────────────

program
  .command("themes")
  .description("列出可用排版主题")
  .option("--verbose", "显示详细样式信息")
  .action((opts) => {
    const names = listThemes()
    const themes = names.map(name => {
      const t = getTheme(name)
      return opts.verbose
        ? { name: t.name, description: t.description, styles: t.styles }
        : { name: t.name, description: t.description }
    })
    ok({ themes, count: themes.length })
  })

// ── capabilities：供 AI Agent 查询本工具能力 ──────────────────────────────────

program
  .command("capabilities")
  .description("输出本工具的能力描述（供 AI Agent 使用）")
  .action(() => {
    ok({
      tool: "wx-publisher",
      version: "0.1.0",
      description: "Markdown 转微信公众号草稿，无需第三方 API Key，完全本地转换",
      commands: {
        publish: {
          description: "完整流程：Markdown → HTML → 上传图片 → 创建草稿",
          required_config: ["wechat_appid", "wechat_secret"],
          required_flags: ["--file", "--cover OR --cover-url"],
          optional_flags: ["--theme", "--title", "--author", "--no-upload-images"],
        },
        convert: {
          description: "仅转换 Markdown 为微信 HTML，不发布",
          required_flags: ["--file"],
          optional_flags: ["--theme", "--output"],
        },
        "config set": {
          description: "设置配置项",
          keys: ["wechat_appid", "wechat_secret", "default_theme"],
        },
        "config get": { description: "查看当前配置" },
        themes: { description: "列出可用主题" },
      },
      env_vars: {
        WXP_APPID: "微信公众号 AppID",
        WXP_SECRET: "微信公众号 AppSecret",
        WXP_THEME: "默认主题",
      },
      themes: listThemes(),
      notes: [
        "封面图必须提供（--cover 本地路径 或 --cover-url 公网 URL）",
        "文章中的外链图片会自动下载并上传到微信素材库",
        "微信公众号草稿创建后需在后台手动发布",
        "access_token 自动缓存，有效期内不重复请求",
      ],
    })
  })

// ── draft：草稿管理 ───────────────────────────────────────────────────────────

const draftCmd = program.command("draft").description("草稿箱管理")

draftCmd
  .command("list")
  .description("列出最新草稿（供 QA Agent 获取 appmsgid）")
  .option("-n, --count <n>", "获取数量", "5")
  .action(async (opts) => {
    const config = loadConfig()
    const errors = validateConfig(config)
    if (errors.length > 0) fail("配置不完整", errors)
    const client = new WechatClient({ appid: config.wechat_appid, secret: config.wechat_secret })
    const drafts = await client.listDrafts(parseInt(opts.count)).catch(e => fail("获取草稿列表失败", String(e)))
    ok({
      drafts: drafts.map(d => ({
        ...d,
        edit_url_template: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&appmsgid={appmsgid}&token={token}&lang=zh_CN`,
        note: "appmsgid 需从草稿箱页面获取，media_id 是 API 标识符",
      })),
    })
  })

// ── validate：静态检查本地 HTML，不需要 CDP ────────────────────────────────────

program
  .command("validate")
  .description("静态检查本地 HTML 文件的已知微信渲染问题（不需要 CDP）")
  .requiredOption("-f, --file <path>", "要检查的 HTML 文件路径（由 convert 命令生成）")
  .action((opts) => {
    let html: string
    try {
      html = readFileSync(resolve(opts.file), "utf-8")
    } catch (e) {
      fail(`读取文件失败: ${opts.file}`, String(e))
    }

    const checks: Record<string, { status: string; detail: string }> = {}

    // CHECK: li 有 display:block
    const liMatches = [...html.matchAll(/<li\s[^>]*style="([^"]*)"/g)]
    if (liMatches.length === 0) {
      checks["LIST_DISPLAY_BLOCK"] = { status: "SKIP", detail: "无 li 元素" }
    } else {
      const bad = liMatches.filter(m => !m[1].includes("display:block"))
      checks["LIST_DISPLAY_BLOCK"] = {
        status: bad.length === 0 ? "PASS" : "FAIL",
        detail: `${liMatches.length} 个 li，${bad.length} 个缺少 display:block`,
      }
    }

    // CHECK: ul li 有 • 前缀文本
    const bulletCount = (html.match(/• /g) || []).length
    checks["LIST_HAS_BULLET"] = {
      status: bulletCount > 0 ? "PASS" : "SKIP",
      detail: `发现 ${bulletCount} 个 • 前缀`,
    }

    // CHECK: pre 有深色背景
    const preMatches = [...html.matchAll(/<pre[^>]*style="([^"]*)"/g)]
    if (preMatches.length === 0) {
      checks["CODE_BLOCK_DARK_BG"] = { status: "SKIP", detail: "无代码块" }
    } else {
      const bad = preMatches.filter(m => !m[1].includes("background:#") && !m[1].includes("background: #"))
      checks["CODE_BLOCK_DARK_BG"] = {
        status: bad.length === 0 ? "PASS" : "FAIL",
        detail: `${preMatches.length} 个 pre，${bad.length} 个缺少 background 样式`,
      }
    }

    // CHECK: pre code 有浅色 color
    const preCodeMatches = [...html.matchAll(/class="language-[^"]*"\s+style="([^"]*)"/g)]
    if (preCodeMatches.length === 0) {
      checks["CODE_BLOCK_LIGHT_TEXT"] = { status: "SKIP", detail: "无代码块" }
    } else {
      const bad = preCodeMatches.filter(m => !m[1].includes("color:"))
      checks["CODE_BLOCK_LIGHT_TEXT"] = {
        status: bad.length === 0 ? "PASS" : "FAIL",
        detail: `${preCodeMatches.length} 个 pre code，${bad.length} 个缺少 color 样式`,
      }
    }

    // CHECK: inline-code 有 style
    const inlineCodeMatches = [...html.matchAll(/class="inline-code"\s+style="([^"]*)"/g)]
    const inlineCodeNoStyle = [...html.matchAll(/class="inline-code"\s+style=""/g)]
    if (inlineCodeMatches.length === 0 && inlineCodeNoStyle.length === 0) {
      checks["CODE_INLINE_STYLE"] = { status: "SKIP", detail: "无行内代码" }
    } else {
      checks["CODE_INLINE_STYLE"] = {
        status: inlineCodeNoStyle.length === 0 ? "PASS" : "FAIL",
        detail: `${inlineCodeMatches.length + inlineCodeNoStyle.length} 个 inline-code，${inlineCodeNoStyle.length} 个 style 为空`,
      }
    }

    // CHECK: h2 有 border-left
    const h2Matches = [...html.matchAll(/<h2[^>]*style="([^"]*)"/g)]
    if (h2Matches.length === 0) {
      checks["H2_BORDER_LEFT"] = { status: "SKIP", detail: "无 h2" }
    } else {
      const bad = h2Matches.filter(m => !m[1].includes("border-left"))
      checks["H2_BORDER_LEFT"] = {
        status: bad.length === 0 ? "PASS" : "FAIL",
        detail: `${h2Matches.length} 个 h2，${bad.length} 个缺少 border-left`,
      }
    }

    const checkList = Object.entries(checks).map(([id, result]) => ({ id, ...result }))
    const passCount = checkList.filter(c => c.status === "PASS").length
    const failCount = checkList.filter(c => c.status === "FAIL").length
    const skipCount = checkList.filter(c => c.status === "SKIP").length

    ok({
      overall: failCount === 0 ? "PASS" : "FAIL",
      pass_count: passCount,
      fail_count: failCount,
      skip_count: skipCount,
      checks: checkList,
      recommendation: failCount === 0
        ? "静态检查通过，建议用 CDP QA 做最终验证"
        : `需要修复: ${checkList.filter(c => c.status === "FAIL").map(c => c.id).join(", ")}`,
    })
  })

program.parse()

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() ?? null
}
