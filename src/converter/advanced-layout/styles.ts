import type { Theme } from "../themes.js"

export interface AdvancedPalette {
  background: string
  surface: string
  surfaceAlt: string
  accentSoft: string
  accentSofter: string
  accent: string
  accentDark: string
  border: string
  mutedBorder: string
  text: string
  textStrong: string
  muted: string
  shadow: string
  accentShadow: string
}

export function getAdvancedPalette(theme: Theme): AdvancedPalette {
  if (theme.name === "studio" || theme.name === "studio-studio") {
    return {
      background: "#faf9f5",
      surface: "#faf9f5",
      surfaceAlt: "#f7f7f7",
      accentSoft: "#f1e6df",
      accentSofter: "#ecd9d0",
      accent: "#c86442",
      accentDark: "#b3593b",
      border: "#e3c6b9",
      mutedBorder: "rgba(202, 202, 199, 0.18)",
      text: "#555555",
      textStrong: "#222222",
      muted: "#737373",
      shadow: "0 2px 6px rgba(85, 85, 85, 0.06)",
      accentShadow: "0 4px 16px rgba(179, 89, 59, 0.12)",
    }
  }

  const accent = extractAccentColor(theme.styles.h2) ?? extractAccentColor(theme.styles.a) ?? "#07c160"
  return {
    background: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#f7f7f7",
    accentSoft: colorMix(accent, 0.12),
    accentSofter: colorMix(accent, 0.18),
    accent,
    accentDark: accent,
    border: colorMix(accent, 0.28),
    mutedBorder: "rgba(0, 0, 0, 0.08)",
    text: "#333333",
    textStrong: "#1a1a1a",
    muted: "#666666",
    shadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
    accentShadow: "0 4px 14px rgba(0, 0, 0, 0.10)",
  }
}

export function esc(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function attr(text: unknown): string {
  return esc(text).replace(/"/g, "&quot;")
}

export function splitList(value = ""): string[] {
  return value
    .split("|")
    .map(part => part.trim())
    .filter(Boolean)
}

export function paragraph(text: string, p: AdvancedPalette, extra = ""): string {
  return `<p style="margin:0;font-size:15px;color:${p.text};line-height:1.72;${extra}">${esc(text)}</p>`
}

export function label(text: string, p: AdvancedPalette, extra = ""): string {
  if (!text) return ""
  return `<p style="display:inline-block;padding:4px 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${p.accentDark};background:${p.accentSoft};border-radius:999px;margin:0;${extra}">${esc(text)}</p>`
}

export function sectionTitle(title: string, p: AdvancedPalette): string {
  if (!title) return ""
  return `<p style="font-size:13px;color:${p.muted};margin:0 0 12px;text-transform:uppercase;letter-spacing:1.8px;font-weight:700;">${esc(title)}</p>`
}

export function cardStyle(p: AdvancedPalette, accent = false): string {
  return accent
    ? `background:linear-gradient(135deg, ${p.accentSoft} 0%, ${p.surface} 52%, ${p.surfaceAlt} 100%);border:1px solid ${p.border};border-radius:12px;padding:16px 14px 13px;box-shadow:${p.shadow};box-sizing:border-box;`
    : `background:${p.surface};border:1px solid ${p.mutedBorder};border-radius:12px;padding:16px 12px 12px;box-shadow:${p.shadow};box-sizing:border-box;`
}

export function imageTag(src: string, alt: string, style: string): string {
  const safeSrc = safeUrl(src)
  if (!safeSrc) return ""
  return `<img data-src="${attr(safeSrc)}" class="rich_pages wxw-img" src="${attr(safeSrc)}" style="${attr(style)}" alt="${attr(alt)}" data-fail="0">`
}

export function safeUrl(url: string): string {
  const value = url.trim()
  if (!value) return ""
  if (/[\u0000-\u001F\u007F]/.test(value) || value.startsWith("//")) return ""
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) && !/^https?:\/\//i.test(value)) return ""
  if (/^(https?:\/\/|\/|#|\.\.?\/)/i.test(value)) return value
  if (/^[A-Za-z0-9_./-]+\.(png|jpe?g|gif|webp|svg)$/i.test(value)) return value
  return ""
}

function extractAccentColor(style: string): string | null {
  const rgb = style.match(/rgb\([^)]+\)/)
  if (rgb) return rgb[0]
  const hex = style.match(/#[0-9a-fA-F]{3,8}/)
  return hex?.[0] ?? null
}

function colorMix(color: string, alpha: number): string {
  if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`)
  if (!color.startsWith("#")) return `rgba(7, 193, 96, ${alpha})`
  const hex = color.slice(1)
  const normalized = hex.length === 3
    ? hex.split("").map(c => c + c).join("")
    : hex.slice(0, 6)
  const n = Number.parseInt(normalized, 16)
  if (Number.isNaN(n)) return `rgba(7, 193, 96, ${alpha})`
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
