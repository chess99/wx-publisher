export interface AdvancedModule {
  marker: string
  name: string
  originalName: string
  title: string
  body: string
  fields: Record<string, string>
  fieldLists: Record<string, string[]>
  rows: string[][]
}

export interface ParseAdvancedLayoutOptions {
  supportedModules?: Set<string>
}

export interface ParseAdvancedLayoutResult {
  markdown: string
  modules: AdvancedModule[]
}

export const MODULE_ALIASES: Record<string, string> = {}

export const PUBLIC_ADVANCED_MODULES = [
  "hero",
  "cards",
  "metrics",
  "steps",
  "compare",
  "timeline",
  "infographic",
  "audience-fit",
  "bridge",
  "manifesto",
  "myth-fact",
  "verdict",
  "people",
  "cases",
  "pricing",
  "faq",
  "logos",
  "part",
  "label-title",
  "quote",
  "image-text",
  "image-compare",
  "image-annotate",
  "toc",
  "checklist",
  "toolbox",
  "specs",
  "image-steps",
  "notice",
  "summary",
  "author-card",
  "series",
  "subscribe",
  "cta",
  "callout",
  "changelog",
  "comparison-table",
  "definition",
  "question",
  "quote-card",
  "resource-list",
  "stat-row",
  "tweet",
]

export const ENHANCED_ADVANCED_MODULES = [
  "gallery",
  "longimage",
  "dialogue",
]

export const SUPPORTED_ADVANCED_MODULES = new Set([
  ...PUBLIC_ADVANCED_MODULES,
  ...ENHANCED_ADVANCED_MODULES,
  ...Object.keys(MODULE_ALIASES),
])

export function canonicalModuleName(name: string): string {
  return MODULE_ALIASES[name] ?? name
}

export function parseAdvancedLayoutBlocks(
  markdown: string,
  options: ParseAdvancedLayoutOptions = {},
): ParseAdvancedLayoutResult {
  const supported = options.supportedModules ?? SUPPORTED_ADVANCED_MODULES
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const output: string[] = []
  const modules: AdvancedModule[] = []

  for (let i = 0; i < lines.length; i++) {
    const start = lines[i]?.match(/^:::([A-Za-z][\w-]*)(?:\[(.*?)\])?\s*$/)
    if (!start) {
      output.push(lines[i] ?? "")
      continue
    }

    const originalName = start[1]
    const canonical = canonicalModuleName(originalName)
    if (!supported.has(originalName) && !supported.has(canonical)) {
      output.push(lines[i] ?? "")
      continue
    }

    let end = -1
    for (let j = i + 1; j < lines.length; j++) {
      if (/^:::\s*$/.test(lines[j] ?? "")) {
        end = j
        break
      }
    }

    if (end === -1) {
      output.push(lines[i] ?? "")
      continue
    }

    const bodyLines = lines.slice(i + 1, end)
    const marker = `WXP_ADVANCED_LAYOUT_BLOCK_${modules.length}`
    modules.push(parseModule(marker, canonical, originalName, start[2] ?? "", bodyLines))
    output.push("")
    output.push(marker)
    output.push("")
    i = end
  }

  return { markdown: output.join("\n"), modules }
}

function parseModule(
  marker: string,
  name: string,
  originalName: string,
  title: string,
  bodyLines: string[],
): AdvancedModule {
  const fields: Record<string, string> = {}
  const fieldLists: Record<string, string[]> = {}
  const rows: string[][] = []

  for (const line of bodyLines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const field = trimmed.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (field) {
      const key = field[1]
      const value = field[2].trim()
      fields[key] = value
      fieldLists[key] = [...(fieldLists[key] ?? []), value]
      continue
    }

    if (trimmed.includes("|")) {
      rows.push(trimmed.split("|").map(part => part.trim()))
    }
  }

  return {
    marker,
    name,
    originalName,
    title: title.trim(),
    body: bodyLines.join("\n"),
    fields,
    fieldLists,
    rows,
  }
}
