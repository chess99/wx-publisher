import { describe, expect, it } from "vitest"
import { dirname } from "path"
import { fileURLToPath } from "url"
import { resolve } from "path"
import { resolveThemeOption } from "../src/cli/theme-options.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => resolve(__dirname, "fixtures", name)

describe("resolveThemeOption", () => {
  it("uses the configured default theme when no option is provided", () => {
    expect(resolveThemeOption({}, "minimal")).toEqual({
      themeName: "minimal",
      themeDefinition: undefined,
    })
  })

  it("uses an explicit built-in theme name", () => {
    expect(resolveThemeOption({ theme: "tech" }, "minimal")).toEqual({
      themeName: "tech",
      themeDefinition: undefined,
    })
  })

  it("loads an external theme file", () => {
    const result = resolveThemeOption(
      { themeFile: fixture("external-theme-valid.json") },
      "minimal",
    )

    expect(result.themeName).toBe("fixture-theme")
    expect(result.themeDefinition?.name).toBe("fixture-theme")
    expect(result.warnings).toEqual([])
  })

  it("rejects using theme and themeFile together", () => {
    expect(() => resolveThemeOption(
      { theme: "tech", themeFile: fixture("external-theme-valid.json") },
      "minimal",
    )).toThrow("--theme and --theme-file cannot be used together")
  })

  it("rejects invalid external theme files", () => {
    expect(() => resolveThemeOption(
      { themeFile: fixture("external-theme-missing-style.json") },
      "minimal",
    )).toThrow("styles.td is required")
  })
})
