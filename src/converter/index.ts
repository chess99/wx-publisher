/**
 * Markdown → 微信公众号 HTML 转换器
 *
 * 微信公众号渲染限制：
 * - 不支持外部 CSS（class 无效），所有样式必须内联到 style 属性
 * - 不支持外链，链接转为带下划线文字
 * - 图片必须是微信素材库 URL，外链图片会被屏蔽
 * - ul/ol/li 标签会被微信二次处理导致空行，改用 <p> + 前缀符号模拟
 * - pre/code 不能依赖 white-space:pre，换行→<br>，空格→&nbsp;（doocs/md 方案）
 */

import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import type { Root, Element, Text, ElementContent } from "hast"
import { visit, SKIP } from "unist-util-visit"
import hljs from "highlight.js"
import { getTheme, type NodeStyles, type Theme } from "./themes.js"
import { parseAdvancedLayoutBlocks } from "./advanced-layout/parser.js"
import { renderAdvancedModules, type RenderedAdvancedBlock } from "./advanced-layout/renderers.js"
import { collectAdvancedModuleImages } from "./advanced-layout/images.js"

/**
 * hljs token 类型 → inline style 颜色映射
 * 参考 Atom One Dark 主题，与 preCode 的 #abb2bf 基础色搭配
 */
const HLJS_TOKEN_COLORS: Record<string, string> = {
  "hljs-comment":    "color:#5c6370;font-style:italic;",
  "hljs-quote":      "color:#5c6370;font-style:italic;",
  "hljs-keyword":    "color:#c678dd;",
  "hljs-selector-tag": "color:#c678dd;",
  "hljs-addition":   "color:#98c379;",
  "hljs-number":     "color:#d19a66;",
  "hljs-string":     "color:#98c379;",
  "hljs-meta hljs-meta-string": "color:#98c379;",
  "hljs-literal":    "color:#56b6c2;",
  "hljs-doctag":     "color:#56b6c2;",
  "hljs-regexp":     "color:#56b6c2;",
  "hljs-title":      "color:#61afef;",
  "hljs-section":    "color:#61afef;font-weight:bold;",
  "hljs-name":       "color:#e06c75;",
  "hljs-selector-id":   "color:#e06c75;",
  "hljs-selector-class":"color:#e06c75;",
  "hljs-attribute":  "color:#d19a66;",
  "hljs-attr":       "color:#d19a66;",
  "hljs-variable":   "color:#e06c75;",
  "hljs-template-variable": "color:#e06c75;",
  "hljs-type":       "color:#e5c07b;",
  "hljs-built_in":   "color:#e5c07b;",
  "hljs-builtin-name":"color:#e5c07b;",
  "hljs-symbol":     "color:#e5c07b;",
  "hljs-bullet":     "color:#e5c07b;",
  "hljs-link":       "color:#61afef;text-decoration:underline;",
  "hljs-deletion":   "color:#e06c75;",
  "hljs-emphasis":   "font-style:italic;",
  "hljs-strong":     "font-weight:bold;",
  "hljs-formula":    "color:#56b6c2;",
  "hljs-params":     "color:#abb2bf;",
  "hljs-subst":      "color:#abb2bf;",
  "hljs-meta":       "color:#61afef;",
  "hljs-selector-pseudo": "color:#56b6c2;",
  "hljs-selector-attr":   "color:#d19a66;",
  "hljs-tag":        "color:#e06c75;",
  "hljs-operator":   "color:#56b6c2;",
  "hljs-punctuation":"color:#abb2bf;",
}

export interface ConvertOptions {
  theme?: string
  themeDefinition?: Theme
  stripLinks?: boolean
}

export interface ConvertResult {
  html: string
  externalImages: string[]
  localImages: string[]
}


export async function convertMarkdown(markdown: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  const { theme: themeName = "default", themeDefinition, stripLinks = true } = options
  const theme = themeDefinition ?? getTheme(themeName)
  const externalImages: string[] = []
  const localImages: string[] = []

  // 剥离 Hexo/Jekyll front matter
  const stripped = markdown.replace(/^---\n[\s\S]*?\n---\n?/, "").trimStart()
  const advanced = parseAdvancedLayoutBlocks(stripped)
  const advancedBlocks = renderAdvancedModules(advanced.modules, theme)
  const advancedImages = collectAdvancedModuleImages(advanced.modules)
  externalImages.push(...advancedImages.externalImages)
  localImages.push(...advancedImages.localImages)

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(() => (tree: Root) => {
      injectAdvancedBlocks(tree, advancedBlocks)
      inlineStyles(tree, theme.styles, externalImages, localImages, stripLinks)
    })
    .use(rehypeStringify, { allowDangerousHtml: true })

  const result = await processor.process(advanced.markdown)
  const inner = String(result)
  const html = `<section style="${escapeAttr(theme.styles.wrapper)}">${inner}</section>`

  return { html, externalImages, localImages }
}

function injectAdvancedBlocks(tree: Root, blocks: RenderedAdvancedBlock[]): void {
  if (blocks.length === 0) return
  const blockMap = new Map(blocks.map(block => [block.marker, block.html]))

  visit(tree, "element", (node: Element, index, parent) => {
    if (!parent || typeof index !== "number" || node.tagName !== "p") return
    const text = node.children.length === 1 && node.children[0]?.type === "text"
      ? node.children[0].value.trim()
      : ""
    const html = blockMap.get(text)
    if (!html) return

    blockMap.delete(text)
    parent.children[index] = {
      type: "raw" as never,
      value: html,
    } as never
    return SKIP
  })
}

/**
 * 剥掉 li 直接子级的 <p> 包裹（松散列表产生），避免 p 的 margin 撑开空行
 * 同时过滤掉纯空白文本节点（\n），防止微信编辑器将其渲染为额外空行
 * <li>\n<p>text</p>\n</li> → <li>text</li>
 */
function unwrapLiParagraphs(children: ElementContent[]): ElementContent[] {
  const result: ElementContent[] = []
  for (const child of children) {
    if (child.type === "element" && child.tagName === "p") {
      result.push(...child.children)
    } else if (child.type === "text" && child.value.trim() === "") {
      // 跳过纯空白文本节点（loose list 产生的 \n）
    } else {
      result.push(child)
    }
  }
  return result
}

/**
 * 用 highlight.js 高亮代码，输出微信兼容的 HTML：
 * - hljs 的 class-based span → inline style span
 * - 换行 → <br>
 * - 空格/制表符 → &nbsp;
 */
function formatCodeForWechat(text: string, lang?: string): string {
  // 用 hljs 高亮，得到带 class 的 span HTML
  let highlighted: string
  try {
    const language = lang && hljs.getLanguage(lang) ? lang : undefined
    highlighted = language
      ? hljs.highlight(text, { language }).value
      : hljs.highlightAuto(text).value
  } catch {
    highlighted = escapeHtml(text)
  }

  // 把 hljs class-based span 转成 inline style span
  highlighted = convertHljsClassesToInlineStyles(highlighted)

  // tab → 4空格
  highlighted = highlighted.replace(/\t/g, "    ")

  // 只把文本节点（标签外）的空格转 &nbsp;，标签属性里的空格不动
  // 正则 (>[^<]+)|(^[^<]+) 匹配 >文字 或行首文字
  highlighted = highlighted.replace(/(>[^<]+)|(^[^<]+)/g, str => str.replace(/ /g, "&nbsp;"))

  // 换行 → <br>
  return highlighted.replace(/\n/g, "<br>")
}

/**
 * 把 hljs 输出的 <span class="hljs-xxx"> 转成 <span style="color:...">
 * hljs 输出的 HTML 已经 escape 过，不需要再 escape
 */
function convertHljsClassesToInlineStyles(html: string): string {
  return html.replace(
    /<span class="([^"]+)">/g,
    (_, classes: string) => {
      // hljs 有时会输出多个 class，找第一个匹配的
      const classList = classes.trim().split(/\s+/)
      // 先试完整 class 名，再试单个
      for (const cls of classList) {
        if (HLJS_TOKEN_COLORS[cls]) {
          return `<span style="${HLJS_TOKEN_COLORS[cls]}">`
        }
      }
      // 组合 class（如 "hljs-meta hljs-meta-string"）
      const combined = classList.join(" ")
      if (HLJS_TOKEN_COLORS[combined]) {
        return `<span style="${HLJS_TOKEN_COLORS[combined]}">`
      }
      // 没有匹配的 token，用默认文字色
      return `<span style="color:inherit;">`
    }
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * 遍历 hast 树，注入内联样式
 */
function inlineStyles(
  tree: Root,
  styles: NodeStyles,
  externalImages: string[],
  localImages: string[],
  stripLinks: boolean
): void {
  visit(tree, "element", (node: Element, index, parent) => {
    const tag = node.tagName

    switch (tag) {
      case "h1": applyStyle(node, styles.h1); break
      case "h2": applyStyle(node, styles.h2); break
      case "h3": applyStyle(node, styles.h3); break
      case "h4":
      case "h5":
      case "h6": applyStyle(node, styles.h4); break
      case "p":  applyStyle(node, styles.p);  break

      case "strong": applyStyle(node, styles.strong); break
      case "em":     applyStyle(node, styles.em);     break

      case "hr": applyStyle(node, styles.hr); break

      // 列表：display:block 消除 list-item 默认行为，li 前加 bullet 前缀
      // 关键：过滤掉 ul/ol 里的文本节点（\n），防止 ProseMirror 把它们渲染成空 li
      case "ul": {
        applyStyle(node, styles.ul)
        const ulLis = node.children.filter(
          (c): c is Element => c.type === "element" && c.tagName === "li"
        )
        for (const li of ulLis) {
          li.children = [{ type: "text", value: "• " } as Text, ...unwrapLiParagraphs(li.children)]
        }
        node.children = ulLis
        break
      }
      case "ol": {
        applyStyle(node, styles.ol)
        let counter = 1
        const olLis = node.children.filter(
          (c): c is Element => c.type === "element" && c.tagName === "li"
        )
        for (const li of olLis) {
          li.children = [{ type: "text", value: `${counter++}. ` } as Text, ...unwrapLiParagraphs(li.children)]
        }
        node.children = olLis
        break
      }
      case "li": {
        applyStyle(node, styles.li)
        node.children = unwrapLiParagraphs(node.children)
        break
      }

      case "table":      applyStyle(node, styles.table);      break
      case "th":         applyStyle(node, styles.th);         break
      case "td":         applyStyle(node, styles.td);         break
      case "blockquote": {
        if (styleGfmAlert(node, styles)) return SKIP
        applyStyle(node, styles.blockquote)
        break
      }
      case "section": {
        styleFootnotes(node, styles)
        break
      }
      case "sup": {
        styleFootnoteReference(node)
        break
      }

      case "pre": {
        const codeChild = node.children.find(
          (c): c is Element => c.type === "element" && c.tagName === "code"
        )

        if (codeChild) {
          const rawText = extractText(codeChild)
          // 从 class="language-xxx" 提取语言
          const classNames = (codeChild.properties?.className ?? []) as string[]
          const lang = classNames.find(c => c.startsWith("language-"))?.replace("language-", "")
          const formattedHtml = formatCodeForWechat(rawText, lang)

          // doocs/md 结构：pre 加 hljs class，code 加 language-xxx class
          // ProseMirror 识别 hljs class 从而保留内容；style 双写保证样式
          // white-space:nowrap 防折行，color 保证文字可见
          const preStyle = styles.pre
          const codeStyle = `${styles.preCode};white-space:nowrap;`

          node.properties = { class: "hljs code__pre", style: preStyle }
          node.children = [
            {
              type: "raw" as never,
              value: `<code class="language-${escapeAttr(lang ?? "plaintext")}" style="${escapeAttr(codeStyle)}">${formattedHtml}</code>`,
            } as never,
          ]
        } else {
          applyStyle(node, styles.pre)
        }

        return SKIP
      }

      case "code": {
        // 用 raw 节点硬写 style + class，确保 ProseMirror 不剥离样式
        const codeText = extractText(node)
        const escaped = escapeHtml(codeText);
        (node as unknown as { type: string; value: string }).type = "raw";
        (node as unknown as { value: string }).value =
          `<code class="inline-code" style="${escapeAttr(styles.code)}">${escaped}</code>`
        break
      }

      case "img": {
        const src = sanitizeImageUrl(node.properties?.src as string | undefined)
        if (!src) {
          if (parent && typeof index === "number") {
            parent.children[index] = {
              type: "element",
              tagName: "span",
              properties: { style: styles.em },
              children: [{ type: "text", value: `[图片已移除${imageAltText(node)}]` }],
            } as Element
          }
          return SKIP
        }
        node.properties = { ...node.properties, src }
        applyStyle(node, styles.img)
        if (src && isExternalUrl(src)) {
          externalImages.push(src)
        } else if (src && isLocalImagePath(src)) {
          localImages.push(src)
        }
        break
      }

      case "a": {
        styleLinkNode(node, styles, stripLinks)
        break
      }
    }
  })
}

const ALERTS: Record<string, { title: string; color: string; icon: string }> = {
  NOTE: { title: "提示", color: "#478be6", icon: "ⓘ" },
  TIP: { title: "技巧", color: "#57ab5a", icon: "💡" },
  IMPORTANT: { title: "重要", color: "#a855f7", icon: "!" },
  WARNING: { title: "警告", color: "#f59e0b", icon: "⚠" },
  CAUTION: { title: "注意", color: "#ef4444", icon: "!" },
}

function styleGfmAlert(node: Element, styles: NodeStyles): boolean {
  const first = node.children.find((child): child is Element => child.type === "element" && child.tagName === "p")
  if (!first) return false
  const text = extractText(first)
  const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)]\s*\n?/)
  if (!match) return false

  const alert = ALERTS[match[1]]
  stripAlertMarker(first, match[0])
  const preservedChildren = node.children.filter(child => child !== first || !isEmptyElement(first))
  for (const child of preservedChildren) styleAlertContent(child, styles)
  node.properties = {
    class: `markdown-alert markdown-alert-${match[1].toLowerCase()}`,
    style: `margin:1.5em 0 2em;padding:1.2em 1.5em;border-left:4px solid ${alert.color};background:linear-gradient(135deg, ${hexToRgba(alert.color, 0.08)}, rgba(255,255,255,0.95));border:1px solid ${hexToRgba(alert.color, 0.2)};border-radius:8px;color:rgb(60,60,60);`,
  }
  node.children = [
    {
      type: "element",
      tagName: "p",
      properties: {
        class: "markdown-alert-title",
        style: `color:${alert.color};margin:0 0 8px;font-size:15px;font-weight:800;line-height:1.5;`,
      },
      children: [{ type: "text", value: `${alert.icon} ${alert.title}` }],
    },
    ...preservedChildren,
  ]
  return true
}

function stripAlertMarker(first: Element, marker: string): void {
  let remaining = marker.length
  const children: ElementContent[] = []

  for (const child of first.children) {
    if (remaining > 0 && child.type === "text") {
      const value = child.value.slice(Math.min(remaining, child.value.length)).replace(/^\s+/, "")
      remaining -= Math.min(remaining, child.value.length)
      if (value) children.push({ ...child, value })
      continue
    }
    children.push(child)
  }

  first.children = children
}

function isEmptyElement(node: Element): boolean {
  return node.children.every(child => child.type === "text" ? child.value.trim() === "" : false)
}

function styleAlertContent(child: ElementContent, styles: NodeStyles): void {
  if (child.type !== "element") return
  switch (child.tagName) {
    case "p": applyStyle(child, styles.p); break
    case "strong": applyStyle(child, styles.strong); break
    case "em": applyStyle(child, styles.em); break
    case "code": applyStyle(child, styles.code); break
    case "a": styleLinkNode(child, styles, false); break
    case "ul": applyStyle(child, styles.ul); break
    case "ol": applyStyle(child, styles.ol); break
    case "li": applyStyle(child, styles.li); break
  }
  for (const nested of child.children) styleAlertContent(nested, styles)
}

function styleFootnotes(node: Element, styles: NodeStyles): void {
  if (!("dataFootnotes" in (node.properties ?? {}))) return
  applyStyle(node, "margin-top:2em;padding-top:1.5em;border-top:1px solid #e5e5e5;")
  node.properties = {
    ...node.properties,
    role: "doc-footnotes",
    ariaLabel: "引用链接",
  }

  for (const child of node.children) {
    if (child.type === "element" && child.tagName === "h2") {
      child.tagName = "h4"
      child.properties = { style: styles.h4 }
      child.children = [{ type: "text", value: "引用链接" }]
    }
    if (child.type === "element" && child.tagName === "ol") {
      child.properties = { style: "list-style-type:decimal;margin:0;padding-left:1em;padding-right:0;" }
    }
  }
}

function styleFootnoteReference(node: Element): void {
  const text = extractText(node).trim()
  if (!/^\d+$/.test(text)) return
  node.properties = {
    ...node.properties,
    style: "font-size:0.75em;line-height:0;vertical-align:super;margin:0;padding:0;display:inline;",
  }
  node.children = [{
    type: "text",
    value: `[${text}]`,
  }]
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "")
  const n = Number.parseInt(normalized, 16)
  if (Number.isNaN(n)) return `rgba(0,0,0,${alpha})`
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 递归提取节点的纯文本内容 */
function extractText(node: Element | Text): string {
  if (node.type === "text") return node.value
  if (node.type === "element") {
    return node.children.map(c => extractText(c as Element | Text)).join("")
  }
  return ""
}

function applyStyle(node: Element, style: string): void {
  if (!style) return
  const existing = (node.properties?.style as string) ?? ""
  node.properties = node.properties ?? {}
  node.properties.style = existing ? `${existing};${style}` : style
}

function styleLinkNode(node: Element, styles: NodeStyles, stripLinks: boolean): void {
  const href = sanitizeHref(node.properties?.href as string | undefined)
  if (stripLinks || !href) {
    node.tagName = "span"
    node.properties = { ...node.properties }
    delete node.properties.href
    applyStyle(node, styles.a)
    return
  }

  node.properties = { ...node.properties, href }
  applyStyle(node, styles.a)
}

function imageAltText(node: Element): string {
  const alt = typeof node.properties?.alt === "string" ? node.properties.alt.trim() : ""
  return alt ? `: ${alt}` : ""
}

function sanitizeHref(value: string | undefined): string | undefined {
  return sanitizeUrl(value, { allowAnchor: true, allowRelative: true })
}

function sanitizeImageUrl(value: string | undefined): string | undefined {
  return sanitizeUrl(value, { allowAnchor: false, allowRelative: true })
}

function sanitizeUrl(
  value: string | undefined,
  options: { allowAnchor: boolean; allowRelative: boolean },
): string | undefined {
  if (typeof value !== "string") return undefined
  const url = value.trim()
  if (!url || /[\u0000-\u001F\u007F]/.test(url)) return undefined
  if (options.allowAnchor && url.startsWith("#")) return url
  if (url.startsWith("//")) return undefined

  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(url)) {
    try {
      const parsed = new URL(url)
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : undefined
    } catch {
      return undefined
    }
  }

  if (!options.allowRelative || url.startsWith("#")) return undefined
  return url
}

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}

function isLocalImagePath(url: string): boolean {
  return Boolean(sanitizeImageUrl(url)) && !isExternalUrl(url)
}
