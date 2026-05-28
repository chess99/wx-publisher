# WeChat HTML Constraints

Generate ordinary HTML that can survive WeChat Official Account rendering. Treat the final HTML as a self-contained article body, not a web app.

## Required Practices

- Put visual styling inline on each element with the `style` attribute.
- Use simple structural tags such as `section`, `p`, `h1`, `h2`, `h3`, `blockquote`, `ul`, `ol`, `li`, `strong`, `em`, `code`, `pre`, `img`, `hr`, `span`, and `a`.
- Prefer nested `section` blocks for layout structure.
- Keep layout single-column and mobile-first.
- Use fixed, conservative content widths only when needed; avoid desktop-centric layouts.
- Use WeChat-safe CSS properties such as color, background, border, border-radius, padding, margin, font-size, line-height, font-weight, text-align, display, width, max-width, box-sizing, and vertical-align.
- Use absolute image URLs or image sources that the publishing tool can upload and rewrite.
- Include explicit `alt` text for meaningful images.
- Use readable paragraph rhythm: practical line height, clear spacing, and enough contrast.
- Make code blocks readable with inline styles on `pre` and `code`.
- Validate the rendered HTML before attempting to create a draft.

## Avoid

- External stylesheets or `<style>` blocks.
- Class selectors, ID selectors, or styling that depends on CSS cascade.
- JavaScript, event handlers, scripts, canvas, SVG scripting, or dynamic behavior.
- Iframes, embedded widgets, forms, video players, or unsupported interactive elements.
- External fonts or font loading.
- Complex layout systems such as CSS grid, flex-heavy arrangements, absolute positioning, sticky positioning, or viewport-based compositions.
- Hover-only states or interactions that require a desktop pointer.
- Reliance on media queries.
- Negative margins, transforms, filters, blend modes, animations, or transitions.
- Background images as required content.
- Remote assets that may be blocked, hotlinked, require cookies, or depend on referrers.
- Desktop-only tables or wide code blocks that cannot fit a mobile viewport.
- Publishing without validating first.

## Publishable Artifact

The final artifact should be `rendered.html`: a complete or fragment-style HTML file whose article body is styled inline and can be copied into the WeChat draft creation pipeline.
