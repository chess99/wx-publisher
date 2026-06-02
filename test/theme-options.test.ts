import { describe, expect, it } from "vitest"
import { dirname } from "path"
import { fileURLToPath } from "url"
import { resolve } from "path"
import { resolveThemeOption } from "../src/cli/theme-options.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => resolve(__dirname, "fixtures", name)

describe("resolveThemeOption", () => {
  it("uses the configured default theme when no option is provided", () => {
    expect(resolveThemeOption({}, "default")).toEqual({
      themeName: "default",
      themeDefinition: undefined,
    })
  })

  it("uses an explicit built-in theme name", () => {
    expect(resolveThemeOption({ theme: "github-readme" }, "default")).toEqual({
      themeName: "github-readme",
      themeDefinition: undefined,
    })
  })

  it("rejects unknown built-in theme names", () => {
    expect(() => resolveThemeOption({ theme: "legacy-theme" }, "default")).toThrow("未知主题: legacy-theme")
  })

  it("rejects unknown configured default theme names", () => {
    expect(() => resolveThemeOption({}, "archived-theme")).toThrow("未知主题: archived-theme")
  })

  it("loads an external theme file", () => {
    const result = resolveThemeOption(
      { themeFile: fixture("external-theme-valid.json") },
      "default",
    )

    expect(result.themeName).toBe("fixture-theme")
    expect(result.themeDefinition?.name).toBe("fixture-theme")
    expect(result.warnings).toEqual([])
  })

  it("rejects using theme and themeFile together", () => {
    expect(() => resolveThemeOption(
      { theme: "github-readme", themeFile: fixture("external-theme-valid.json") },
      "default",
    )).toThrow("--theme and --theme-file cannot be used together")
  })

  it("rejects invalid external theme files", () => {
    expect(() => resolveThemeOption(
      { themeFile: fixture("external-theme-missing-style.json") },
      "default",
    )).toThrow("styles.td is required")
  })
})
