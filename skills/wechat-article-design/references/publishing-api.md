# Publishing API

The HTML-first publishing path creates WeChat Official Account drafts through `publish-wechat-draft.mjs`. It does not publish articles.

## Credentials

Configuration may mirror `wx-publisher` sources:

- `WXP_APPID`
- `WXP_SECRET`
- `.wxp.json` in the current project
- `~/.config/wx-publisher/config.json`

Check configuration before drafting:

```bash
wxp capabilities
wxp config get
```

## Draft Creation

Direct HTML draft creation uses the skill script, not the current `wxp publish` Markdown-oriented CLI path.

Draft creation requires `--html` and `--title`. A cover is recommended:

```bash
node skills/wechat-article-design/scripts/publish-wechat-draft.mjs --html rendered.html --cover /path/to/cover.jpg --title "Article title"
```

The script uploads the cover image when provided. It may also upload article images and rewrite image references so the draft can render inside WeChat. When no cover is provided, it uses the built-in placeholder cover, but callers should prefer a real cover.

Publishing creates a draft only. A human still needs to review and publish from the WeChat Official Account backend.

## Dry Run

Use `--dry-run` when checking the publishing payload without creating a draft:

```bash
node skills/wechat-article-design/scripts/publish-wechat-draft.mjs --html rendered.html --cover /path/to/cover.jpg --title "Article title" --dry-run
```

Always run validation before draft creation, including before non-dry-run publish commands:

```bash
node skills/wechat-article-design/scripts/validate-wechat-html.mjs --file rendered.html
```
