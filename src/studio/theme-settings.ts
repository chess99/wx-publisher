import type { NodeStyles, Theme } from "../converter/themes.js"

export type StudioFontFamily = "system" | "serif" | "mono"
export type StudioCodeBlockStyle = "dark" | "light"

export interface StudioThemeSettings {
  primaryColor?: string
  fontSize?: number
  fontFamily?: StudioFontFamily
  codeBlockStyle?: StudioCodeBlockStyle
}

const FONT_FAMILIES: Record<StudioFontFamily, string> = {
  system: "-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif",
  serif: "Georgia,'Times New Roman','Songti SC','SimSun',serif",
  mono: "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,'PingFang SC',monospace",
}

export function deriveStudioTheme(baseTheme: Theme, settings: StudioThemeSettings): Theme {
  const styles: NodeStyles = { ...baseTheme.styles }

  if (settings.primaryColor) {
    const color = settings.primaryColor
    styles.h2 = appendStyle(styles.h2, `border-left-color:${color};border-bottom-color:${color};color:${color};`)
    styles.h3 = appendStyle(styles.h3, `color:${color};border-bottom-color:${color};`)
    styles.blockquote = appendStyle(styles.blockquote, `border-left-color:${color};`)
    styles.a = appendStyle(styles.a, `color:${color};`)
  }

  if (settings.fontSize) {
    const size = clamp(settings.fontSize, 14, 20)
    styles.p = appendStyle(replaceCssDeclaration(styles.p, "font-size", `${size}px`), "")
    styles.li = appendStyle(replaceCssDeclaration(styles.li, "font-size", `${size}px`), "")
    styles.blockquote = appendStyle(replaceCssDeclaration(styles.blockquote, "font-size", `${Math.max(14, size - 1)}px`), "")
    styles.code = appendStyle(replaceCssDeclaration(styles.code, "font-size", `${Math.max(12, size - 2)}px`), "")
    styles.preCode = appendStyle(replaceCssDeclaration(styles.preCode, "font-size", `${Math.max(12, size - 3)}px`), "")
  }

  if (settings.fontFamily) {
    styles.wrapper = replaceCssDeclaration(styles.wrapper, "font-family", FONT_FAMILIES[settings.fontFamily])
  }

  if (settings.codeBlockStyle === "light") {
    styles.pre = "background:#f6f8fa;border:1px solid #d0d7de;border-radius:8px;padding:16px 20px;margin:16px 0;overflow-x:auto;display:block;"
    styles.preCode = "font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;color:#24292f;background:none;padding:0;border-radius:0;display:block;white-space:nowrap;overflow-x:auto;"
  }

  return {
    name: `${baseTheme.name}-studio`,
    description: `${baseTheme.description}（Studio 调整）`,
    styles,
  }
}

function replaceCssDeclaration(style: string, property: string, value: string): string {
  const pattern = new RegExp(`(^|;)\\s*${escapeRegExp(property)}\\s*:[^;]*`, "i")
  if (pattern.test(style)) {
    return style.replace(pattern, `$1${property}:${value}`)
  }
  return appendStyle(style, `${property}:${value};`)
}

function appendStyle(style: string, addition: string): string {
  if (!addition) return style
  return `${style.trim().replace(/;?$/, ";")}${addition}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
