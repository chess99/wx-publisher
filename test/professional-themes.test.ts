import { describe, expect, it } from "vitest"
import { convertMarkdown } from "../src/converter/index.js"
import { getTheme, listThemes } from "../src/converter/themes.js"

const PROFESSIONAL_THEMES = [
  "default",
  "bytedance",
  "apple",
  "sports",
  "chinese",
  "cyber",
  "wechat-native",
  "nyt-classic",
  "github-readme",
  "sspai-red",
  "mint-fresh",
  "sunset-amber",
  "ink-minimal",
  "lavender-dream",
  "coffee-house",
  "bauhaus-primary",
  "minimal-gold",
  "minimal-green",
  "minimal-blue",
  "minimal-orange",
  "minimal-red",
  "minimal-navy",
  "minimal-gray",
  "minimal-sky",
  "focus-gold",
  "focus-green",
  "focus-blue",
  "focus-orange",
  "focus-red",
  "focus-navy",
  "focus-gray",
  "focus-sky",
  "elegant-gold",
  "elegant-green",
  "elegant-blue",
  "elegant-orange",
  "elegant-red",
  "elegant-navy",
  "elegant-gray",
  "elegant-sky",
  "bold-gold",
  "bold-green",
  "bold-blue",
  "bold-orange",
  "bold-red",
  "bold-navy",
  "bold-gray",
  "bold-sky",
]

describe("professional theme matrix", () => {
  it("exposes exactly the aligned 48-theme set", () => {
    const themes = listThemes()

    expect(themes).toEqual(PROFESSIONAL_THEMES)
    for (const theme of PROFESSIONAL_THEMES) {
      expect(themes).toContain(theme)
    }
    expect(themes).toHaveLength(48)
  })

  it("converts plain markdown, safe lists, and advanced modules with every professional theme", async () => {
    const markdown = [
      "# 标题",
      "",
      "正文包含 **重点** 和 `code`。",
      "",
      "- 无序一",
      "- 无序二",
      "",
      "1. 有序一",
      "2. 有序二",
      "",
      ":::callout[提示]",
      "类型 | 标题 | 内容",
      ":::",
      "",
    ].join("\n")

    for (const theme of PROFESSIONAL_THEMES) {
      const result = await convertMarkdown(markdown, { theme, stripLinks: false })
      expect(result.html).toContain("标题")
      expect(result.html).toContain('data-mpa-action-id="callout"')
      expect(result.html).toContain('data-wxp-list="unordered"')
      expect(result.html).toContain('data-wxp-list="ordered"')
      expect(result.html).not.toMatch(/<(ul|ol|li)\b/)
    }
  })

  it("applies distinct family visual rules", () => {
    const defaultStyles = getTheme("default").styles
    expect(getTheme("default").accent).toBe("#a34e2e")
    expect(defaultStyles.wrapper).toContain("background:#faf9f5")
    expect(defaultStyles.wrapper).toContain("color:#222222")
    expect(defaultStyles.p).toContain("font-size:16px")
    expect(defaultStyles.p).toContain("line-height:1.82")
    expect(defaultStyles.p).not.toContain("letter-spacing")
    expect(defaultStyles.h2).toContain("border-bottom:1px dashed")
    expect(defaultStyles.h2).toContain("rgb(63, 63, 63)")
    expect(defaultStyles.code).toContain("border-radius:999px")
    expect(defaultStyles.pre).toContain("rgba(200, 100, 66, 0.14) 12px")
    expect(defaultStyles.preCode).toContain("overflow-wrap:anywhere")

    expect(getTheme("bytedance").accent).toBe("#1677ff")
    expect(getTheme("apple").accent).toBe("#007aff")
    expect(getTheme("sports").accent).toBe("#00a968")
    expect(getTheme("cyber").accent).toBe("#f472b6")
    expect(getTheme("bauhaus-primary").accent).toBe("#004d9f")
    expect(getTheme("minimal-gold").styles.h1).toContain("#c8a062")
    expect(getTheme("focus-blue").styles.h1).toContain("text-align:center")
    expect(getTheme("elegant-green").styles.h2).toContain("border-left:5px")
    expect(getTheme("bold-red").styles.h1).toContain("color:#ffffff")
    expect(getTheme("github-readme").styles.pre).toContain("#0969da")
    expect(getTheme("nyt-classic").styles.wrapper).toContain("#fdfaf6")
    expect(getTheme("wechat-native").styles.a).toContain("#07c160")
  })

  it("keeps theme selection metadata available for AI callers", () => {
    expect(getTheme("github-readme").bestFor).toContain("technical")
    expect(getTheme("github-readme").collection).toBe("modern")
    expect(getTheme("bold-red").density).toBe("medium")
    expect(getTheme("nyt-classic").contrast).toBe("medium")
  })

  it("uses the shared reading baseline for paragraphs and lists", async () => {
    const markdown = [
      "第一段连续正文。",
      "",
      "- 无序列表",
      "",
      "1. 有序列表",
      "",
      "第二段应该保留段距。",
    ].join("\n")

    for (const theme of ["default", "github-readme"]) {
      const result = await convertMarkdown(markdown, { theme })

      expect(result.html).toContain('data-wxp-paragraph="true"')
      expect(result.html).toContain("font-size:16px")
      expect(result.html).toContain("line-height:1.82")
      expect(result.html).toContain("margin:0 0 16px 0")
      expect(result.html).not.toContain("letter-spacing:0.1em")
      expect(result.html).toContain('data-wxp-list="unordered"')
      expect(result.html).toContain('data-wxp-list="ordered"')
      expect(result.html).not.toMatch(/<(ul|ol|li)\b/)
    }
  })

  it("converts default theme content against the local reference baseline", async () => {
    const markdown = [
      "## 我会怎么写 `/goal`",
      "",
      "正文包含 `AGENTS.md` 和 `docs/plan.md`。",
      "",
      "```text",
      "/goal line one",
      "/goal line two",
      "```",
      "",
      "- 列表一",
      "- 列表二",
      "",
      ":::verdict",
      "eyebrow: 判断",
      "title: 默认主题基线",
      "body: 高级模块应跟随默认主题。",
      ":::",
      "",
      "## 参考资料",
      "",
      "1. Example：https://example.com/a/very/long/path",
    ].join("\n")

    const result = await convertMarkdown(markdown, { theme: "default", stripLinks: false })

    expect(result.html).toContain("background:#faf9f5")
    expect(result.html).toContain("font-size:16px;line-height:1.82")
    expect(result.html).not.toContain("letter-spacing:0.1em")
    expect(result.html).toContain("border-left:4px solid rgb(230, 130, 96)")
    expect(result.html).toContain("border-bottom:1px dashed rgb(230, 130, 96)")
    expect(result.html).toContain('class="inline-code"')
    expect(result.html).toContain("border-radius:999px")
    expect(result.html).toContain("<br>/goal")
    expect(result.html).not.toContain("white-space:nowrap;overflow-x:auto;;white-space:nowrap")
    expect(result.html).toContain("overflow-wrap:anywhere")
    expect(result.html).toContain('data-wxp-list="unordered"')
    expect(result.html).toContain('data-wxp-list="ordered"')
    expect(result.html).not.toMatch(/<(ul|ol|li)\b/)
    expect(result.html).toContain('data-mpa-action-id="verdict"')
    expect(result.html).toContain("background:linear-gradient(135deg, #f1e6df 0%, #faf9f5 48%, #f7f7f7 100%)")
    expect(result.html).toContain("word-break:break-all")
    expect(result.html).toContain("overflow-wrap:anywhere")
  })
})
