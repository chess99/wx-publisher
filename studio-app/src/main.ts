import "./styles.css"

type ThemeOption = {
  name: string
  description: string
}

type StudioState = {
  article: {
    path: string
    name: string
    markdown: string
  }
  themes: ThemeOption[]
  advancedModules: {
    public: string[]
    enhanced: string[]
    total: number
  }
  config: {
    wechat_appid: string
    wechat_secret_configured: boolean
    default_theme: string
  }
}

type StudioThemeSettings = {
  primaryColor?: string
  fontSize?: number
  fontFamily?: "system" | "serif" | "mono"
  codeBlockStyle?: "dark" | "light"
}

type ConvertResult = {
  html: string
  externalImages: string[]
  localImages: string[]
}

type JsonEnvelope<T> = {
  success: boolean
  data?: T
  error?: string
  details?: unknown
  hint?: string
}

const SWATCHES = ["#d66a45", "#0969da", "#07c160", "#9a6b2f", "#7c3aed", "#2f855a", "#111827", "#d9480f"]

const app = document.querySelector<HTMLDivElement>("#app")
if (!app) throw new Error("missing #app")

const state = {
  markdown: "",
  html: "",
  activeTheme: "default",
  themeSettings: {
    fontSize: 16,
    fontFamily: "system",
    codeBlockStyle: "dark",
  } as StudioThemeSettings,
  settingsOpen: false,
  themes: [] as ThemeOption[],
  advancedModules: {
    public: [] as string[],
    enhanced: [] as string[],
    total: 0,
  },
  articleName: "",
  articlePath: "",
  config: {
    wechat_appid: "(未设置)",
    wechat_secret_configured: false,
    default_theme: "default",
  } as StudioState["config"],
  images: {
    external: [] as string[],
    local: [] as string[],
  },
}

const root = document.createElement("div")
root.className = "studio-shell settings-closed"
root.innerHTML = `
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">W</div>
      <div>
        <strong>wxp Studio</strong>
        <span class="file-name">加载中</span>
      </div>
    </div>
    <div class="toolbar">
      <button class="ghost-button" data-action="copy-html" title="复制 HTML">复制 HTML</button>
      <button class="ghost-button" data-action="copy-rich" title="复制富文本">复制富文本</button>
      <button class="ghost-button" data-action="export-html" title="导出 HTML">导出 HTML</button>
      <button class="primary-button" data-action="toggle-settings" title="打开设置和发布">设置 / 发布</button>
    </div>
  </header>

  <main class="workspace">
    <section class="editor-pane">
      <div class="pane-head">
        <div>
          <span class="eyebrow">MARKDOWN</span>
          <h2>编辑</h2>
        </div>
        <span class="status-pill" data-bind="word-count">0 字</span>
      </div>
      <textarea class="markdown-editor" spellcheck="false" placeholder="输入 Markdown"></textarea>
    </section>

    <section class="preview-pane">
      <div class="pane-head">
        <div>
          <span class="eyebrow">WECHAT PREVIEW</span>
          <h2>手机稿纸</h2>
        </div>
        <span class="status-pill" data-bind="image-count">0 图</span>
      </div>
      <div class="phone-frame">
        <div class="phone-speaker"></div>
        <article class="preview-content"></article>
      </div>
    </section>

    <aside class="settings-panel">
      <div class="panel-title">
        <div>
          <span class="eyebrow">STYLE & PUBLISH</span>
          <h2>设置</h2>
        </div>
        <button class="icon-button" data-action="toggle-settings" title="收起设置">×</button>
      </div>

      <section class="setting-group">
        <h3>主题</h3>
        <div class="theme-grid"></div>
      </section>

      <section class="setting-group">
        <h3>主题色</h3>
        <button class="subtle-button" data-action="reset-color" title="恢复当前主题原色">使用主题原色</button>
        <div class="swatches"></div>
      </section>

      <section class="setting-group">
        <h3>高级模块</h3>
        <p class="muted-text" data-bind="module-count">读取中</p>
        <div class="module-tags"></div>
      </section>

      <section class="setting-group compact-grid">
        <label>
          字号
          <input class="setting-input" type="number" min="14" max="20" step="1" data-setting="font-size" />
        </label>
        <label>
          字体
          <select class="setting-input" data-setting="font-family">
            <option value="system">无衬线</option>
            <option value="serif">衬线</option>
            <option value="mono">等宽</option>
          </select>
        </label>
        <label>
          代码块
          <select class="setting-input" data-setting="code-style">
            <option value="dark">深色</option>
            <option value="light">浅色</option>
          </select>
        </label>
      </section>

      <section class="setting-group">
        <h3>发布草稿</h3>
        <input class="setting-input" data-publish="title" placeholder="标题，默认读取 H1" />
        <input class="setting-input" data-publish="author" placeholder="作者，可选" />
        <textarea class="setting-input digest-input" data-publish="digest" maxlength="120" placeholder="摘要，120 字以内"></textarea>
        <select class="setting-input" data-publish="cover-type">
          <option value="placeholder">使用占位封面</option>
          <option value="path">本地封面路径</option>
          <option value="url">公网封面 URL</option>
        </select>
        <input class="setting-input" data-publish="cover-value" placeholder="/path/to/cover.jpg 或 https://..." />
        <button class="primary-button publish-button" data-action="publish">创建微信公众号草稿</button>
        <div class="config-note"></div>
      </section>

      <section class="setting-group">
        <h3>状态</h3>
        <pre class="result-box" data-bind="result">等待操作</pre>
      </section>
    </aside>
  </main>
`
app.append(root)

const markdownEditor = root.querySelector<HTMLTextAreaElement>(".markdown-editor")!
const preview = root.querySelector<HTMLElement>(".preview-content")!
const themeGrid = root.querySelector<HTMLElement>(".theme-grid")!
const swatches = root.querySelector<HTMLElement>(".swatches")!
const resultBox = root.querySelector<HTMLElement>('[data-bind="result"]')!

void boot()

async function boot(): Promise<void> {
  try {
    const payload = await request<StudioState>("/api/state")
    if (!payload.data) throw new Error(payload.error ?? "加载失败")

    state.markdown = payload.data.article.markdown
    state.articleName = payload.data.article.name
    state.articlePath = payload.data.article.path
    state.themes = payload.data.themes
    state.advancedModules = payload.data.advancedModules
    state.config = payload.data.config
    state.activeTheme = payload.data.config.default_theme || payload.data.themes[0]?.name || "default"

    markdownEditor.value = state.markdown
    root.querySelector(".file-name")!.textContent = payload.data.article.name
    renderThemeCards()
    renderSwatches()
    renderAdvancedModules()
    syncControls()
    bindEvents()
    await convertNow()
  } catch (error) {
    setResult({ success: false, error: "Studio 初始化失败", details: String(error) })
  }
}

function bindEvents(): void {
  markdownEditor.addEventListener("input", () => {
    state.markdown = markdownEditor.value
    updateStats()
    debounceConvert()
  })

  root.addEventListener("click", event => {
    const target = event.target as HTMLElement
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action
    if (!action) return

    if (action === "toggle-settings") toggleSettings()
    if (action === "copy-html") void copyHtml()
    if (action === "copy-rich") void copyRich()
    if (action === "export-html") exportHtml()
    if (action === "reset-color") resetThemeColor()
    if (action === "publish") void publishDraft()
  })

  root.querySelector<HTMLInputElement>('[data-setting="font-size"]')?.addEventListener("input", event => {
    state.themeSettings.fontSize = Number((event.target as HTMLInputElement).value)
    debounceConvert()
  })
  root.querySelector<HTMLSelectElement>('[data-setting="font-family"]')?.addEventListener("change", event => {
    state.themeSettings.fontFamily = (event.target as HTMLSelectElement).value as StudioThemeSettings["fontFamily"]
    debounceConvert()
  })
  root.querySelector<HTMLSelectElement>('[data-setting="code-style"]')?.addEventListener("change", event => {
    state.themeSettings.codeBlockStyle = (event.target as HTMLSelectElement).value as StudioThemeSettings["codeBlockStyle"]
    debounceConvert()
  })
}

function renderThemeCards(): void {
  themeGrid.innerHTML = state.themes.map(theme => `
    <button class="theme-card ${theme.name === state.activeTheme ? "active" : ""}" data-theme="${escapeHtml(theme.name)}">
      <span>${escapeHtml(theme.name)}</span>
      <small>${escapeHtml(theme.description)}</small>
    </button>
  `).join("")
  themeGrid.querySelectorAll<HTMLButtonElement>("[data-theme]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeTheme = button.dataset.theme ?? state.activeTheme
      renderThemeCards()
      void convertNow()
    })
  })
}

function renderSwatches(): void {
  swatches.innerHTML = SWATCHES.map(color => `
    <button class="swatch ${color === state.themeSettings.primaryColor ? "active" : ""}" data-color="${color}" style="--swatch:${color}" title="${color}"></button>
  `).join("")
  swatches.querySelectorAll<HTMLButtonElement>("[data-color]").forEach(button => {
    button.addEventListener("click", () => {
      state.themeSettings.primaryColor = button.dataset.color
      renderSwatches()
      void convertNow()
    })
  })
}

function renderAdvancedModules(): void {
  const tags = root.querySelector<HTMLElement>(".module-tags")!
  const moduleCount = root.querySelector<HTMLElement>('[data-bind="module-count"]')!
  const featured = [...state.advancedModules.public.slice(0, 8), ...state.advancedModules.enhanced]
  moduleCount.textContent = `${state.advancedModules.total} 个模块可用，支持封面、卡片、数据、图文、FAQ、画廊和对话等结构。`
  tags.innerHTML = featured.map(name => `<span>${escapeHtml(name)}</span>`).join("")
}

function resetThemeColor(): void {
  state.themeSettings.primaryColor = undefined
  renderSwatches()
  void convertNow()
}

function syncControls(): void {
  root.querySelector<HTMLInputElement>('[data-setting="font-size"]')!.value = String(state.themeSettings.fontSize ?? 16)
  root.querySelector<HTMLSelectElement>('[data-setting="font-family"]')!.value = state.themeSettings.fontFamily ?? "system"
  root.querySelector<HTMLSelectElement>('[data-setting="code-style"]')!.value = state.themeSettings.codeBlockStyle ?? "dark"
  root.querySelector<HTMLElement>(".config-note")!.textContent =
    state.config.wechat_secret_configured
      ? `已读取公众号配置：${state.config.wechat_appid}`
      : "未检测到完整公众号配置，发布前请先执行 wxp config set。"
  updateStats()
}

let convertTimer = 0
function debounceConvert(): void {
  window.clearTimeout(convertTimer)
  convertTimer = window.setTimeout(() => void convertNow(), 220)
}

async function convertNow(): Promise<void> {
  try {
    const payload = await request<ConvertResult>("/api/convert", {
      markdown: state.markdown,
      theme: state.activeTheme,
      themeSettings: state.themeSettings,
    })
    if (!payload.success || !payload.data) throw new Error(payload.error ?? "转换失败")
    state.html = payload.data.html
    state.images.external = payload.data.externalImages
    state.images.local = payload.data.localImages
    preview.innerHTML = state.html
    updateStats()
  } catch (error) {
    setResult({ success: false, error: "转换失败", details: String(error) })
  }
}

async function publishDraft(): Promise<void> {
  const coverType = root.querySelector<HTMLSelectElement>('[data-publish="cover-type"]')!.value
  const coverValue = root.querySelector<HTMLInputElement>('[data-publish="cover-value"]')!.value.trim()
  const payload = await request<unknown>("/api/publish", {
    markdown: state.markdown,
    theme: state.activeTheme,
    themeSettings: state.themeSettings,
    title: root.querySelector<HTMLInputElement>('[data-publish="title"]')!.value.trim(),
    author: root.querySelector<HTMLInputElement>('[data-publish="author"]')!.value.trim(),
    digest: root.querySelector<HTMLTextAreaElement>('[data-publish="digest"]')!.value.trim(),
    cover: { type: coverType, value: coverValue },
  })
  setResult(payload)
}

async function copyHtml(): Promise<void> {
  setResult({ success: true, data: { message: "正在复制 HTML..." } })
  try {
    await navigator.clipboard.writeText(state.html)
    setResult({ success: true, data: { message: "HTML 已复制" } })
  } catch (error) {
    setResult({ success: false, error: "复制 HTML 失败", details: String(error) })
  }
}

async function copyRich(): Promise<void> {
  setResult({ success: true, data: { message: "正在复制富文本..." } })
  try {
    const ClipboardItemCtor = globalThis.ClipboardItem
    if (!ClipboardItemCtor) throw new Error("ClipboardItem unavailable")
    await navigator.clipboard.write([
      new ClipboardItemCtor({
        "text/html": new Blob([state.html], { type: "text/html" }),
        "text/plain": new Blob([preview.textContent ?? ""], { type: "text/plain" }),
      }),
    ])
    setResult({ success: true, data: { message: "富文本已复制，可粘贴到公众号后台" } })
  } catch (error) {
    setResult({ success: false, error: "复制富文本失败，已保留 HTML 可手动复制", details: String(error) })
  }
}

function exportHtml(): void {
  const blob = new Blob([state.html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${state.articleName.replace(/\.md$/i, "") || "wxp-article"}.html`
  link.click()
  URL.revokeObjectURL(url)
  setResult({ success: true, data: { message: "HTML 已导出" } })
}

async function request<T>(path: string, body?: unknown): Promise<JsonEnvelope<T>> {
  const response = await fetch(path, body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return await response.json() as JsonEnvelope<T>
}

function toggleSettings(): void {
  state.settingsOpen = !state.settingsOpen
  root.classList.toggle("settings-closed", !state.settingsOpen)
}

function updateStats(): void {
  root.querySelector('[data-bind="word-count"]')!.textContent = `${state.markdown.length} 字`
  const imageCount = state.images.external.length + state.images.local.length
  root.querySelector('[data-bind="image-count"]')!.textContent = `${imageCount} 图`
}

function setResult(payload: unknown): void {
  resultBox.textContent = JSON.stringify(payload, null, 2)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
