import { describe, expect, it } from "vitest"
import { convertMarkdown } from "../src/converter/index.js"
import { parseAdvancedLayoutBlocks } from "../src/converter/advanced-layout/parser.js"

const IMAGE_URL = "https://example.com/image.png"

const SAMPLE_MODULES = `:::hero
eyebrow: FEATURE
meta: 2026.03
kicker: Start
title: Module structure | Theme atmosphere
subtitle: A short subtitle
image: ${IMAGE_URL}
brand: wx-publisher
tags: docs | api
:::

:::cards[Cards]
PART 01 | Opening | Explain the point | accent
:::

:::metrics[Metrics]
Reuse | 34 modules | Works across themes | accent
:::

:::steps[Steps]
01 | Start | Put the conclusion first | Good for process summaries
:::

:::compare[Compare]
Before | Long explanations | After | Structured modules | accent
:::

:::timeline[Timeline]
2024 | Prototype | First local renderer
:::

:::infographic
eyebrow: Graphic
title: Make|one point|visible
subtitle: Short explanation
quote: One screen, one judgment.
note: Good for transitions
:::

:::audience-fit
title: Fit
fit: Long-form writers | Product teams
avoid: Short updates
:::

:::bridge
label: Next
title: Evidence should follow judgment
body: The next section carries proof.
next: Continue
:::

:::manifesto
label: Belief
title: Structure before decoration
body: Good layout clarifies meaning.
believe: Structure first | Text is the lead
against: Random templates | Visual noise
:::

:::myth-fact[Myth Fact]
More modules means better | Only useful modules should remain
:::

:::verdict
eyebrow: Verdict
title: Structure matters
body: Modules should solve reading tasks.
:::

:::people[People]
Editor | Strategy | Owns the article rhythm | accent
:::

:::cases[Cases]
Launch post | +38% completion | Clearer key points | accent
:::

:::pricing[Pricing]
Pro | ￥599 | Advanced modules / Brand writing | accent
:::

:::faq[FAQ]
Can old themes use this? | Yes.
:::

:::logos[Logos]
Northstar | Growth
:::

:::part
index: 01
title: Body joins the system
subtitle: TYPOGRAPHY
:::

:::label-title
label: Module
title: Split content into readable structure
:::

:::quote
eyebrow: Core
quote: Modules make judgment easier to find.
source: Design principle
note: Good for conclusions
:::

:::image-text
eyebrow: Demo
title: Image and text together
body: Keep screenshot and explanation together.
note: Good for product screenshots
image: ${IMAGE_URL}
alt: Demo image
:::

:::image-compare
eyebrow: Compare
title: Before and after
left_title: Before
left_image: ${IMAGE_URL}
right_title: After
right_image: ${IMAGE_URL}
note: Good for A/B comparison
:::

:::image-annotate
eyebrow: Annotate
title: Look here
note: Good for screenshots
image: ${IMAGE_URL}
alt: Annotated image
point: 01 | 24 | 24 | Main area | First thing readers see
:::

:::toc[TOC]
01 | Start | Explain the structure
:::

:::checklist[Checklist]
done | Structure ready | Key points are clear
pending | Add data | Fill missing proof
warn | Check links | Avoid broken flow
:::

:::toolbox[Tools]
Template | Planning template | Fast drafting | https://example.com
:::

:::specs[Specs]
Audience | Content teams | Good for long form
:::

:::image-steps[Steps]
01 | Open editor | Start with structure. | ${IMAGE_URL} | Screenshot note
:::

:::notice[Notice]
Good for | Tutorials | Structured content
Risk | Too many modules | Keep it focused
:::

:::dialogue[Dialogue]
User: Hello
AI: Hi there
:::

:::summary
eyebrow: Summary
highlight: Structure first
body: Theme can then carry atmosphere.
:::

:::author-card
name: Geek Journey
role: Builder
bio: Builds content tools.
tags: AI | Content
note: Follow for updates
link: https://example.com
:::

:::series
name: Notes
issue: 07
title: One brand voice
desc: A series about content systems.
tags: WeChat | Layout
next: Next article
:::

:::subscribe
label: Updates
title: Save this series
subtitle: More layout notes later.
primary: Follow
secondary: Share
note: Next up
:::

:::cta
title: Start with advanced modules.
note: BUILD WITH STRUCTURE
:::

:::callout[Callout]
Tip | Keep it focused | One module should solve one reading task
:::

:::changelog
{"version":"v2","date":"2026.05","added":["More modules"],"fixed":["Stable rendering"]}
:::

:::comparison-table
{"left":{"title":"Before","items":["Slow","Low clarity"]},"right":{"title":"After","items":["Fast","High clarity"]}}
:::

:::definition
{"term":"Advanced layout","def":"A structured expression layer.","termLabel":"Definition"}
:::

:::question
[{"q":"Why use modules?","a":"To make judgment and evidence easier to scan."}]
:::

:::quote-card
{"text":"Structure is a reading promise.","source":"Local publishing guide"}
:::

:::resource-list
[{"name":"Docs","url":"https://example.com","desc":"Syntax and examples","icon":"Guide"}]
:::

:::stat-row
[{"value":"43","label":"Modules","note":"Public set"},{"value":"40","label":"Themes","note":"Professional set"}]
:::

:::tweet
{"name":"Product Notes","handle":"@local","text":"A good article should be readable before it is decorative.","timestamp":"2026-05"}
:::

:::gallery[Gallery]
![A](${IMAGE_URL})
:::

:::longimage[Long Image]
![Long](${IMAGE_URL})
:::`

describe("advanced layout parser", () => {
  it("parses field and row directive blocks", () => {
    const parsed = parseAdvancedLayoutBlocks("before\n\n:::hero\ntitle: Hello\n:::\n\n:::cards[Title]\nA | B | C | accent\n:::")

    expect(parsed.modules).toHaveLength(2)
    expect(parsed.modules[0]).toMatchObject({
      name: "hero",
      fields: { title: "Hello" },
    })
    expect(parsed.modules[1]).toMatchObject({
      name: "cards",
      title: "Title",
      rows: [["A", "B", "C", "accent"]],
    })
  })

  it("does not treat Chinese colon fields as valid fields", () => {
    const parsed = parseAdvancedLayoutBlocks(":::hero\ntitle：Hello\n:::", { supportedModules: new Set(["hero"]) })

    expect(parsed.modules[0]?.fields).toEqual({})
    expect(parsed.modules[0]?.body).toContain("title：Hello")
  })

  it("keeps unknown directive blocks in markdown", () => {
    const parsed = parseAdvancedLayoutBlocks(":::unknown\ntitle: Hello\n:::", { supportedModules: new Set(["hero"]) })

    expect(parsed.markdown).toContain(":::unknown")
    expect(parsed.modules).toEqual([])
  })
})

describe("advanced layout conversion", () => {
  it("renders every documented sample module without leaking directive fences", async () => {
    const result = await convertMarkdown(SAMPLE_MODULES, { theme: "studio", stripLinks: false })

    const modules = [
      "hero", "cards", "metrics", "steps", "compare", "timeline",
      "infographic", "audience-fit", "bridge", "manifesto", "myth-fact",
      "verdict", "people", "cases", "pricing", "faq", "logos", "part",
      "label-title", "quote", "image-text", "image-compare", "image-annotate",
      "toc", "checklist", "toolbox", "specs", "image-steps", "notice",
      "dialogue", "summary", "author-card", "series", "subscribe", "cta",
      "callout", "changelog", "comparison-table", "definition", "question",
      "quote-card", "resource-list", "stat-row", "tweet", "gallery", "longimage",
    ]

    for (const module of modules) {
      expect(result.html).toContain(`data-mpa-action-id="${module}"`)
    }
    expect(result.html).not.toContain(":::hero")
    expect(result.html).not.toContain("<script")
    expect(result.externalImages).toContain(IMAGE_URL)
    expect(result.html).toContain("More modules")
    expect(result.html).toContain("Advanced layout")
    expect(result.html).toContain("Why use modules?")
    expect(result.html).toContain("Structure is a reading promise.")
    expect(result.html).toContain("Syntax and examples")
    expect(result.html).toContain("Public set")
    expect(result.html).toContain("A good article should be readable before it is decorative.")
  })

  it("renders formerly aliased modules as first-class modules", async () => {
    const result = await convertMarkdown(`:::steps[Steps]\n01 | Do it | Follow the path | ${IMAGE_URL} | Note\n:::\n\n:::compare\nleft_title: Old\nleft_image: ${IMAGE_URL}\nright_title: New\nright_image: ${IMAGE_URL}\n:::\n\n:::bridge\ntitle: Bridge title\nbody: Connect sections.\n:::\n\n:::manifesto\ntitle: Believe this\nbody: A memorable position.\n:::`, { theme: "studio" })

    expect(result.html).toContain('data-mpa-action-id="steps"')
    expect(result.html).toContain('data-mpa-action-id="compare"')
    expect(result.html).toContain('data-mpa-action-id="bridge"')
    expect(result.html).toContain('data-mpa-action-id="manifesto"')
  })

  it("keeps enhanced image modules rendered instead of copying competitor placeholders", async () => {
    const result = await convertMarkdown(
      `:::gallery[Gallery]\n![A](${IMAGE_URL})\n:::\n\n:::longimage[Long]\n![Long](${IMAGE_URL})\n:::`,
      { theme: "studio" },
    )

    expect(result.html).toContain('data-mpa-action-id="gallery"')
    expect(result.html).toContain('data-mpa-action-id="longimage"')
    expect(result.html).toContain('class="rich_pages wxw-img"')
    expect(result.html).not.toContain("[IMAGE:")
  })

  it("matches competitor structure for process and comparison modules", async () => {
    const result = await convertMarkdown(
      `:::steps[Steps]\n01 | Start | Body | Note\n02 | Continue | More body | More note\n:::\n\n:::timeline[Timeline]\nStage 1 | Build | First pass\nStage 2 | Verify | Second pass\n:::\n\n:::bridge\nlabel: Next\ntitle: Evidence follows judgment\nbody: The next section carries proof.\nnext: Continue\n:::\n\n:::myth-fact[Myth Fact]\nMore modules means better | Useful modules should remain\n:::`,
      { theme: "studio", stripLinks: false },
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

  it("matches competitor structure for JSON-backed modules", async () => {
    const result = await convertMarkdown(
      `:::changelog\n{"version":"v2","date":"2026.05","added":["More modules"],"fixed":["Stable rendering"]}\n:::\n\n:::comparison-table\n{"left":{"title":"Before","items":["Slow"]},"right":{"title":"After","items":["Fast"]}}\n:::\n\n:::definition\n{"term":"Advanced layout","def":"A structured expression layer.","termLabel":"Definition"}\n:::\n\n:::question\n[{"q":"Why use modules?","a":"To make judgment easier to scan."}]\n:::\n\n:::quote-card\n{"text":"Structure is a reading promise.","source":"Guide"}\n:::\n\n:::resource-list\n[{"name":"Docs","url":"https://example.com","desc":"Syntax and examples","icon":"Guide"}]\n:::\n\n:::stat-row\n[{"value":"43","label":"Modules","note":"Public set"}]\n:::\n\n:::tweet\n{"name":"Product Notes","handle":"@local","text":"Readable before decorative.","timestamp":"2026-05"}\n:::`,
      { theme: "studio", stripLinks: false },
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

  it("renders GFM alerts and styled footnotes", async () => {
    const markdown = `> [!NOTE]\n> **提示**: remember this\n>\n> Second paragraph\n\nFootnote here[^1].\n\n[^1]: Footnote body`
    const result = await convertMarkdown(markdown, { theme: "studio", stripLinks: false })

    expect(result.html).toContain("markdown-alert-note")
    expect(result.html).toContain("<strong")
    expect(result.html).toContain("Second paragraph")
    expect(result.html).toContain("引用链接")
    expect(result.html).not.toContain("Footnotes")
    expect(result.html).toContain("[1]")
  })

  it("removes unsafe Markdown links and images when links are preserved", async () => {
    const result = await convertMarkdown(
      `[bad](javascript:alert(1))\n\n[data](data:text/html,<svg>)\n\n![x](javascript:alert(1))\n\n[ok](https://example.com/path)\n\n![ok](./local.png)`,
      { theme: "studio", stripLinks: false },
    )

    expect(result.html).not.toContain("javascript:")
    expect(result.html).not.toContain("data:text/html")
    expect(result.html).toContain('href="https://example.com/path"')
    expect(result.html).toContain("[图片已移除: x]")
    expect(result.localImages).toContain("./local.png")
  })

  it("sanitizes and collects Markdown links and images inside GFM alerts", async () => {
    const result = await convertMarkdown(
      `> [!NOTE]\n> [bad](javascript:alert(1))\n> ![bad](javascript:alert(1))\n> [ok](https://example.com/path)\n> ![ok](./alert-local.png)`,
      { theme: "studio", stripLinks: false },
    )

    expect(result.html).not.toContain("javascript:")
    expect(result.html).toContain('href="https://example.com/path"')
    expect(result.html).toContain("[图片已移除: bad]")
    expect(result.localImages).toContain("./alert-local.png")
  })

  it("strips Markdown links inside GFM alerts by default", async () => {
    const result = await convertMarkdown(
      `> [!NOTE]\n> [ok](https://example.com/path)`,
      { theme: "studio" },
    )

    expect(result.html).not.toContain('href="https://example.com/path"')
    expect(result.html).toContain("ok")
  })

  it("does not render protocol-relative advanced module image URLs", async () => {
    const result = await convertMarkdown(
      `:::hero\ntitle: Unsafe image\nimage: //cdn.example.com/unsafe.png\n:::`,
      { theme: "studio" },
    )

    expect(result.html).not.toContain("//cdn.example.com/unsafe.png")
    expect(result.externalImages).not.toContain("//cdn.example.com/unsafe.png")
  })

  it("does not let user text collide with advanced block markers", async () => {
    const result = await convertMarkdown(
      `WXP_ADVANCED_LAYOUT_BLOCK_0\n\n:::summary\neyebrow: Summary\nhighlight: Safe marker\nbody: Only one rendered block.\n:::\n\nWXP_ADVANCED_LAYOUT_BLOCK_0`,
      { theme: "studio" },
    )

    expect(result.html.match(/data-mpa-action-id="summary"/g)).toHaveLength(1)
    expect(result.html.match(/WXP_ADVANCED_LAYOUT_BLOCK_0/g)).toHaveLength(2)
  })

  it("collects raw image URLs from image-steps rows", async () => {
    const rowImage = "https://example.com/image-steps-only.png"
    const result = await convertMarkdown(`:::image-steps[Steps]\n01 | Open | Body | ${rowImage} | Note\n:::`, { theme: "studio" })

    expect(result.externalImages).toContain(rowImage)
  })
})
