# Rendering Toolkit

Prefer a direct `rendered.html` path. The caller should generate final inline-styled HTML explicitly, then validate, preview, and draft it.

## Preferred Path

```bash
node skills/wechat-article-design/scripts/validate-wechat-html.mjs --file rendered.html
node skills/wechat-article-design/scripts/preview-wechat-html.mjs --file rendered.html --output preview.html
node skills/wechat-article-design/scripts/publish-wechat-draft.mjs --html rendered.html --cover /path/to/cover.jpg --title "Article title"
```

This path keeps the publishable artifact inspectable and avoids hidden layout decisions.

## Optional Renderer

`render-wechat-article.mjs` is optional only. Use it when a small script helps assemble repeatable sections or escape untrusted text, but do not require it for every article.

When using a renderer, keep its output as ordinary inline-styled HTML in `rendered.html`.

## Optional Helpers

These helper shapes are useful in a renderer:

```js
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function style(rules) {
  return Object.entries(rules)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function tag(name, attrs = {}, children = "") {
  const attrText = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => value === true ? key : `${key}="${escapeHtml(value)}"`)
    .join(" ");
  return `<${name}${attrText ? ` ${attrText}` : ""}>${children}</${name}>`;
}
```

Use `escapeHtml` for untrusted text. Use `style` to keep inline style strings consistent. Use `tag` only for simple HTML generation where it improves clarity.
