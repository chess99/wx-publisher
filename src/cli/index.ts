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
import { readFileSync, writeFileSync, unlinkSync } from "fs"
import { resolve } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { spawn } from "child_process"
import { convertMarkdown } from "../converter/index.js"
import { generatePreviewHtml } from "../converter/preview-html.js"
import { WechatClient } from "../wechat/client.js"
import { loadConfig, saveConfig, getConfigPath, validateConfig } from "../config/index.js"
import { listThemes, getTheme } from "../converter/themes.js"
import { PLACEHOLDER_COVER_BASE64, PLACEHOLDER_COVER_FILENAME } from "../converter/placeholder-cover.js"
import { OpenAIImageProvider } from "../image/providers/openai.js"
import { MiniMaxImageProvider } from "../image/providers/minimax.js"
import { generateImagePrompt } from "../image/prompt-generator.js"
import { startSelectionServer } from "../image/selection-server.js"
import { generateGenCoverHtml } from "../image/gen-cover-html.js"

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
  .option("-c, --cover <path>", "封面图本地路径（不提供则使用内置占位图）")
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
    let usedPlaceholderCover = false
    if (opts.cover) {
      const result = await client.uploadImage(resolve(opts.cover)).catch(e => fail(`上传封面图失败`, String(e)))
      thumbMediaId = result.media_id
    } else if (opts.coverUrl) {
      const result = await client.uploadImageFromUrl(opts.coverUrl).catch(e => fail(`下载并上传封面图失败`, String(e)))
      thumbMediaId = result.media_id
    } else {
      // 未提供封面图，使用内置占位图
      const tmpPath = resolve(tmpdir(), `wx-publisher-placeholder-${randomUUID()}.png`)
      writeFileSync(tmpPath, Buffer.from(PLACEHOLDER_COVER_BASE64, "base64"))
      try {
        const result = await client.uploadImage(tmpPath).catch(e => fail(`上传占位封面图失败`, String(e)))
        thumbMediaId = result.media_id
        usedPlaceholderCover = true
      } finally {
        try { unlinkSync(tmpPath) } catch {}
      }
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
      used_placeholder_cover: usedPlaceholderCover,
      ...(usedPlaceholderCover && { warning: "未提供封面图，已使用内置占位图。建议用 --cover 或 --cover-url 指定真实封面图后重新发布。" }),
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
      wechat_appid:       config.wechat_appid || "(未设置)",
      wechat_secret:      config.wechat_secret ? "***" : "(未设置)",
      default_theme:      config.default_theme,
      image_provider:     config.image_provider,
      image_provider_url: config.image_provider_url,
      image_api_key:      config.image_api_key ? "***" : "(未设置)",
      image_model:        config.image_model,
      image_text_model:   config.image_text_model,
      image_size:         config.image_size,
      image_candidates:   config.image_candidates,
      config_path:        getConfigPath(),
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
          required_flags: ["--file"],
          optional_flags: ["--theme", "--title", "--author", "--no-upload-images", "--cover", "--cover-url"],
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
        "封面图可选：--cover 本地路径 或 --cover-url 公网 URL；不提供则自动使用内置占位图，JSON 输出含 warning 字段",
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

// ── preview：浏览器主题预览（人类用） ─────────────────────────────────────────

program
  .command("preview")
  .description("在浏览器中预览所有主题效果（人类用，AI Agent 直接用 --theme 参数）")
  .requiredOption("-f, --file <path>", "Markdown 文件路径")
  .option("-o, --output <path>", "输出 HTML 路径（默认写入系统临时目录）")
  .option("--no-open", "生成 HTML 但不自动打开浏览器")
  .action(async (opts) => {
    let markdown: string
    const absPath = resolve(opts.file)
    try {
      markdown = readFileSync(absPath, "utf-8")
    } catch (e) {
      fail(`读取文件失败: ${opts.file}`, String(e))
    }

    const themes = listThemes()

    // 并行渲染所有主题，任一失败不影响其他
    const settled = await Promise.allSettled(
      themes.map(theme => convertMarkdown(markdown, { theme }))
    )

    const results = themes.map((theme, i) => {
      const r = settled[i]
      if (r.status === "fulfilled") {
        return { theme, html: r.value.html }
      } else {
        return { theme, html: "", error: String(r.reason) }
      }
    })

    const outputPath = opts.output ?? `${tmpdir()}/wxp-preview-${randomUUID()}.html`
    const html = generatePreviewHtml(results, absPath)

    try {
      writeFileSync(outputPath, html, "utf-8")
    } catch (e) {
      fail(`写入预览文件失败: ${outputPath}`, String(e))
    }

    if (opts.open !== false) {
      const openCmd = process.platform === "darwin" ? "open"
        : process.platform === "win32" ? "start"
        : "xdg-open"
      spawn(openCmd, [outputPath], { detached: true, stdio: "ignore" }).unref()
    }

    ok({
      path: outputPath,
      themes: results.map(r => ({ theme: r.theme, ok: !r.error, error: r.error })),
      message: opts.open !== false ? "已在浏览器中打开预览" : "预览文件已生成",
    })
  })

// ── gen-cover：AI 生成封面图候选，浏览器选图 ─────────────────────────────────

program
  .command("gen-cover")
  .description("AI 生成封面图候选，浏览器选图后输出封面图路径")
  .requiredOption("-f, --file <path>", "Markdown 文件路径")
  .option("-n, --n <number>", "候选图数量（1-4，默认读配置）")
  .option("--style <desc>", "附加风格提示词（追加到自动生成的提示词后）")
  .option("-o, --output <path>", "封面图输出路径（默认 <tmpdir>/wxp-cover-{uuid}.jpg）")
  .action(async (opts) => {
    const config = loadConfig()

    // 检查 provider 支持
    const supportedProviders = ["openai", "minimax"]
    if (!supportedProviders.includes(config.image_provider)) {
      process.stderr.write(
        `不支持的 image_provider: ${config.image_provider}\n` +
        `支持的值：${supportedProviders.join(", ")}\n` +
        `如需接入其他 OpenAI 兼容服务，设置 image_provider: openai 并配置 image_provider_url。\n`
      )
      process.exit(1)
    }

    const apiKey = config.image_api_key
    if (!apiKey) {
      const envHint = config.image_provider === "minimax"
        ? "请设置 MINIMAX_API_KEY 环境变量，或运行：\n  wxp config set image_api_key <your-key>"
        : "请设置 OPENAI_API_KEY 环境变量，或运行：\n  wxp config set image_api_key sk-..."
      process.stderr.write(`未找到 API key。${envHint}\n`)
      process.exit(1)
    }

    // 校验 --n 参数
    if (opts.n !== undefined && !/^\d+$/.test(String(opts.n))) {
      process.stderr.write(`--n 必须为 1-4 的整数，收到: ${opts.n}\n`)
      process.exit(1)
    }
    const n = opts.n ? Math.min(4, Math.max(1, parseInt(opts.n, 10))) : config.image_candidates

    // 读取文章
    const absPath = resolve(opts.file)
    let markdown: string
    try {
      markdown = readFileSync(absPath, "utf-8")
    } catch (e) {
      fail(`读取文件失败: ${opts.file}`, String(e))
    }

    // 生成提示词（通过 image_provider_url 的 OpenAI 兼容 chat endpoint）
    // MiniMax 支持 OpenAI 兼容格式：baseURL=https://api.minimaxi.com/v1，模型=MiniMax-M2.7
    process.stderr.write("正在生成图像提示词...\n")
    let prompt: string
    try {
      prompt = await generateImagePrompt(markdown, apiKey, {
        baseURL: config.image_provider_url,
        textModel: config.image_text_model,
      })
      if (opts.style) prompt = `${prompt}, ${opts.style}`
    } catch (e) {
      fail("提示词生成失败", String(e))
    }
    process.stderr.write(`提示词：${prompt}\n`)

    // 选择生图 provider 实例
    const provider = config.image_provider === "minimax"
      ? new MiniMaxImageProvider(apiKey, config.image_model)
      : new OpenAIImageProvider(apiKey, config.image_provider_url, config.image_model)
    let images: Buffer[]
    try {
      const results = await provider.generateImages(prompt, {
        n,
        size: config.image_size,
      })
      // Issue #7: 过滤掉 b64_json 为空的项（某些兼容层可能返回 null）
      images = results.filter(r => r.data.length > 0).map(r => r.data)
    } catch (e) {
      fail("图片生成失败", String(e))
    }

    // Issue #6: API 返回空数组时提前退出，避免挂起 10 分钟
    if (images.length === 0) {
      fail("图片生成失败：API 未返回任何图片，请检查模型配置和 API 配额")
    }

    // 启动选图服务
    const outputPath = opts.output ?? `${tmpdir()}/wxp-cover-${randomUUID()}.jpg`
    let resolved = false

    let htmlPath: string
    const server = startSelectionServer(images, (index) => {
      if (resolved) return
      resolved = true

      try {
        writeFileSync(outputPath, images[index])
      } catch (e) {
        server.close()
        fail(`写入封面图失败: ${outputPath}`, String(e))
      }

      server.close()
      // 清理临时 HTML 文件
      try { unlinkSync(htmlPath) } catch { /* best effort */ }
      ok({ cover: outputPath, prompt })
    })

    // 生成并打开选图页
    const html = generateGenCoverHtml({
      port: server.port,
      imageCount: images.length,
      prompt,
      filePath: absPath,
    })

    htmlPath = `${tmpdir()}/wxp-gen-cover-${randomUUID()}.html`
    writeFileSync(htmlPath, html, "utf-8")

    process.stderr.write(`正在打开浏览器选图页...\n`)
    const openCmd = process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "start"
      : "xdg-open"
    // Issue #9: Windows 的 start 是 cmd.exe 内建命令，需要 shell:true
    spawn(openCmd, [htmlPath], {
      detached: true,
      stdio: "ignore",
      shell: process.platform === "win32",
    }).unref()

    process.stderr.write(`选图页已打开，请在浏览器中选择封面图。\n`)

    // 等待用户选图（最多 10 分钟）
    const timeout = setTimeout(() => {
      if (!resolved) {
        server.close()
        process.stderr.write("超时（10分钟未选图），进程退出。\n")
        process.exit(1)
      }
    }, 10 * 60 * 1000)
    timeout.unref()
  })

program.parse()

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() ?? null
}
