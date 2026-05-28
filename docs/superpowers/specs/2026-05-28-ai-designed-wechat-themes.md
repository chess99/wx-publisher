# AI-Designed WeChat Themes

## Goal

Allow AI-driven callers to design WeChat article presentation without being limited to a small set of built-in `wxp` themes.

The design has two stages:

1. Add external theme file support to `wxp` as a stable fallback path.
2. Add an experimental root-level skill that provides lower-level WeChat article rendering, validation, preview, and draft publishing tools for callers that want more creative freedom.

These stages must be implemented as separate commits.

## Context

`wx-publisher` currently owns the stable publishing pipeline:

- Markdown to WeChat-compatible HTML conversion.
- Inline styles for all rendered nodes.
- Link downgrading.
- Local and remote image detection and upload.
- Cover upload.
- Draft creation through the WeChat API.
- JSON output for automation.

The blog workflow in `/Users/zcs/code2/blog` already owns editorial decisions, cover generation, channel adaptation, and publishing orchestration. A caller AI has already proven it can understand the current `Theme.styles` structure by adding the `warm-tech` theme for a specific article. That proves external AI-generated themes are viable.

The current friction is that article-specific design requires either choosing one of a few built-in themes or changing `src/converter/themes.ts`. Changing source is sometimes fine, but installed/open-source users may not have or want a source checkout. `wxp` should expose a theme-file interface for that case.

## Boundary

`wxp` remains a stable CLI tool. It should not become a high-creativity article design environment. Its stable responsibilities are conversion, compatibility, image handling, WeChat API calls, validation, preview, and JSON contracts.

The experimental creative path lives outside `wxp` as a skill. The skill provides reusable tooling and WeChat compatibility knowledge, but does not prescribe editorial workflow. Upstream callers decide article interpretation, visual direction, creative layout, cover generation, and publish timing.

## Stage 1: External Theme Files

Stage 1 adds support for using a JSON theme file whose shape mirrors the existing internal `Theme` type.

### CLI

Add `--theme-file <path>` to:

```bash
wxp convert --file article.md --theme-file theme.json --output preview.html
wxp publish --file article.md --theme-file theme.json --cover cover.jpg --title "..."
wxp preview --file article.md --theme-file theme.json
```

Add a `theme` command group:

```bash
wxp theme validate --file theme.json
wxp theme schema
```

Update `wxp capabilities` to describe:

- External theme file support.
- The JSON schema summary.
- Commands that accept `--theme-file`.
- Validation behavior.

### Theme Format

The file format is the external JSON form of the current `Theme`:

```json
{
  "name": "article-specific-theme",
  "description": "为某篇文章设计的公众号主题",
  "styles": {
    "wrapper": "...",
    "h1": "...",
    "h2": "...",
    "h3": "...",
    "h4": "...",
    "p": "...",
    "strong": "...",
    "em": "...",
    "code": "...",
    "pre": "...",
    "preCode": "...",
    "blockquote": "...",
    "ul": "...",
    "ol": "...",
    "li": "...",
    "hr": "...",
    "img": "...",
    "a": "...",
    "table": "...",
    "th": "...",
    "td": "..."
  }
}
```

All `NodeStyles` fields are required. This keeps rendering deterministic and prevents silent fallback from hiding malformed AI output.

### Resolution Rules

`--theme-file` and `--theme` are mutually exclusive for `convert` and `publish`.

For `preview`, `--theme-file` adds the external theme to the preview result set. Built-in themes should still render unless a future implementation deliberately adds a separate `--only-theme-file` option.

If neither `--theme-file` nor `--theme` is passed, existing default theme behavior remains unchanged.

### Validation

`wxp theme validate` returns JSON and exits non-zero for errors.

Errors:

- Missing `name`, `description`, or `styles`.
- Any required `NodeStyles` key is missing.
- Any style value is not a string.
- Obvious dangerous content such as `<script`, `javascript:`, or event-handler-like HTML fragments.

Warnings:

- Unknown fields.
- CSS that is likely to fail or behave poorly in WeChat, such as external fonts, complex animations, fixed positioning, and overly large fixed widths.

Warnings do not block conversion or publishing. Errors do.

### Documentation

Update `README.md` and `AGENTS.md` with:

- A minimal `theme.json` example.
- `convert`, `preview`, `publish`, `theme validate`, and `theme schema` examples.
- JSON output expectations.

The docs should only describe the external theme-file capability. They should not tell callers whether to modify source or add built-in themes.

### Tests

Add focused tests for:

- Loading a valid theme file.
- Rejecting missing required style fields.
- Rejecting dangerous content.
- Returning warnings for unknown fields and high-risk CSS.
- `convert --theme-file` uses the external theme.
- `publish --theme-file` passes the external theme into conversion without changing existing image and draft behavior. Use mocks/stubs if needed.
- `preview --theme-file` includes the external theme in preview results.

## Stage 2: WeChat Article Design Skill

Stage 2 adds an experimental root-level skill:

```text
skills/wechat-article-design/
├── SKILL.md
├── scripts/
│   ├── render-wechat-article.mjs
│   ├── validate-wechat-html.mjs
│   ├── preview-wechat-html.mjs
│   └── publish-wechat-draft.mjs
├── references/
│   ├── wechat-html-constraints.md
│   ├── rendering-toolkit.md
│   └── publishing-api.md
└── examples/
    ├── minimal-render.mjs
    ├── article.md
    └── rendered.html
```

This skill is a lower-level toolkit and knowledge package. It does not define an editorial process and does not require callers to write a design brief. Upstream workflows decide creative direction and orchestration.

### Skill Responsibilities

`SKILL.md` explains:

- The skill provides tools for WeChat-compatible article HTML rendering, validation, preview, and draft creation.
- Upstream callers own article understanding, creative direction, layout decisions, cover generation, and publish decisions.
- The final publishable artifact is WeChat-compatible HTML.
- Publishing only creates a draft. It never directly publishes.

### Scripts

`render-wechat-article.mjs`:

- Exposes reusable rendering utilities and a CLI entry.
- Can parse Markdown or accept caller-produced intermediate HTML/sections.
- Helps with HTML escaping, style assembly, code highlighting, image collection, and WeChat-safe output.
- Allows caller-defined rendering strategy instead of forcing the current `wxp` converter shape.

`validate-wechat-html.mjs`:

- Checks dangerous tags and attributes.
- Checks script, iframe, external CSS, inline event handlers, empty links, unresolved local images, and high-risk CSS.
- Checks list and code-block structures that often break in WeChat.
- Outputs JSON with errors and warnings.

`preview-wechat-html.mjs`:

- Wraps rendered HTML in a local preview page.
- Does not require WeChat credentials.

`publish-wechat-draft.mjs`:

- Accepts already-rendered HTML, title, author, cover path or URL, and image upload options.
- Uploads cover and article images where needed.
- Creates a WeChat draft.
- Uses the same success/error JSON contract style as `wxp`.

### Implementation Language

Use JavaScript/Node for the skill scripts. The existing project is Node-based, the Markdown/HTML AST ecosystem is strong, and the WeChat client logic can be reused or adapted cleanly.

### Relationship to `wxp`

The skill is independent from the stable `wxp` path. It may reuse implementation ideas or small utilities from `wxp`, but it should not require changing `wxp` for every creative experiment.

If the skill path fails validation or produces unsatisfactory output, callers can fall back to Stage 1: generate a `theme.json` and use `wxp --theme-file`.

### Tests

Add focused tests or fixture checks for:

- Minimal render example produces non-empty HTML.
- Validation catches dangerous tags and event attributes.
- Validation catches unresolved local images.
- Preview generation writes a standalone HTML file.
- Draft publishing command can be tested with mocked WeChat API calls or a dry-run mode.

## Rollout

Implementation should use two commits:

1. `feat: support external theme files`
2. `feat: add wechat article design skill`

Stage 1 should be usable independently. Stage 2 should not regress or replace Stage 1.

## Non-Goals

- Do not add arbitrary HTML template support to `wxp` in Stage 1.
- Do not add controlled structure slots to `wxp` in this design.
- Do not make the skill responsible for editorial workflow.
- Do not directly publish articles to WeChat; draft creation remains the final automated action.
