import { describe, expect, it } from "vitest"
import { deriveStudioTheme } from "../src/studio/theme-settings.js"
import { getTheme } from "../src/converter/themes.js"
import { getAdvancedPalette } from "../src/converter/advanced-layout/styles.js"

describe("deriveStudioTheme", () => {
  it("applies primary color, font size, font family, and code block style without mutating the base theme", () => {
    const base = getTheme("github-readme")
    const derived = deriveStudioTheme(base, {
      primaryColor: "#d66a45",
      fontSize: 17,
      fontFamily: "serif",
      codeBlockStyle: "light",
    })

    expect(derived.name).toBe("github-readme-studio")
    expect(derived.styles.h2).toContain("#d66a45")
    expect(derived.styles.h3).toContain("#d66a45")
    expect(derived.styles.a).toContain("#d66a45")
    expect(derived.styles.p).toContain("font-size:17px")
    expect(derived.styles.li).toContain("font-size:17px")
    expect(derived.styles.wrapper).toContain("Georgia")
    expect(derived.styles.pre).toContain("background:#f6f8fa")
    expect(derived.styles.preCode).toContain("color:#24292f")
    expect(getAdvancedPalette(derived).accent).toBe("#d66a45")
    expect(getAdvancedPalette(derived).accentSoft).toBe("rgba(214, 106, 69, 0.12)")

    expect(base.styles.h2).not.toContain("#d66a45")
    expect(base.styles.p).not.toContain("font-size:17px")
  })

  it("returns the original theme styles when no Studio overrides are provided", () => {
    const base = getTheme("default")
    const derived = deriveStudioTheme(base, {})

    expect(derived.name).toBe("default-studio")
    expect(derived.styles).toEqual(base.styles)
    expect(derived.styles).not.toBe(base.styles)
  })

  it("uses the gallery advanced palette when Studio keeps the base accent", () => {
    const derived = deriveStudioTheme(getTheme("github-readme"), {})
    expect(getAdvancedPalette(derived).accent).toBe("#0969da")
    expect(getAdvancedPalette(derived).accentSoft).toBe("#e1edfb")
  })
})
