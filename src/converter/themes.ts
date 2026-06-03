/**
 * 微信公众号排版主题
 *
 * 运行时主题只暴露 48 个对齐主题。主题选择信息保留在 Theme
 * 元数据中，方便 CLI、Studio 和 AI 调用方按场景挑选。
 */

export interface Theme {
  name: string
  description: string
  styles: NodeStyles
  collection?: string
  displayName?: string
  bestFor?: string
  density?: "low" | "medium" | "high"
  contrast?: "low" | "medium" | "high"
  accent?: string
  sourceUpdatedAt?: string
}

export interface ThemeReference {
  name: string
  description: string
  collection: string
  displayName: string
  bestFor: string
  density: "low" | "medium" | "high"
  contrast: "low" | "medium" | "high"
  accent: string
}

export interface NodeStyles {
  wrapper: string
  h1: string
  h2: string
  h3: string
  h4: string
  p: string
  strong: string
  em: string
  code: string
  pre: string
  preCode: string
  blockquote: string
  ul: string
  ol: string
  li: string
  hr: string
  img: string
  a: string
  table: string
  th: string
  td: string
}

type ThemeCollection = "built-in" | "classic" | "modern" | "extra" | "minimal" | "focus" | "elegant" | "bold"

interface ThemeSpec {
  name: string
  collection: ThemeCollection
  displayName: string
  accent: string
  background: string
  surface: string
  text: string
  muted: string
  border: string
  codeBackground: string
  description: string
  bestFor: string
  density: "low" | "medium" | "high"
  contrast: "low" | "medium" | "high"
}

const SOURCE_UPDATED_AT = "2026-06-02"

const BASE_UL = "list-style:none;padding-left:0;margin:0 0 16px 0;"
const BASE_OL = "list-style:none;padding-left:0;margin:0 0 16px 0;"

const NAMED_THEME_SPECS: ThemeSpec[] = [
  named("default", "built-in", "Reference Warm", "#c86442", "#faf9f5", "#f7f7f7", "#222222", "#3f3f3f", "#dab1a1", "#f6e7df", "暖色技术长文基线，适合代码和判断密集的文章", "technical essays, code-heavy notes, structured long-form writing", "medium", "medium"),
  named("bytedance", "built-in", "Product Blue", "#1d4ed8", "#ffffff", "#f4f7ff", "#111827", "#64748b", "#c9d7ff", "#eef4ff", "产品蓝，现代清晰", "product updates, efficient business writing, modern operations", "medium", "medium"),
  named("apple", "built-in", "Polished Indigo", "#5b6ee1", "#fbfcff", "#f3f5ff", "#111827", "#667085", "#d7dcff", "#eef1ff", "精致靛蓝，留白充足", "brand stories, product writing, polished launches", "low", "medium"),
  named("sports", "built-in", "Energy Orange", "#f97316", "#fffaf5", "#fff3e8", "#24180f", "#7c6a57", "#fed7aa", "#fff0df", "活力橙，节奏强", "events, campaigns, launches, time-sensitive updates", "medium", "high"),
  named("chinese", "built-in", "Classic Umber", "#9a3412", "#fffaf3", "#f8efe2", "#2f2318", "#7a6656", "#e9d0b8", "#f7eadc", "暖棕古典，书卷气", "culture, seasonal writing, traditional editorial pieces", "medium", "medium"),
  named("cyber", "built-in", "Neon Violet", "#8b5cf6", "#111827", "#1f1438", "#f8fafc", "#c4b5fd", "#6d4bd8", "#18122c", "霓虹紫，高对比", "visual technology, experiments, campaigns", "high", "high"),
  named("wechat-native", "classic", "Classic Green", "#07c160", "#ffffff", "#f5fbf7", "#1f2933", "#5f6f67", "#d6eadf", "#eef8f1", "公众号原生绿，熟悉保守", "public-account style posts, conservative knowledge writing", "medium", "medium"),
  named("nyt-classic", "classic", "Newsprint Black", "#111827", "#fbf6e8", "#f3ecd8", "#111111", "#6b6254", "#d8cdb5", "#eee4cf", "新闻纸黑，严肃长文", "long-form reports, essays, opinion columns", "high", "medium"),
  named("github-readme", "modern", "Developer Blue", "#0969da", "#ffffff", "#f6f8fa", "#24292f", "#57606a", "#d0d7de", "#f6f8fa", "开发者蓝，README 气质", "technical guides, API notes, developer documentation", "medium", "medium"),
  named("sspai-red", "modern", "Media Red", "#d71920", "#ffffff", "#fff5f5", "#1f2933", "#6b7280", "#f3c3c5", "#fff0f1", "媒体红，利落醒目", "productivity posts, media-style reviews, creator content", "medium", "high"),
  named("mint-fresh", "modern", "Fresh Mint", "#10b981", "#f7fffb", "#ecfdf5", "#12372a", "#55766a", "#bbf7d0", "#e9fbf2", "清新薄荷，轻运营", "lifestyle, health, light operations content", "low", "medium"),
  named("sunset-amber", "modern", "Sunset Amber", "#d97706", "#fff8ed", "#ffedd5", "#33210d", "#7c5d36", "#fed7aa", "#fff1dc", "落日琥珀，叙事温暖", "travel, narrative essays, story-driven columns", "medium", "medium"),
  named("ink-minimal", "extra", "Ink Minimal", "#111827", "#ffffff", "#f3f4f6", "#111827", "#6b7280", "#d1d5db", "#f3f4f6", "黑白墨色，低干扰", "text-heavy essays, notes, minimal editorial writing", "low", "medium"),
  named("lavender-dream", "extra", "Lavender Dream", "#8b5cf6", "#fbf7ff", "#f3e8ff", "#2e2444", "#75658f", "#ddd6fe", "#f5edff", "柔紫梦境，品牌情绪", "brand mood, inspiration writing, soft visual stories", "low", "medium"),
  named("coffee-house", "extra", "Coffee House", "#7c4a2d", "#fff8ef", "#f3e6d8", "#2f2118", "#7a6658", "#d9bea6", "#f5eadf", "咖啡暖棕，人物访谈", "interviews, human-centered columns, essays", "medium", "medium"),
  named("bauhaus-primary", "extra", "Primary Bauhaus", "#e63946", "#fffdf7", "#f8f0d9", "#111827", "#5f6268", "#f3c14b", "#f4f0e5", "包豪斯主色，图形感强", "campaigns, launches, visual columns", "high", "high"),
]

const COLOR_VARIANTS = [
  { key: "gold", accent: "#b8872f", label: "Gold" },
  { key: "green", accent: "#188a5b", label: "Green" },
  { key: "blue", accent: "#2563eb", label: "Blue" },
  { key: "orange", accent: "#c86442", label: "Orange" },
  { key: "red", accent: "#d33f49", label: "Red" },
  { key: "navy", accent: "#243b63", label: "Navy" },
  { key: "gray", accent: "#64748b", label: "Gray" },
  { key: "sky", accent: "#0ea5e9", label: "Sky" },
] as const

const MATRIX_THEME_SPECS: ThemeSpec[] = [
  ...themeSeries("minimal", "Minimal", "minimal", "低干扰极简，内容优先", "clean repeatable output, low-friction templates", "low", "medium"),
  ...themeSeries("focus", "Focus", "focus", "居中强调，节奏清晰", "centered rhythm, key-point emphasis, structured reading", "medium", "medium"),
  ...themeSeries("elegant", "Elegant", "elegant", "层次丰富，编辑感强", "brand-led articles, editorial writing, aesthetic long-form", "medium", "medium"),
  ...themeSeries("bold", "Bold", "bold", "强视觉标题，强调转化", "launches, campaigns, high-impact announcements", "medium", "high"),
]

const THEME_SPECS: ThemeSpec[] = [
  ...NAMED_THEME_SPECS,
  ...MATRIX_THEME_SPECS,
]

export const themes: Record<string, Theme> = Object.fromEntries(
  THEME_SPECS.map(spec => [spec.name, createTheme(spec)]),
)

function named(
  name: string,
  collection: ThemeCollection,
  displayName: string,
  accent: string,
  background: string,
  surface: string,
  text: string,
  muted: string,
  border: string,
  codeBackground: string,
  description: string,
  bestFor: string,
  density: "low" | "medium" | "high",
  contrast: "low" | "medium" | "high",
): ThemeSpec {
  return { name, collection, displayName, accent, background, surface, text, muted, border, codeBackground, description, bestFor, density, contrast }
}

function themeSeries(
  prefix: "minimal" | "focus" | "elegant" | "bold",
  label: string,
  collection: ThemeCollection,
  description: string,
  bestFor: string,
  density: "low" | "medium" | "high",
  contrast: "low" | "medium" | "high",
): ThemeSpec[] {
  return COLOR_VARIANTS.map(color => named(
    `${prefix}-${color.key}`,
    collection,
    `${label} ${color.label}`,
    color.accent,
    collection === "elegant" ? "#fffaf3" : "#ffffff",
    colorMix(color.accent, 0.08),
    "#2f3437",
    "#64748b",
    colorMix(color.accent, 0.28),
    colorMix(color.accent, 0.10),
    `${color.label} ${description}`,
    bestFor,
    density,
    contrast,
  ))
}

function createTheme(spec: ThemeSpec): Theme {
  return {
    name: spec.name,
    description: spec.description,
    styles: createStyles(spec),
    collection: spec.collection,
    displayName: spec.displayName,
    bestFor: spec.bestFor,
    density: spec.density,
    contrast: spec.contrast,
    accent: spec.accent,
    sourceUpdatedAt: SOURCE_UPDATED_AT,
  }
}

function createStyles(spec: ThemeSpec): NodeStyles {
  if (spec.name === "default") return createDefaultReferenceStyles(spec)

  const accent = spec.accent
  const soft = colorMix(accent, 0.10)
  const softer = colorMix(accent, 0.16)
  const border = spec.border
  const shadow = `0 6px 18px ${colorMix(accent, 0.10)}`
  const paragraph = `font-size:16px;line-height:${spec.density === "low" ? "1.9" : spec.density === "high" ? "1.72" : "1.82"};color:${spec.text};margin:0 0 16px 0;`

  const h1 = h1Style(spec, soft, shadow)
  const h2 = h2Style(spec, soft, shadow)

  return {
    wrapper: `font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif;max-width:677px;margin:0 auto;padding:0 16px;background:${spec.background};color:${spec.text};`,
    h1,
    h2,
    h3: `font-size:18px;font-weight:750;color:${accent};margin:22px 0 9px;line-height:1.42;`,
    h4: `font-size:16px;font-weight:700;color:${spec.text};margin:18px 0 7px;line-height:1.4;border-left:3px solid ${accent};padding-left:8px;`,
    p: paragraph,
    strong: `font-weight:800;color:${accent};`,
    em: `font-style:italic;color:${spec.muted};`,
    code: `font-family:'SFMono-Regular',Consolas,monospace;font-size:13px;background:${spec.codeBackground};padding:2px 6px;border-radius:5px;color:${accent};border:1px solid ${border};`,
    pre: `background:${spec.name === "github-readme" ? spec.surface : "#111827"};border-radius:10px;padding:16px 18px;margin:18px 0;overflow-x:auto;display:block;border:1px solid ${accent};`,
    preCode: `font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;color:${spec.name === "github-readme" ? spec.text : "#e5e7eb"};background:none;padding:0;border-radius:0;display:block;white-space:nowrap;overflow-x:auto;`,
    blockquote: `border-left:4px solid ${accent};margin:18px 0;padding:12px 16px;background:${soft};color:${spec.muted};font-size:15px;line-height:1.82;border-radius:0 8px 8px 0;`,
    ul: BASE_UL,
    ol: BASE_OL,
    li: `display:block;margin:0.22em 8px;font-size:16px;line-height:1.82;color:${spec.text};`,
    hr: `border:none;border-top:1px solid ${border};margin:26px 0;`,
    img: `max-width:100%;border-radius:${spec.collection === "minimal" || spec.name === "ink-minimal" ? "2px" : "8px"};display:block;margin:18px auto;${spec.collection === "bold" || spec.collection === "elegant" ? `box-shadow:${shadow};` : ""}`,
    a: `color:${accent};text-decoration:none;font-weight:700;border-bottom:1px solid ${border};`,
    table: `width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;background:${spec.surface};`,
    th: `background:${softer};font-weight:800;padding:9px 12px;border:1px solid ${border};text-align:left;color:${accent};`,
    td: `padding:9px 12px;border:1px solid ${border};color:${spec.text};`,
  }
}

function createDefaultReferenceStyles(spec: ThemeSpec): NodeStyles {
  const headingAccent = "rgb(230, 130, 96)"
  const linkAccent = "rgb(200, 100, 66)"
  const inlineCodeBg = "linear-gradient(180deg, rgba(200, 100, 66, 0.14), rgba(200, 100, 66, 0.08))"
  const preBg = "linear-gradient(180deg, rgba(200, 100, 66, 0.14) 0px, rgba(200, 100, 66, 0.14) 12px, rgba(250, 250, 249, 0.98) 12px, rgba(250, 250, 249, 0.98) 100%)"
  const fontFamily = "'PingFang SC',-apple-system-font,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif"

  return {
    wrapper: `font-family:${fontFamily};max-width:677px;margin:0 auto;padding:12px;background:#faf9f5;color:${spec.text};`,
    h1: `margin:1.8em 8px 0.8em 0;padding:0 0 0.55em 12px;border-left:4px solid ${headingAccent};border-bottom:1px dashed ${headingAccent};font-size:22px;font-weight:bold;line-height:1.2;color:rgb(63, 63, 63);`,
    h2: `margin:2em 8px 0.75em 0;padding:0 0 0.5em 12px;border-left:4px solid ${headingAccent};border-bottom:1px dashed ${headingAccent};font-size:20px;font-weight:bold;line-height:1.2;color:rgb(63, 63, 63);`,
    h3: `margin:1.7em 8px 0.7em;font-size:18px;font-weight:bold;line-height:1.35;color:rgb(63, 63, 63);`,
    h4: `margin:1.5em 8px 0.6em;padding-left:9px;border-left:3px solid ${headingAccent};font-size:16px;font-weight:bold;line-height:1.35;color:rgb(63, 63, 63);`,
    p: `margin:1.2em 8px;text-align:justify;line-height:1.75;font-family:${fontFamily};font-size:15px;letter-spacing:0.1em;color:rgb(34, 34, 34);font-weight:400;overflow-wrap:break-word;`,
    strong: `font-weight:700;color:rgb(63, 63, 63);`,
    em: `font-style:italic;color:${spec.muted};`,
    code: `display:inline-block;background:${inlineCodeBg};color:#9f452c;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;padding:2px 7px;border-radius:999px;border:1px solid rgba(200, 100, 66, 0.18);font-size:90%;line-height:1.4;`,
    pre: `display:block;box-sizing:border-box;margin:1.5em 8px;padding:1.15em 1.2em 1.2em;background:${preBg};border:1px solid rgba(200, 100, 66, 0.18);border-radius:14px;overflow-x:auto;font-size:14px;line-height:1.6;box-shadow:0 8px 20px rgba(200, 100, 66, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.85);white-space:pre;-webkit-overflow-scrolling:touch;tab-size:2;`,
    preCode: `background:none;padding:0;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;font-size:14px;color:#3b342f;line-height:1.6;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;`,
    blockquote: `margin:1.5em 8px 2em;padding:1em 1.2em;border-left:4px solid ${headingAccent};background:rgba(200, 100, 66, 0.1);color:rgb(63, 63, 63);font-size:15px;line-height:1.75;border-radius:0 8px 8px 0;`,
    ul: `list-style:none;margin:0em 8px 1.5em;padding:0;text-align:left;line-height:1.75;font-family:${fontFamily};font-size:15px;color:rgb(63, 63, 63);`,
    ol: `list-style:none;margin:0em 8px 1.5em;padding:0;text-align:left;line-height:1.75;font-family:${fontFamily};font-size:15px;color:rgb(63, 63, 63);`,
    li: `display:block;margin:0.5em 0;padding:0;text-align:left;line-height:1.75;font-family:${fontFamily};font-size:15px;font-weight:400;color:rgb(63, 63, 63);`,
    hr: `border:none;border-top:1px dashed rgba(230, 130, 96, 0.4);margin:2em 8px;`,
    img: `max-width:100%;border-radius:8px;display:block;margin:18px auto;`,
    a: `color:${linkAccent};text-decoration:none;border-bottom:1px solid rgba(200, 100, 66, 0.3);word-break:break-all;overflow-wrap:anywhere;white-space:normal;`,
    table: `width:100%;border-collapse:collapse;margin:1.5em 8px;font-size:14px;background:#faf9f5;`,
    th: `background:#ead6cc;font-weight:800;padding:9px 12px;border:1px solid #dab1a1;text-align:left;color:#9f452c;`,
    td: `padding:9px 12px;border:1px solid #dab1a1;color:#3b342f;`,
  }
}

function h1Style(spec: ThemeSpec, soft: string, shadow: string): string {
  switch (spec.collection) {
    case "minimal":
      return `font-size:23px;font-weight:800;color:${spec.accent};margin:28px 0 14px;line-height:1.35;`
    case "focus":
      return `font-size:23px;font-weight:850;color:${spec.text};margin:30px 0 16px;line-height:1.35;text-align:center;padding:10px 0;border-top:2px solid ${spec.accent};border-bottom:2px solid ${spec.accent};`
    case "elegant":
      return `font-size:25px;font-weight:850;color:${spec.text};margin:30px 0 15px;line-height:1.34;padding:10px 14px;background:linear-gradient(90deg,${soft},transparent);border-left:6px solid ${spec.accent};border-radius:8px;`
    case "bold":
      return `font-size:24px;font-weight:900;color:#ffffff;margin:28px 0 15px;line-height:1.3;text-align:center;padding:14px 18px;background:${spec.accent};border-radius:12px;box-shadow:${shadow};`
    case "classic":
      return `font-size:26px;font-weight:850;color:${spec.text};margin:30px 0 15px;line-height:1.35;border-bottom:3px double ${spec.accent};padding-bottom:10px;`
    case "extra":
      return `font-size:25px;font-weight:900;color:${spec.text};margin:28px 0 14px;line-height:1.32;padding:12px 14px;background:${soft};border:2px solid ${spec.accent};border-radius:10px;`
    default:
      return `font-size:24px;font-weight:850;color:${spec.text};margin:28px 0 14px;line-height:1.34;padding-bottom:8px;border-bottom:3px solid ${spec.accent};`
  }
}

function h2Style(spec: ThemeSpec, soft: string, shadow: string): string {
  switch (spec.collection) {
    case "minimal":
      return `font-size:19px;font-weight:800;color:${spec.accent};margin:25px 0 11px;line-height:1.4;border-bottom:1px solid ${spec.border};padding-bottom:6px;`
    case "focus":
      return `font-size:20px;font-weight:850;color:${spec.text};margin:28px 0 13px;line-height:1.4;text-align:center;`
    case "elegant":
      return `font-size:20px;font-weight:850;color:${spec.text};margin:28px 0 12px;line-height:1.42;padding:8px 12px;border-left:5px solid ${spec.accent};background:${soft};border-radius:0 8px 8px 0;`
    case "bold":
      return `font-size:20px;font-weight:900;color:#ffffff;margin:26px 0 12px;line-height:1.35;padding:10px 14px;background:${spec.accent};border-radius:10px;box-shadow:${shadow};`
    case "classic":
      return `font-size:20px;font-weight:850;color:${spec.text};margin:28px 0 12px;line-height:1.42;border-left:5px solid ${spec.accent};padding-left:12px;background:${soft};`
    case "extra":
      return `font-size:20px;font-weight:900;color:${spec.accent};margin:26px 0 12px;line-height:1.4;padding:8px 12px;background:${soft};border-left:5px solid ${spec.accent};`
    default:
      return `font-size:20px;font-weight:850;color:${spec.text};margin:26px 0 12px;line-height:1.42;border-left:4px solid ${spec.accent};padding-left:12px;background:${soft};`
  }
}

function colorMix(color: string, alpha: number): string {
  if (color.startsWith("rgba(")) return color
  if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `,${alpha})`)
  const hex = color.replace("#", "")
  const normalized = hex.length === 3 ? hex.split("").map(char => char + char).join("") : hex.slice(0, 6)
  const n = Number.parseInt(normalized, 16)
  if (Number.isNaN(n)) return `rgba(7,193,96,${alpha})`
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export function getTheme(name: string): Theme {
  return themes[name] ?? themes.default
}

export function hasTheme(name: string): boolean {
  return Object.hasOwn(themes, name)
}

export function listThemes(): string[] {
  return THEME_SPECS.map(spec => spec.name)
}

export function listThemeReferences(): ThemeReference[] {
  return THEME_SPECS.map(spec => ({
    name: spec.name,
    description: spec.description,
    collection: spec.collection,
    displayName: spec.displayName,
    bestFor: spec.bestFor,
    density: spec.density,
    contrast: spec.contrast,
    accent: spec.accent,
  }))
}
