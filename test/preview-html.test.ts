import { describe, it, expect } from "vitest"
import { generatePreviewHtml } from "../src/converter/preview-html.js"
import type { ThemePreviewResult } from "../src/converter/preview-html.js"

const MOCK_RESULTS: ThemePreviewResult[] = [
  { theme: "default", html: "<section>default content</section>" },
  { theme: "tech",    html: "<section>tech content</section>" },
  { theme: "elegant", html: "<section>elegant content</section>" },
  { theme: "minimal", html: "<section>minimal content</section>" },
]

const FILE_PATH = "/home/user/article.md"

describe("generatePreviewHtml", () => {
  it("包含所有 4 个主题的 panel div", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    for (const r of MOCK_RESULTS) {
      expect(html).toContain(`data-theme="${r.theme}"`)
    }
  })

  it("包含所有 4 个主题的 tab 按钮", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    // 匹配 <button class="tab..." data-theme="..."> 元素
    const tabMatches = html.match(/<button class="tab[^"]*" data-theme=/g) ?? []
    expect(tabMatches.length).toBe(4)
  })

  it("第一个主题的 panel 默认可见，其余隐藏", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    // 第一个 panel 不含 display:none
    expect(html).toContain('<div class="panel" data-theme="default">')
    // 其余含 display:none
    expect(html).toContain('data-theme="tech" style="display:none"')
    expect(html).toContain('data-theme="elegant" style="display:none"')
    expect(html).toContain('data-theme="minimal" style="display:none"')
  })

  it("第一个 tab 有 tab-active class", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    expect(html).toContain('class="tab tab-active" data-theme="default"')
  })

  it("底部命令包含绝对文件路径", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    expect(html).toContain(`--file ${FILE_PATH}`)
  })

  it("底部命令包含所有主题的命令字符串", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    for (const r of MOCK_RESULTS) {
      expect(html).toContain(`--theme ${r.theme}`)
    }
  })

  it("包含封面图输入框", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    expect(html).toContain('id="coverInput"')
  })

  it("包含复制按钮", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    expect(html).toContain('id="copyBtn"')
    expect(html).toContain("复制命令")
  })

  it("不含外部资源引用（CDN、外链 CSS/JS）", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)
    // 不应有 <link href="http 或 <script src="http
    expect(html).not.toMatch(/<link[^>]+href="https?:/)
    expect(html).not.toMatch(/<script[^>]+src="https?:/)
    // 不应有 @import url(http
    expect(html).not.toMatch(/@import\s+url\(https?:/)
  })

  it("渲染失败的主题显示错误信息而非崩溃", () => {
    const resultsWithError: ThemePreviewResult[] = [
      { theme: "default", html: "<section>ok</section>" },
      { theme: "tech",    html: "", error: "渲染出错了" },
    ]
    const html = generatePreviewHtml(resultsWithError, FILE_PATH)
    expect(html).toContain("渲染失败")
    expect(html).toContain("渲染出错了")
    // 正常主题仍然渲染
    expect(html).toContain("ok")
  })

  it("文件路径中的特殊字符被正确转义", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, '/path/to/my "article" & more.md')
    // title 属性中不应有未转义的引号
    expect(html).not.toContain('title="wx-publisher 预览 · /path/to/my "article"')
    // HTML 实体应存在
    expect(html).toContain("&amp;")
  })
})
