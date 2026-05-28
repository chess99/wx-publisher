#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const STYLES = {
  article:
    "box-sizing: border-box; color: #1f2933; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.78; max-width: 677px; margin: 0 auto; padding: 8px 0",
  h1:
    "font-size: 26px; line-height: 1.28; font-weight: 700; color: #111827; margin: 0 0 22px; padding: 0 0 12px; border-bottom: 2px solid #2f80ed",
  h2:
    "font-size: 22px; line-height: 1.35; font-weight: 700; color: #12355b; margin: 30px 0 14px; padding-left: 12px; border-left: 4px solid #2f80ed",
  h3:
    "font-size: 18px; line-height: 1.45; font-weight: 700; color: #1f2933; margin: 24px 0 10px",
  h4:
    "font-size: 16px; line-height: 1.5; font-weight: 700; color: #374151; margin: 20px 0 8px",
  p: "font-size: 16px; line-height: 1.78; color: #374151; margin: 12px 0",
  blockquote:
    "margin: 18px 0; padding: 12px 16px; color: #44546a; background: #f4f8fb; border-left: 4px solid #7aa7d9; border-radius: 4px",
  ul: "margin: 12px 0; padding-left: 22px; color: #374151",
  ol: "margin: 12px 0; padding-left: 22px; color: #374151",
  li: "margin: 6px 0; line-height: 1.7",
  pre: "box-sizing: border-box; margin: 16px 0; padding: 14px 16px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; background: #111827; color: #e5e7eb; border-radius: 6px; font-size: 14px; line-height: 1.65",
  code:
    "font-family: Menlo, Monaco, Consolas, 'Courier New', monospace; background: #eef4ff; color: #0f3a75; padding: 2px 5px; border-radius: 4px; font-size: 90%",
  codeBlock: "font-family: Menlo, Monaco, Consolas, 'Courier New', monospace",
  strong: "font-weight: 700; color: #111827",
  em: "font-style: italic; color: #4b5563",
  hr: "border: none; border-top: 1px solid #d6dde8; margin: 28px 0",
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function tag(name, attrs = {}, children = "") {
  const attrText = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => (value === true ? key : `${key}="${escapeHtml(value)}"`))
    .join(" ")
  return `<${name}${attrText ? ` ${attrText}` : ""}>${children}</${name}>`
}

function renderInline(markdown) {
  const codeTokens = []
  let text = String(markdown).replace(/`([^`\n]+)`/g, (_match, code) => {
    const token = `\u0000CODE${codeTokens.length}\u0000`
    codeTokens.push(tag("code", { style: STYLES.code }, escapeHtml(code)))
    return token
  })

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")

  let html = escapeHtml(text)
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, (_match, value) =>
    tag("strong", { style: STYLES.strong }, tag("em", { style: STYLES.em }, value))
  )
  html = html.replace(/\*\*([^*]+)\*\*/g, (_match, value) =>
    tag("strong", { style: STYLES.strong }, value)
  )
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, (_match, value) =>
    tag("em", { style: STYLES.em }, value)
  )

  return html.replace(/\u0000CODE(\d+)\u0000/g, (_match, index) => codeTokens[Number(index)] ?? "")
}

function isBlank(line) {
  return /^\s*$/.test(line)
}

function isFence(line) {
  return /^\s*```/.test(line)
}

function isHorizontalRule(line) {
  return /^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)
}

function isHeading(line) {
  return /^\s{0,3}#{1,6}\s+/.test(line)
}

function isBlockquote(line) {
  return /^\s{0,3}>\s?/.test(line)
}

function unorderedMatch(line) {
  return line.match(/^\s{0,3}[-*+]\s+(.+)$/)
}

function orderedMatch(line) {
  return line.match(/^\s{0,3}\d+[.)]\s+(.+)$/)
}

function renderList(items, ordered) {
  const listTag = ordered ? "ol" : "ul"
  const body = items
    .map((item) => tag("li", { style: STYLES.li }, renderInline(item)))
    .join("")
  return tag(listTag, { style: STYLES[listTag] }, body)
}

function renderParagraph(lines) {
  return tag("p", { style: STYLES.p }, renderInline(lines.join(" ").trim()))
}

export function renderWechatArticle(markdown, options = {}) {
  const lines = String(markdown).replace(/\r\n?/g, "\n").split("\n")
  const blocks = []
  let index = 0

  if (options.title) {
    blocks.push(tag("h1", { style: STYLES.h1 }, escapeHtml(options.title)))
  }

  while (index < lines.length) {
    const line = lines[index]

    if (isBlank(line)) {
      index += 1
      continue
    }

    if (isFence(line)) {
      index += 1
      const codeLines = []
      while (index < lines.length && !isFence(lines[index])) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) {
        index += 1
      }
      blocks.push(
        tag("pre", { style: STYLES.pre }, tag("code", { style: STYLES.codeBlock }, escapeHtml(codeLines.join("\n"))))
      )
      continue
    }

    if (isHorizontalRule(line)) {
      blocks.push(`<hr style="${escapeHtml(STYLES.hr)}">`)
      index += 1
      continue
    }

    if (isHeading(line)) {
      const match = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/)
      const level = Math.min(match[1].length, 4)
      blocks.push(tag(`h${level}`, { style: STYLES[`h${level}`] }, renderInline(match[2].replace(/\s+#+\s*$/, ""))))
      index += 1
      continue
    }

    if (isBlockquote(line)) {
      const quoteLines = []
      while (index < lines.length && isBlockquote(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s{0,3}>\s?/, ""))
        index += 1
      }
      blocks.push(tag("blockquote", { style: STYLES.blockquote }, renderParagraph(quoteLines)))
      continue
    }

    const unordered = unorderedMatch(line)
    const ordered = orderedMatch(line)
    if (unordered || ordered) {
      const items = []
      const orderedList = Boolean(ordered)
      while (index < lines.length) {
        const itemMatch = orderedList ? orderedMatch(lines[index]) : unorderedMatch(lines[index])
        if (!itemMatch) {
          break
        }
        items.push(itemMatch[1])
        index += 1
      }
      blocks.push(renderList(items, orderedList))
      continue
    }

    const paragraphLines = []
    while (
      index < lines.length &&
      !isBlank(lines[index]) &&
      !isFence(lines[index]) &&
      !isHeading(lines[index]) &&
      !isHorizontalRule(lines[index]) &&
      !isBlockquote(lines[index]) &&
      !unorderedMatch(lines[index]) &&
      !orderedMatch(lines[index])
    ) {
      paragraphLines.push(lines[index])
      index += 1
    }
    blocks.push(renderParagraph(paragraphLines))
  }

  const separator = options.pretty ? "\n" : ""
  return tag("section", { style: STYLES.article }, blocks.join(separator))
}

function parseArgs(args) {
  const result = {
    file: null,
    output: null,
    title: "",
    pretty: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--pretty") {
      result.pretty = true
      continue
    }

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

function printJson(payload, pretty = false) {
  process.stdout.write(`${JSON.stringify(payload, null, pretty ? 2 : 0)}\n`)
}

async function main() {
  let pretty = false

  try {
    const args = parseArgs(process.argv.slice(2))
    pretty = args.pretty
    const filePath = resolve(process.cwd(), args.file)
    const outputPath = resolve(process.cwd(), args.output)
    const markdown = await readFile(filePath, "utf8")
    const html = renderWechatArticle(markdown, { title: args.title, pretty })

    await writeFile(outputPath, html, "utf8")
    printJson({
      success: true,
      data: {
        input: filePath,
        output: outputPath,
        title: args.title || null,
      },
    }, pretty)
  } catch (error) {
    printJson({
      success: false,
      error: "Markdown render failed",
      details: error instanceof Error ? error.message : String(error),
    }, pretty)
    process.exitCode = 1
  }
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await main()
}
