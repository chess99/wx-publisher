/**
 * Markdown → 微信公众号 HTML 转换器
 *
 * 微信公众号渲染限制：
 * - 不支持外部 CSS（class 无效），所有样式必须内联到 style 属性
 * - 不支持外链（<a href="..."> 点击无效），链接转为带下划线文字
 * - 图片必须是微信素材库 URL 才能显示，外链图片会被屏蔽
 * - 不支持 <script>、<iframe> 等标签
 */

import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import type { Root, Element, Text, Node } from "hast"
import { visit } from "unist-util-visit"
import { getTheme, type NodeStyles } from "./themes.js"

export interface ConvertOptions {
  theme?: string
  /** 是否把链接转成纯文字（微信外链无效，默认 true） */
  stripLinks?: boolean
}

export interface ConvertResult {
  html: string
  /** 文章中发现的外部图片 URL（需要上传到微信素材库） */
  externalImages: string[]
}

export async function convertMarkdown(markdown: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  const { theme: themeName = "default", stripLinks = true } = options
  const theme = getTheme(themeName)
  const externalImages: string[] = []

  // 剥离 Hexo/Jekyll front matter（--- ... --- 块）
  const stripped = markdown.replace(/^---\n[\s\S]*?\n---\n?/, "").trimStart()

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(() => (tree: Root) => {
      inlineStyles(tree, theme.styles, externalImages, stripLinks)
    })
    .use(rehypeStringify)

  const result = await processor.process(stripped)
  const inner = String(result)

  // 用 wrapper 包裹整体
  const html = `<section style="${theme.styles.wrapper}">${inner}</section>`

  return { html, externalImages }
}

/**
 * 遍历 hast 树，给每个节点注入内联样式
 */
function inlineStyles(
  tree: Root,
  styles: NodeStyles,
  externalImages: string[],
  stripLinks: boolean
): void {
  visit(tree, "element", (node: Element) => {
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
      case "ul": applyStyle(node, styles.ul); break
      case "ol": applyStyle(node, styles.ol); break
      case "li": applyStyle(node, styles.li); break
      case "hr": applyStyle(node, styles.hr); break
      case "table": applyStyle(node, styles.table); break
      case "th": applyStyle(node, styles.th); break
      case "td": applyStyle(node, styles.td); break
      case "blockquote": applyStyle(node, styles.blockquote); break

      case "pre": {
        applyStyle(node, styles.pre)
        // pre > code 用 preCode 样式
        visit(node, "element", (child: Element) => {
          if (child.tagName === "code") {
            applyStyle(child, styles.preCode)
          }
        })
        break
      }

      case "code": {
        // 只处理不在 pre 里的行内 code
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
          // 微信不支持外链，转为带样式的 span
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

function applyStyle(node: Element, style: string): void {
  if (!style) return
  const existing = (node.properties?.style as string) ?? ""
  node.properties = node.properties ?? {}
  node.properties.style = existing ? `${existing};${style}` : style
}

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}
