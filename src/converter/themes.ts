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
  advancedPalette?: ThemeAdvancedPalette
  sourceUpdatedAt?: string
}

export interface ThemeAdvancedPalette {
  background: string
  surface: string
  surfaceAlt: string
  accentSoft: string
  accentSofter: string
  accentDark: string
  border: string
  muted: string
  text: string
  textStrong: string
  mutedBorder?: string
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

const SOURCE_UPDATED_AT = "2026-06-03"

const READING_FONT_FAMILY = "-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif"
const READING_PARAGRAPH = "font-size:16px;line-height:1.82;margin:0 0 16px 0;"
const READING_LIST = "list-style:none;padding-left:0;margin:0 0 16px 0;"
const READING_LIST_ITEM = "display:block;margin:0.22em 8px;font-size:16px;line-height:1.82;"

const NAMED_THEME_SPECS: ThemeSpec[] = [
  named("default", "built-in", "Reference Warm", "#a34e2e", "#faf9f5", "#f7f7f7", "#222222", "#737373", "#e3c6b9", "#f1e6df", "暖色技术长文基线，适合代码和判断密集的文章", "technical essays, code-heavy notes, structured long-form writing", "medium", "medium"),
  named("bytedance", "built-in", "Product Blue", "#1677ff", "#ffffff", "#f2f3f5", "#4e5969", "#717782", "#b4d2fb", "#e3eefd", "产品蓝，现代清晰", "product updates, efficient business writing, modern operations", "medium", "medium"),
  named("apple", "built-in", "Polished Blue", "#007aff", "#ffffff", "#fafafa", "#333333", "#767676", "#add2fa", "#e0eefd", "精致系统蓝，留白充足", "brand stories, product writing, polished launches", "low", "medium"),
  named("sports", "built-in", "Energy Green", "#00a968", "#ffffff", "#f8f8f8", "#2c2c2c", "#767676", "#afd9cc", "#e1f1ec", "活力绿，节奏强", "events, campaigns, launches, time-sensitive updates", "medium", "high"),
  named("chinese", "built-in", "Classic Red", "#8b1e22", "#f8f4e9", "#f5eee3", "#333333", "#70706f", "#d5b0a9", "#ebdad1", "中式红，书卷气", "culture, seasonal writing, traditional editorial pieces", "medium", "medium"),
  named("cyber", "built-in", "Cyber Pink", "#f472b6", "#ffffff", "#fef8fb", "#333333", "#767676", "#d8caf9", "#f0ebfd", "赛博粉紫，高对比", "visual technology, experiments, campaigns", "high", "high"),
  named("wechat-native", "classic", "Classic Green", "#07c160", "#ffffff", "#f6fbfa", "#333333", "#767676", "#afd9c3", "#e1f1e9", "公众号原生绿，熟悉保守", "public-account style posts, conservative knowledge writing", "medium", "medium"),
  named("nyt-classic", "classic", "Newsprint Blue", "#326891", "#fdfaf6", "#f7f3ee", "#000000", "#757372", "#bccbd6", "#e5e8ea", "新闻纸蓝，严肃长文", "long-form reports, essays, opinion columns", "high", "medium"),
  named("github-readme", "modern", "Developer Blue", "#0969da", "#ffffff", "#f6f8fa", "#1f2328", "#75767a", "#b0cff3", "#e1edfb", "开发者蓝，README 气质", "technical guides, API notes, developer documentation", "medium", "medium"),
  named("sspai-red", "modern", "Media Red", "#d71a1b", "#ffffff", "#f6fbfa", "#333333", "#767676", "#f2b6b6", "#fae4e4", "媒体红，利落醒目", "productivity posts, media-style reviews, creator content", "medium", "high"),
  named("mint-fresh", "modern", "Fresh Mint", "#1a7a5a", "#f0faf5", "#e1f5ec", "#2d4a3e", "#63766f", "#acd1c3", "#d6ebe2", "清新薄荷，轻运营", "lifestyle, health, light operations content", "low", "medium"),
  named("sunset-amber", "modern", "Sunset Amber", "#c0582a", "#fdf6ee", "#f9ecda", "#3d2c1e", "#7c6f64", "#e7c2af", "#f5e3d6", "落日琥珀，叙事温暖", "travel, narrative essays, story-driven columns", "medium", "medium"),
  named("ink-minimal", "extra", "Ink Minimal", "#111111", "#ffffff", "#fafafa", "#111111", "#767676", "#b3b3b3", "#e2e2e2", "黑白墨色，低干扰", "text-heavy essays, notes, minimal editorial writing", "low", "medium"),
  named("lavender-dream", "extra", "Lavender Dream", "#6b4c9a", "#f5f0ff", "#ece4ff", "#3d3155", "#746a87", "#c9bcdf", "#e4dcf3", "柔紫梦境，品牌情绪", "brand mood, inspiration writing, soft visual stories", "low", "medium"),
  named("coffee-house", "extra", "Coffee House", "#6d4c41", "#f5efe6", "#ece3d5", "#3e2723", "#7b6963", "#c9bbb1", "#e5dbd2", "咖啡暖棕，人物访谈", "interviews, human-centered columns, essays", "medium", "medium"),
  named("bauhaus-primary", "extra", "Primary Bauhaus", "#004d9f", "#ffffff", "#f6fbfa", "#1a1a1a", "#767676", "#adc6e0", "#e0eaf3", "包豪斯主色，图形感强", "campaigns, launches, visual columns", "high", "high"),
]

const COLOR_VARIANTS = [
  { key: "gold", accent: "#c8a062", label: "Gold" },
  { key: "green", accent: "#2bae85", label: "Green" },
  { key: "blue", accent: "#4b6ef5", label: "Blue" },
  { key: "orange", accent: "#f89a3a", label: "Orange" },
  { key: "red", accent: "#f25c54", label: "Red" },
  { key: "navy", accent: "#1f4f8a", label: "Navy" },
  { key: "gray", accent: "#4e5969", label: "Gray" },
  { key: "sky", accent: "#3a7fd5", label: "Sky" },
] as const

const MATRIX_THEME_SPECS: ThemeSpec[] = [
  ...themeSeries("minimal", "Minimal", "minimal", "低干扰极简，内容优先", "clean repeatable output, low-friction templates", "low", "medium"),
  ...themeSeries("focus", "Focus", "focus", "居中强调，节奏清晰", "centered rhythm, key-point emphasis, structured reading", "medium", "medium"),
  ...themeSeries("elegant", "Elegant", "elegant", "层次丰富，编辑感强", "brand-led articles, editorial writing, aesthetic long-form", "medium", "medium"),
  ...themeSeries("bold", "Bold", "bold", "强视觉标题，强调转化", "launches, campaigns, high-impact announcements", "medium", "high"),
]

const THEME_DISPLAY_METADATA: Record<string, { displayName: string; bestFor: string }> = {
  "default": { displayName: "默认主题", bestFor: "适合运营、知识内容，气质偏熟悉、微信原生。" },
  "bytedance": { displayName: "字节范", bestFor: "适合产品、品牌内容，气质偏科技、效率。" },
  "apple": { displayName: "苹果范", bestFor: "适合品牌、产品内容，气质偏精致、未来感。" },
  "sports": { displayName: "运动风", bestFor: "适合运营、专题内容，气质偏动感、活力。" },
  "chinese": { displayName: "中国风", bestFor: "适合专题、品牌内容，气质偏古典、文化。" },
  "cyber": { displayName: "赛博朋克", bestFor: "适合专题、产品内容，气质偏赛博、实验性。" },
  "wechat-native": { displayName: "微信公众号原生", bestFor: "适合运营、知识内容，气质偏熟悉、稳妥。" },
  "nyt-classic": { displayName: "NYT", bestFor: "适合知识、专题内容，气质偏报刊、严肃。" },
  "github-readme": { displayName: "GitHub", bestFor: "适合产品、知识内容，气质偏技术、结构化。" },
  "sspai-red": { displayName: "少数派", bestFor: "适合产品、品牌内容，气质偏媒体感、中文科技。" },
  "mint-fresh": { displayName: "薄荷", bestFor: "适合品牌、运营内容，气质偏清新、生活方式。" },
  "sunset-amber": { displayName: "日落", bestFor: "适合专题、品牌内容，气质偏叙事、温暖。" },
  "ink-minimal": { displayName: "水墨", bestFor: "适合知识、专题内容，气质偏黑白、克制。" },
  "lavender-dream": { displayName: "薰衣草", bestFor: "适合品牌、专题内容，气质偏柔和、浪漫。" },
  "coffee-house": { displayName: "咖啡", bestFor: "适合专题、品牌内容，气质偏温暖、人文。" },
  "bauhaus-primary": { displayName: "Bauhaus", bestFor: "适合专题、品牌、产品内容，气质偏现代主义、实验。" },
  "minimal-gold": { displayName: "简约 · 古铜金", bestFor: "适合知识、运营内容，气质偏克制、整洁、温润、沉稳。" },
  "minimal-green": { displayName: "简约 · 翡翠绿", bestFor: "适合知识、运营内容，气质偏克制、整洁、清新、自然。" },
  "minimal-blue": { displayName: "简约 · 宝石蓝", bestFor: "适合知识、运营内容，气质偏克制、整洁、专业、科技。" },
  "minimal-orange": { displayName: "简约 · 暖阳橙", bestFor: "适合知识、运营内容，气质偏克制、整洁、明快、亲和。" },
  "minimal-red": { displayName: "简约 · 中国红", bestFor: "适合知识、运营内容，气质偏克制、整洁、强调、传播。" },
  "minimal-navy": { displayName: "简约 · 深海蓝", bestFor: "适合知识、运营内容，气质偏克制、整洁、可信、理性。" },
  "minimal-gray": { displayName: "简约 · 石墨灰", bestFor: "适合知识、运营内容，气质偏克制、整洁、中性。" },
  "minimal-sky": { displayName: "简约 · 天空蓝", bestFor: "适合知识、运营内容，气质偏克制、整洁、通透、轻盈。" },
  "focus-gold": { displayName: "聚焦 · 古铜金", bestFor: "适合知识、品牌内容，气质偏聚焦、秩序、温润、沉稳。" },
  "focus-green": { displayName: "聚焦 · 翡翠绿", bestFor: "适合知识、品牌内容，气质偏聚焦、秩序、清新、自然。" },
  "focus-blue": { displayName: "聚焦 · 宝石蓝", bestFor: "适合知识、品牌内容，气质偏聚焦、秩序、专业、科技。" },
  "focus-orange": { displayName: "聚焦 · 暖阳橙", bestFor: "适合知识、品牌内容，气质偏聚焦、秩序、明快、亲和。" },
  "focus-red": { displayName: "聚焦 · 中国红", bestFor: "适合知识、品牌内容，气质偏聚焦、秩序、强调、传播。" },
  "focus-navy": { displayName: "聚焦 · 深海蓝", bestFor: "适合知识、品牌内容，气质偏聚焦、秩序、可信、理性。" },
  "focus-gray": { displayName: "聚焦 · 石墨灰", bestFor: "适合知识、品牌内容，气质偏聚焦、秩序、克制、中性。" },
  "focus-sky": { displayName: "聚焦 · 天空蓝", bestFor: "适合知识、品牌内容，气质偏聚焦、秩序、通透、轻盈。" },
  "elegant-gold": { displayName: "精致 · 古铜金", bestFor: "适合品牌、运营内容，气质偏精致、雅致、温润、沉稳。" },
  "elegant-green": { displayName: "精致 · 翡翠绿", bestFor: "适合品牌、运营内容，气质偏精致、雅致、清新、自然。" },
  "elegant-blue": { displayName: "精致 · 宝石蓝", bestFor: "适合品牌、运营内容，气质偏精致、雅致、专业、科技。" },
  "elegant-orange": { displayName: "精致 · 暖阳橙", bestFor: "适合品牌、运营内容，气质偏精致、雅致、明快、亲和。" },
  "elegant-red": { displayName: "精致 · 中国红", bestFor: "适合品牌、运营内容，气质偏精致、雅致、强调、传播。" },
  "elegant-navy": { displayName: "精致 · 深海蓝", bestFor: "适合品牌、运营内容，气质偏精致、雅致、可信、理性。" },
  "elegant-gray": { displayName: "精致 · 石墨灰", bestFor: "适合品牌、运营内容，气质偏精致、雅致、克制、中性。" },
  "elegant-sky": { displayName: "精致 · 天空蓝", bestFor: "适合品牌、运营内容，气质偏精致、雅致、通透、轻盈。" },
  "bold-gold": { displayName: "醒目 · 古铜金", bestFor: "适合专题、品牌、运营内容，气质偏醒目、宣传、温润、沉稳。" },
  "bold-green": { displayName: "醒目 · 翡翠绿", bestFor: "适合专题、品牌、运营内容，气质偏醒目、宣传、清新、自然。" },
  "bold-blue": { displayName: "醒目 · 宝石蓝", bestFor: "适合专题、品牌、运营内容，气质偏醒目、宣传、专业、科技。" },
  "bold-orange": { displayName: "醒目 · 暖阳橙", bestFor: "适合专题、品牌、运营内容，气质偏醒目、宣传、明快、亲和。" },
  "bold-red": { displayName: "醒目 · 中国红", bestFor: "适合专题、品牌、运营内容，气质偏醒目、宣传、强调、传播。" },
  "bold-navy": { displayName: "醒目 · 深海蓝", bestFor: "适合专题、品牌、运营内容，气质偏醒目、宣传、可信、理性。" },
  "bold-gray": { displayName: "醒目 · 石墨灰", bestFor: "适合专题、品牌、运营内容，气质偏醒目、宣传、克制、中性。" },
  "bold-sky": { displayName: "醒目 · 天空蓝", bestFor: "适合专题、品牌、运营内容，气质偏醒目、宣传、通透、轻盈。" },
}

const GALLERY_ADVANCED_PALETTES: Record<string, ThemeAdvancedPalette> = {
  "default": { background: "#faf9f5", surface: "#faf9f5", surfaceAlt: "#f7f7f7", accentSoft: "#f1e6df", accentSofter: "#ecd9d0", accentDark: "#b3593b", border: "#e3c6b9", muted: "#737373", text: "#555555", textStrong: "#222222", mutedBorder: "rgba(202, 202, 199, 0.18)" },
  "bytedance": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f2f3f5", accentSoft: "#e3eefd", accentSofter: "#d0e3fc", accentDark: "#1571f1", border: "#b4d2fb", muted: "#717782", text: "#1d2129", textStrong: "#4e5969" },
  "apple": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fafafa", accentSoft: "#e0eefd", accentSofter: "#cce3fc", accentDark: "#0072ef", border: "#add2fa", muted: "#767676", text: "#595959", textStrong: "#333333" },
  "sports": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f8f8f8", accentSoft: "#e1f1ec", accentSofter: "#cde7df", accentDark: "#05875f", border: "#afd9cc", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
  "chinese": { background: "#f8f4e9", surface: "#f8f4e9", surfaceAlt: "#f5eee3", accentSoft: "#ebdad1", accentSofter: "#e2c9c1", accentDark: "#8b1e22", border: "#d5b0a9", muted: "#70706f", text: "#8b1e22", textStrong: "#333333" },
  "cyber": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fef8fb", accentSoft: "#f0ebfd", accentSofter: "#e7defb", accentDark: "#8659ed", border: "#d8caf9", muted: "#767676", text: "#595959", textStrong: "#333333" },
  "wechat-native": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6fbfa", accentSoft: "#e1f1e9", accentSofter: "#cde7da", accentDark: "#058844", border: "#afd9c3", muted: "#767676", text: "#163325", textStrong: "#333333" },
  "nyt-classic": { background: "#fdfaf6", surface: "#fdfaf6", surfaceAlt: "#f7f3ee", accentSoft: "#e5e8ea", accentSofter: "#d4dde2", accentDark: "#326891", border: "#bccbd6", muted: "#757372", text: "#111111", textStrong: "#000000" },
  "github-readme": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6f8fa", accentSoft: "#e1edfb", accentSofter: "#cee1f8", accentDark: "#0969da", border: "#b0cff3", muted: "#75767a", text: "#1f2328", textStrong: "#1f2328" },
  "sspai-red": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6fbfa", accentSoft: "#fae4e4", accentSofter: "#f7d1d1", accentDark: "#d71a1b", border: "#f2b6b6", muted: "#767676", text: "#2d2d2d", textStrong: "#333333" },
  "mint-fresh": { background: "#f0faf5", surface: "#f0faf5", surfaceAlt: "#e1f5ec", accentSoft: "#d6ebe2", accentSofter: "#c5e0d6", accentDark: "#1a7a5a", border: "#acd1c3", muted: "#63766f", text: "#1d5e49", textStrong: "#2d4a3e" },
  "sunset-amber": { background: "#fdf6ee", surface: "#fdf6ee", surfaceAlt: "#f9ecda", accentSoft: "#f5e3d6", accentSofter: "#efd6c6", accentDark: "#b85428", border: "#e7c2af", muted: "#7c6f64", text: "#7f452a", textStrong: "#3d2c1e" },
  "ink-minimal": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fafafa", accentSoft: "#e2e2e2", accentSofter: "#cfcfcf", accentDark: "#111111", border: "#b3b3b3", muted: "#767676", text: "#000000", textStrong: "#111111" },
  "lavender-dream": { background: "#f5f0ff", surface: "#f5f0ff", surfaceAlt: "#ece4ff", accentSoft: "#e4dcf3", accentSofter: "#d9cfeb", accentDark: "#6b4c9a", border: "#c9bcdf", muted: "#746a87", text: "#5e4587", textStrong: "#3d3155" },
  "coffee-house": { background: "#f5efe6", surface: "#f5efe6", surfaceAlt: "#ece3d5", accentSoft: "#e5dbd2", accentSofter: "#dacec5", accentDark: "#6d4c41", border: "#c9bbb1", muted: "#7b6963", text: "#4a302a", textStrong: "#3e2723" },
  "bauhaus-primary": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6fbfa", accentSoft: "#e0eaf3", accentSofter: "#ccdbec", accentDark: "#004d9f", border: "#adc6e0", muted: "#767676", text: "#595959", textStrong: "#1a1a1a" },
  "minimal-gold": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f9fafb", accentSoft: "#f2eee9", accentSofter: "#e9e3da", accentDark: "#8f7246", border: "#dbd2c4", muted: "#767676", text: "#6b5534", textStrong: "#2c2c2c" },
  "minimal-green": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f9fafb", accentSoft: "#e4f0ed", accentSofter: "#d3e7e0", accentDark: "#218666", border: "#b8d8ce", muted: "#767676", text: "#19644d", textStrong: "#2c2c2c" },
  "minimal-blue": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f9fafb", accentSoft: "#e9edfd", accentSofter: "#dbe1fc", accentDark: "#496bef", border: "#c5d0fa", muted: "#767676", text: "#3751b4", textStrong: "#2c2c2c" },
  "minimal-orange": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f9fafb", accentSoft: "#f4ede5", accentSofter: "#ede1d4", accentDark: "#a76827", border: "#e3cfba", muted: "#767676", text: "#7e4e1e", textStrong: "#2c2c2c" },
  "minimal-red": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f9fafb", accentSoft: "#f9eae9", accentSofter: "#f4dbda", accentDark: "#ca4d46", border: "#eec6c4", muted: "#767676", text: "#983a35", textStrong: "#2c2c2c" },
  "minimal-navy": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f9fafb", accentSoft: "#e4eaf1", accentSofter: "#d2dce8", accentDark: "#1f4f8a", border: "#b7c7da", muted: "#767676", text: "#1f4f8a", textStrong: "#2c2c2c" },
  "minimal-gray": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f9fafb", accentSoft: "#eaebed", accentSofter: "#dcdee1", accentDark: "#4e5969", border: "#c6cacf", muted: "#767676", text: "#4e5969", textStrong: "#2c2c2c" },
  "minimal-sky": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f9fafb", accentSoft: "#e7eff8", accentSofter: "#d7e4f4", accentDark: "#3777c8", border: "#bfd3ed", muted: "#767676", text: "#295a96", textStrong: "#2c2c2c" },
  "focus-gold": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fcfaf7", accentSoft: "#f2eee9", accentSofter: "#e9e3da", accentDark: "#8f7246", border: "#dbd2c4", muted: "#767676", text: "#6b5534", textStrong: "#2c2c2c" },
  "focus-green": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f4fbf9", accentSoft: "#e4f0ed", accentSofter: "#d3e7e0", accentDark: "#218666", border: "#b8d8ce", muted: "#767676", text: "#19644d", textStrong: "#2c2c2c" },
  "focus-blue": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6f8ff", accentSoft: "#e9edfd", accentSofter: "#dbe1fc", accentDark: "#496bef", border: "#c5d0fa", muted: "#767676", text: "#3751b4", textStrong: "#2c2c2c" },
  "focus-orange": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fffaf5", accentSoft: "#f4ede5", accentSofter: "#ede1d4", accentDark: "#a76827", border: "#e3cfba", muted: "#767676", text: "#7e4e1e", textStrong: "#2c2c2c" },
  "focus-red": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fef7f6", accentSoft: "#f9eae9", accentSofter: "#f4dbda", accentDark: "#ca4d46", border: "#eec6c4", muted: "#767676", text: "#983a35", textStrong: "#2c2c2c" },
  "focus-navy": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f4f6f9", accentSoft: "#e4eaf1", accentSofter: "#d2dce8", accentDark: "#1f4f8a", border: "#b7c7da", muted: "#767676", text: "#1f4f8a", textStrong: "#2c2c2c" },
  "focus-gray": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6f7f8", accentSoft: "#eaebed", accentSofter: "#dcdee1", accentDark: "#4e5969", border: "#c6cacf", muted: "#767676", text: "#4e5969", textStrong: "#2c2c2c" },
  "focus-sky": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f5f9fd", accentSoft: "#e7eff8", accentSofter: "#d7e4f4", accentDark: "#3777c8", border: "#bfd3ed", muted: "#767676", text: "#295a96", textStrong: "#2c2c2c" },
  "elegant-gold": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fcfaf7", accentSoft: "#f2eee9", accentSofter: "#e9e3da", accentDark: "#8f7246", border: "#dbd2c4", muted: "#767676", text: "#6b5534", textStrong: "#2c2c2c" },
  "elegant-green": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f4fbf9", accentSoft: "#e4f0ed", accentSofter: "#d3e7e0", accentDark: "#218666", border: "#b8d8ce", muted: "#767676", text: "#19644d", textStrong: "#2c2c2c" },
  "elegant-blue": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6f8ff", accentSoft: "#e9edfd", accentSofter: "#dbe1fc", accentDark: "#496bef", border: "#c5d0fa", muted: "#767676", text: "#3751b4", textStrong: "#2c2c2c" },
  "elegant-orange": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fffaf5", accentSoft: "#f4ede5", accentSofter: "#ede1d4", accentDark: "#a76827", border: "#e3cfba", muted: "#767676", text: "#7e4e1e", textStrong: "#2c2c2c" },
  "elegant-red": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fef7f6", accentSoft: "#f9eae9", accentSofter: "#f4dbda", accentDark: "#ca4d46", border: "#eec6c4", muted: "#767676", text: "#983a35", textStrong: "#2c2c2c" },
  "elegant-navy": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f4f6f9", accentSoft: "#e4eaf1", accentSofter: "#d2dce8", accentDark: "#1f4f8a", border: "#b7c7da", muted: "#767676", text: "#1f4f8a", textStrong: "#2c2c2c" },
  "elegant-gray": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6f7f8", accentSoft: "#eaebed", accentSofter: "#dcdee1", accentDark: "#4e5969", border: "#c6cacf", muted: "#767676", text: "#4e5969", textStrong: "#2c2c2c" },
  "elegant-sky": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f5f9fd", accentSoft: "#e7eff8", accentSofter: "#d7e4f4", accentDark: "#3777c8", border: "#bfd3ed", muted: "#767676", text: "#295a96", textStrong: "#2c2c2c" },
  "bold-gold": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fcfaf7", accentSoft: "#f2eee9", accentSofter: "#e9e3da", accentDark: "#8f7246", border: "#dbd2c4", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
  "bold-green": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f4fbf9", accentSoft: "#e4f0ed", accentSofter: "#d3e7e0", accentDark: "#218666", border: "#b8d8ce", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
  "bold-blue": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6f8ff", accentSoft: "#e9edfd", accentSofter: "#dbe1fc", accentDark: "#496bef", border: "#c5d0fa", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
  "bold-orange": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fffaf5", accentSoft: "#f4ede5", accentSofter: "#ede1d4", accentDark: "#a76827", border: "#e3cfba", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
  "bold-red": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#fef7f6", accentSoft: "#f9eae9", accentSofter: "#f4dbda", accentDark: "#ca4d46", border: "#eec6c4", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
  "bold-navy": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f4f6f9", accentSoft: "#e4eaf1", accentSofter: "#d2dce8", accentDark: "#1f4f8a", border: "#b7c7da", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
  "bold-gray": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f6f7f8", accentSoft: "#eaebed", accentSofter: "#dcdee1", accentDark: "#4e5969", border: "#c6cacf", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
  "bold-sky": { background: "#ffffff", surface: "#ffffff", surfaceAlt: "#f5f9fd", accentSoft: "#e7eff8", accentSofter: "#d7e4f4", accentDark: "#3777c8", border: "#bfd3ed", muted: "#767676", text: "#595959", textStrong: "#2c2c2c" },
}

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
    "#ffffff",
    colorMix(color.accent, 0.08),
    "#2c2c2c",
    "#767676",
    colorMix(color.accent, 0.28),
    colorMix(color.accent, 0.10),
    `${color.label} ${description}`,
    bestFor,
    density,
    contrast,
  ))
}

function createTheme(spec: ThemeSpec): Theme {
  const metadata = THEME_DISPLAY_METADATA[spec.name]
  return {
    name: spec.name,
    description: spec.description,
    styles: createStyles(spec),
    collection: spec.collection,
    displayName: metadata?.displayName ?? spec.displayName,
    bestFor: metadata?.bestFor ?? spec.bestFor,
    density: spec.density,
    contrast: spec.contrast,
    accent: spec.accent,
    advancedPalette: GALLERY_ADVANCED_PALETTES[spec.name],
    sourceUpdatedAt: SOURCE_UPDATED_AT,
  }
}

function createStyles(spec: ThemeSpec): NodeStyles {
  const accent = spec.accent
  const soft = colorMix(accent, 0.10)
  const softer = colorMix(accent, 0.16)
  const border = spec.border
  const shadow = `0 6px 18px ${colorMix(accent, 0.10)}`
  const paragraph = `${READING_PARAGRAPH}color:${spec.text};`

  const h1 = h1Style(spec, soft, shadow)
  const h2 = h2Style(spec, soft, shadow)

  return {
    wrapper: `font-family:${READING_FONT_FAMILY};max-width:677px;margin:0 auto;padding:0 16px;background:${spec.background};color:${spec.text};`,
    h1,
    h2,
    h3: `font-size:18px;font-weight:750;color:${accent};margin:22px 0 9px;line-height:1.42;`,
    h4: `font-size:16px;font-weight:700;color:${spec.text};margin:18px 0 7px;line-height:1.4;border-left:3px solid ${accent};padding-left:8px;`,
    p: paragraph,
    strong: `font-weight:800;color:${accent};`,
    em: `font-style:italic;color:${spec.muted};`,
    code: `display:inline-block;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;font-size:90%;line-height:1.4;background:${spec.codeBackground};padding:2px 7px;border-radius:999px;color:${accent};border:1px solid ${border};`,
    pre: `display:block;box-sizing:border-box;background:${spec.surface};border-radius:12px;padding:16px 18px;margin:18px 0;overflow-x:auto;border:1px solid ${border};border-top:3px solid ${accent};box-shadow:${shadow};-webkit-overflow-scrolling:touch;tab-size:2;`,
    preCode: `font-family:Menlo,Monaco,Consolas,'Courier New',monospace;font-size:14px;color:${spec.text};background:none;padding:0;border-radius:0;display:block;line-height:1.6;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;`,
    blockquote: `border-left:4px solid ${accent};margin:18px 0;padding:12px 16px;background:${soft};color:${spec.muted};font-size:15px;line-height:1.82;border-radius:0 8px 8px 0;`,
    ul: READING_LIST,
    ol: READING_LIST,
    li: `${READING_LIST_ITEM}color:${spec.text};`,
    hr: `border:none;border-top:1px dashed ${border};margin:26px 0;`,
    img: `max-width:100%;border-radius:${spec.collection === "minimal" || spec.name === "ink-minimal" ? "2px" : "8px"};display:block;margin:18px auto;${spec.collection === "bold" || spec.collection === "elegant" ? `box-shadow:${shadow};` : ""}`,
    a: `color:${accent};text-decoration:none;font-weight:700;border-bottom:1px solid ${border};word-break:break-all;overflow-wrap:anywhere;white-space:normal;`,
    table: `width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;background:${spec.surface};`,
    th: `background:${softer};font-weight:800;padding:9px 12px;border:1px solid ${border};text-align:left;color:${accent};`,
    td: `padding:9px 12px;border:1px solid ${border};color:${spec.text};`,
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
    default:
      return `margin:28px 8px 22px;padding:16px 18px;background:${spec.accent};color:#ffffff;font-size:24px;font-weight:900;line-height:1.28;text-align:center;border-radius:12px;box-shadow:${shadow};`
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
    default:
      return `margin:2em 8px 0.75em 0;padding:0 0 0.5em 12px;border-left:4px solid ${spec.accent};border-bottom:1px dashed ${spec.accent};font-size:20px;font-weight:800;line-height:1.25;color:${spec.text};`
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
    displayName: THEME_DISPLAY_METADATA[spec.name]?.displayName ?? spec.displayName,
    bestFor: THEME_DISPLAY_METADATA[spec.name]?.bestFor ?? spec.bestFor,
    density: spec.density,
    contrast: spec.contrast,
    accent: spec.accent,
  }))
}
