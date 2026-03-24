/**
 * Markdown → 微信公众号 HTML 转换器
 *
 * 微信公众号渲染限制：
 * - 不支持外部 CSS（class 无效），所有样式必须内联到 style 属性
 * - 不支持外链，链接转为带下划线文字
 * - 图片必须是微信素材库 URL，外链图片会被屏蔽
 * - ul/ol/li 标签会被微信二次处理导致空行，改用 <p> + 前缀符号模拟
 * - pre > code 的 color 可能被微信剥离，改用 <span> 包裹文字
 */

import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import type { Root, Element, Text, RootContent, ElementContent } from "hast"
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
      // 第一步：把列表展平为 <p> 标签（避免微信对 ul/ol/li 的二次处理）
      flattenLists(tree)
      // 第二步：注入内联样式
      inlineStyles(tree, theme.styles, externalImages, stripLinks)
    })
    .use(rehypeStringify)

  const result = await processor.process(stripped)
  const inner = String(result)
  const html = `<section style="${theme.styles.wrapper}">${inner}</section>`

  return { html, externalImages }
}

/**
 * 把 ul/ol 列表展平为一组 <p> 标签
 * 例：<ul><li>foo</li><li>bar</li></ul>
 * 变成：<p>• foo</p><p>• bar</p>
 *
 * 这是绕过微信对列表标签二次处理的唯一可靠方案
 */
function flattenLists(tree: Root): void {
  // 需要从父节点替换子节点，所以用 visit 拿到 parent 和 index
  visit(tree, "element", (node: Element, index, parent) => {
    if ((node.tagName !== "ul" && node.tagName !== "ol") || parent == null || index == null) {
      return
    }

    const isOrdered = node.tagName === "ol"
    const replacements: ElementContent[] = []
    let counter = 1

    for (const child of node.children) {
      if (child.type !== "element" || child.tagName !== "li") continue

      const prefix = isOrdered ? `${counter++}. ` : "• "

      // 提取 li 的内容，剥掉可能存在的 <p> 包裹
      const liContent = unwrapParagraphs(child.children)

      const pNode: Element = {
        type: "element",
        tagName: "p",
        properties: {},
        children: [
          { type: "text", value: prefix } as Text,
          ...liContent,
        ],
      }
      replacements.push(pNode)
    }

    // 用展平后的 <p> 列表替换原来的 ul/ol
    const parentEl = parent as Root | Element
    parentEl.children.splice(index, 1, ...replacements)

    // 返回新的 index，让 visit 从替换后的位置继续
    return index + replacements.length
  })
}

/**
 * 剥掉单层 <p> 包裹，返回其内容
 * <p>text</p> → [text]
 * 非 <p> 节点直接保留
 */
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

      case "table":    applyStyle(node, styles.table);    break
      case "th":       applyStyle(node, styles.th);       break
      case "td":       applyStyle(node, styles.td);       break
      case "blockquote": applyStyle(node, styles.blockquote); break

      case "pre": {
        applyStyle(node, styles.pre)
        // pre > code：强制浅色文字，用 <span> 包裹所有文本节点保证颜色
        for (const child of node.children) {
          if (child.type === "element" && child.tagName === "code") {
            child.properties = child.properties ?? {}
            child.properties.style = styles.preCode
            // 把 code 内所有文本节点包进 <span style="color:...">
            // 确保微信即使剥离 code 的 style 也能看到颜色
            wrapTextInSpan(child, styles.preCode)
          }
        }
        return SKIP
      }

      case "code": {
        applyStyle(node, styles.code)
        break
      }

      case "img": {
        applyStyle(node, styles.img)
        const src = node.properties?.src as string | undefined
        if (src && isExternalUrl(src)) {
          externalImages.push(src)
        }
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

/**
 * 把 code 块内所有直接文本子节点包进 <span style="color:...">
 * 提取 preCode 里的 color 值用于 span
 */
function wrapTextInSpan(codeNode: Element, preCodeStyle: string): void {
  const colorMatch = preCodeStyle.match(/color:([^;]+)/)
  if (!colorMatch) return
  const color = colorMatch[1]

  codeNode.children = codeNode.children.map((child): ElementContent => {
    if (child.type === "text") {
      return {
        type: "element",
        tagName: "span",
        properties: { style: `color:${color};` },
        children: [child],
      }
    }
    return child
  })
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
