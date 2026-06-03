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

type FilterGroup = "collection" | "scenario" | "density" | "contrast"

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
  const collections = uniqueValues(results.map(r => r.collection ?? "custom"), COLLECTION_ORDER)
  const scenarios = uniqueValues(results.flatMap(r => scenarioLabels(r.bestFor)), SCENARIO_ORDER)
  const densities = uniqueValues(results.map(r => r.density ?? "medium"), DENSITY_ORDER)
  const contrasts = uniqueValues(results.map(r => r.contrast ?? "medium"), CONTRAST_ORDER)

  const commandsJson = safeJson(Object.fromEntries(
    results.filter(r => !r.error).map(r => [
      r.theme,
      r.publishCommand ?? `wxp publish --file ${shellQuote(filePath)} --theme ${shellQuote(r.theme)}`,
    ])
  ))

  const metaJson = safeJson(Object.fromEntries(results.map(r => {
    const collection = r.collection ?? "custom"
    const density = r.density ?? "medium"
    const contrast = r.contrast ?? "medium"
    return [
      r.theme,
      {
        theme: r.theme,
        displayName: displayName(r),
        collection,
        collectionLabel: collectionLabel(collection),
        density,
        densityLabel: densityLabel(density),
        contrast,
        contrastLabel: contrastLabel(contrast),
        accent: r.accent ?? "#07c160",
        bestFor: r.bestFor ?? "自定义主题，适合按当前文章单独验收。",
        scenarios: scenarioLabels(r.bestFor),
        tones: toneLabels(r.bestFor),
        error: r.error ?? "",
      },
    ]
  })))

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>wx-publisher 主题画廊 · ${escapeHtml(fileName)}</title>
<style>
  * { box-sizing: border-box; }
  :root {
    --paper: #faf8f3;
    --paper-strong: #fffdf8;
    --ink: #18202d;
    --muted: #667085;
    --line: #e5ded5;
    --brand: #b45a3a;
    --brand-soft: #f5e8df;
  }
  html { background: #ebe8e1; overflow-x: hidden; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    background:
      radial-gradient(circle at 20% 0%, rgba(180,90,58,.12), transparent 34%),
      linear-gradient(135deg, #f8f5ee 0%, #eef1f4 52%, #f9f7f1 100%);
    color: var(--ink);
    overflow-x: hidden;
  }
  button, input, textarea { font: inherit; }
  .gallery-shell { min-height: 100vh; padding: clamp(22px, 3vw, 42px); }
  .gallery-hero {
    max-width: 1480px;
    margin: 0 auto 18px;
    padding: clamp(26px, 5vw, 54px);
    border: 1px solid rgba(229,222,213,.9);
    border-radius: 28px;
    background:
      linear-gradient(135deg, rgba(255,255,255,.92), rgba(250,248,243,.78)),
      repeating-linear-gradient(135deg, rgba(180,90,58,.05) 0 1px, transparent 1px 18px);
    box-shadow: 0 28px 80px rgba(38, 31, 24, .12);
  }
  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr);
    gap: clamp(22px, 4vw, 54px);
    align-items: end;
  }
  .eyebrow {
    margin: 0 0 13px;
    color: var(--brand);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .18em;
  }
  .hero-title {
    max-width: 780px;
    margin: 0;
    font-size: clamp(34px, 5vw, 68px);
    line-height: 1.05;
    letter-spacing: 0;
    color: #151a22;
    overflow-wrap: anywhere;
  }
  .hero-title span { display: block; }
  .hero-copy {
    max-width: 760px;
    margin: 18px 0 0;
    color: #475467;
    font-size: clamp(16px, 2vw, 20px);
    line-height: 1.75;
    overflow-wrap: anywhere;
  }
  .hero-copy strong { color: var(--brand); font-weight: 800; }
  .source-path { margin: 18px 0 0; color: #7a6f66; font-size: 13px; word-break: break-all; }
  .stats-panel {
    display: grid;
    gap: 12px;
    padding: 18px;
    border: 1px solid rgba(180,90,58,.18);
    border-radius: 22px;
    background: rgba(255,255,255,.74);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
  }
  .stat-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
  .stat-label { color: #667085; font-size: 13px; }
  .stat-value { color: #18202d; font-size: 24px; font-weight: 850; }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    max-width: 1480px;
    margin: 0 auto 18px;
    display: grid;
    grid-template-columns: minmax(240px, 380px) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    padding: 14px;
    border: 1px solid rgba(229,222,213,.9);
    border-radius: 20px;
    background: rgba(255,253,248,.92);
    backdrop-filter: blur(16px);
    box-shadow: 0 14px 38px rgba(38, 31, 24, .08);
  }
  .search-input {
    width: 100%;
    min-height: 44px;
    border: 1px solid #d8d0c6;
    border-radius: 14px;
    padding: 11px 14px;
    outline: none;
    color: #1d2531;
    background: #fff;
  }
  .search-input:focus { border-color: var(--brand); box-shadow: 0 0 0 4px rgba(180,90,58,.12); }
  .filter-stack { display: grid; gap: 9px; min-width: 0; }
  .filter-row { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; min-width: 0; }
  .filter-label { min-width: 68px; color: #7a6f66; font-size: 12px; font-weight: 800; }
  .filter-chip {
    border: 1px solid #ded7ce;
    background: #fff;
    color: #475467;
    border-radius: 999px;
    padding: 6px 11px;
    font-size: 12px;
    cursor: pointer;
    transition: background .16s ease, color .16s ease, border-color .16s ease, transform .16s ease;
  }
  .filter-chip:hover { transform: translateY(-1px); border-color: rgba(180,90,58,.38); }
  .filter-chip.active { background: #201a17; border-color: #201a17; color: #fff; }
  .theme-grid {
    max-width: 1480px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 18px;
  }
  .theme-card {
    display: grid;
    grid-template-rows: auto 330px auto;
    min-height: 548px;
    border: 1px solid #e2dcd5;
    border-radius: 24px;
    overflow: hidden;
    background: rgba(255,255,255,.92);
    box-shadow: 0 18px 46px rgba(38, 31, 24, .09);
    cursor: pointer;
    text-align: left;
    padding: 0;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }
  .theme-card:hover { transform: translateY(-3px); border-color: rgba(180,90,58,.38); box-shadow: 0 26px 58px rgba(38, 31, 24, .14); }
  .theme-card[hidden] { display: none; }
  .theme-card-error { border-color: #efb8b8; background: #fff7f7; }
  .card-head { padding: 18px 18px 14px; border-bottom: 1px solid #eee7df; background: linear-gradient(180deg, #fff, #fffaf5); }
  .card-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-width: 0; }
  .card-name { margin: 0; color: #171d27; font-size: 21px; line-height: 1.25; font-weight: 850; letter-spacing: 0; }
  .card-id { margin: 7px 0 0; color: #7a6f66; font-size: 12px; font-family: "SFMono-Regular", Consolas, monospace; }
  .accent-row { display: flex; gap: 6px; align-items: center; flex: 0 0 auto; padding-top: 3px; }
  .accent-swatch { width: 15px; height: 15px; border-radius: 50%; border: 1px solid rgba(0,0,0,.12); box-shadow: 0 0 0 3px rgba(255,255,255,.78); }
  .badge-row { margin-top: 13px; display: flex; flex-wrap: wrap; gap: 7px; }
  .meta-badge {
    border: 1px solid #e4ddd5;
    background: #f9f6f1;
    color: #5f6b7a;
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 11px;
    line-height: 1.45;
  }
  .meta-badge.primary { border-color: rgba(180,90,58,.2); background: var(--brand-soft); color: var(--brand); font-weight: 750; }
  .card-preview-frame { position: relative; overflow: hidden; background: #f4f1ec; border-bottom: 1px solid #eee7df; }
  .card-preview-frame::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 90px;
    background: linear-gradient(to bottom, rgba(244,241,236,0), #f4f1ec);
    pointer-events: none;
  }
  .preview-source {
    width: 677px;
    min-height: 760px;
    transform: scale(.46);
    transform-origin: top left;
    background: #fff;
  }
  .card-foot { padding: 14px 18px 18px; min-height: 96px; color: #586474; font-size: 13px; line-height: 1.65; }
  .tone-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .tone-chip { color: #7a3f2b; background: #f8ece4; border-radius: 999px; padding: 3px 8px; font-size: 11px; }
  .error-box { padding: 24px; color: #9f2f2f; font-family: "SFMono-Regular", Consolas, monospace; font-size: 13px; line-height: 1.6; }
  .empty-state { max-width: 1480px; margin: 18px auto 0; color: #69717d; display: none; }
  .empty-state.visible { display: block; }
  .detail-panel {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: none;
    background: rgba(22, 18, 15, .58);
  }
  .detail-panel.open { display: grid; grid-template-columns: minmax(320px, 430px) minmax(0, 1fr); }
  .detail-sidebar {
    background: #fffdf8;
    padding: 24px;
    overflow: auto;
    border-right: 1px solid #e2dcd5;
  }
  .detail-close {
    border: 1px solid #ded7ce;
    background: #fff;
    color: #1f2732;
    border-radius: 12px;
    padding: 8px 12px;
    cursor: pointer;
  }
  .detail-title { margin: 24px 0 6px; font-size: 30px; line-height: 1.15; color: #15191f; }
  .detail-id { margin: 0 0 16px; font-family: "SFMono-Regular", Consolas, monospace; color: #7a6f66; }
  .detail-meta { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 18px; }
  .detail-help { color: #586474; line-height: 1.7; font-size: 14px; }
  .command-box { margin-top: 18px; display: grid; gap: 9px; }
  .cover-input, .cmd-text {
    width: 100%;
    border: 1px solid #ded7ce;
    background: #fff;
    border-radius: 12px;
    padding: 10px 11px;
    color: #1f2732;
    font-size: 13px;
  }
  .cmd-text { min-height: 90px; resize: vertical; font-family: "SFMono-Regular", Consolas, monospace; line-height: 1.55; }
  .copy-btn {
    border: 0;
    background: #201a17;
    color: #fff;
    border-radius: 12px;
    padding: 11px 14px;
    cursor: pointer;
  }
  .copy-btn.copied { background: #15803d; }
  .detail-preview-wrap { overflow: auto; padding: 32px 18px; background: #ece8df; }
  .detail-preview {
    max-width: 760px;
    margin: 0 auto;
    background: #fff;
    box-shadow: 0 24px 68px rgba(17,24,39,.25);
  }
  @media (max-width: 900px) {
    .hero-grid, .toolbar { grid-template-columns: 1fr; }
    .detail-panel.open { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .detail-sidebar { max-height: 42vh; border-right: 0; border-bottom: 1px solid #e2dcd5; }
  }
  @media (max-width: 560px) {
    .gallery-shell { padding: 16px; overflow-x: hidden; }
    .gallery-hero { padding: 24px 18px; border-radius: 22px; overflow: hidden; }
    .hero-title { font-size: 31px; line-height: 1.16; }
    .hero-copy { font-size: 15px; line-height: 1.7; }
    .stats-panel, .toolbar, .theme-card { min-width: 0; }
    .toolbar { padding: 12px; border-radius: 18px; }
    .filter-label { min-width: 48px; }
    .theme-grid { grid-template-columns: minmax(0, 1fr); }
    .theme-card { grid-template-rows: auto 300px auto; }
    .preview-source { transform: scale(.44); }
  }
</style>
</head>
<body>
<main class="gallery-shell" data-page="theme-gallery">
  <header class="gallery-hero">
    <div class="hero-grid">
      <section>
        <p class="eyebrow">THEME GALLERY</p>
        <h1 class="hero-title"><span>主题不是换配色，</span><span>是切换内容气质</span></h1>
        <p class="hero-copy"><strong>主题负责气质</strong>，模块负责说服力。这里把 48 个主题放在同一篇样稿里，方便按内容场景、表达密度和视觉语气快速比较。</p>
        <p class="source-path">样稿：${escapeHtml(filePath)}</p>
      </section>
      <aside class="stats-panel" aria-label="主题统计">
        <div class="stat-row"><span class="stat-label">公开主题</span><span class="stat-value">${results.length}</span></div>
        <div class="stat-row"><span class="stat-label">渲染成功</span><span class="stat-value">${successfulThemes.length}</span></div>
        <div class="stat-row"><span class="stat-label">内容系列</span><span class="stat-value">${collections.length}</span></div>
      </aside>
    </div>
  </header>

  <section class="toolbar" aria-label="主题筛选">
    <input class="search-input" id="themeSearch" type="search" placeholder="搜索主题、场景或气质">
    <div class="filter-stack">
      ${renderFilterGroup("collection", "系列", collections)}
      ${renderFilterGroup("scenario", "场景", scenarios)}
      ${renderFilterGroup("density", "密度", densities)}
      ${renderFilterGroup("contrast", "对比", contrasts)}
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
  const activeFilters = { collection: "all", scenario: "all", density: "all", contrast: "all" };

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
      meta.collectionLabel,
      meta.densityLabel,
      meta.contrastLabel,
      ...meta.scenarios
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
      const matchesScenario = activeFilters.scenario === "all" || card.dataset.scenario.split("|").includes(activeFilters.scenario);
      const matchesDensity = activeFilters.density === "all" || card.dataset.density === activeFilters.density;
      const matchesContrast = activeFilters.contrast === "all" || card.dataset.contrast === activeFilters.contrast;
      const show = matchesQuery && matchesCollection && matchesScenario && matchesDensity && matchesContrast;
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
  const bestFor = result.bestFor ?? "自定义主题，适合按当前文章单独验收。"
  const scenarios = scenarioLabels(result.bestFor)
  const tones = toneLabels(result.bestFor)
  const search = [result.theme, name, collectionLabel(collection), densityLabel(density), contrastLabel(contrast), bestFor, ...scenarios, ...tones].join(" ").toLowerCase()
  const errorClass = result.error ? " theme-card-error" : ""
  const errorAttr = result.error ? ' data-error="true"' : ""
  const preview = result.error
    ? `<div class="error-box">渲染失败<br>${escapeHtml(result.error)}</div>`
    : `<div class="preview-source">${result.html}</div>`

  return `<button class="theme-card${errorClass}" data-theme="${escapeAttr(result.theme)}" data-collection="${escapeAttr(collection)}" data-scenario="${escapeAttr(scenarios.join("|"))}" data-density="${escapeAttr(density)}" data-contrast="${escapeAttr(contrast)}" data-search="${escapeAttr(search)}"${errorAttr} type="button">
      <div class="card-head">
        <div class="card-title-row">
          <div>
            <h2 class="card-name">${escapeHtml(name)}</h2>
            <p class="card-id">${escapeHtml(result.theme)}</p>
          </div>
          <div class="accent-row">
            <span class="accent-swatch" style="background:${escapeAttr(accent)}"></span>
          </div>
        </div>
        <div class="badge-row">
          <span class="meta-badge primary">${escapeHtml(collectionLabel(collection))}</span>
          <span class="meta-badge">${escapeHtml(densityLabel(density))}</span>
          <span class="meta-badge">${escapeHtml(contrastLabel(contrast))}</span>
          ${scenarios.map(label => `<span class="meta-badge">${escapeHtml(label)}</span>`).join("")}
        </div>
      </div>
      <div class="card-preview-frame">${preview}</div>
      <div class="card-foot">
        <div>${escapeHtml(bestFor)}</div>
        <div class="tone-row">${tones.map(label => `<span class="tone-chip">${escapeHtml(label)}</span>`).join("")}</div>
      </div>
    </button>`
}

function renderFilterGroup(group: FilterGroup, label: string, values: string[]): string {
  const allText = group === "collection" ? "全部系列"
    : group === "scenario" ? "全部场景"
      : group === "density" ? "全部密度"
        : "全部对比"
  const chips = ["all", ...values].map((value, index) => {
    const active = index === 0 ? " active" : ""
    const text = value === "all" ? allText : filterValueLabel(group, value)
    return `<button class="filter-chip${active}" data-filter-group="${group}" data-filter-value="${escapeAttr(value)}" type="button">${escapeHtml(text)}</button>`
  }).join("")
  return `<div class="filter-row" data-filter-group="${group}"><span class="filter-label">${label}</span>${chips}</div>`
}

const COLLECTION_ORDER = ["built-in", "classic", "modern", "extra", "minimal", "focus", "elegant", "bold", "custom"]
const SCENARIO_ORDER = ["知识", "产品", "品牌", "运营", "专题"]
const DENSITY_ORDER = ["low", "medium", "high"]
const CONTRAST_ORDER = ["low", "medium", "high"]

function uniqueValues(values: string[], order: string[] = []): string[] {
  const unique = [...new Set(values.filter(Boolean))]
  return unique.sort((a, b) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai >= 0 || bi >= 0) return (ai >= 0 ? ai : 999) - (bi >= 0 ? bi : 999)
    return a.localeCompare(b, "zh-CN")
  })
}

function filterValueLabel(group: FilterGroup, value: string): string {
  if (group === "collection") return collectionLabel(value)
  if (group === "density") return densityLabel(value)
  if (group === "contrast") return contrastLabel(value)
  return value
}

function collectionLabel(value: string): string {
  const labels: Record<string, string> = {
    "built-in": "原生",
    "classic": "经典",
    "modern": "精选",
    "extra": "专题",
    "minimal": "简约",
    "focus": "聚焦",
    "elegant": "精致",
    "bold": "醒目",
    "custom": "自定义",
  }
  return labels[value] ?? value
}

function densityLabel(value: string): string {
  const labels: Record<string, string> = { low: "低密度", medium: "中密度", high: "高密度" }
  return labels[value] ?? value
}

function contrastLabel(value: string): string {
  const labels: Record<string, string> = { low: "低对比", medium: "中对比", high: "高对比" }
  return labels[value] ?? value
}

function scenarioLabels(bestFor?: string): string[] {
  const source = bestFor ?? ""
  const labels = SCENARIO_ORDER.filter(label => source.includes(label))
  return labels.length ? labels : ["自定义"]
}

function toneLabels(bestFor?: string): string[] {
  const source = bestFor ?? ""
  const match = source.match(/气质偏([^。]+)/)
  if (!match) return []
  return match[1].split(/[、,，]/).map(label => label.trim()).filter(Boolean).slice(0, 4)
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
