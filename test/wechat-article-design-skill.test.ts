import { mkdtemp, readFile, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { dirname, join, resolve } from "path"
import { fileURLToPath, pathToFileURL } from "url"
import { describe, expect, it } from "vitest"
import { spawn } from "child_process"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const validateScript = join(
  repoRoot,
  "skills",
  "wechat-article-design",
  "scripts",
  "validate-wechat-html.mjs"
)
const previewScript = join(
  repoRoot,
  "skills",
  "wechat-article-design",
  "scripts",
  "preview-wechat-html.mjs"
)
const publishScript = join(
  repoRoot,
  "skills",
  "wechat-article-design",
  "scripts",
  "publish-wechat-draft.mjs"
)
const renderScript = join(
  repoRoot,
  "skills",
  "wechat-article-design",
  "scripts",
  "render-wechat-article.mjs"
)

function runNode(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolveRun) => {
    const proc = spawn("node", args, { cwd: repoRoot })

    let stdout = ""
    let stderr = ""
    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString()
    })
    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString()
    })
    proc.on("close", (code) => {
      resolveRun({ stdout, stderr, exitCode: code ?? 1 })
    })
  })
}

async function writeTempHtml(name: string, html: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "wxp-wechat-html-"))
  const filePath = join(dir, name)
  await writeFile(filePath, html, "utf8")
  return filePath
}

describe("wechat article design HTML validator", () => {
  it("exits 0 and prints success JSON for valid HTML", async () => {
    const filePath = await writeTempHtml(
      "valid.html",
      '<section><h1>Title</h1><p>Body</p><a href="https://example.com">Read</a></section>'
    )

    const { stdout, stderr, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.valid).toBe(true)
    expect(payload.data.errors).toEqual([])
  })

  it("catches dangerous tags and event handler attributes", async () => {
    const filePath = await writeTempHtml(
      "bad.html",
      '<section><script>alert("x")</script><img src="https://example.com/a.png" onerror="alert(1)"></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)
    const errors = payload.data.errors.join("\n")

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.valid).toBe(false)
    expect(errors).toMatch(/script/i)
    expect(errors).toMatch(/event handler/i)
  })

  it("catches javascript URLs", async () => {
    const filePath = await writeTempHtml(
      "javascript-url.html",
      '<section><a href="javascript:alert(1)">Click</a></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches decimal entity-encoded javascript URLs", async () => {
    const filePath = await writeTempHtml(
      "decimal-entity-javascript-url.html",
      '<section><a href="java&#115;cript:alert(1)">Click</a></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches hex entity-encoded javascript URLs", async () => {
    const filePath = await writeTempHtml(
      "hex-entity-javascript-url.html",
      '<section><a href="java&#x73;cript:alert(1)">Click</a></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches named entity-encoded javascript URL separators", async () => {
    const filePath = await writeTempHtml(
      "named-entity-javascript-url.html",
      '<section><a href="javascript&colon;alert(1)">Click</a></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches semicolonless decimal entity-encoded javascript URL letters", async () => {
    const filePath = await writeTempHtml(
      "semicolonless-decimal-letter-javascript-url.html",
      '<section><a href="java&#115cript:alert(1)">Click</a></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches semicolonless decimal entity-encoded javascript URL separators", async () => {
    const filePath = await writeTempHtml(
      "semicolonless-decimal-separator-javascript-url.html",
      '<section><a href="javascript&#58alert(1)">Click</a></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches tab entity-obfuscated javascript URLs", async () => {
    const filePath = await writeTempHtml(
      "tab-entity-javascript-url.html",
      '<section><a href="java&Tab;script:alert(1)">Click</a></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches newline entity-obfuscated javascript URLs", async () => {
    const filePath = await writeTempHtml(
      "newline-entity-javascript-url.html",
      '<section><a href="java&NewLine;script:alert(1)">Click</a></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches javascript URLs inside CSS url() values", async () => {
    const filePath = await writeTempHtml(
      "css-javascript-url.html",
      '<section style="background-image:url(java&Tab;script&colon;alert(1))">Unsafe</section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/javascript:/i)
  })

  it("catches unresolved local images", async () => {
    const filePath = await writeTempHtml(
      "missing-image.html",
      '<section><img src="missing.png" alt="Missing"></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toContain("missing.png")
  })

  it("catches unresolved local images when quoted attributes contain greater-than signs", async () => {
    const filePath = await writeTempHtml(
      "missing-image-with-quoted-greater-than.html",
      '<section><img alt="2 > 1" src="missing.png"></section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toContain("missing.png")
  })

  it("resolves local image paths after removing query and hash suffixes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wxp-wechat-html-"))
    const imagePath = join(dir, "cover.png")
    const filePath = join(dir, "image-query-hash.html")
    await writeFile(imagePath, "not really a png", "utf8")
    await writeFile(filePath, '<section><img src="cover.png?v=1#x" alt="Cover"></section>', "utf8")

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.errors).toEqual([])
  })

  it("catches unresolved local CSS url() assets", async () => {
    const filePath = await writeTempHtml(
      "missing-css-url.html",
      '<section style="background-image:url(missing-bg.png)">Body</section>'
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.data.errors.join("\n")).toContain("missing-bg.png")
  })

  it("allows existing local CSS url() assets", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wxp-wechat-html-"))
    const imagePath = join(dir, "bg.png")
    const filePath = join(dir, "existing-css-url.html")
    await writeFile(imagePath, "not really a png", "utf8")
    await writeFile(filePath, '<section style="background-image:url(bg.png?v=1#x)">Body</section>', "utf8")

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.errors).toEqual([])
  })

  it("does not flag event-handler-like or javascript-like text inside code content", async () => {
    const filePath = await writeTempHtml(
      "safe-code-content.html",
      "<section><pre><code>onerror= example\nhref=\"javascript:alert(1)\"</code></pre></section>"
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.valid).toBe(true)
    expect(payload.data.errors).toEqual([])
  })

  it("warns but does not fail for risky WeChat CSS", async () => {
    const filePath = await writeTempHtml(
      "risky-css.html",
      [
        "<style>",
        '@import url("https://example.com/site.css");',
        '@font-face { font-family: "X"; src: url("https://example.com/x.woff2"); }',
        "@keyframes fade { from { opacity: 0; } to { opacity: 1; } }",
        "</style>",
        '<section style="position: fixed; animation: fade 1s ease;">Body</section>',
      ].join("")
    )

    const { stdout, exitCode } = await runNode([validateScript, "--file", filePath])
    const payload = JSON.parse(stdout)
    const warnings = payload.data.warnings.join("\n")

    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.valid).toBe(true)
    expect(payload.data.errors).toEqual([])
    expect(warnings).toMatch(/<style>/i)
    expect(warnings).toMatch(/position:\s*fixed/i)
    expect(warnings).toMatch(/animation/i)
    expect(warnings).toMatch(/@font-face/i)
    expect(warnings).toMatch(/@import/i)
  })
})

describe("wechat article design helper scripts", () => {
  it("preview script wraps direct HTML into a standalone preview HTML file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wxp-wechat-preview-"))
    const articlePath = join(dir, "rendered.html")
    const previewPath = join(dir, "preview.html")
    await writeFile(
      articlePath,
      '<section style="padding: 16px;"><h1>Preview Title</h1><p>Body</p></section>',
      "utf8"
    )

    const { stdout, stderr, exitCode } = await runNode([
      previewScript,
      "--file",
      articlePath,
      "--output",
      previewPath,
      "--title",
      "Preview <Title>",
    ])
    const payload = JSON.parse(stdout)
    const preview = await readFile(previewPath, "utf8")

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.output).toBe(previewPath)
    expect(preview).toContain("<!doctype html>")
    expect(preview).toContain("Preview &lt;Title&gt;")
    expect(preview).toContain('<section style="padding: 16px;"><h1>Preview Title</h1><p>Body</p></section>')
    expect(preview).toContain("max-width: 677px")
  })

  it("publish script dry-run validates HTML and prints success JSON without credentials or network", async () => {
    const filePath = await writeTempHtml(
      "publish-valid.html",
      '<section><p>Draft body</p><img src="https://mmbiz.qpic.cn/sz_mmbiz_png/demo.png" alt="Uploaded"></section>'
    )

    const { stdout, stderr, exitCode } = await runNode([
      publishScript,
      "--html",
      filePath,
      "--title",
      "Dry Run Draft",
      "--dry-run",
    ])
    const payload = JSON.parse(stdout)

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.dry_run).toBe(true)
    expect(payload.data.title).toBe("Dry Run Draft")
    expect(payload.data.image_count).toBe(1)
    expect(payload.data.used_placeholder_cover).toBe(true)
  })

  it("publish script dry-run counts CSS url() upload candidates", async () => {
    const filePath = await writeTempHtml(
      "publish-css-image.html",
      '<section style="background-image:url(https://example.com/bg.png)"><p>Draft body</p></section>'
    )

    const { stdout, exitCode } = await runNode([
      publishScript,
      "--html",
      filePath,
      "--title",
      "Dry Run CSS Image",
      "--dry-run",
    ])
    const payload = JSON.parse(stdout)

    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(payload.data.would_upload_image_count).toBe(1)
  })

  it("publish script dry-run rejects digests longer than 120 characters", async () => {
    const filePath = await writeTempHtml("publish-long-digest.html", "<section><p>Draft body</p></section>")
    const digest = "x".repeat(121)

    const { stdout, exitCode } = await runNode([
      publishScript,
      "--html",
      filePath,
      "--title",
      "Long Digest",
      "--digest",
      digest,
      "--dry-run",
    ])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.details).toMatch(/120/)
  })

  it("publish script dry-run fails when validator finds dangerous HTML", async () => {
    const filePath = await writeTempHtml(
      "publish-dangerous.html",
      '<section><script>alert("x")</script><p>Unsafe</p></section>'
    )

    const { stdout, exitCode } = await runNode([
      publishScript,
      "--html",
      filePath,
      "--title",
      "Unsafe Draft",
      "--dry-run",
    ])
    const payload = JSON.parse(stdout)

    expect(exitCode).not.toBe(0)
    expect(payload.success).toBe(false)
    expect(payload.error).toMatch(/validation/i)
    expect(payload.data.valid).toBe(false)
    expect(payload.data.errors.join("\n")).toMatch(/script/i)
  })

  it("publish image rewrite handles unquoted src values consistently with detection", async () => {
    const { rewriteImageSources } = await import(pathToFileURL(publishScript).href)
    const html = [
      '<section>',
      '<img src=cover.png alt="Cover">',
      "<img src='quoted.png' alt='Quoted'>",
      '<img src="double.png" alt="Double">',
      "</section>",
    ].join("")

    const rewritten = rewriteImageSources(
      html,
      new Map([
        ["cover.png", "https://mmbiz.qpic.cn/cover.png"],
        ["quoted.png", "https://mmbiz.qpic.cn/quoted.png"],
        ["double.png", "https://mmbiz.qpic.cn/double.png"],
      ])
    )

    expect(rewritten).toContain('src="https://mmbiz.qpic.cn/cover.png"')
    expect(rewritten).toContain("src='https://mmbiz.qpic.cn/quoted.png'")
    expect(rewritten).toContain('src="https://mmbiz.qpic.cn/double.png"')
    expect(rewritten).not.toContain("src=cover.png")
  })

  it("publish CSS URL rewrite handles style attributes and style blocks", async () => {
    const { rewriteCssUrlSources } = await import(pathToFileURL(publishScript).href)
    const html = [
      "<style>.hero{background:url('remote.png')}</style>",
      '<section style="background-image:url(local.png)">Body</section>',
    ].join("")

    const rewritten = rewriteCssUrlSources(
      html,
      new Map([
        ["remote.png", "https://mmbiz.qpic.cn/remote.png"],
        ["local.png", "https://mmbiz.qpic.cn/local.png"],
      ])
    )

    expect(rewritten).toContain("background:url('https://mmbiz.qpic.cn/remote.png')")
    expect(rewritten).toContain("background-image:url('https://mmbiz.qpic.cn/local.png')")
    expect(rewritten).not.toContain("url('remote.png')")
    expect(rewritten).not.toContain("url(local.png)")
  })

  it("render helper can render an example Markdown file to inline-styled HTML", async () => {
    const outputPath = join(await mkdtemp(join(tmpdir(), "wxp-wechat-render-")), "article.html")
    const examplePath = join(repoRoot, "skills", "wechat-article-design", "examples", "article.md")

    const { stdout, stderr, exitCode } = await runNode([
      renderScript,
      "--file",
      examplePath,
      "--output",
      outputPath,
      "--title",
      "Example Render",
    ])
    const payload = JSON.parse(stdout)
    const html = await readFile(outputPath, "utf8")

    expect(stderr).toBe("")
    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(html).toContain("<section")
    expect(html).toContain("style=")
    expect(html).toContain("Example Render")
    expect(html).toContain("<strong")
    expect(html).toContain("<code")
    expect(html).toContain("微信公众号")
  })

  it("render helper renders italic after punctuation without breaking bold or bold-italic", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wxp-wechat-render-inline-"))
    const markdownPath = join(dir, "inline.md")
    const outputPath = join(dir, "inline.html")
    await writeFile(
      markdownPath,
      "标点、*语气强调*，以及 **重点信息** 和 ***双重强调***，代码 `*literal*`。",
      "utf8"
    )

    const { stdout, exitCode } = await runNode([
      renderScript,
      "--file",
      markdownPath,
      "--output",
      outputPath,
    ])
    const payload = JSON.parse(stdout)
    const html = await readFile(outputPath, "utf8")

    expect(exitCode).toBe(0)
    expect(payload.success).toBe(true)
    expect(html).toContain("标点、<em")
    expect(html).toContain(">语气强调</em>")
    expect(html).toContain("<strong")
    expect(html).toContain(">重点信息</strong>")
    expect(html).toContain("<strong")
    expect(html).toContain("<em")
    expect(html).toContain(">双重强调</em></strong>")
    expect(html).toContain("*literal*")
    expect(html).not.toContain("*语气强调*")
  })
})
