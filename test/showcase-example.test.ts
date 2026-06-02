import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { convertMarkdown } from "../src/converter/index.js"

const showcasePath = resolve(process.cwd(), "examples/advanced-layout-showcase.md")

const PUBLIC_ADVANCED_MODULES = [
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

const ENHANCED_ADVANCED_MODULES = [
  "dialogue",
  "gallery",
  "longimage",
]

function readShowcase(): string {
  return readFileSync(showcasePath, "utf8")
}

describe("advanced layout showcase example", () => {
  it("exists as the canonical runnable example", () => {
    expect(existsSync(showcasePath)).toBe(true)
  })

  it("covers every public advanced module", () => {
    const showcase = readShowcase()

    for (const moduleName of [...PUBLIC_ADVANCED_MODULES, ...ENHANCED_ADVANCED_MODULES]) {
      expect(showcase).toContain(`:::${moduleName}`)
    }
  })

  it("converts without leaking directive fences", async () => {
    const result = await convertMarkdown(readShowcase(), { theme: "default", stripLinks: false })

    for (const moduleName of [...PUBLIC_ADVANCED_MODULES, ...ENHANCED_ADVANCED_MODULES]) {
      expect(result.html).toContain(`data-mpa-action-id="${moduleName}"`)
    }

    expect(result.html).not.toContain(":::hero")
    expect(result.html).not.toContain(":::gallery")
    expect(result.html).toContain("markdown-alert-note")
    expect(result.html).toContain("引用链接")
    expect(result.externalImages.length).toBeGreaterThan(0)
  })
})
