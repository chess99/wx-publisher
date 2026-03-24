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
import { getTheme, type NodeStyles } from "./themes.js"

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
  stripLinks?: boolean
}

export interface ConvertResult {
  html: string
  externalImages: string[]
}


export async function convertMarkdown(markdown: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  const { theme: themeName = "default", stripLinks = true } = options
  const theme = getTheme(themeName)
  const externalImages: string[] = []

  // 剥离 Hexo/Jekyll front matter
  const stripped = markdown.replace(/^---\n[\s\S]*?\n---\n?/, "").trimStart()

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(() => (tree: Root) => {
      inlineStyles(tree, theme.styles, externalImages, stripLinks)
    })
    .use(rehypeStringify, { allowDangerousHtml: true })

  const result = await processor.process(stripped)
  const inner = String(result)
  const html = `<section style="${theme.styles.wrapper}">${inner}</section>`

  return { html, externalImages }
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

/**
 * 遍历 hast 树，注入内联样式
 */
function inlineStyles(
  tree: Root,
  styles: NodeStyles,
  externalImages: string[],
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
      case "blockquote": applyStyle(node, styles.blockquote); break

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
              value: `<code class="language-${lang ?? "plaintext"}" style="${codeStyle}">${formattedHtml}</code>`,
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
          `<code class="inline-code" style="${styles.code}">${escaped}</code>`
        break
      }

      case "img": {
        applyStyle(node, styles.img)
        const src = node.properties?.src as string | undefined
        if (src && isExternalUrl(src)) externalImages.push(src)
        break
      }

      case "a": {
        if (stripLinks) {
          node.tagName = "span"
          applyStyle(node, styles.a)
          delete node.properties?.href
        } else {
          applyStyle(node, styles.a)
        }
        break
      }
    }
  })
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

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}
