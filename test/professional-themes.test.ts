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

  it("converts plain markdown and advanced modules with every professional theme", async () => {
    const markdown = "# 标题\n\n正文包含 **重点** 和 `code`。\n\n:::callout[提示]\n类型 | 标题 | 内容\n:::\n"

    for (const theme of PROFESSIONAL_THEMES) {
      const result = await convertMarkdown(markdown, { theme, stripLinks: false })
      expect(result.html).toContain("标题")
      expect(result.html).toContain('data-mpa-action-id="callout"')
    }
  })

  it("applies distinct family visual rules", () => {
    const defaultStyles = getTheme("default").styles
    expect(getTheme("default").accent).toBe("#c86442")
    expect(defaultStyles.wrapper).toContain("background:#1a1a1a")
    expect(defaultStyles.p).toContain("letter-spacing:0.1em")
    expect(defaultStyles.h2).toContain("border-bottom:1px dashed")
    expect(defaultStyles.code).toContain("border-radius:999px")
    expect(defaultStyles.pre).toContain("rgba(200, 100, 66, 0.14) 12px")
    expect(defaultStyles.preCode).toContain("overflow-wrap:anywhere")

    expect(getTheme("minimal-gold").styles.h1).toContain("#b8872f")
    expect(getTheme("focus-blue").styles.h1).toContain("text-align:center")
    expect(getTheme("elegant-green").styles.h2).toContain("border-left:5px")
    expect(getTheme("bold-red").styles.h1).toContain("color:#ffffff")
    expect(getTheme("github-readme").styles.pre).toContain("#0969da")
    expect(getTheme("nyt-classic").styles.wrapper).toContain("#fbf6e8")
    expect(getTheme("wechat-native").styles.a).toContain("#07c160")
  })

  it("keeps theme selection metadata available for AI callers", () => {
    expect(getTheme("github-readme").bestFor).toContain("technical")
    expect(getTheme("github-readme").collection).toBe("modern")
    expect(getTheme("bold-red").density).toBe("medium")
    expect(getTheme("nyt-classic").contrast).toBe("medium")
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

    expect(result.html).toContain("border-left:4px solid rgb(230, 130, 96)")
    expect(result.html).toContain("border-bottom:1px dashed rgb(230, 130, 96)")
    expect(result.html).toContain('class="inline-code"')
    expect(result.html).toContain("border-radius:999px")
    expect(result.html).toContain("<br>/goal")
    expect(result.html).not.toContain("white-space:nowrap;overflow-x:auto;;white-space:nowrap")
    expect(result.html).toContain("overflow-wrap:anywhere")
    expect(result.html).toContain('data-mpa-action-id="verdict"')
    expect(result.html).toContain("background:linear-gradient(135deg, #ead6cc 0%, #faf9f5 48%, #f7f7f7 100%)")
    expect(result.html).toContain("word-break:break-all")
    expect(result.html).toContain("overflow-wrap:anywhere")
  })
})
