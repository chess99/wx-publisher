import { describe, expect, it } from "vitest"
import { resolve } from "path"
import {
  getThemeFileSchema,
  loadThemeFile,
  validateThemeObject,
  THEME_STYLE_KEYS,
} from "../src/converter/theme-file.js"

const fixture = (name: string) => resolve("test", "fixtures", name)

describe("external theme files", () => {
  it("exports a schema containing every NodeStyles key", () => {
    const schema = getThemeFileSchema()
    expect(schema.required).toEqual(["name", "description", "styles"])
    for (const key of THEME_STYLE_KEYS) {
      expect(schema.properties.styles.required).toContain(key)
    }
  })

  it("loads a valid external theme", () => {
    const result = loadThemeFile(fixture("external-theme-valid.json"))
    expect(result.theme.name).toBe("fixture-theme")
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.theme.styles.h2).toContain("border-left")
  })

  it("rejects missing required style keys", () => {
    const result = loadThemeFile(fixture("external-theme-missing-style.json"))
    expect(result.theme).toBeNull()
    expect(result.errors).toContain("styles.td is required")
  })

  it("rejects dangerous style content", () => {
    const result = loadThemeFile(fixture("external-theme-dangerous.json"))
    expect(result.theme).toBeNull()
    expect(result.errors.join("\n")).toContain("styles.img contains forbidden content: javascript:")
  })

  it("returns warnings for unknown fields and risky CSS", () => {
    const result = loadThemeFile(fixture("external-theme-warning.json"))
    expect(result.theme?.name).toBe("warning-theme")
    expect(result.errors).toEqual([])
    expect(result.warnings).toContain("unknown top-level field: extra")
    expect(result.warnings.join("\n")).toContain("styles.wrapper uses position:fixed")
    expect(result.warnings.join("\n")).toContain("styles.h1 uses animation")
    expect(result.warnings.join("\n")).toContain("styles.wrapper uses a fixed width greater than 677px")
  })

  it("rejects non-object input", () => {
    const result = validateThemeObject("not object")
    expect(result.theme).toBeNull()
    expect(result.errors).toContain("theme file must contain a JSON object")
  })
})
