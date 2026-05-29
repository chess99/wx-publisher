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
  "sspai-red",
  "wechat-native",
]

describe("professional theme matrix", () => {
  it("exposes the full professional theme set plus compatibility themes", () => {
    const themes = listThemes()

    for (const theme of PROFESSIONAL_THEMES) {
      expect(themes).toContain(theme)
    }
    expect(themes).toContain("studio")
    expect(themes.length).toBeGreaterThanOrEqual(40)
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
    expect(getTheme("wechat-native").styles.a).toContain("#07c160")
  })
})
