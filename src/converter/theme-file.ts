import { readFileSync } from "fs"
import type { Theme, NodeStyles } from "./themes.js"

export const THEME_STYLE_KEYS = [
  "wrapper",
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "strong",
  "em",
  "code",
  "pre",
  "preCode",
  "blockquote",
  "ul",
  "ol",
  "li",
  "hr",
  "img",
  "a",
  "table",
  "th",
  "td",
] as const satisfies readonly (keyof NodeStyles)[]

type ThemeStyleKey = (typeof THEME_STYLE_KEYS)[number]
type MissingThemeStyleKeys = Exclude<keyof NodeStyles, ThemeStyleKey>
const _assertAllNodeStyleKeysCovered: MissingThemeStyleKeys extends never ? true : never = true
void _assertAllNodeStyleKeysCovered

export interface ThemeValidationResult {
  theme: Theme | null
  errors: string[]
  warnings: string[]
}

export interface ThemeFileSchema {
  type: "object"
  required: string[]
  additionalProperties: boolean
  properties: {
    name: {
      type: "string"
    }
    description: {
      type: "string"
    }
    styles: {
      type: "object"
      required: ThemeStyleKey[]
      properties: Record<ThemeStyleKey, { type: "string" }>
    }
  }
}

const TOP_LEVEL_KEYS = new Set(["name", "description", "styles"])
const STYLE_KEYS = new Set<string>(THEME_STYLE_KEYS)
const FORBIDDEN_STYLE_PATTERNS = ["<script", "javascript:", "onerror=", "onclick=", "onload="]

export function getThemeFileSchema(): ThemeFileSchema {
  return {
    type: "object",
    required: ["name", "description", "styles"],
    additionalProperties: true,
    properties: {
      name: {
        type: "string",
      },
      description: {
        type: "string",
      },
      styles: {
        type: "object",
        required: [...THEME_STYLE_KEYS],
        properties: THEME_STYLE_KEYS.reduce(
          (properties, key) => {
            properties[key] = { type: "string" }
            return properties
          },
          {} as Record<ThemeStyleKey, { type: "string" }>,
        ),
      },
    },
  }
}

export function loadThemeFile(path: string): ThemeValidationResult {
  let fileContents: string

  try {
    fileContents = readFileSync(path, "utf8")
  } catch (e) {
    return {
      theme: null,
      errors: [`failed to read theme file: ${String(e)}`],
      warnings: [],
    }
  }

  try {
    return validateThemeObject(JSON.parse(fileContents))
  } catch (e) {
    return {
      theme: null,
      errors: [`failed to parse theme JSON: ${String(e)}`],
      warnings: [],
    }
  }
}

export function validateThemeObject(value: unknown): ThemeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isPlainObject(value)) {
    return {
      theme: null,
      errors: ["theme file must contain a JSON object"],
      warnings,
    }
  }

  for (const key of Object.keys(value)) {
    if (!TOP_LEVEL_KEYS.has(key)) {
      warnings.push(`unknown top-level field: ${key}`)
    }
  }

  const name = value.name
  const description = value.description
  const styles = value.styles

  if (typeof name !== "string" || name.trim() === "") {
    errors.push("name is required")
  }

  if (typeof description !== "string" || description.trim() === "") {
    errors.push("description is required")
  }

  if (!isPlainObject(styles)) {
    errors.push("styles is required")
  } else {
    validateStyles(styles, errors, warnings)
  }

  if (errors.length > 0) {
    return {
      theme: null,
      errors,
      warnings,
    }
  }

  return {
    theme: {
      name: name as string,
      description: description as string,
      styles: normalizeNodeStyles(styles as Record<ThemeStyleKey, string>),
    },
    errors,
    warnings,
  }
}

function normalizeNodeStyles(styles: Record<ThemeStyleKey, string>): NodeStyles {
  return THEME_STYLE_KEYS.reduce(
    (normalizedStyles, key) => {
      normalizedStyles[key] = styles[key]
      return normalizedStyles
    },
    {} as NodeStyles,
  )
}

function validateStyles(
  styles: Record<string, unknown>,
  errors: string[],
  warnings: string[],
): void {
  for (const key of Object.keys(styles)) {
    if (!STYLE_KEYS.has(key)) {
      warnings.push(`unknown styles field: ${key}`)
    }
  }

  for (const key of THEME_STYLE_KEYS) {
    const style = styles[key]

    if (typeof style !== "string") {
      errors.push(`styles.${key} is required`)
      continue
    }

    validateStyleContent(key, style, errors, warnings)
  }
}

function validateStyleContent(
  key: ThemeStyleKey,
  style: string,
  errors: string[],
  warnings: string[],
): void {
  const normalizedStyle = style.toLowerCase()

  for (const pattern of FORBIDDEN_STYLE_PATTERNS) {
    if (normalizedStyle.includes(pattern)) {
      errors.push(`styles.${key} contains forbidden content: ${pattern}`)
    }
  }

  if (/\bposition\s*:\s*fixed\b/.test(normalizedStyle)) {
    warnings.push(`styles.${key} uses position:fixed, which is risky in WeChat`)
  }

  if (/\banimation(?:-[a-z-]+)?\s*:/.test(normalizedStyle) || normalizedStyle.includes("@keyframes")) {
    warnings.push(`styles.${key} uses animation, which is risky in WeChat`)
  }

  if (
    normalizedStyle.includes("@font-face") ||
    normalizedStyle.includes("@import") ||
    /url\(\s*['"]?https?:\/\//.test(normalizedStyle)
  ) {
    warnings.push(`styles.${key} uses external font or URL loading, which is risky in WeChat`)
  }

  if (usesFixedWidthOverLimit(normalizedStyle)) {
    warnings.push(`styles.${key} uses a fixed width greater than 677px`)
  }
}

function usesFixedWidthOverLimit(style: string): boolean {
  const widthPattern = /(?:^|[;\s])(?:max-)?width\s*:\s*(\d+(?:\.\d+)?)px\b/g

  for (const match of style.matchAll(widthPattern)) {
    if (Number(match[1]) > 677) {
      return true
    }
  }

  return false
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
