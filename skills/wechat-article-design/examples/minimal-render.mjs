#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { renderWechatArticle } from "../scripts/render-wechat-article.mjs"

const examplesDir = dirname(fileURLToPath(import.meta.url))
const markdownPath = join(examplesDir, "article.md")
const outputPath = join(examplesDir, "rendered.html")

const markdown = await readFile(markdownPath, "utf8")
const html = renderWechatArticle(markdown, {
  pretty: true,
})

await writeFile(outputPath, html, "utf8")
process.stdout.write(JSON.stringify({ success: true, output: outputPath }) + "\n")
