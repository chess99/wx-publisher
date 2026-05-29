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
      "hero", "cards", "metrics", "infographic", "audience-fit", "verdict",
      "people", "cases", "pricing", "faq", "logos", "part", "label-title",
      "quote", "image-text", "image-compare", "image-annotate", "toc",
      "checklist", "toolbox", "specs", "image-steps", "notice", "dialogue",
      "summary", "author-card", "series", "subscribe", "cta", "gallery",
      "longimage",
    ]

    for (const module of modules) {
      expect(result.html).toContain(`data-mpa-action-id="${module}"`)
    }
    expect(result.html).not.toContain(":::hero")
    expect(result.html).not.toContain("<script")
    expect(result.externalImages).toContain(IMAGE_URL)
  })

  it("renders documented advanced layout aliases", async () => {
    const result = await convertMarkdown(`:::steps[Steps]\n01 | Do it | Follow the path | ${IMAGE_URL} | Note\n:::\n\n:::compare\nleft_title: Old\nleft_image: ${IMAGE_URL}\nright_title: New\nright_image: ${IMAGE_URL}\n:::\n\n:::bridge\ntitle: Bridge title\nbody: Connect sections.\n:::\n\n:::manifesto\ntitle: Believe this\nbody: A memorable position.\n:::`, { theme: "studio" })

    expect(result.html).toContain('data-mpa-action-id="image-steps"')
    expect(result.html).toContain('data-mpa-action-id="image-compare"')
    expect(result.html).toContain('data-mpa-action-id="summary"')
    expect(result.html).toContain('data-mpa-action-id="quote"')
  })

  it("renders GFM alerts and styled footnotes", async () => {
    const markdown = `> [!NOTE]\n> **提示**: remember this\n\nFootnote here[^1].\n\n[^1]: Footnote body`
    const result = await convertMarkdown(markdown, { theme: "studio", stripLinks: false })

    expect(result.html).toContain("markdown-alert-note")
    expect(result.html).toContain("引用链接")
    expect(result.html).not.toContain("Footnotes")
    expect(result.html).toContain("[1]")
  })
})
