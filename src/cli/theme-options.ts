import { resolve } from "path"
import type { Theme } from "../converter/themes.js"
import { hasTheme } from "../converter/themes.js"
import { loadThemeFile } from "../converter/theme-file.js"

export interface ThemeCliOptions {
  theme?: string
  themeFile?: string
}

export interface ResolvedThemeOption {
  themeName: string
  themeDefinition?: Theme
  warnings?: string[]
}

export function resolveThemeOption(
  opts: ThemeCliOptions,
  defaultTheme: string,
): ResolvedThemeOption {
  if (opts.theme && opts.themeFile) {
    throw new Error("--theme and --theme-file cannot be used together")
  }

  if (!opts.themeFile) {
    const themeName = (opts.theme || defaultTheme || "default").trim() || "default"
    if (!hasTheme(themeName)) {
      throw new Error(`未知主题: ${themeName}`)
    }
    return {
      themeName,
      themeDefinition: undefined,
    }
  }

  const result = loadThemeFile(resolve(opts.themeFile))

  if (!result.theme) {
    throw new Error(result.errors.join("\n"))
  }

  return {
    themeName: result.theme.name,
    themeDefinition: result.theme,
    warnings: result.warnings,
  }
}
