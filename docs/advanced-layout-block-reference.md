# Advanced Layout Block Reference

This is the local field map for advanced layout blocks. It is written as an implementation reference for examples, tests, and future renderer work.

The runtime source of truth for supported names is `src/converter/advanced-layout/parser.ts`. The canonical runnable article is `examples/advanced-layout-showcase.md`.

## Syntax Rules

- Field blocks use `:::name`, one `field: value` per line, then `:::`.
- Row blocks can use `:::name[title]`, one data row per line, and `|` between columns.
- Markdown body blocks keep Markdown image syntax inside the block body.
- Unknown blocks are left as normal Markdown. Known blocks should be represented in the showcase file.
- Keep one block focused on one reading task. Do not use a heavy block when a heading and paragraph would be clearer.

## Opening Blocks

| Block | Type | Field order | Minimum | Recommended use | Common failure |
| --- | --- | --- | --- | --- | --- |
| `hero` | fields | `eyebrow`, `meta`, `kicker`, `title`, `subtitle`, `image`, `brand`, `tags` | `title` | First-screen lead for a major article, release, or guide. | Using it multiple times in one article. |
| `cards` | rows | label, title, body, variant | one 3-column row | Show 2-4 major sections or takeaways near the top. | Turning every paragraph into a card. |
| `toc` | rows | index, title, body | one 3-column row | Help readers navigate a long article. | Adding it to a short note with no real sections. |
| `part` | fields | `index`, `title`, `subtitle` | `index`, `title` | Mark a major article section. | Using it for every small subsection. |
| `label-title` | fields | `label`, `title` | `title` | Lighter section opener with a label. | Replacing every normal heading with it. |

## Infographic Blocks

| Block | Type | Field order | Minimum | Recommended use | Common failure |
| --- | --- | --- | --- | --- | --- |
| `metrics` | rows | label, value, body, variant | one 3-column row | Present key numbers or compact outcomes. | Putting long explanations in the value column. |
| `steps` | rows | index, title, body, note | one 3-column row | Explain a process in order. | Mixing unrelated tasks into one sequence. |
| `compare` | rows | left title, left body, right title, right body, variant | one 4-column row | Contrast old/new, before/after, or option A/B. | Leaving one side empty or weaker than the other. |
| `timeline` | rows | time, title, body | one 3-column row | Show a chronological path or roadmap. | Using vague time labels that do not create order. |
| `infographic` | fields | `type`, `eyebrow`, `title`, `subtitle`, `quote`, `note`, `layout` | `title` | Make one central judgment visually prominent. | Trying to make it carry many unrelated facts. |

## Judgment Blocks

| Block | Type | Field order | Minimum | Recommended use | Common failure |
| --- | --- | --- | --- | --- | --- |
| `audience-fit` | fields | `title`, `fit`, `avoid` | `title`, one list | Qualify who should keep reading. | Writing generic lists that fit everyone. |
| `bridge` | fields | `label`, `title`, `body`, `next` | `title` | Transition from judgment to evidence or next section. | Using it as decoration with no narrative turn. |
| `manifesto` | fields | `label`, `title`, `body`, `believe`, `against`, `note` | `title` | State durable principles or positioning. | Turning it into a company bio. |
| `myth-fact` | rows | myth, fact | one 2-column row | Correct a misconception directly. | Making the fact just another opinion. |
| `verdict` | fields | `eyebrow`, `title`, `body` | `title` | State the final judgment or main point. | Hiding the real conclusion in the body. |

## Evidence Blocks

| Block | Type | Field order | Minimum | Recommended use | Common failure |
| --- | --- | --- | --- | --- | --- |
| `quote` | fields | `eyebrow`, `quote`, `source`, `note` | `quote` | Highlight a conclusion, excerpt, or principle. | Using it for ordinary body copy. |
| `image-text` | fields | `layout`, `eyebrow`, `title`, `body`, `note`, `image`, `alt` | `title`, `image` | Keep a screenshot and explanation together. | Using an image that does not support the text. |
| `image-compare` | fields | `eyebrow`, `title`, `left_title`, `left_image`, `right_title`, `right_image`, `note` | two images | Compare visual states or alternatives. | Comparing images with no meaningful difference. |
| `image-annotate` | fields | `eyebrow`, `title`, `note`, `image`, `alt`, repeated `point` | `image`, one point | Explain important regions in a screenshot or poster. | Placing too many points on one image. |
| `image-steps` | rows | index, title, body, image, note | one 4-column row | Combine operation steps with screenshots. | Omitting images and duplicating `steps`. |

## Conversion Blocks

| Block | Type | Field order | Minimum | Recommended use | Common failure |
| --- | --- | --- | --- | --- | --- |
| `checklist` | rows | status, title, body | one 3-column row | Show completion state, risks, or preflight checks. | Using unsupported status labels instead of `done`, `pending`, or `warn`. |
| `toolbox` | rows | label, title, body, link | one 3-column row | Collect tools, templates, links, and references. | Listing resources with no selection logic. |
| `specs` | rows | label, value, body | one 3-column row | Present parameters, scope, or product facts. | Writing long paragraphs in the value column. |
| `notice` | rows | label, value, body | one 3-column row | Show fit, preconditions, risks, and limits. | Mixing notices with unrelated marketing copy. |
| `cases` | rows | name, metric, body, variant | one 3-column row | Present proof through examples or outcomes. | Claiming results without a concrete metric or observation. |
| `pricing` | rows | name, price, items, variant | one 3-column row | Compare packages or plan levels. | Using it where there is no offer or plan structure. |
| `faq` | rows | question, answer | one 2-column row | Answer objections near the end of a piece. | Adding questions nobody would ask. |
| `logos` | rows | name, body | one 2-column row | Show partners, tools, or related entities. | Treating logo rows as evidence without context. |
| `summary` | fields | `eyebrow`, `highlight`, `body` | `highlight` | Condense the article's takeaway near the end. | Repeating the intro without adding closure. |
| `cta` | fields | `title`, `note` | `title` | Land the next action clearly. | Asking for too many actions at once. |

## Brand Blocks

| Block | Type | Field order | Minimum | Recommended use | Common failure |
| --- | --- | --- | --- | --- | --- |
| `people` | rows | name, role, body, variant | one 3-column row | Introduce people, roles, or stakeholders. | Adding names that do not matter to the article. |
| `author-card` | fields | `name`, `role`, `bio`, `tags`, `note`, `link` | `name` | Close with author or team identity. | Making the card longer than the article ending. |
| `series` | fields | `name`, `issue`, `title`, `desc`, `tags`, `next` | `name`, `title` | Anchor a recurring column or sequence. | Using it for a one-off post. |
| `subscribe` | fields | `label`, `title`, `subtitle`, `primary`, `secondary`, `note` | `title` | Encourage following, saving, or sharing. | Competing with a separate `cta` for attention. |

## Sprint Blocks

| Block | Type | Field order | Minimum | Recommended use | Common failure |
| --- | --- | --- | --- | --- | --- |
| `callout` | rows | type, title, body | one 3-column row | Highlight a tip, warning, or important note. | Replacing all normal paragraphs with callouts. |
| `changelog` | fields or rows | `title`, `version`, `date`, or change type and body rows | one change | Show release changes or iteration notes. | Mixing product changes with unrelated commentary. |
| `comparison-table` | fields and rows | `columns`, then table rows | `columns`, one row | Compare multiple attributes compactly. | Creating a table too wide for phone reading. |
| `definition` | fields | `label`, `term`, `body`, `note` | `term`, `body` | Define a key term or concept. | Defining terms that are already obvious. |
| `question` | fields | `title`, `body` | `title` | Raise a strategic or reflective question. | Using it as a generic heading. |
| `quote-card` | fields | `quote`, `source` | `quote` | Show a compact quote with stronger framing. | Repeating the same point as a nearby `quote`. |
| `resource-list` | rows | type, title, body, link | one 3-column row | Curate documents, tools, or next reads. | Listing unvetted links. |
| `stat-row` | rows | label, value, body | one 3-column row | Show several compact stats in one row group. | Using it for verbose explanations. |
| `tweet` | fields | `author`, `handle`, `body`, `note` | `body` | Present a short social-style observation or testimonial. | Using real social attribution without permission. |

## Enhanced Blocks

| Block | Type | Field order | Minimum | Recommended use | Common failure |
| --- | --- | --- | --- | --- | --- |
| `dialogue` | dialogue body | `role: content` per line | one role line | Show interviews, support exchanges, or teaching conversations. | Mixing Chinese and English colon rules inconsistently in generated content. |
| `gallery` | Markdown body | Markdown image lines | one image | Show a small image set. | Using large, unrelated images that slow review. |
| `longimage` | Markdown body | one Markdown image | one image | Wrap a tall image for long-form visual material. | Putting many images inside a long-image block. |

## Showcase Coverage

The showcase article should contain every block listed above. The current test coverage checks that:

- every supported block name appears in `examples/advanced-layout-showcase.md`;
- conversion removes raw directive fences from rendered HTML;
- rendered output contains each block's `data-mpa-action-id`;
- alerts, footnotes, and external images still work in the same example.

When adding a new block, update this reference, update the showcase, and update the tests in the same iteration.
