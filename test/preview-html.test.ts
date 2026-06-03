import { describe, it, expect } from "vitest"
import { generatePreviewHtml } from "../src/converter/preview-html.js"
import type { ThemePreviewResult } from "../src/converter/preview-html.js"

const MOCK_RESULTS: ThemePreviewResult[] = [
  {
    theme: "default",
    displayName: "Reference Warm",
    collection: "built-in",
    density: "medium",
    contrast: "medium",
    accent: "#a34e2e",
    bestFor: "technical essays",
    html: "<section>default content</section>",
  },
  {
    theme: "github-readme",
    displayName: "Developer Blue",
    collection: "modern",
    density: "medium",
    contrast: "medium",
    accent: "#0969da",
    bestFor: "developer documentation",
    html: "<section>github-readme content</section>",
  },
  {
    theme: "fixture-theme",
    displayName: "Fixture Theme",
    collection: "custom",
    density: "medium",
    contrast: "high",
    accent: "#b8870c",
    bestFor: "custom preview",
    html: "<section>fixture content</section>",
    publishCommand: "wxp publish --file /home/user/article.md --theme-file test/fixtures/external-theme-valid.json",
  },
]

const FILE_PATH = "/home/user/article.md"

describe("generatePreviewHtml", () => {
  it("renders a static theme gallery with one card per result", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)

    expect(html).toContain('class="gallery-shell"')
    expect(html).toContain('class="theme-grid"')
    expect(html).toContain('class="theme-card" data-theme="default"')
    expect(html).toContain('class="theme-card" data-theme="github-readme"')
    expect(html).toContain('class="theme-card" data-theme="fixture-theme"')
  })

  it("includes searchable and filterable gallery controls", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)

    expect(html).toContain('id="themeSearch"')
    expect(html).toContain('data-filter-group="collection"')
    expect(html).toContain('data-filter-group="density"')
    expect(html).toContain('data-filter-group="contrast"')
    expect(html).toContain('data-filter-value="modern"')
    expect(html).toContain('data-filter-value="custom"')
  })

  it("shows theme metadata badges and accent swatches", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)

    expect(html).toContain("Reference Warm")
    expect(html).toContain("Developer Blue")
    expect(html).toContain("technical essays")
    expect(html).toContain('class="accent-swatch" style="background:#a34e2e"')
    expect(html).toContain("built-in")
    expect(html).toContain("medium density")
    expect(html).toContain("high contrast")
  })

  it("contains a full preview drawer and copy command controls", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)

    expect(html).toContain('id="detailPanel"')
    expect(html).toContain('id="detailPreview"')
    expect(html).toContain('id="coverInput"')
    expect(html).toContain('id="copyBtn"')
    expect(html).toContain("复制命令")
  })

  it("includes all publish commands including external theme files", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)

    expect(html).toContain(`--file ${FILE_PATH} --theme default`)
    expect(html).toContain(`--file ${FILE_PATH} --theme github-readme`)
    expect(html).toContain("--theme-file test/fixtures/external-theme-valid.json")
  })

  it("does not reference external CSS or JavaScript resources", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, FILE_PATH)

    expect(html).not.toMatch(/<link[^>]+href="https?:/)
    expect(html).not.toMatch(/<script[^>]+src="https?:/)
    expect(html).not.toMatch(/@import\s+url\(https?:/)
  })

  it("renders failed themes as error cards without hiding successful themes", () => {
    const resultsWithError: ThemePreviewResult[] = [
      { theme: "default", html: "<section>ok</section>" },
      { theme: "github-readme", html: "", error: "渲染出错了" },
    ]
    const html = generatePreviewHtml(resultsWithError, FILE_PATH)

    expect(html).toContain("theme-card-error")
    expect(html).toContain("渲染失败")
    expect(html).toContain("渲染出错了")
    expect(html).toContain("ok")
  })

  it("escapes file paths and metadata in the gallery shell", () => {
    const html = generatePreviewHtml(MOCK_RESULTS, '/path/to/my "article" & more.md')

    expect(html).not.toContain('title="wx-publisher 主题画廊 · /path/to/my "article"')
    expect(html).toContain("&amp;")
    expect(html).toContain("&quot;")
  })
})
