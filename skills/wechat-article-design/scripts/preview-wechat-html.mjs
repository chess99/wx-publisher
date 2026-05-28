#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises"
import { basename, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { validateWechatHtml } from "./validate-wechat-html.mjs"

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function parseArgs(args) {
  const result = {
    file: null,
    output: null,
    title: "",
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--file" || arg === "-f" || arg === "--output" || arg === "-o" || arg === "--title") {
      const value = args[index + 1]
      if (!value || value.startsWith("-")) {
        throw new Error(`${arg} requires a value`)
      }
      if (arg === "--file" || arg === "-f") result.file = value
      if (arg === "--output" || arg === "-o") result.output = value
      if (arg === "--title") result.title = value
      index += 1
      continue
    }

    throw new Error(`unknown argument: ${arg}`)
  }

  if (!result.file) throw new Error("missing required --file argument")
  if (!result.output) throw new Error("missing required --output argument")

  return result
}

function renderPreviewPage({ title, sourcePath, articleHtml, warnings }) {
  const pageTitle = title || basename(sourcePath)
  const warningHtml =
    warnings.length > 0
      ? `<section style="max-width: 677px; margin: 0 auto 12px; padding: 10px 12px; background: #fff8e6; color: #6b4e00; border: 1px solid #f1d48a; border-radius: 6px; font-size: 13px; line-height: 1.5;">${escapeHtml(
          warnings.join(" | ")
        )}</section>`
      : ""

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <style>
    body {
      margin: 0;
      padding: 32px 16px;
      background: #eef1f5;
      color: #1f2933;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    }
    .wx-preview-shell {
      box-sizing: border-box;
      max-width: 677px;
      margin: 0 auto;
      padding: 28px 24px;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      border-radius: 8px;
    }
    .wx-preview-meta {
      max-width: 677px;
      margin: 0 auto 16px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <section class="wx-preview-meta">
    <strong>${escapeHtml(pageTitle)}</strong><br>
    ${escapeHtml(sourcePath)}
  </section>
  ${warningHtml}
  <main class="wx-preview-shell">
${articleHtml}
  </main>
</body>
</html>
`
}

function printJson(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`)
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2))
    const filePath = resolve(process.cwd(), args.file)
    const outputPath = resolve(process.cwd(), args.output)
    const html = await readFile(filePath, "utf8")
    const validation = validateWechatHtml(html, { filePath })

    if (!validation.success) {
      printJson({
        success: false,
        error: "HTML validation failed",
        details: validation.data.errors.join("; "),
        data: validation.data,
      })
      process.exitCode = 1
      return
    }

    const preview = renderPreviewPage({
      title: args.title,
      sourcePath: filePath,
      articleHtml: html,
      warnings: validation.data.warnings,
    })

    await writeFile(outputPath, preview, "utf8")
    printJson({
      success: true,
      data: {
        input: filePath,
        output: outputPath,
        title: args.title || basename(filePath),
        warnings: validation.data.warnings,
      },
    })
  } catch (error) {
    printJson({
      success: false,
      error: "Preview generation failed",
      details: error instanceof Error ? error.message : String(error),
    })
    process.exitCode = 1
  }
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await main()
}
