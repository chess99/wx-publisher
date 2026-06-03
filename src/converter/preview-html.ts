/**
 * 生成主题画廊 HTML
 *
 * 输入：各主题预渲染结果 + 原始文件绝对路径
 * 输出：自包含的单页 HTML，无外部依赖
 */

export interface ThemePreviewResult {
  theme: string
  html: string
  error?: string
  publishCommand?: string
  displayName?: string
  collection?: string
  bestFor?: string
  density?: "low" | "medium" | "high"
  contrast?: "low" | "medium" | "high"
  accent?: string
}

export function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

export function generatePreviewHtml(
  results: ThemePreviewResult[],
  filePath: string
): string {
  const successfulThemes = results.filter(r => !r.error)
  const firstTheme = successfulThemes[0]?.theme ?? results[0]?.theme ?? ""
  const fileName = filePath.split("/").pop() ?? filePath

  const commandsJson = safeJson(Object.fromEntries(
    results.filter(r => !r.error).map(r => [
      r.theme,
      r.publishCommand ?? `wxp publish --file ${shellQuote(filePath)} --theme ${shellQuote(r.theme)}`,
    ])
  ))

  const metaJson = safeJson(Object.fromEntries(results.map(r => [
    r.theme,
    {
      theme: r.theme,
      displayName: displayName(r),
      collection: r.collection ?? "custom",
      density: r.density ?? "medium",
      contrast: r.contrast ?? "medium",
      accent: r.accent ?? "#07c160",
      bestFor: r.bestFor ?? r.collection ?? "theme preview",
      error: r.error ?? "",
    },
  ])))

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>wx-publisher 主题画廊 · ${escapeHtml(fileName)}</title>
<style>
  * { box-sizing: border-box; }
  html { background: #eef1f4; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    background: #eef1f4;
    color: #20242a;
  }
  button, input { font: inherit; }
  .gallery-shell { min-height: 100vh; padding: 28px clamp(18px, 3vw, 44px) 40px; }
  .gallery-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    align-items: end;
    margin: 0 auto 22px;
    max-width: 1440px;
  }
  .eyebrow { margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #69717d; text-transform: uppercase; letter-spacing: .08em; }
  h1 { margin: 0; font-size: clamp(28px, 4vw, 46px); line-height: 1.08; letter-spacing: 0; color: #15191f; }
  .source-path { margin: 10px 0 0; color: #69717d; font-size: 14px; word-break: break-all; }
  .count-badge { justify-self: end; border: 1px solid #d7dce2; background: #fff; border-radius: 999px; padding: 8px 13px; color: #3c4450; font-size: 13px; }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: minmax(220px, 360px) minmax(0, 1fr);
    gap: 14px;
    align-items: start;
    max-width: 1440px;
    margin: 0 auto 22px;
    padding: 14px;
    border: 1px solid rgba(215,220,226,.9);
    background: rgba(255,255,255,.94);
    backdrop-filter: blur(14px);
    border-radius: 14px;
    box-shadow: 0 10px 26px rgba(22, 31, 45, .08);
  }
  .search-input {
    width: 100%;
    border: 1px solid #cfd6df;
    border-radius: 10px;
    padding: 10px 12px;
    outline: none;
    color: #1f2732;
    background: #fff;
  }
  .search-input:focus { border-color: #6f8fb8; box-shadow: 0 0 0 3px rgba(111,143,184,.16); }
  .filter-stack { display: grid; gap: 9px; }
  .filter-row { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
  .filter-label { min-width: 68px; font-size: 12px; color: #78818d; font-weight: 700; }
  .filter-chip {
    border: 1px solid #d7dce2;
    background: #f8fafc;
    color: #39424f;
    border-radius: 999px;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
  }
  .filter-chip.active { background: #1f2732; border-color: #1f2732; color: #fff; }
  .theme-grid {
    max-width: 1440px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 18px;
  }
  .theme-card {
    display: grid;
    grid-template-rows: auto 340px auto;
    min-height: 520px;
    border: 1px solid #d9dee5;
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 12px 28px rgba(22, 31, 45, .09);
    cursor: pointer;
    text-align: left;
    padding: 0;
    transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  }
  .theme-card:hover { transform: translateY(-2px); border-color: #aeb8c5; box-shadow: 0 18px 34px rgba(22, 31, 45, .13); }
  .theme-card[hidden] { display: none; }
  .theme-card-error { border-color: #efb8b8; background: #fff7f7; }
  .card-head { padding: 15px 16px 13px; border-bottom: 1px solid #edf0f3; }
  .card-title-row { display: flex; align-items: center; gap: 9px; min-width: 0; }
  .accent-swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,.12); flex: 0 0 auto; }
  .card-name { margin: 0; color: #15191f; font-size: 17px; line-height: 1.25; font-weight: 760; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-id { margin: 5px 0 0 23px; color: #6d7580; font-size: 12px; font-family: "SFMono-Regular", Consolas, monospace; }
  .badge-row { margin-top: 11px; display: flex; flex-wrap: wrap; gap: 6px; }
  .meta-badge { border: 1px solid #dce1e7; background: #f8fafc; color: #4c5664; border-radius: 999px; padding: 3px 8px; font-size: 11px; line-height: 1.45; }
  .card-preview-frame { position: relative; overflow: hidden; background: #f5f6f8; border-bottom: 1px solid #edf0f3; }
  .card-preview-frame::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 84px;
    background: linear-gradient(to bottom, rgba(245,246,248,0), #f5f6f8);
    pointer-events: none;
  }
  .preview-source {
    width: 677px;
    min-height: 760px;
    transform: scale(.47);
    transform-origin: top left;
    background: #fff;
  }
  .card-foot { padding: 12px 16px 15px; color: #69717d; font-size: 13px; line-height: 1.55; min-height: 78px; }
  .error-box { padding: 24px; color: #9f2f2f; font-family: "SFMono-Regular", Consolas, monospace; font-size: 13px; line-height: 1.6; }
  .empty-state { max-width: 1440px; margin: 18px auto 0; color: #69717d; display: none; }
  .empty-state.visible { display: block; }
  .detail-panel {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: none;
    background: rgba(17, 24, 39, .58);
  }
  .detail-panel.open { display: grid; grid-template-columns: minmax(300px, 420px) minmax(0, 1fr); }
  .detail-sidebar {
    background: #fff;
    padding: 22px;
    overflow: auto;
    border-right: 1px solid #d9dee5;
  }
  .detail-close {
    border: 1px solid #d7dce2;
    background: #fff;
    color: #1f2732;
    border-radius: 10px;
    padding: 7px 10px;
    cursor: pointer;
  }
  .detail-title { margin: 22px 0 6px; font-size: 26px; line-height: 1.15; color: #15191f; }
  .detail-id { margin: 0 0 16px; font-family: "SFMono-Regular", Consolas, monospace; color: #69717d; }
  .detail-meta { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 18px; }
  .detail-help { color: #69717d; line-height: 1.65; font-size: 14px; }
  .command-box { margin-top: 18px; display: grid; gap: 9px; }
  .cover-input, .cmd-text {
    width: 100%;
    border: 1px solid #d7dce2;
    background: #f8fafc;
    border-radius: 10px;
    padding: 9px 10px;
    color: #1f2732;
    font-size: 13px;
  }
  .cmd-text {
    min-height: 84px;
    resize: vertical;
    font-family: "SFMono-Regular", Consolas, monospace;
    line-height: 1.5;
  }
  .copy-btn {
    border: 0;
    background: #1f2732;
    color: #fff;
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
  }
  .copy-btn.copied { background: #15803d; }
  .detail-preview-wrap { overflow: auto; padding: 32px 18px; background: #eef1f4; }
  .detail-preview {
    max-width: 760px;
    margin: 0 auto;
    background: #fff;
    box-shadow: 0 20px 60px rgba(17,24,39,.24);
  }
  @media (max-width: 860px) {
    .gallery-header, .toolbar { grid-template-columns: 1fr; }
    .count-badge { justify-self: start; }
    .detail-panel.open { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .detail-sidebar { max-height: 42vh; border-right: 0; border-bottom: 1px solid #d9dee5; }
  }
</style>
</head>
<body>
<main class="gallery-shell" data-page="theme-gallery">
  <header class="gallery-header">
    <div>
      <p class="eyebrow">wx-publisher</p>
      <h1>主题画廊</h1>
      <p class="source-path">样稿：${escapeHtml(filePath)}</p>
    </div>
    <div class="count-badge">${successfulThemes.length}/${results.length} 个主题渲染成功</div>
  </header>

  <section class="toolbar" aria-label="主题筛选">
    <input class="search-input" id="themeSearch" type="search" placeholder="搜索主题、系列、用途">
    <div class="filter-stack">
      ${renderFilterGroup("collection", "系列", uniqueValues(results.map(r => r.collection ?? "custom")))}
      ${renderFilterGroup("density", "密度", uniqueValues(results.map(r => r.density ?? "medium")))}
      ${renderFilterGroup("contrast", "对比", uniqueValues(results.map(r => r.contrast ?? "medium")))}
    </div>
  </section>

  <section class="theme-grid" id="themeGrid">
    ${results.map(renderThemeCard).join("\n    ")}
  </section>
  <p class="empty-state" id="emptyState">没有匹配的主题。</p>
</main>

<aside class="detail-panel" id="detailPanel" aria-hidden="true">
  <section class="detail-sidebar">
    <button class="detail-close" id="detailClose" type="button">关闭</button>
    <h2 class="detail-title" id="detailTitle"></h2>
    <p class="detail-id" id="detailId"></p>
    <div class="detail-meta" id="detailMeta"></div>
    <p class="detail-help" id="detailHelp"></p>
    <div class="command-box">
      <input class="cover-input" id="coverInput" type="text" placeholder="封面图路径或 URL">
      <textarea class="cmd-text" id="cmdText" readonly></textarea>
      <button class="copy-btn" id="copyBtn" type="button">复制命令</button>
    </div>
  </section>
  <section class="detail-preview-wrap">
    <div class="detail-preview" id="detailPreview"></div>
  </section>
</aside>

<script>
  const COMMANDS = ${commandsJson};
  const THEME_META = ${metaJson};
  let activeTheme = ${JSON.stringify(firstTheme)};
  const activeFilters = { collection: "all", density: "all", contrast: "all" };

  function shellQuote(value) {
    if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
    return "'" + value.replace(/'/g, "'\\"'\\"'") + "'";
  }

  function updateCommand() {
    const cover = document.getElementById("coverInput").value.trim();
    let cmd = COMMANDS[activeTheme] || "";
    if (cover) {
      const isUrl = cover.startsWith("http://") || cover.startsWith("https://");
      cmd += isUrl ? " --cover-url " + shellQuote(cover) : " --cover " + shellQuote(cover);
    }
    document.getElementById("cmdText").value = cmd;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function openDetail(theme) {
    const card = Array.from(document.querySelectorAll(".theme-card")).find(item => item.dataset.theme === theme);
    if (!card || card.dataset.error) return;
    const meta = THEME_META[theme];
    activeTheme = theme;
    document.getElementById("detailTitle").textContent = meta.displayName;
    document.getElementById("detailId").textContent = meta.theme;
    document.getElementById("detailHelp").textContent = meta.bestFor;
    document.getElementById("detailMeta").innerHTML = [
      meta.collection,
      meta.density + " density",
      meta.contrast + " contrast"
    ].map(value => '<span class="meta-badge">' + escapeHtml(value) + '</span>').join("");
    document.getElementById("detailPreview").innerHTML = card.querySelector(".preview-source").innerHTML;
    document.getElementById("detailPanel").classList.add("open");
    document.getElementById("detailPanel").setAttribute("aria-hidden", "false");
    updateCommand();
  }

  function closeDetail() {
    document.getElementById("detailPanel").classList.remove("open");
    document.getElementById("detailPanel").setAttribute("aria-hidden", "true");
  }

  function applyFilters() {
    const query = document.getElementById("themeSearch").value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll(".theme-card").forEach(card => {
      const matchesQuery = !query || card.dataset.search.includes(query);
      const matchesCollection = activeFilters.collection === "all" || card.dataset.collection === activeFilters.collection;
      const matchesDensity = activeFilters.density === "all" || card.dataset.density === activeFilters.density;
      const matchesContrast = activeFilters.contrast === "all" || card.dataset.contrast === activeFilters.contrast;
      const show = matchesQuery && matchesCollection && matchesDensity && matchesContrast;
      card.hidden = !show;
      if (show) visible += 1;
    });
    document.getElementById("emptyState").classList.toggle("visible", visible === 0);
  }

  document.querySelectorAll(".theme-card").forEach(card => {
    card.addEventListener("click", () => openDetail(card.dataset.theme));
  });
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const group = chip.dataset.filterGroup;
      activeFilters[group] = chip.dataset.filterValue;
      document.querySelectorAll('.filter-chip[data-filter-group="' + group + '"]').forEach(item => {
        item.classList.toggle("active", item === chip);
      });
      applyFilters();
    });
  });
  document.getElementById("themeSearch").addEventListener("input", applyFilters);
  document.getElementById("coverInput").addEventListener("input", updateCommand);
  document.getElementById("detailClose").addEventListener("click", closeDetail);
  document.getElementById("detailPanel").addEventListener("click", event => {
    if (event.target.id === "detailPanel") closeDetail();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeDetail();
  });
  document.getElementById("copyBtn").addEventListener("click", () => {
    const cmd = document.getElementById("cmdText").value;
    if (!cmd) return;
    navigator.clipboard.writeText(cmd).then(() => {
      const btn = document.getElementById("copyBtn");
      btn.textContent = "已复制";
      btn.classList.add("copied");
      setTimeout(() => { btn.textContent = "复制命令"; btn.classList.remove("copied"); }, 1600);
    });
  });
</script>
</body>
</html>`
}

function renderThemeCard(result: ThemePreviewResult): string {
  const collection = result.collection ?? "custom"
  const density = result.density ?? "medium"
  const contrast = result.contrast ?? "medium"
  const accent = result.accent ?? "#07c160"
  const name = displayName(result)
  const bestFor = result.bestFor ?? collection
  const search = [result.theme, name, collection, density, contrast, bestFor].join(" ").toLowerCase()
  const errorClass = result.error ? " theme-card-error" : ""
  const errorAttr = result.error ? ' data-error="true"' : ""
  const preview = result.error
    ? `<div class="error-box">渲染失败<br>${escapeHtml(result.error)}</div>`
    : `<div class="preview-source">${result.html}</div>`

  return `<button class="theme-card${errorClass}" data-theme="${escapeAttr(result.theme)}" data-collection="${escapeAttr(collection)}" data-density="${escapeAttr(density)}" data-contrast="${escapeAttr(contrast)}" data-search="${escapeAttr(search)}"${errorAttr} type="button">
      <div class="card-head">
        <div class="card-title-row">
          <span class="accent-swatch" style="background:${escapeAttr(accent)}"></span>
          <h2 class="card-name">${escapeHtml(name)}</h2>
        </div>
        <p class="card-id">${escapeHtml(result.theme)}</p>
        <div class="badge-row">
          <span class="meta-badge">${escapeHtml(collection)}</span>
          <span class="meta-badge">${escapeHtml(density)} density</span>
          <span class="meta-badge">${escapeHtml(contrast)} contrast</span>
        </div>
      </div>
      <div class="card-preview-frame">${preview}</div>
      <div class="card-foot">${escapeHtml(bestFor)}</div>
    </button>`
}

function renderFilterGroup(group: "collection" | "density" | "contrast", label: string, values: string[]): string {
  const chips = ["all", ...values].map((value, index) => {
    const active = index === 0 ? " active" : ""
    const text = value === "all" ? "全部" : value
    return `<button class="filter-chip${active}" data-filter-group="${group}" data-filter-value="${escapeAttr(value)}" type="button">${escapeHtml(text)}</button>`
  }).join("")
  return `<div class="filter-row" data-filter-group="${group}"><span class="filter-label">${label}</span>${chips}</div>`
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function displayName(result: ThemePreviewResult): string {
  return result.displayName ?? result.theme
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeAttr(str: string): string {
  return escapeHtml(str).replace(/'/g, "&#39;")
}
