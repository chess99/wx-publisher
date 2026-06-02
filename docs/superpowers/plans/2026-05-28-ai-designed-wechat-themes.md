# AI-Designed WeChat Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add external theme-file support to `wxp`, then add an HTML-first `wechat-article-design` skill for experimental AI-designed WeChat articles.

**Architecture:** Stage 1 keeps `wxp` stable by loading external `Theme` JSON through a dedicated validator/loader, then passing a parsed `Theme` object into the existing Markdown converter. Stage 2 adds an independent root-level skill whose main path is AI-generated HTML plus validation, preview, and draft publishing tools; `render-wechat-article.mjs` is only an optional helper.

**Tech Stack:** TypeScript, Node.js ESM, Commander, Vitest, existing `WechatClient`, existing Markdown converter, plain Node `.mjs` scripts for the skill.

---

## Scope Check

The approved spec intentionally contains two stages and requires two commits:

1. `feat: support external theme files`
2. `feat: add wechat article design skill`

This is one implementation plan because Stage 2 depends on the same repo conventions, WeChat API behavior, JSON contracts, and fixture strategy, but each stage remains independently testable and independently committable.

## File Structure

Stage 1 files:

- Create `src/converter/theme-file.ts`: owns external theme schema, validation, warning generation, JSON parsing, and file loading.
- Modify `src/converter/index.ts`: accepts a parsed external `Theme` via `ConvertOptions.themeDefinition`.
- Create `src/cli/theme-options.ts`: resolves `--theme` / `--theme-file` / default config consistently for `convert` and `publish`.
- Modify `src/cli/index.ts`: adds `--theme-file`, `theme validate`, `theme schema`, and capabilities output.
- Modify `src/converter/preview-html.ts`: supports custom publish commands for external theme preview tabs.
- Modify `README.md` and `AGENTS.md`: documents external theme-file usage.
- Create `test/theme-file.test.ts`: unit tests for schema, validation, and loading.
- Create `test/cli-theme-file.test.ts`: CLI-level tests for validate/schema/capabilities/convert/preview conflict behavior.
- Create `test/fixtures/external-theme-valid.json`: valid full theme fixture.
- Create `test/fixtures/external-theme-missing-style.json`: invalid missing-style fixture.
- Create `test/fixtures/external-theme-dangerous.json`: invalid dangerous-content fixture.
- Create `test/fixtures/external-theme-warning.json`: valid-with-warnings fixture.

Stage 2 files:

- Create `skills/wechat-article-design/SKILL.md`: describes the low-level tool skill and HTML-first main path.
- Create `skills/wechat-article-design/references/wechat-html-constraints.md`: documents WeChat HTML constraints.
- Create `skills/wechat-article-design/references/rendering-toolkit.md`: documents optional rendering utilities.
- Create `skills/wechat-article-design/references/publishing-api.md`: documents draft API usage and config.
- Create `skills/wechat-article-design/scripts/validate-wechat-html.mjs`: validates AI-generated HTML and emits JSON.
- Create `skills/wechat-article-design/scripts/preview-wechat-html.mjs`: wraps HTML in a local preview shell.
- Create `skills/wechat-article-design/scripts/publish-wechat-draft.mjs`: publishes already-rendered HTML to a WeChat draft, with `--dry-run` for tests.
- Create `skills/wechat-article-design/scripts/render-wechat-article.mjs`: optional helper utilities and CLI.
- Create `skills/wechat-article-design/examples/benchmark.md`: Markdown fixture covering common Markdown elements.
- Create `skills/wechat-article-design/examples/creative-rendered.html`: hand-authored creative HTML fixture.
- Create `skills/wechat-article-design/examples/minimal-render.mjs`: optional render helper example.
- Create `skills/wechat-article-design/examples/article.md`: small example input.
- Create `skills/wechat-article-design/examples/rendered.html`: small example output.
- Create `test/wechat-article-design-skill.test.ts`: script-level tests for validation, preview, render helper, and publish dry-run.

## Stage 1 Commit: `feat: support external theme files`

### Task 1: Add External Theme Fixtures

**Files:**
- Create: `test/fixtures/external-theme-valid.json`
- Create: `test/fixtures/external-theme-missing-style.json`
- Create: `test/fixtures/external-theme-dangerous.json`
- Create: `test/fixtures/external-theme-warning.json`

- [ ] **Step 1: Create the valid fixture**

Create `test/fixtures/external-theme-valid.json`:

```json
{
  "name": "fixture-theme",
  "description": "Valid external theme fixture",
  "styles": {
    "wrapper": "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',Arial,sans-serif;max-width:677px;margin:0 auto;padding:0 16px;background:#fff;color:#222;",
    "h1": "font-size:26px;font-weight:800;color:#111;margin:24px 0 14px;line-height:1.3;",
    "h2": "font-size:20px;font-weight:700;color:#111;margin:24px 0 12px;border-left:4px solid #b8870c;padding-left:12px;",
    "h3": "font-size:17px;font-weight:700;color:#7a4f18;margin:20px 0 10px;",
    "h4": "font-size:16px;font-weight:700;color:#333;margin:18px 0 8px;",
    "p": "font-size:16px;line-height:1.85;color:#333;margin:0 0 16px 0;",
    "strong": "font-weight:700;color:#111;",
    "em": "font-style:italic;color:#555;",
    "code": "font-family:'SFMono-Regular',Consolas,monospace;font-size:13px;background:#f5efe3;color:#9a3412;padding:2px 6px;border-radius:4px;",
    "pre": "background:#171717;border-radius:8px;padding:16px 18px;margin:18px 0;overflow-x:auto;display:block;",
    "preCode": "font-family:'SFMono-Regular',Consolas,monospace;font-size:13px;color:#f5f5f5;background:none;padding:0;display:block;white-space:nowrap;overflow-x:auto;",
    "blockquote": "border-left:4px solid #b8870c;background:#fff8e5;color:#4a3a20;margin:18px 0;padding:12px 16px;",
    "ul": "list-style:none;padding-left:0;margin:0 0 16px 0;",
    "ol": "list-style:none;padding-left:0;margin:0 0 16px 0;",
    "li": "display:block;margin:0.2em 8px;font-size:16px;line-height:1.85;color:#333;",
    "hr": "border:none;border-top:1px solid #ead8be;margin:28px 0;",
    "img": "max-width:100%;display:block;margin:18px auto;border-radius:8px;",
    "a": "color:#8a5a12;text-decoration:underline;font-weight:600;",
    "table": "width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;",
    "th": "background:#f3e6d3;font-weight:700;padding:9px 12px;border:1px solid #dfc8aa;text-align:left;color:#2f251b;",
    "td": "padding:9px 12px;border:1px solid #ead8be;color:#333;"
  }
}
```

- [ ] **Step 2: Create the missing-style fixture**

Create `test/fixtures/external-theme-missing-style.json`. It is the same as the valid fixture except the `styles.td` key is omitted:

```json
{
  "name": "missing-style-theme",
  "description": "Invalid fixture missing td",
  "styles": {
    "wrapper": "font-family:-apple-system;max-width:677px;margin:0 auto;",
    "h1": "font-size:26px;",
    "h2": "font-size:20px;",
    "h3": "font-size:17px;",
    "h4": "font-size:16px;",
    "p": "font-size:16px;line-height:1.85;",
    "strong": "font-weight:700;",
    "em": "font-style:italic;",
    "code": "font-family:monospace;",
    "pre": "background:#111;",
    "preCode": "font-family:monospace;color:#fff;",
    "blockquote": "border-left:4px solid #999;",
    "ul": "list-style:none;",
    "ol": "list-style:none;",
    "li": "display:block;",
    "hr": "border:none;border-top:1px solid #eee;",
    "img": "max-width:100%;",
    "a": "text-decoration:underline;",
    "table": "width:100%;",
    "th": "font-weight:700;"
  }
}
```

- [ ] **Step 3: Create the dangerous-content fixture**

Create `test/fixtures/external-theme-dangerous.json`:

```json
{
  "name": "dangerous-theme",
  "description": "Invalid fixture with dangerous CSS-like content",
  "styles": {
    "wrapper": "font-family:-apple-system;max-width:677px;margin:0 auto;",
    "h1": "font-size:26px;",
    "h2": "font-size:20px;",
    "h3": "font-size:17px;",
    "h4": "font-size:16px;",
    "p": "font-size:16px;line-height:1.85;",
    "strong": "font-weight:700;",
    "em": "font-style:italic;",
    "code": "font-family:monospace;",
    "pre": "background:#111;",
    "preCode": "font-family:monospace;color:#fff;",
    "blockquote": "border-left:4px solid #999;",
    "ul": "list-style:none;",
    "ol": "list-style:none;",
    "li": "display:block;",
    "hr": "border:none;border-top:1px solid #eee;",
    "img": "max-width:100%;background:url(javascript:alert(1));",
    "a": "text-decoration:underline;",
    "table": "width:100%;",
    "th": "font-weight:700;",
    "td": "padding:8px;"
  }
}
```

- [ ] **Step 4: Create the warning fixture**

Create `test/fixtures/external-theme-warning.json`:

```json
{
  "name": "warning-theme",
  "description": "Valid fixture with warnings",
  "extra": "unknown field should warn",
  "styles": {
    "wrapper": "font-family:'RemoteFont';max-width:1200px;margin:0 auto;position:fixed;",
    "h1": "font-size:26px;animation:fade 1s ease;",
    "h2": "font-size:20px;",
    "h3": "font-size:17px;",
    "h4": "font-size:16px;",
    "p": "font-size:16px;line-height:1.85;",
    "strong": "font-weight:700;",
    "em": "font-style:italic;",
    "code": "font-family:monospace;",
    "pre": "background:#111;",
    "preCode": "font-family:monospace;color:#fff;",
    "blockquote": "border-left:4px solid #999;",
    "ul": "list-style:none;",
    "ol": "list-style:none;",
    "li": "display:block;",
    "hr": "border:none;border-top:1px solid #eee;",
    "img": "max-width:100%;",
    "a": "text-decoration:underline;",
    "table": "width:100%;",
    "th": "font-weight:700;",
    "td": "padding:8px;"
  }
}
```

- [ ] **Step 5: Commit fixtures with implementation later**

Do not commit yet. These fixtures are staged in Task 4 with the Stage 1 implementation.

### Task 2: Write Theme File Unit Tests

**Files:**
- Create: `test/theme-file.test.ts`
- Depends on fixtures from Task 1.

- [ ] **Step 1: Write failing unit tests**

Create `test/theme-file.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { resolve } from "path"
import {
  getThemeFileSchema,
  loadThemeFile,
  validateThemeObject,
  THEME_STYLE_KEYS,
} from "../src/converter/theme-file.js"

const fixture = (name: string) => resolve("test", "fixtures", name)

describe("external theme files", () => {
  it("exports a schema containing every NodeStyles key", () => {
    const schema = getThemeFileSchema()
    expect(schema.required).toEqual(["name", "description", "styles"])
    for (const key of THEME_STYLE_KEYS) {
      expect(schema.properties.styles.required).toContain(key)
    }
  })

  it("loads a valid external theme", () => {
    const result = loadThemeFile(fixture("external-theme-valid.json"))
    expect(result.theme.name).toBe("fixture-theme")
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.theme.styles.h2).toContain("border-left")
  })

  it("rejects missing required style keys", () => {
    const result = loadThemeFile(fixture("external-theme-missing-style.json"))
    expect(result.theme).toBeNull()
    expect(result.errors).toContain("styles.td is required")
  })

  it("rejects dangerous style content", () => {
    const result = loadThemeFile(fixture("external-theme-dangerous.json"))
    expect(result.theme).toBeNull()
    expect(result.errors.join("\\n")).toContain("styles.img contains forbidden content: javascript:")
  })

  it("returns warnings for unknown fields and risky CSS", () => {
    const result = loadThemeFile(fixture("external-theme-warning.json"))
    expect(result.theme?.name).toBe("warning-theme")
    expect(result.errors).toEqual([])
    expect(result.warnings).toContain("unknown top-level field: extra")
    expect(result.warnings.join("\\n")).toContain("styles.wrapper uses position:fixed")
    expect(result.warnings.join("\\n")).toContain("styles.h1 uses animation")
    expect(result.warnings.join("\\n")).toContain("styles.wrapper uses a fixed width greater than 677px")
  })

  it("rejects non-object input", () => {
    const result = validateThemeObject("not object")
    expect(result.theme).toBeNull()
    expect(result.errors).toContain("theme file must contain a JSON object")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/theme-file.test.ts
```

Expected: fail with an import error for `src/converter/theme-file.js`.

### Task 3: Implement Theme File Loading and Validation

**Files:**
- Create: `src/converter/theme-file.ts`
- Supports tests from Task 2.

- [ ] **Step 1: Create `src/converter/theme-file.ts`**

Create `src/converter/theme-file.ts`:

```ts
import { readFileSync } from "fs"
import type { Theme, NodeStyles } from "./themes.js"

export const THEME_STYLE_KEYS = [
  "wrapper",
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "strong",
  "em",
  "code",
  "pre",
  "preCode",
  "blockquote",
  "ul",
  "ol",
  "li",
  "hr",
  "img",
  "a",
  "table",
  "th",
  "td",
] as const satisfies readonly (keyof NodeStyles)[]

type ThemeStyleKey = typeof THEME_STYLE_KEYS[number]

export interface ThemeValidationResult {
  theme: Theme | null
  errors: string[]
  warnings: string[]
}

export interface ThemeFileSchema {
  type: "object"
  required: string[]
  properties: {
    name: { type: "string" }
    description: { type: "string" }
    styles: {
      type: "object"
      required: string[]
      properties: Record<ThemeStyleKey, { type: "string" }>
    }
  }
  additionalProperties: boolean
}

export function getThemeFileSchema(): ThemeFileSchema {
  return {
    type: "object",
    required: ["name", "description", "styles"],
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      styles: {
        type: "object",
        required: [...THEME_STYLE_KEYS],
        properties: Object.fromEntries(
          THEME_STYLE_KEYS.map(key => [key, { type: "string" }])
        ) as Record<ThemeStyleKey, { type: "string" }>,
      },
    },
    additionalProperties: false,
  }
}

export function loadThemeFile(path: string): ThemeValidationResult {
  let raw: string
  try {
    raw = readFileSync(path, "utf-8")
  } catch (e) {
    return { theme: null, errors: [`failed to read theme file: ${String(e)}`], warnings: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return { theme: null, errors: [`failed to parse theme JSON: ${String(e)}`], warnings: [] }
  }

  return validateThemeObject(parsed)
}

export function validateThemeObject(value: unknown): ThemeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isPlainObject(value)) {
    return { theme: null, errors: ["theme file must contain a JSON object"], warnings }
  }

  warnUnknownFields(value, ["name", "description", "styles"], "top-level", warnings)

  const name = value["name"]
  const description = value["description"]
  const styles = value["styles"]

  if (typeof name !== "string" || name.trim() === "") {
    errors.push("name is required and must be a non-empty string")
  }
  if (typeof description !== "string" || description.trim() === "") {
    errors.push("description is required and must be a non-empty string")
  }
  if (!isPlainObject(styles)) {
    errors.push("styles is required and must be an object")
  }

  if (!isPlainObject(styles)) {
    return { theme: null, errors, warnings }
  }

  warnUnknownFields(styles, [...THEME_STYLE_KEYS], "styles", warnings)

  const normalizedStyles = {} as NodeStyles
  for (const key of THEME_STYLE_KEYS) {
    const style = styles[key]
    if (typeof style !== "string") {
      errors.push(`styles.${key} is required`)
      continue
    }
    const styleWarnings = collectStyleWarnings(key, style)
    warnings.push(...styleWarnings)
    const forbidden = collectForbiddenContent(key, style)
    errors.push(...forbidden)
    normalizedStyles[key] = style
  }

  if (errors.length > 0) {
    return { theme: null, errors, warnings }
  }

  return {
    theme: {
      name: name as string,
      description: description as string,
      styles: normalizedStyles,
    },
    errors,
    warnings,
  }
}

function warnUnknownFields(
  object: Record<string, unknown>,
  allowed: string[],
  label: string,
  warnings: string[]
): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(object)) {
    if (!allowedSet.has(key)) {
      warnings.push(`unknown ${label} field: ${key}`)
    }
  }
}

function collectForbiddenContent(key: string, style: string): string[] {
  const lower = style.toLowerCase()
  const forbidden = ["<script", "javascript:", "onerror=", "onclick=", "onload="]
  return forbidden
    .filter(pattern => lower.includes(pattern))
    .map(pattern => `styles.${key} contains forbidden content: ${pattern}`)
}

function collectStyleWarnings(key: string, style: string): string[] {
  const warnings: string[] = []
  const lower = style.toLowerCase()

  if (lower.includes("position:fixed") || lower.includes("position: fixed")) {
    warnings.push(`styles.${key} uses position:fixed, which is risky in WeChat`)
  }
  if (lower.includes("animation:") || lower.includes("@keyframes")) {
    warnings.push(`styles.${key} uses animation, which is risky in WeChat`)
  }
  if (lower.includes("@font-face") || lower.includes("@import") || /url\\(\\s*https?:/i.test(style)) {
    warnings.push(`styles.${key} uses external font or URL loading, which is risky in WeChat`)
  }

  const widthMatch = style.match(/(?:^|;)\\s*(?:max-)?width\\s*:\\s*(\\d+)px/i)
  if (widthMatch && Number(widthMatch[1]) > 677) {
    warnings.push(`styles.${key} uses a fixed width greater than 677px`)
  }

  return warnings
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
```

- [ ] **Step 2: Run unit tests**

Run:

```bash
npm test -- test/theme-file.test.ts
```

Expected: pass all tests in `test/theme-file.test.ts`.

### Task 4: Add Theme Resolution for CLI and Converter

**Files:**
- Modify: `src/converter/index.ts`
- Create: `src/cli/theme-options.ts`
- Create: `test/theme-options.test.ts`

- [ ] **Step 1: Write failing theme option tests**

Create `test/theme-options.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { resolveThemeOption } from "../src/cli/theme-options.js"

describe("resolveThemeOption", () => {
  it("uses configured default theme when no option is provided", () => {
    const result = resolveThemeOption({}, "minimal")
    expect(result).toEqual({ themeName: "minimal", themeDefinition: undefined })
  })

  it("uses explicit built-in theme name", () => {
    const result = resolveThemeOption({ theme: "github-readme" }, "default")
    expect(result).toEqual({ themeName: "github-readme", themeDefinition: undefined })
  })

  it("loads an external theme file", () => {
    const result = resolveThemeOption(
      { themeFile: "test/fixtures/external-theme-valid.json" },
      "default"
    )
    expect(result.themeName).toBe("fixture-theme")
    expect(result.themeDefinition?.name).toBe("fixture-theme")
    expect(result.warnings).toEqual([])
  })

  it("rejects --theme and --theme-file together", () => {
    expect(() => resolveThemeOption(
      { theme: "github-readme", themeFile: "test/fixtures/external-theme-valid.json" },
      "default"
    )).toThrow("--theme and --theme-file cannot be used together")
  })

  it("rejects invalid external theme files", () => {
    expect(() => resolveThemeOption(
      { themeFile: "test/fixtures/external-theme-missing-style.json" },
      "default"
    )).toThrow("styles.td is required")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/theme-options.test.ts
```

Expected: fail with an import error for `src/cli/theme-options.js`.

- [ ] **Step 3: Modify `src/converter/index.ts` options**

Update imports and `ConvertOptions` in `src/converter/index.ts`:

```ts
import { getTheme, type NodeStyles, type Theme } from "./themes.js"

export interface ConvertOptions {
  theme?: string
  themeDefinition?: Theme
  stripLinks?: boolean
}
```

Update the start of `convertMarkdown`:

```ts
export async function convertMarkdown(markdown: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  const { theme: themeName = "default", themeDefinition, stripLinks = true } = options
  const theme = themeDefinition ?? getTheme(themeName)
  const externalImages: string[] = []
  const localImages: string[] = []
```

No other converter behavior should change.

- [ ] **Step 4: Create `src/cli/theme-options.ts`**

Create `src/cli/theme-options.ts`:

```ts
import { resolve } from "path"
import type { Theme } from "../converter/themes.js"
import { loadThemeFile } from "../converter/theme-file.js"

export interface ThemeCliOptions {
  theme?: string
  themeFile?: string
}

export interface ResolvedThemeOption {
  themeName: string
  themeDefinition?: Theme
  warnings?: string[]
}

export function resolveThemeOption(
  opts: ThemeCliOptions,
  defaultTheme: string
): ResolvedThemeOption {
  if (opts.theme && opts.themeFile) {
    throw new Error("--theme and --theme-file cannot be used together")
  }

  if (!opts.themeFile) {
    return { themeName: opts.theme ?? defaultTheme, themeDefinition: undefined }
  }

  const result = loadThemeFile(resolve(opts.themeFile))
  if (!result.theme) {
    throw new Error(result.errors.join("; "))
  }

  return {
    themeName: result.theme.name,
    themeDefinition: result.theme,
    warnings: result.warnings,
  }
}
```

- [ ] **Step 5: Run theme option tests**

Run:

```bash
npm test -- test/theme-options.test.ts test/theme-file.test.ts
```

Expected: pass both test files.

### Task 5: Add CLI Commands and Theme-File Options

**Files:**
- Modify: `src/cli/index.ts`
- Modify: `src/converter/preview-html.ts`
- Create: `test/cli-theme-file.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Create `test/cli-theme-file.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { spawn } from "child_process"

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn("node", ["--import", "tsx/esm", "src/cli/index.ts", ...args], {
      cwd: "/Users/zcs/code2/wx-publisher",
      env: {
        ...process.env,
        WXP_APPID: "",
        WXP_SECRET: "",
        WXP_THEME: "",
      },
    })
    let stdout = ""
    let stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 1 }))
  })
}

describe("CLI external theme files", () => {
  it("theme schema prints a machine-readable schema", async () => {
    const { stdout, exitCode } = await runCli(["theme", "schema"])
    const payload = JSON.parse(stdout)
    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.schema.properties.styles.required).toContain("preCode")
  })

  it("theme validate accepts a valid theme file", async () => {
    const { stdout, exitCode } = await runCli([
      "theme", "validate",
      "--file", "test/fixtures/external-theme-valid.json",
    ])
    const payload = JSON.parse(stdout)
    expect(exitCode).toBe(0)
    expect(payload.data.valid).toBe(true)
    expect(payload.data.theme.name).toBe("fixture-theme")
  })

  it("theme validate rejects a broken theme file", async () => {
    const { stderr, exitCode } = await runCli([
      "theme", "validate",
      "--file", "test/fixtures/external-theme-missing-style.json",
    ])
    const payload = JSON.parse(stderr)
    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.details).toContain("styles.td is required")
  })

  it("convert uses --theme-file", async () => {
    const { stdout, exitCode } = await runCli([
      "convert",
      "--file", "test/fixtures/benchmark.md",
      "--theme-file", "test/fixtures/external-theme-valid.json",
    ])
    expect(exitCode).toBe(0)
    expect(stdout).toContain("border-left:4px solid #b8870c")
    expect(stdout).toContain("写给开发者的排版指南")
  })

  it("convert rejects --theme and --theme-file together", async () => {
    const { stderr, exitCode } = await runCli([
      "convert",
      "--file", "test/fixtures/benchmark.md",
      "--theme", "github-readme",
      "--theme-file", "test/fixtures/external-theme-valid.json",
    ])
    const payload = JSON.parse(stderr)
    expect(exitCode).not.toBe(0)
    expect(payload.error).toContain("主题参数冲突")
  })

  it("preview includes external theme when --theme-file is passed", async () => {
    const { stdout, exitCode } = await runCli([
      "preview",
      "--file", "test/fixtures/benchmark.md",
      "--theme-file", "test/fixtures/external-theme-valid.json",
      "--no-open",
    ])
    const payload = JSON.parse(stdout)
    expect(exitCode).toBe(0)
    expect(payload.data.themes).toContainEqual({ theme: "fixture-theme", ok: true })
  })

  it("preview command for external theme keeps --theme-file", async () => {
    const { stdout, exitCode } = await runCli([
      "preview",
      "--file", "test/fixtures/benchmark.md",
      "--theme-file", "test/fixtures/external-theme-valid.json",
      "--no-open",
    ])
    const payload = JSON.parse(stdout)
    const html = require("fs").readFileSync(payload.data.path, "utf-8")
    expect(exitCode).toBe(0)
    expect(html).toContain("--theme-file")
    expect(html).toContain("test/fixtures/external-theme-valid.json")
  })

  it("capabilities describes external theme files", async () => {
    const { stdout, exitCode } = await runCli(["capabilities"])
    const payload = JSON.parse(stdout)
    expect(exitCode).toBe(0)
    expect(payload.data.features.external_theme_file).toBe(true)
    expect(payload.data.commands.convert.optional_flags).toContain("--theme-file")
    expect(payload.data.commands.publish.optional_flags).toContain("--theme-file")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/cli-theme-file.test.ts
```

Expected: fail because `theme` command and `--theme-file` are not implemented.

- [ ] **Step 3: Update `src/cli/index.ts` imports**

Add imports:

```ts
import { resolveThemeOption } from "./theme-options.js"
import { getThemeFileSchema, loadThemeFile } from "../converter/theme-file.js"
```

- [ ] **Step 4: Add `--theme-file` to `publish` command**

In `publish`, add the option:

```ts
.option("--theme-file <path>", "外部主题 JSON 文件路径（与 --theme 二选一）")
```

Replace:

```ts
const theme = opts.theme ?? config.default_theme
const client = new WechatClient({ appid: config.wechat_appid, secret: config.wechat_secret })

// 转换 Markdown
const { html, externalImages, localImages } = await convertMarkdown(markdown, { theme })
```

with:

```ts
let resolvedTheme: ReturnType<typeof resolveThemeOption>
try {
  resolvedTheme = resolveThemeOption({ theme: opts.theme, themeFile: opts.themeFile }, config.default_theme)
} catch (e) {
  fail("主题参数冲突或主题文件无效", String(e))
}

for (const warning of resolvedTheme.warnings ?? []) {
  console.error(JSON.stringify({ warning }))
}

const theme = resolvedTheme.themeName
const client = new WechatClient({ appid: config.wechat_appid, secret: config.wechat_secret })

// 转换 Markdown
const { html, externalImages, localImages } = await convertMarkdown(markdown, {
  theme,
  themeDefinition: resolvedTheme.themeDefinition,
})
```

- [ ] **Step 5: Add `--theme-file` to `convert` command**

In `convert`, add:

```ts
.option("--theme-file <path>", "外部主题 JSON 文件路径（与 --theme 二选一）")
```

Replace:

```ts
const theme = opts.theme ?? config.default_theme
const { html, externalImages, localImages } = await convertMarkdown(markdown, { theme })
```

with:

```ts
let resolvedTheme: ReturnType<typeof resolveThemeOption>
try {
  resolvedTheme = resolveThemeOption({ theme: opts.theme, themeFile: opts.themeFile }, config.default_theme)
} catch (e) {
  fail("主题参数冲突或主题文件无效", String(e))
}

const theme = resolvedTheme.themeName
const { html, externalImages, localImages } = await convertMarkdown(markdown, {
  theme,
  themeDefinition: resolvedTheme.themeDefinition,
})
```

When writing to an output file, keep the existing `ok` response shape but use `theme`.

- [ ] **Step 6: Add `theme` command group**

Insert before `capabilities`:

```ts
const themeCmd = program.command("theme").description("管理外部主题文件")

themeCmd
  .command("schema")
  .description("输出外部主题 JSON schema")
  .action(() => {
    ok({ schema: getThemeFileSchema() })
  })

themeCmd
  .command("validate")
  .description("校验外部主题 JSON 文件")
  .requiredOption("-f, --file <path>", "主题 JSON 文件路径")
  .action((opts) => {
    const result = loadThemeFile(resolve(opts.file))
    if (!result.theme) {
      fail("主题文件无效", result.errors.join("; "))
    }
    ok({
      valid: true,
      theme: {
        name: result.theme.name,
        description: result.theme.description,
      },
      warnings: result.warnings,
    })
  })
```

- [ ] **Step 7: Add external-theme publish commands to preview HTML**

Update `ThemePreviewResult` in `src/converter/preview-html.ts`:

```ts
export interface ThemePreviewResult {
  theme: string
  html: string
  error?: string
  publishCommand?: string
}
```

Replace the command JSON generation:

```ts
const commandsJson = JSON.stringify(
  Object.fromEntries(results.filter(r => !r.error).map(r => [
    r.theme,
    `wxp publish --file ${filePath} --theme ${r.theme}`,
  ]))
)
```

with:

```ts
const commandsJson = JSON.stringify(
  Object.fromEntries(results.filter(r => !r.error).map(r => [
    r.theme,
    r.publishCommand ?? `wxp publish --file ${filePath} --theme ${r.theme}`,
  ]))
)
```

- [ ] **Step 8: Add `--theme-file` to `preview` command**

In `preview`, add:

```ts
.option("--theme-file <path>", "额外加入预览的外部主题 JSON 文件")
```

Replace:

```ts
const themes = listThemes()
```

with:

```ts
const builtInThemes = listThemes()
const externalTheme = opts.themeFile ? loadThemeFile(resolve(opts.themeFile)) : null
if (externalTheme && !externalTheme.theme) {
  fail("主题文件无效", externalTheme.errors.join("; "))
}
const themeEntries = [
  ...builtInThemes.map(theme => ({
    name: theme,
    definition: undefined,
    publishCommand: `wxp publish --file ${absPath} --theme ${theme}`,
  })),
  ...(externalTheme?.theme ? [{
    name: externalTheme.theme.name,
    definition: externalTheme.theme,
    publishCommand: `wxp publish --file ${absPath} --theme-file ${resolve(opts.themeFile)}`,
  }] : []),
]
```

Replace the rendering block:

```ts
const settled = await Promise.allSettled(
  themes.map(theme => convertMarkdown(markdown, { theme }))
)

const results = themes.map((theme, i) => {
```

with:

```ts
const settled = await Promise.allSettled(
  themeEntries.map(entry => convertMarkdown(markdown, {
    theme: entry.name,
    themeDefinition: entry.definition,
  }))
)

const results = themeEntries.map((entry, i) => {
  const theme = entry.name
```

Keep the existing fulfilled/rejected result shape, but include the publish command for successful themes:

```ts
if (r.status === "fulfilled") {
  return { theme, html: r.value.html, publishCommand: entry.publishCommand }
} else {
  return { theme, html: "", error: String(r.reason) }
}
```

- [ ] **Step 9: Update capabilities output**

In `capabilities`, add `--theme-file` to `publish` and `convert` optional flags, add `theme` commands, and add:

```ts
features: {
  external_theme_file: true,
},
external_theme_file: {
  description: "使用外部 Theme JSON 文件提供文章级自定义主题",
  commands: ["convert", "publish", "preview", "theme validate", "theme schema"],
  schema: getThemeFileSchema(),
},
```

The final `commands` section must include:

```ts
theme: {
  description: "外部主题文件工具",
  subcommands: ["schema", "validate"],
}
```

- [ ] **Step 10: Run CLI tests**

Run:

```bash
npm test -- test/cli-theme-file.test.ts test/theme-options.test.ts test/theme-file.test.ts
```

Expected: all pass.

### Task 6: Update Docs for External Theme Files

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update README usage section**

In `README.md`, add after the built-in `convert` example:

```md
# 使用外部主题文件转换
wxp convert --file article.md --theme-file theme.json --output preview.html

# 使用外部主题文件创建草稿
wxp publish --file article.md --theme-file theme.json --cover cover.jpg
```

- [ ] **Step 2: Update README theme section**

Add this section under `## 主题`:

````md
### 外部主题文件

外部主题文件用于文章级自定义排版。文件格式与内置主题一致：

```json
{
  "name": "custom-editorial",
  "description": "自定义公众号排版主题",
  "styles": {
    "wrapper": "font-family:-apple-system;max-width:677px;margin:0 auto;",
    "h1": "font-size:26px;font-weight:800;",
    "h2": "font-size:20px;font-weight:700;",
    "h3": "font-size:17px;font-weight:700;",
    "h4": "font-size:16px;font-weight:700;",
    "p": "font-size:16px;line-height:1.85;",
    "strong": "font-weight:700;",
    "em": "font-style:italic;",
    "code": "font-family:monospace;background:#f5f5f5;",
    "pre": "background:#111;padding:16px;overflow-x:auto;",
    "preCode": "font-family:monospace;color:#fff;white-space:nowrap;",
    "blockquote": "border-left:4px solid #999;padding-left:12px;",
    "ul": "list-style:none;padding-left:0;",
    "ol": "list-style:none;padding-left:0;",
    "li": "display:block;",
    "hr": "border:none;border-top:1px solid #eee;",
    "img": "max-width:100%;display:block;margin:16px auto;",
    "a": "text-decoration:underline;",
    "table": "width:100%;border-collapse:collapse;",
    "th": "font-weight:700;border:1px solid #ddd;",
    "td": "border:1px solid #ddd;"
  }
}
```

校验主题：

```bash
wxp theme validate --file theme.json
wxp theme schema
```
````

- [ ] **Step 3: Update AGENTS.md common flows**

In `AGENTS.md`, add after the normal `publish` example:

````md
### 使用外部主题文件

```bash
wxp theme validate --file /path/to/theme.json

wxp publish \
  --file /path/to/article.md \
  --cover /path/to/cover.jpg \
  --theme-file /path/to/theme.json \
  --title "文章标题"
```

`--theme-file` 接受外部 Theme JSON 文件。成功时 `publish` 的 JSON 输出中 `data.theme` 为主题文件里的 `name`。
````

- [ ] **Step 4: Run docs-adjacent tests**

Run:

```bash
npm test -- test/cli-surface.test.ts test/cli-theme-file.test.ts
```

Expected: both test files pass.

### Task 7: Verify and Commit Stage 1

**Files:**
- All Stage 1 files.

- [ ] **Step 1: Run full validation**

Run:

```bash
npm run typecheck
npm test
npm run build
```

Expected:

- `npm run typecheck`: exits 0.
- `npm test`: all Vitest suites pass.
- `npm run build`: exits 0 and updates `dist/`.

- [ ] **Step 2: Inspect git diff**

Run:

```bash
git diff --stat
git diff -- src/converter/theme-file.ts src/cli/theme-options.ts src/converter/index.ts src/cli/index.ts
```

Expected:

- Stage 1 diff only includes external theme-file support, tests, fixtures, and docs.
- No files under `skills/wechat-article-design/` are included in this commit.
- Do not stage unrelated untracked files such as `scripts/publish-literary-draft.mjs`.

- [ ] **Step 3: Commit Stage 1**

Run:

```bash
git add README.md AGENTS.md src/converter/theme-file.ts src/converter/index.ts src/cli/theme-options.ts src/cli/index.ts test/theme-file.test.ts test/theme-options.test.ts test/cli-theme-file.test.ts test/fixtures/external-theme-valid.json test/fixtures/external-theme-missing-style.json test/fixtures/external-theme-dangerous.json test/fixtures/external-theme-warning.json
git commit -m "feat: support external theme files"
```

Expected: commit succeeds.

## Stage 2 Commit: `feat: add wechat article design skill`

### Task 8: Add Skill Documentation Skeleton

**Files:**
- Create: `skills/wechat-article-design/SKILL.md`
- Create: `skills/wechat-article-design/references/wechat-html-constraints.md`
- Create: `skills/wechat-article-design/references/rendering-toolkit.md`
- Create: `skills/wechat-article-design/references/publishing-api.md`

- [ ] **Step 1: Create `SKILL.md`**

Create `skills/wechat-article-design/SKILL.md`:

````md
---
name: wechat-article-design
description: Low-level tools for producing, validating, previewing, and drafting WeChat Official Account article HTML. Use when a caller already owns editorial direction and wants to generate final inline-styled WeChat HTML directly.
---

# WeChat Article Design Toolkit

This skill provides bottom-layer tooling for WeChat-compatible article HTML. It does not define an editorial workflow. The caller owns article understanding, creative direction, layout decisions, cover generation, and publish decisions.

## Main Path

The main path is HTML-first:

```bash
node skills/wechat-article-design/scripts/validate-wechat-html.mjs --file rendered.html
node skills/wechat-article-design/scripts/preview-wechat-html.mjs --file rendered.html --output preview.html
node skills/wechat-article-design/scripts/publish-wechat-draft.mjs \
  --html rendered.html \
  --cover cover.jpg \
  --title "Article title"
```

`render-wechat-article.mjs` is optional. Use it only when Markdown parsing, escaping helpers, or simple conversion utilities are useful.

## Constraints

Read `references/wechat-html-constraints.md` before generating HTML.

The publishable artifact is ordinary HTML with all visual styling inline in `style` attributes. Do not rely on external CSS, class selectors, scripts, iframes, or external fonts.

Publishing only creates a WeChat draft. It does not directly publish.

## Validation

Always run `validate-wechat-html.mjs` before draft creation. Treat validation errors as blockers. Review warnings before publishing.
````

- [ ] **Step 2: Create constraints reference**

Create `skills/wechat-article-design/references/wechat-html-constraints.md`:

```md
# WeChat HTML Constraints

WeChat Official Account article content is HTML submitted as the `content` field of the draft API.

## Required Practices

- Put visual styles inline with `style="..."`.
- Keep article width mobile-friendly; `max-width:677px` is a safe upper bound.
- Use system fonts such as `-apple-system`, `BlinkMacSystemFont`, `PingFang SC`, `Helvetica Neue`, `Arial`, and `sans-serif`.
- Convert local images to uploaded WeChat material URLs before final publication.
- Keep code blocks horizontally scrollable with `overflow-x:auto` and explicit text color.
- Prefer simple block layouts built from `section`, `p`, `h1`-`h4`, `blockquote`, `pre`, `code`, `table`, `tr`, `th`, `td`, `img`, `span`, and `strong`.

## Avoid

- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<link>`, and external CSS.
- Inline event attributes such as `onclick`, `onload`, and `onerror`.
- `javascript:` URLs.
- `position:fixed` and complex absolute positioning.
- External web fonts and `@font-face`.
- Animation-heavy designs.
- Layouts that need desktop width to remain readable.

## Validation Reality

Successful draft creation does not guarantee perfect rendering in the WeChat backend. Always inspect the draft manually before publishing.
```

- [ ] **Step 3: Create rendering toolkit reference**

Create `skills/wechat-article-design/references/rendering-toolkit.md`:

```md
# Rendering Toolkit

The preferred path is for an upstream AI to generate final `rendered.html` directly.

Use `scripts/render-wechat-article.mjs` only when helper functions are useful:

- `escapeHtml(text)` for text nodes.
- `style(object)` for inline CSS strings.
- `tag(name, attrs, children)` for small safe HTML fragments.
- CLI fallback conversion through the existing built `wxp` converter.

The helper does not own creative direction and is not a required renderer.
```

- [ ] **Step 4: Create publishing API reference**

Create `skills/wechat-article-design/references/publishing-api.md`:

```md
# Publishing API

`scripts/publish-wechat-draft.mjs` creates a WeChat draft from already-rendered HTML.

Configuration uses the same sources as `wxp`:

- `WXP_APPID` / `WXP_SECRET`
- local `.wxp.json`
- `~/.config/wx-publisher/config.json`

The script uploads a cover image, optionally uploads local article images, replaces image `src` values with WeChat material URLs, and calls the draft API.

The script only creates drafts. It never directly publishes.

Use `--dry-run` in tests and local validation when credentials are unavailable.
```

### Task 9: Implement HTML Validation Script and Tests

**Files:**
- Create: `skills/wechat-article-design/scripts/validate-wechat-html.mjs`
- Create: `test/wechat-article-design-skill.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `test/wechat-article-design-skill.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { spawn } from "child_process"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

const ROOT = "/Users/zcs/code2/wx-publisher"

function runNode(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn("node", args, { cwd: ROOT, env: { ...process.env, WXP_APPID: "", WXP_SECRET: "" } })
    let stdout = ""
    let stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 1 }))
  })
}

describe("wechat article design skill scripts", () => {
  it("validate catches dangerous tags and event attributes", async () => {
    const dir = join(tmpdir(), `wxp-skill-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    const file = join(dir, "bad.html")
    writeFileSync(file, `<section><script>alert(1)</script><img src="x.jpg" onerror="alert(1)"></section>`)

    const { stdout, exitCode } = await runNode([
      "skills/wechat-article-design/scripts/validate-wechat-html.mjs",
      "--file", file,
    ])
    const payload = JSON.parse(stdout)
    rmSync(dir, { recursive: true, force: true })

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.errors.join("\\n")).toContain("forbidden tag: script")
    expect(payload.errors.join("\\n")).toContain("inline event attribute: onerror")
  })

  it("validate catches unresolved local images", async () => {
    const dir = join(tmpdir(), `wxp-skill-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    const file = join(dir, "local-image.html")
    writeFileSync(file, `<section><img src="./missing.png" style="max-width:100%;"></section>`)

    const { stdout, exitCode } = await runNode([
      "skills/wechat-article-design/scripts/validate-wechat-html.mjs",
      "--file", file,
    ])
    const payload = JSON.parse(stdout)
    rmSync(dir, { recursive: true, force: true })

    expect(exitCode).not.toBe(0)
    expect(payload.errors.join("\\n")).toContain("unresolved local image: ./missing.png")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/wechat-article-design-skill.test.ts
```

Expected: fail because `validate-wechat-html.mjs` does not exist.

- [ ] **Step 3: Implement validation script**

Create `skills/wechat-article-design/scripts/validate-wechat-html.mjs`:

```js
#!/usr/bin/env node
import { existsSync, readFileSync } from "fs"
import { dirname, resolve } from "path"

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--file" || arg === "-f") args.file = argv[++i]
  }
  return args
}

function ok(data) {
  console.log(JSON.stringify({ success: true, ...data }, null, 2))
  process.exit(0)
}

function fail(data) {
  console.log(JSON.stringify({ success: false, ...data }, null, 2))
  process.exit(1)
}

export function validateWechatHtml(html, options = {}) {
  const baseDir = options.baseDir ?? process.cwd()
  const errors = []
  const warnings = []

  for (const tag of ["script", "iframe", "object", "embed", "link"]) {
    const pattern = new RegExp(`<\\s*${tag}(\\s|>|/)`, "i")
    if (pattern.test(html)) errors.push(`forbidden tag: ${tag}`)
  }

  const eventAttrs = html.match(/\\s(on[a-z]+)\\s*=/gi) ?? []
  for (const attr of eventAttrs) {
    errors.push(`inline event attribute: ${attr.trim().replace(/=$/, "").toLowerCase()}`)
  }

  if (/javascript\\s*:/i.test(html)) errors.push("javascript: URL is forbidden")
  if (/<style[\\s>]/i.test(html)) warnings.push("style tag detected; prefer inline style attributes")
  if (/position\\s*:\\s*fixed/i.test(html)) warnings.push("position:fixed is risky in WeChat")
  if (/animation\\s*:/i.test(html) || /@keyframes/i.test(html)) warnings.push("animation is risky in WeChat")
  if (/@font-face/i.test(html) || /@import/i.test(html)) warnings.push("external font or CSS import is risky in WeChat")

  const imgSrcPattern = /<img\\b[^>]*\\bsrc=["']([^"']+)["'][^>]*>/gi
  for (const match of html.matchAll(imgSrcPattern)) {
    const src = match[1]
    if (isRemoteImage(src) || src.startsWith("data:")) continue
    const abs = resolve(baseDir, src)
    if (!existsSync(abs)) errors.push(`unresolved local image: ${src}`)
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  }
}

function isRemoteImage(src) {
  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")
}

const isCli = import.meta.url === `file://${process.argv[1]}`
if (isCli) {
  const args = parseArgs(process.argv.slice(2))
  if (!args.file) fail({ errors: ["--file is required"], warnings: [] })

  const file = resolve(args.file)
  let html
  try {
    html = readFileSync(file, "utf-8")
  } catch (e) {
    fail({ errors: [`failed to read HTML file: ${String(e)}`], warnings: [] })
  }

  const result = validateWechatHtml(html, { baseDir: dirname(file) })
  if (result.valid) ok(result)
  fail(result)
}
```

- [ ] **Step 4: Run validation tests**

Run:

```bash
npm test -- test/wechat-article-design-skill.test.ts
```

Expected: validation tests pass.

### Task 10: Add Preview, Publish Dry-Run, Render Helper, and Examples

**Files:**
- Create: `skills/wechat-article-design/scripts/preview-wechat-html.mjs`
- Create: `skills/wechat-article-design/scripts/publish-wechat-draft.mjs`
- Create: `skills/wechat-article-design/scripts/render-wechat-article.mjs`
- Create: `skills/wechat-article-design/examples/benchmark.md`
- Create: `skills/wechat-article-design/examples/creative-rendered.html`
- Create: `skills/wechat-article-design/examples/article.md`
- Create: `skills/wechat-article-design/examples/rendered.html`
- Create: `skills/wechat-article-design/examples/minimal-render.mjs`
- Modify: `test/wechat-article-design-skill.test.ts`

- [ ] **Step 1: Append preview, render, and dry-run tests**

Append to `test/wechat-article-design-skill.test.ts` inside the existing `describe` block:

```ts
  it("preview generation writes a standalone HTML file", async () => {
    const dir = join(tmpdir(), `wxp-skill-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    const input = join(dir, "rendered.html")
    const output = join(dir, "preview.html")
    writeFileSync(input, `<section style="font-size:16px;">Hello</section>`)

    const { stdout, exitCode } = await runNode([
      "skills/wechat-article-design/scripts/preview-wechat-html.mjs",
      "--file", input,
      "--output", output,
    ])
    const payload = JSON.parse(stdout)
    const preview = readFileSync(output, "utf-8")
    rmSync(dir, { recursive: true, force: true })

    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(preview).toContain("WeChat Article Preview")
    expect(preview).toContain("Hello")
  })

  it("publish dry-run validates inputs without WeChat credentials", async () => {
    const { stdout, exitCode } = await runNode([
      "skills/wechat-article-design/scripts/publish-wechat-draft.mjs",
      "--html", "skills/wechat-article-design/examples/rendered.html",
      "--title", "Dry Run",
      "--dry-run",
    ])
    const payload = JSON.parse(stdout)
    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.dry_run).toBe(true)
    expect(payload.data.title).toBe("Dry Run")
  })

  it("optional render helper example produces non-empty HTML", async () => {
    const dir = join(tmpdir(), `wxp-skill-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    const output = join(dir, "rendered.html")

    const { stdout, exitCode } = await runNode([
      "skills/wechat-article-design/examples/minimal-render.mjs",
      "--output", output,
    ])
    const payload = JSON.parse(stdout)
    const html = readFileSync(output, "utf-8")
    rmSync(dir, { recursive: true, force: true })

    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(html).toContain("<section")
    expect(html).toContain("Minimal WeChat Article")
  })
```

- [ ] **Step 2: Create example files**

Create `skills/wechat-article-design/examples/article.md`:

```md
# Minimal WeChat Article

This is a small article used by the optional render helper.

## Key Point

- Inline styles are required.
- Draft creation is not publication.
```

Create `skills/wechat-article-design/examples/rendered.html`:

```html
<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',Arial,sans-serif;max-width:677px;margin:0 auto;padding:0 16px;color:#222;">
  <h1 style="font-size:24px;line-height:1.35;margin:24px 0 12px;">Minimal WeChat Article</h1>
  <p style="font-size:16px;line-height:1.85;margin:0 0 16px;">This is a small rendered HTML fixture.</p>
</section>
```

Copy the benchmark fixture:

```bash
cp test/fixtures/benchmark.md skills/wechat-article-design/examples/benchmark.md
```

Create `skills/wechat-article-design/examples/creative-rendered.html`:

```html
<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',Arial,sans-serif;max-width:677px;margin:0 auto;padding:8px 4px 32px;color:#1a1a1a;background:#ffffff;line-height:1.85;">
  <h1 style="font-size:27px;font-weight:900;color:#0a0a0a;line-height:1.25;margin:0 0 20px;padding-bottom:18px;border-bottom:3px solid #b8870c;">写给开发者的排版指南</h1>
  <p style="font-size:16.5px;color:#b8870c;font-style:italic;line-height:1.75;margin:0 0 28px;padding:14px 18px;background:#fffdf0;border-left:4px solid #b8870c;border-radius:0 6px 6px 0;">好的排版不是装饰，是思维的组织方式。当代码有了层次，读者才有了方向。</p>
  <h2 style="font-size:18px;font-weight:700;color:#0a0a0a;padding:10px 16px;background:#fffdf0;border-left:4px solid #b8870c;border-radius:0 6px 6px 0;margin:32px 0 16px;">为什么开发者也要懂排版</h2>
  <p style="font-size:16px;line-height:1.85;margin:0 0 14px;">很多开发者认为排版是设计师的事。但当你写 README、技术博客、设计文档时，<strong style="color:#b8870c;font-weight:700;">你就是那个设计师</strong>。</p>
  <pre style="background:#1c1c1e;border-radius:8px;padding:16px 18px;margin:18px 0;overflow-x:auto;"><code style="font-family:'SF Mono',Menlo,Monaco,'Courier New',monospace;font-size:13px;line-height:1.7;color:#f5f5f7;white-space:nowrap;display:block;">const message = &quot;inline styles are the contract&quot;</code></pre>
  <p style="font-size:17px;font-weight:700;color:#b8870c;text-align:center;padding:24px 20px;background:#fffdf0;border:1px solid #e8c96a;border-radius:8px;margin:24px 0 0;line-height:1.6;">这样写，读者能更快理解我想表达的意思吗？</p>
</section>
```

- [ ] **Step 3: Create preview script**

Create `skills/wechat-article-design/scripts/preview-wechat-html.mjs`:

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--file" || arg === "-f") args.file = argv[++i]
    if (arg === "--output" || arg === "-o") args.output = argv[++i]
  }
  return args
}

function json(payload, code) {
  console.log(JSON.stringify(payload, null, 2))
  process.exit(code)
}

const args = parseArgs(process.argv.slice(2))
if (!args.file) json({ success: false, error: "--file is required" }, 1)

const input = resolve(args.file)
const output = resolve(args.output ?? `${tmpdir()}/wechat-article-preview-${randomUUID()}.html`)
const body = readFileSync(input, "utf-8")
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WeChat Article Preview</title>
<style>
body{margin:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",Arial,sans-serif;}
.shell{max-width:760px;margin:0 auto;padding:24px 16px 48px;}
.paper{background:#fff;padding:24px 16px;box-shadow:0 1px 8px rgba(0,0,0,.08);}
</style>
</head>
<body>
<main class="shell">
<div class="paper">
${body}
</div>
</main>
</body>
</html>`

writeFileSync(output, html, "utf-8")
json({ success: true, data: { path: output } }, 0)
```

- [ ] **Step 4: Create publish dry-run script**

Create `skills/wechat-article-design/scripts/publish-wechat-draft.mjs`:

```js
#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs"
import { join, resolve } from "path"
import { homedir, tmpdir } from "os"
import { randomUUID } from "crypto"

function parseArgs(argv) {
  const args = { uploadImages: true, dryRun: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--html") args.html = argv[++i]
    if (arg === "--title") args.title = argv[++i]
    if (arg === "--author") args.author = argv[++i]
    if (arg === "--digest") args.digest = argv[++i]
    if (arg === "--cover") args.cover = argv[++i]
    if (arg === "--cover-url") args.coverUrl = argv[++i]
    if (arg === "--no-upload-images") args.uploadImages = false
    if (arg === "--dry-run") args.dryRun = true
  }
  return args
}

function ok(data) {
  console.log(JSON.stringify({ success: true, data }, null, 2))
  process.exit(0)
}

function fail(error, details) {
  console.error(JSON.stringify({ success: false, error, details }, null, 2))
  process.exit(1)
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, "utf-8"))
}

function loadConfig() {
  const globalPath = join(homedir(), ".config", "wx-publisher", "config.json")
  const localPath = resolve(process.cwd(), ".wxp.json")
  const file = { ...readJsonIfExists(globalPath), ...readJsonIfExists(localPath) }
  return {
    wechat_appid: process.env.WXP_APPID ?? file.wechat_appid ?? "",
    wechat_secret: process.env.WXP_SECRET ?? file.wechat_secret ?? "",
  }
}

const args = parseArgs(process.argv.slice(2))
if (!args.html) fail("参数不完整", "--html is required")
if (!args.title) fail("参数不完整", "--title is required")

let html
try {
  html = readFileSync(resolve(args.html), "utf-8")
} catch (e) {
  fail("读取 HTML 失败", String(e))
}

if (args.dryRun) {
  ok({
    dry_run: true,
    title: args.title,
    html_bytes: Buffer.byteLength(html),
    cover: args.cover ?? null,
    cover_url: args.coverUrl ?? null,
  })
}

const config = loadConfig()
if (!config.wechat_appid || !config.wechat_secret) {
  fail("配置不完整", ["wechat_appid 未配置（或设置环境变量 WXP_APPID）", "wechat_secret 未配置（或设置环境变量 WXP_SECRET）"])
}

const { WechatClient } = await import("../../../dist/wechat/client.js")
const { PLACEHOLDER_COVER_BASE64 } = await import("../../../dist/converter/placeholder-cover.js")
const client = new WechatClient({ appid: config.wechat_appid, secret: config.wechat_secret })

let thumbMediaId
let usedPlaceholderCover = false
if (args.cover) {
  const result = await client.uploadImage(resolve(args.cover))
  thumbMediaId = result.media_id
} else if (args.coverUrl) {
  const result = await client.uploadImageFromUrl(args.coverUrl)
  thumbMediaId = result.media_id
} else {
  const tmpPath = join(tmpdir(), `wechat-design-placeholder-${randomUUID()}.png`)
  writeFileSync(tmpPath, Buffer.from(PLACEHOLDER_COVER_BASE64, "base64"))
  try {
    const result = await client.uploadImage(tmpPath)
    thumbMediaId = result.media_id
    usedPlaceholderCover = true
  } finally {
    try { unlinkSync(tmpPath) } catch {}
  }
}

const draft = await client.createDraft([{
  title: args.title,
  content: html,
  thumb_media_id: thumbMediaId,
  author: args.author,
  digest: args.digest,
  show_cover_pic: 1,
  need_open_comment: 0,
}])

ok({
  media_id: draft.media_id,
  title: args.title,
  used_placeholder_cover: usedPlaceholderCover,
  message: "草稿已创建，请在微信公众号后台发布",
})
```

- [ ] **Step 5: Create render helper script**

Create `skills/wechat-article-design/scripts/render-wechat-article.mjs`:

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function style(object) {
  return Object.entries(object)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}:${value}`)
    .join(";")
}

export function tag(name, attrs = {}, children = "") {
  const attrText = Object.entries(attrs)
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join("")
  const childText = Array.isArray(children) ? children.join("") : children
  return `<${name}${attrText}>${childText}</${name}>`
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--input") args.input = argv[++i]
    if (arg === "--output") args.output = argv[++i]
  }
  return args
}

function simpleMarkdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/)
  const children = []
  for (const line of lines) {
    if (line.startsWith("# ")) {
      children.push(tag("h1", { style: "font-size:24px;line-height:1.35;margin:24px 0 12px;" }, escapeHtml(line.slice(2))))
    } else if (line.startsWith("## ")) {
      children.push(tag("h2", { style: "font-size:20px;line-height:1.4;margin:24px 0 10px;" }, escapeHtml(line.slice(3))))
    } else if (line.trim()) {
      children.push(tag("p", { style: "font-size:16px;line-height:1.85;margin:0 0 16px;" }, escapeHtml(line)))
    }
  }
  return tag("section", {
    style: "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',Arial,sans-serif;max-width:677px;margin:0 auto;padding:0 16px;color:#222;",
  }, children)
}

const isCli = import.meta.url === `file://${process.argv[1]}`
if (isCli) {
  const args = parseArgs(process.argv.slice(2))
  if (!args.input || !args.output) {
    console.error(JSON.stringify({ success: false, error: "--input and --output are required" }, null, 2))
    process.exit(1)
  }
  const markdown = readFileSync(resolve(args.input), "utf-8")
  const html = simpleMarkdownToHtml(markdown)
  writeFileSync(resolve(args.output), html, "utf-8")
  console.log(JSON.stringify({ success: true, data: { output: resolve(args.output) } }, null, 2))
}
```

- [ ] **Step 6: Create minimal render example**

Create `skills/wechat-article-design/examples/minimal-render.mjs`:

```js
#!/usr/bin/env node
import { writeFileSync } from "fs"
import { resolve } from "path"
import { tag, style, escapeHtml } from "../scripts/render-wechat-article.mjs"

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--output") args.output = argv[++i]
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const output = resolve(args.output ?? "skills/wechat-article-design/examples/rendered.html")

const html = tag("section", {
  style: style({
    "font-family": "-apple-system,BlinkMacSystemFont,'PingFang SC',Arial,sans-serif",
    "max-width": "677px",
    "margin": "0 auto",
    "padding": "0 16px",
    "color": "#222",
  }),
}, [
  tag("h1", { style: "font-size:24px;line-height:1.35;margin:24px 0 12px;" }, "Minimal WeChat Article"),
  tag("p", { style: "font-size:16px;line-height:1.85;margin:0 0 16px;" }, escapeHtml("Inline styles are the publishing contract.")),
])

writeFileSync(output, html, "utf-8")
console.log(JSON.stringify({ success: true, data: { output } }, null, 2))
```

- [ ] **Step 7: Run skill tests**

Run:

```bash
npm test -- test/wechat-article-design-skill.test.ts
```

Expected: all tests in the file pass.

### Task 11: Verify and Commit Stage 2

**Files:**
- All Stage 2 files.

- [ ] **Step 1: Run full validation**

Run:

```bash
npm run typecheck
npm test
npm run build
```

Expected:

- `npm run typecheck`: exits 0.
- `npm test`: all Vitest suites pass.
- `npm run build`: exits 0.

- [ ] **Step 2: Run direct script smoke checks**

Run:

```bash
node skills/wechat-article-design/scripts/validate-wechat-html.mjs --file skills/wechat-article-design/examples/rendered.html
node skills/wechat-article-design/scripts/preview-wechat-html.mjs --file skills/wechat-article-design/examples/rendered.html --output /tmp/wxp-wechat-preview.html
node skills/wechat-article-design/scripts/publish-wechat-draft.mjs --html skills/wechat-article-design/examples/rendered.html --title "Dry Run" --dry-run
```

Expected:

- Validation exits 0 with `"success": true`.
- Preview exits 0 and writes `/tmp/wxp-wechat-preview.html`.
- Publish dry-run exits 0 with `"dry_run": true`.

- [ ] **Step 3: Inspect git diff**

Run:

```bash
git diff --stat
git status --short
```

Expected:

- Diff includes only `skills/wechat-article-design/**` and `test/wechat-article-design-skill.test.ts`.
- Do not stage unrelated untracked files such as `scripts/publish-literary-draft.mjs`.

- [ ] **Step 4: Commit Stage 2**

Run:

```bash
git add skills/wechat-article-design test/wechat-article-design-skill.test.ts
git commit -m "feat: add wechat article design skill"
```

Expected: commit succeeds.

## Final Verification

- [ ] **Step 1: Confirm two expected implementation commits exist**

Run:

```bash
git log --oneline -5
```

Expected output includes:

```text
feat: add wechat article design skill
feat: support external theme files
```

- [ ] **Step 2: Confirm working tree only has unrelated pre-existing files, if any**

Run:

```bash
git status --short
```

Expected: clean, or only unrelated user-created files that were intentionally not staged.

- [ ] **Step 3: Final command verification**

Run:

```bash
npm run typecheck
npm test
npm run build
```

Expected: all three commands exit 0.
