# Reference Advanced Renderer Alignment Design

## Context

The pasted attachments are reference renderer outputs for `examples/advanced-layout-showcase.md` using the baseline visual language. The first attachment at `/Users/zcs/.codex/attachments/71c0aaa6-befa-4ac5-af00-6ac3685a42d0/pasted-text.txt` covered the public advanced modules. The follow-up attachment at `/Users/zcs/.codex/attachments/8277d153-3a06-43bc-9342-b32a56604287/pasted-text.txt` confirms that the reference also renders `gallery` and `longimage`. Current `wxp` conversion already renders every documented public advanced module and the enhanced image modules, but several module templates differ from the reference's structure.

This work aligns `wxp` advanced block rendering with the reference baseline where the reference output is structurally sound. It intentionally keeps `wxp` behavior where the reference has visible bugs, missing support, or worse user experience.

## Baseline Evidence

The reference output contains these public module ids:

`hero`, `cards`, `metrics`, `steps`, `compare`, `timeline`, `infographic`, `audience-fit`, `bridge`, `manifesto`, `myth-fact`, `verdict`, `people`, `cases`, `pricing`, `faq`, `logos`, `part`, `label-title`, `quote`, `image-text`, `image-compare`, `image-annotate`, `toc`, `checklist`, `toolbox`, `specs`, `image-steps`, `notice`, `callout`, `changelog`, `comparison-table`, `definition`, `question`, `quote-card`, `resource-list`, `stat-row`, `tweet`, `dialogue`, `summary`, `author-card`, `series`, `subscribe`, `cta`, `gallery`, `longimage`.

It also emits child ids for richer JSON-backed modules:

- `question-item`
- `resource-list-item`
- `stat-row-cell`

The follow-up reference output emits `gallery` as a horizontal scroll-snap image carousel and `longimage` as an accent card with a constrained vertical scroll container. These are valid baseline structures. `wxp` should match their visual structure while preserving its safer image tag generation for WeChat compatibility and image URL sanitization.

## Alignment Rules

Use the reference output as the default baseline for public advanced modules:

- Preserve `data-mpa-action-id` names and add reference child ids where useful.
- Match the reference's structural intent: timeline rails, side accent blocks, two-column comparison cards, compact JSON cards, and icon-like badges.
- Keep the existing Studio palette values unless the reference reveals a specific missing state. The palette already matches the pasted baseline closely.
- Continue outputting inline styles only; no external CSS or runtime JavaScript.
- Preserve existing sanitization, image URL collection, and Markdown conversion behavior.

Use optimized `wxp` behavior instead of copying the reference when:

- The reference uses a tag or behavior that hurts WeChat compatibility or reader experience.
- The reference has duplicated or internally contradictory style declarations where the simpler current style achieves the same visual result.

## Module Decisions

### Already Close Enough

These modules already match the reference's structure closely enough that the first implementation pass should not rewrite them:

`hero`, `cards`, `metrics`, `audience-fit`, `verdict`, `people`, `cases`, `pricing`, `faq`, `logos`, `part`, `label-title`, `quote`, `image-text`, `image-compare`, `image-annotate`, `toc`, `checklist`, `toolbox`, `specs`, `image-steps`, `notice`, `summary`, `author-card`, `series`, `cta`.

### Public Modules To Align

The first renderer pass should align these public modules:

- `steps`: change from simple stacked border rows to numbered square badges with vertical connector lines and card bodies.
- `timeline`: change from a two-column grid to a flex rail with dot markers, stage chips, and content body.
- `bridge`: change from a full card with horizontal rule to a side accent rail plus nested content card.
- `manifesto`: reduce the current large gradient card into the reference's more modular statement plus belief/against blocks.
- `myth-fact`: change from stacked single-column myth/fact rows to paired two-column comparison cards.

The second renderer pass should align JSON-heavy modules:

- `changelog`: render a compact version/date header and per-entry rows, using the reference's badge structure.
- `comparison-table`: render two side-by-side cards rather than a table, because the reference uses cards and this is easier to scan on WeChat mobile.
- `definition`: render a left term/label column plus right definition column.
- `question`: add `data-mpa-action-id="question-item"` and use Q/A badge rows.
- `quote-card`: use centered quote-card styling with a small source badge.
- `resource-list`: add `data-mpa-action-id="resource-list-item"` and use icon blocks, text, and link affordance in a single row.
- `stat-row`: add `data-mpa-action-id="stat-row-cell"` and use a grid separated by a 1px border background.
- `tweet`: use compact avatar/name/meta/text/footer card structure.

### Enhanced Image Modules

Align `gallery` and `longimage` with the follow-up reference baseline:

- `gallery`: render a horizontal carousel with `scroll-snap-type`, padded image cards, a fixed `4/3` image frame, per-image captions from Markdown alt text, and the module title below the carousel.
- `longimage`: render an accent outer card, a `longimage-scroll-container` with `max-height:420px` plus `max-height:min(75vh,600px)`, and the module title as a bottom strip.
- Keep `imageTag` output instead of the reference's plain gallery `<img>` tag so images continue to receive WeChat-compatible attributes and URL sanitization.
- Do not copy the reference's inline `<style>` block for scrollbar pseudo-elements; inline styles are safer for WeChat rich text.

### Optimized Exceptions

For `subscribe`, keep the current non-button markup unless a later WeChat draft check proves `<button>` is accepted and better. The reference uses button-like markup, but static spans are safer in copied WeChat rich text and preserve the same visual role.

For `dialogue`, keep the current lightweight wrapper structure. The reference output wraps the same chat bubbles in repeated `mpa-from-tpl` / template sections. That metadata does not improve the rendered reader experience, increases HTML size, and is unnecessary for local conversion.

## Testing Strategy

Tests should avoid brittle full-HTML snapshots. Instead, they should assert structural invariants that prove alignment:

- Public module ids remain present.
- `gallery` and `longimage` include the reference carousel and scroll-container structure while still using `imageTag`.
- `steps` contains connector-oriented step structure.
- `timeline` uses rail/dot layout instead of grid columns.
- `myth-fact` uses paired columns.
- JSON modules emit the reference child ids.
- `comparison-table` no longer emits a `<table>` for the advanced module.
- `subscribe` remains non-button until explicitly changed.

Conversion verification must use:

```bash
npm run dev -- convert --file examples/advanced-layout-showcase.md --theme default --output /tmp/wxp-current-showcase.html
```

Regression verification must include:

```bash
npm test -- advanced-layout
npm test
npm run build
```

## Success Criteria

The work is complete only when:

- Every public advanced module either structurally matches the reference baseline or is documented as an optimized exception.
- `gallery` and `longimage` match the follow-up reference baseline structure while still rendering real image modules.
- The full showcase conversion emits no raw advanced directive fences.
- The generated HTML includes the reference child ids for `question`, `resource-list`, and `stat-row`.
- The targeted and full verification commands pass.
- The renderer changes and any example or doc changes are committed in scoped commits.
