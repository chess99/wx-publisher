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
import { getTheme, type NodeStyles } from "./themes.js"

export interface ConvertOptions {
  theme?: string
  stripLinks?: boolean
}

export interface ConvertResult {
  html: string
  externalImages: string[]
}

// mac 风格三色圆点，doocs/md 同款
const MAC_DOTS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="45px" height="13px" viewBox="0 0 450 130"><ellipse cx="50" cy="65" rx="50" ry="52" stroke="rgb(220,60,54)" stroke-width="2" fill="rgb(237,108,96)"></ellipse><ellipse cx="225" cy="65" rx="50" ry="52" stroke="rgb(218,151,33)" stroke-width="2" fill="rgb(247,193,81)"></ellipse><ellipse cx="400" cy="65" rx="50" ry="52" stroke="rgb(27,161,37)" stroke-width="2" fill="rgb(100,200,86)"></ellipse></svg>`

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
      flattenLists(tree)
      inlineStyles(tree, theme.styles, externalImages, stripLinks)
    })
    .use(rehypeStringify, { allowDangerousHtml: true })

  const result = await processor.process(stripped)
  const inner = String(result)
  const html = `<section style="${theme.styles.wrapper}">${inner}</section>`

  return { html, externalImages }
}

/**
 * 把 ul/ol 展平为 <p> 标签，绕过微信对列表标签的二次处理
 */
function flattenLists(tree: Root): void {
  visit(tree, "element", (node: Element, index, parent) => {
    if ((node.tagName !== "ul" && node.tagName !== "ol") || parent == null || index == null) return

    const isOrdered = node.tagName === "ol"
    const replacements: ElementContent[] = []
    let counter = 1

    for (const child of node.children) {
      if (child.type !== "element" || child.tagName !== "li") continue

      const prefix = isOrdered ? `${counter++}. ` : "• "
      const liContent = unwrapParagraphs(child.children)

      const pNode: Element = {
        type: "element",
        tagName: "p",
        properties: {},
        children: [{ type: "text", value: prefix } as Text, ...liContent],
      }
      replacements.push(pNode)
    }

    const parentEl = parent as Root | Element
    parentEl.children.splice(index, 1, ...replacements)
    return index + replacements.length
  })
}

function unwrapParagraphs(children: ElementContent[]): ElementContent[] {
  const result: ElementContent[] = []
  for (const child of children) {
    if (child.type === "element" && child.tagName === "p") {
      result.push(...child.children)
    } else {
      result.push(child)
    }
  }
  return result
}

/**
 * 把代码文本转成微信兼容格式：
 * - 换行 → <br>
 * - 空格/制表符 → &nbsp;
 * 这样完全不依赖 white-space CSS，微信必然正确渲染
 */
function formatCodeForWechat(text: string): string {
  return text
    .replace(/\t/g, "    ")           // tab → 4空格
    .split("\n")
    .map(line =>
      // 文本节点中的空格全部转 &nbsp;
      line.replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/ /g, "&nbsp;")
    )
    .join("<br>")
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

      case "table":      applyStyle(node, styles.table);      break
      case "th":         applyStyle(node, styles.th);         break
      case "td":         applyStyle(node, styles.td);         break
      case "blockquote": applyStyle(node, styles.blockquote); break

      case "pre": {
        // 找到 pre > code，提取纯文本，转成 <br>&nbsp; 格式后重建节点
        const codeChild = node.children.find(
          (c): c is Element => c.type === "element" && c.tagName === "code"
        )

        if (codeChild) {
          // 提取代码纯文本（忽略 highlight.js 的 span 标签，因为我们没用 hljs）
          const rawText = extractText(codeChild)
          const formattedHtml = formatCodeForWechat(rawText)

          // 提取 color 值用于文字颜色
          const colorMatch = styles.preCode.match(/color:([^;]+)/)
          const textColor = colorMatch ? colorMatch[1] : "#abb2bf"

          // 重建 pre 的内容：mac 圆点 + 格式化代码
          const macSpanStyle = "display:block;padding:10px 14px 4px;"
          const codeStyle = `${styles.preCode};color:${textColor};`

          // 用原始 HTML 字符串替换节点，通过 dangerouslySetInnerHTML 方式
          // 在 hast 里用 raw 节点插入预格式化 HTML
          node.children = [
            {
              type: "raw" as never,
              value: `<span style="${macSpanStyle}">${MAC_DOTS_SVG}</span><code style="${codeStyle}">${formattedHtml}</code>`,
            } as never,
          ]
        }

        applyStyle(node, styles.pre)
        return SKIP
      }

      case "code": {
        applyStyle(node, styles.code)
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
