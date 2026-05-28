---
name: wechat-article-design
description: Low-level tools for producing, validating, previewing, and drafting WeChat Official Account article HTML. Use when a caller already owns editorial direction and wants to generate final inline-styled WeChat HTML directly.
---

# WeChat Article Design

This skill provides bottom-layer tooling for producing WeChat-compatible article HTML. It is for callers who already own the editorial direction and need final, publishable HTML that can be validated, previewed, and drafted through the skill script interface.

This skill does not define an editorial workflow. The caller owns article understanding, creative direction, layout decisions, cover generation, and publish decisions.

## Required Reading

Before generating HTML, read `references/wechat-html-constraints.md`.

Use the other references as needed:

- `references/rendering-toolkit.md` for the preferred HTML-first rendering path and optional helper functions.
- `references/publishing-api.md` for credential sources, cover/image upload behavior, draft creation, and dry-run behavior.

## Core Path

The main path is HTML-first:

```bash
node skills/wechat-article-design/scripts/validate-wechat-html.mjs --file rendered.html
node skills/wechat-article-design/scripts/preview-wechat-html.mjs --file rendered.html --output preview.html
node skills/wechat-article-design/scripts/publish-wechat-draft.mjs --html rendered.html --cover /path/to/cover.jpg --title "Article title"
```

Always run validation before creating a draft.

## Artifact Rules

The publishable artifact is ordinary HTML with all visual styling inline.

Do not rely on:

- External CSS
- Class selectors
- Scripts
- Iframes
- External fonts

`render-wechat-article.mjs` is optional only. Use it when it helps produce `rendered.html`, but do not treat it as the required workflow.

Publishing creates a WeChat draft only. It does not publish the article.
