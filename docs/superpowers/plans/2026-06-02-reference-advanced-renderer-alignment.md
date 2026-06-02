# Reference Advanced Renderer Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `wxp` advanced block rendering with the reference baseline while preserving optimized behavior for reference gaps.

**Architecture:** Keep the existing parser and palette intact. Update focused renderer functions in `src/converter/advanced-layout/renderers.ts`, and prove alignment through structural Vitest assertions in `test/advanced-layout.test.ts` plus showcase conversion.

**Tech Stack:** TypeScript, Vitest, `tsx`, current inline-style HTML renderer.

---

## File Map

- Modify: `test/advanced-layout.test.ts`
  - Adds structural tests for reference-aligned modules and optimized exceptions.
- Modify: `src/converter/advanced-layout/renderers.ts`
  - Updates the renderer templates for public advanced modules whose structure differs from the reference baseline.
- Read-only reference: `/Users/zcs/.codex/attachments/71c0aaa6-befa-4ac5-af00-6ac3685a42d0/pasted-text.txt`
  - Reference baseline output.
- Read-only reference: `examples/advanced-layout-showcase.md`
  - Canonical full-feature article.

## Task 1: Add Structural Alignment Tests

**Files:**
- Modify: `test/advanced-layout.test.ts`

- [ ] **Step 1: Write the failing test for enhanced image modules**

Add this test inside `describe("advanced layout conversion", () => { ... })`:

```ts
  it("matches reference structure for gallery and long image modules", async () => {
    const result = await convertMarkdown(
      `:::gallery[Gallery]\n![A](${IMAGE_URL})\n![B](${IMAGE_URL})\n:::\n\n:::longimage[Long]\n![Long](${IMAGE_URL})\n:::`,
      { theme: "default" },
    )

    expect(result.html).toContain('data-mpa-action-id="gallery"')
    expect(result.html).toContain("scroll-snap-type:x mandatory")
    expect(result.html).toContain("aspect-ratio:4/3")
    expect(result.html).toContain("scroll-snap-align:start")
    expect(result.html).toContain(">A</p>")
    expect(result.html).toContain(">B</p>")
    expect(result.html).toContain(">Gallery</p>")
    expect(result.html).toContain('data-mpa-action-id="longimage"')
    expect(result.html).toContain('class="longimage-scroll-container"')
    expect(result.html).toContain("max-height:420px")
    expect(result.html).toContain("max-height:min(75vh,600px)")
    expect(result.html).toContain(">Long</p>")
    expect(result.html).toContain('class="rich_pages wxw-img"')
    expect(result.html).not.toContain("[IMAGE:")
  })
```

- [ ] **Step 2: Write the failing test for layout modules**

Add this test in the same describe block:

```ts
  it("matches reference structure for process and comparison modules", async () => {
    const result = await convertMarkdown(
      `:::steps[Steps]\n01 | Start | Body | Note\n02 | Continue | More body | More note\n:::\n\n:::timeline[Timeline]\nStage 1 | Build | First pass\nStage 2 | Verify | Second pass\n:::\n\n:::bridge\nlabel: Next\n title: Evidence follows judgment\nbody: The next section carries proof.\nnext: Continue\n:::\n\n:::myth-fact[Myth Fact]\nMore modules means better | Useful modules should remain\n:::`,
      { theme: "default", stripLinks: false },
    )

    expect(result.html).toContain('data-mpa-action-id="steps"')
    expect(result.html).toContain("align-items:stretch")
    expect(result.html).toContain("width:2px")
    expect(result.html).toContain('data-mpa-action-id="timeline"')
    expect(result.html).toContain("box-shadow:0 0 0 3px")
    expect(result.html).toContain('data-mpa-action-id="bridge"')
    expect(result.html).toContain("width:3px")
    expect(result.html).toContain('data-mpa-action-id="myth-fact"')
    expect(result.html).toContain("grid-template-columns:minmax(0,1fr) minmax(0,1fr)")
  })
```

- [ ] **Step 3: Write the failing test for JSON module child ids and card structures**

Add this test in the same describe block:

```ts
  it("matches reference structure for JSON-backed modules", async () => {
    const result = await convertMarkdown(
      `:::changelog\n{"version":"v2","date":"2026.05","added":["More modules"],"fixed":["Stable rendering"]}\n:::\n\n:::comparison-table\n{"left":{"title":"Before","items":["Slow"]},"right":{"title":"After","items":["Fast"]}}\n:::\n\n:::definition\n{"term":"Advanced layout","def":"A structured expression layer.","termLabel":"Definition"}\n:::\n\n:::question\n[{"q":"Why use modules?","a":"To make judgment easier to scan."}]\n:::\n\n:::quote-card\n{"text":"Structure is a reading promise.","source":"Guide"}\n:::\n\n:::resource-list\n[{"name":"Docs","url":"https://example.com","desc":"Syntax and examples","icon":"Guide"}]\n:::\n\n:::stat-row\n[{"value":"43","label":"Modules","note":"Public set"}]\n:::\n\n:::tweet\n{"name":"Product Notes","handle":"@local","text":"Readable before decorative.","timestamp":"2026-05"}\n:::`,
      { theme: "default", stripLinks: false },
    )

    expect(result.html).toContain('data-mpa-action-id="changelog"')
    expect(result.html).toContain("font-variant-numeric:tabular-nums")
    expect(result.html).toContain('data-mpa-action-id="comparison-table"')
    expect(result.html).not.toContain("<table")
    expect(result.html).toContain('data-mpa-action-id="definition"')
    expect(result.html).toContain("flex:0 0 30%")
    expect(result.html).toContain('data-mpa-action-id="question-item"')
    expect(result.html).toContain('data-mpa-action-id="resource-list-item"')
    expect(result.html).toContain('data-mpa-action-id="stat-row-cell"')
    expect(result.html).toContain('data-mpa-action-id="tweet"')
  })
```

- [ ] **Step 4: Run tests to verify the new assertions fail**

Run:

```bash
npm test -- advanced-layout
```

Expected: the optimized exception test passes, and the new layout/JSON structure tests fail on current renderer output.

- [ ] **Step 5: Commit the failing tests only if the team wants red tests committed**

Default for this repository is to commit working iterations, so do not commit the failing state. Keep the tests unstaged until implementation passes.

## Task 2: Align Process And Comparison Modules

**Files:**
- Modify: `src/converter/advanced-layout/renderers.ts`
- Test: `test/advanced-layout.test.ts`

- [ ] **Step 1: Replace `renderSteps` with reference-style step cards**

Use a structure with:

```ts
`<section data-mpa-action-id="steps" style="margin:0 0 32px;">`
```

Each row must include:

```ts
`display:flex;gap:12px;align-items:stretch;margin-bottom:12px;`
`width:34px;height:34px;border-radius:10px;`
`width:2px;flex:1 1 auto;background:linear-gradient(${p.accentSofter}, transparent);`
`background:linear-gradient(180deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);`
```

Omit the connector on the last row.

- [ ] **Step 2: Replace `renderTimeline` with reference-style dot rail rows**

Each row must include:

```ts
`display:flex;gap:12px;align-items:flex-start;padding:0 0 16px;min-height:48px;`
`width:10px;height:10px;border-radius:999px;background:${p.accentDark};box-shadow:0 0 0 3px ${p.accentSoft};`
`flex:1;width:2px;background:${p.mutedBorder};margin-top:4px;min-height:20px;`
```

Omit the vertical continuation line on the last row.

- [ ] **Step 3: Replace `renderBridge` with reference-style side rail card**

The outer bridge must include:

```ts
`display:flex;align-items:stretch;gap:12px;margin:8px 0 30px;`
`width:3px;border-radius:999px;background:linear-gradient(180deg, ${p.accentDark}, ${p.accentSofter});`
```

The content card must use `padding:14px 15px`, `border-radius:12px`, and keep `label`, `title`, `body`, and `next`.

- [ ] **Step 4: Replace `renderMythFact` with reference-style paired cards**

Each row must use:

```ts
`display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin:0 0 12px;`
```

The left card renders `误区`; the right card renders `事实`.

- [ ] **Step 5: Adjust `renderManifesto` toward reference card rhythm**

Keep field support intact. Use a compact statement section and a `display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;` belief/against area. Preserve `believe`, `against`, and `note`.

- [ ] **Step 6: Run targeted tests**

Run:

```bash
npm test -- advanced-layout
```

Expected: process/comparison test passes; JSON structure test still fails until Task 3.

## Task 3: Align JSON-Backed Modules

**Files:**
- Modify: `src/converter/advanced-layout/renderers.ts`
- Test: `test/advanced-layout.test.ts`

- [ ] **Step 1: Replace `renderChangelog` with compact header and entry rows**

Use `div` elements in this module to match the reference structure. The header must include:

```ts
`font-variant-numeric:tabular-nums;`
```

Each item row must include a compact type badge and text content.

- [ ] **Step 2: Replace `renderComparisonTable` with two side-by-side cards**

Do not emit a `<table>` tag. The outer section must include:

```ts
`display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin:24px 0;`
```

Each side card must render the title and item rows.

- [ ] **Step 3: Replace `renderDefinition` with two-column definition card**

The outer section must use:

```ts
`display:flex;gap:12px;`
```

The term column must use:

```ts
`flex:0 0 30%;min-width:96px;`
```

- [ ] **Step 4: Replace `renderQuestion` with Q/A item cards**

Each item must include:

```ts
`data-mpa-action-id="question-item"`
```

Render one Q row and one A row with circular badges.

- [ ] **Step 5: Replace `renderQuoteCard` with centered quote card**

Use a centered layout, large quote mark, main quote text, and source badge. Preserve `author` and `source` by joining them when both exist.

- [ ] **Step 6: Replace `renderResourceList` with reference row structure**

Each item must include:

```ts
`data-mpa-action-id="resource-list-item"`
```

Render icon, title, description, and optional link in one horizontal row.

- [ ] **Step 7: Replace `renderStatRow` with separated grid cells**

Each cell must include:

```ts
`data-mpa-action-id="stat-row-cell"`
```

Use a 1px parent grid gap with `background:${p.mutedBorder}` and individual `background:${p.surface}` cells.

- [ ] **Step 8: Replace `renderTweet` with compact social card**

Use a 40px avatar, name, handle, body text, and optional footer metadata. Preserve avatar image rendering when `avatar` is provided.

- [ ] **Step 9: Run targeted tests**

Run:

```bash
npm test -- advanced-layout
```

Expected: all new structural tests pass.

## Task 4: Verify Showcase And Full Suite

**Files:**
- Read: `examples/advanced-layout-showcase.md`
- Generated output: `/tmp/wxp-current-showcase.html`

- [ ] **Step 1: Convert the showcase**

Run:

```bash
npm run dev -- convert --file examples/advanced-layout-showcase.md --theme default --output /tmp/wxp-current-showcase.html
```

Expected: JSON success output with `"theme": "default"`.

- [ ] **Step 2: Confirm required ids in generated HTML**

Run:

```bash
rg 'data-mpa-action-id="(question-item|resource-list-item|stat-row-cell|gallery|longimage)"' /tmp/wxp-current-showcase.html
```

Expected: matches for all five ids.

- [ ] **Step 3: Confirm no raw advanced fences leak**

Run:

```bash
rg ':::hero|:::gallery|:::longimage' /tmp/wxp-current-showcase.html
```

Expected: no matches and exit code 1.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: tests pass and build exits 0.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add test/advanced-layout.test.ts src/converter/advanced-layout/renderers.ts
git commit -m "fix: align advanced renderer with reference baseline"
```

Expected: commit succeeds with only the test and renderer files staged.

## Self-Review Notes

- The plan covers all modules identified in the design as materially different.
- `gallery` and `longimage` are aligned to the follow-up reference baseline while preserving `imageTag` for WeChat compatibility.
- No raw full-output snapshot is required; structural assertions are less brittle and still prove the important alignment points.
- The plan keeps parser, themes, and example article unchanged unless verification reveals a direct need.
