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
})
