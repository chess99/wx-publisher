/**
 * 生成选图页 HTML。
 *
 * 图片通过本地 HTTP 服务（selection-server）提供，选定后向 /select?index=N 发请求。
 * 页面自包含，无外部依赖。
 *
 * 交互状态：
 *   空闲    — hover 高亮 + 底部"选定"按钮
 *   选中中  — 全卡片锁定 + 选中卡片绿色边框 + spinner
 *   完成    — 全屏 overlay + 勾选动画 + 关闭提示
 *   错误    — toast 提示 + 恢复可点击
 */

export interface GenCoverHtmlOptions {
  port: number
  imageCount: number
  prompt: string
  filePath: string
}

export function generateGenCoverHtml(opts: GenCoverHtmlOptions): string {
  const { port, imageCount, prompt, filePath } = opts
  const base = `http://localhost:${port}`

  const cardsHtml = Array.from({ length: imageCount }, (_, i) => `
    <div class="card" id="card-${i}" role="button" tabindex="${i}" aria-label="候选图 ${i + 1}" onclick="selectImage(${i})" onkeydown="if(event.key==='Enter'||event.key===' ')selectImage(${i})">
      <div class="card-img-wrap">
        <img src="${base}/image/${i}" alt="候选图 ${i + 1}">
        <div class="card-overlay">
          <div class="card-overlay-inner">
            <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>选定这张</span>
          </div>
        </div>
        <div class="card-spinner" id="spinner-${i}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        </div>
      </div>
      <div class="card-footer">
        <span class="card-num">候选 ${i + 1}</span>
        <span class="card-hint">点击选定</span>
      </div>
    </div>`).join("")

  const fileName = filePath.split("/").pop() ?? filePath

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>选择封面图 · ${escapeHtml(fileName)}</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --green: #07c160;
  --green-dark: #059a4c;
  --green-bg: #f0fdf4;
  --surface: #ffffff;
  --bg: #f1f5f9;
  --border: #e2e8f0;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --red: #ef4444;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-hover: 0 4px 16px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.08);
  --radius: 12px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
  background: var(--bg);
  color: var(--text-primary);
  min-height: 100vh;
}

/* ── Header ── */
.header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 1px 0 var(--border);
}
.badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: var(--green);
  color: #fff;
  padding: 3px 9px;
  border-radius: 20px;
  flex-shrink: 0;
}
.header-file {
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-sep { color: var(--border); margin: 0 2px; }

/* ── Prompt bar ── */
.prompt-bar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 10px 24px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.prompt-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--green-dark);
  white-space: nowrap;
  margin-top: 1px;
  flex-shrink: 0;
}
.prompt-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  font-style: italic;
}

/* ── Grid ── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Card ── */
.card {
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  outline: none;
  border: 2px solid transparent;
  transition: transform 200ms cubic-bezier(.22,.68,0,1.2),
              box-shadow 200ms ease,
              border-color 200ms ease;
  position: relative;
}
.card:hover {
  transform: translateY(-3px) scale(1.005);
  box-shadow: var(--shadow-hover);
}
.card:focus-visible {
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgba(7,193,96,0.25);
}

.card-img-wrap {
  position: relative;
  overflow: hidden;
  background: #e2e8f0;
  aspect-ratio: 16/9;
}
.card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 200ms ease;
}
.card:hover .card-img-wrap img {
  transform: scale(1.02);
}

/* hover overlay */
.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(7, 193, 96, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 180ms ease;
  backdrop-filter: blur(2px);
}
.card:hover .card-overlay { opacity: 1; }
.card-overlay-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  transform: translateY(4px);
  transition: transform 180ms ease;
}
.card:hover .card-overlay-inner { transform: translateY(0); }
.card-overlay .check-icon {
  width: 32px; height: 32px;
  stroke: #fff;
  stroke-width: 2.5;
}

/* spinner (shown while confirming) */
.card-spinner {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.85);
  display: none;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.card-spinner svg {
  width: 40px; height: 40px;
  stroke: var(--green);
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* selected state */
.card.selected {
  border-color: var(--green);
  box-shadow: 0 0 0 4px rgba(7,193,96,0.2), var(--shadow-hover);
}

/* card footer */
.card-footer {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-num {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}
.card-hint {
  font-size: 12px;
  color: var(--text-muted);
  transition: color 150ms;
}
.card:hover .card-hint { color: var(--green); }

/* locked state (after selection) */
.card.locked {
  cursor: not-allowed;
  opacity: 0.45;
  transform: none !important;
  box-shadow: var(--shadow-card) !important;
}
.card.locked .card-overlay { display: none; }
.card.locked .card-hint { display: none; }
.card.selected.locked {
  opacity: 1;
  cursor: default;
}

/* ── Success overlay ── */
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: none;
  align-items: center;
  justify-content: center;
  animation: fadeIn 250ms ease;
}
.success-overlay.show { display: flex; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.success-card {
  background: var(--surface);
  border-radius: 20px;
  padding: 40px 48px;
  max-width: 440px;
  width: calc(100% - 48px);
  text-align: center;
  box-shadow: 0 24px 80px rgba(0,0,0,0.3);
  animation: slideUp 300ms cubic-bezier(.34,1.56,.64,1);
}
@keyframes slideUp {
  from { transform: translateY(24px) scale(0.96); opacity: 0; }
  to   { transform: translateY(0)    scale(1);    opacity: 1; }
}

.success-icon {
  width: 72px;
  height: 72px;
  background: var(--green-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}
.success-icon svg {
  width: 36px; height: 36px;
  stroke: var(--green);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: drawCheck 400ms cubic-bezier(.4,0,.2,1) 200ms forwards;
}
@keyframes drawCheck { to { stroke-dashoffset: 0; } }

.success-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.success-sub {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}
.success-path {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  font-family: "SFMono-Regular", "JetBrains Mono", Consolas, monospace;
  color: var(--text-secondary);
  word-break: break-all;
  text-align: left;
  margin-bottom: 24px;
  display: none;
}
.success-path.show { display: block; }

.close-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--green-bg);
  color: var(--green-dark);
  border: 1px solid rgba(7,193,96,0.25);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
}
.kbd {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 12px;
  font-family: monospace;
  box-shadow: 0 1px 0 var(--border);
  color: var(--text-primary);
}

/* ── Error toast ── */
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%) translateY(80px);
  background: #1e293b;
  color: #fff;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  transition: transform 250ms cubic-bezier(.34,1.56,.64,1), opacity 250ms;
  opacity: 0;
  z-index: 50;
}
.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
.toast-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); flex-shrink: 0; }

@media (prefers-reduced-motion: reduce) {
  .card, .card-img-wrap img, .card-overlay, .card-overlay-inner,
  .success-overlay, .success-card, .success-icon svg, .toast {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 480px) {
  .grid { grid-template-columns: 1fr; padding: 16px; gap: 14px; }
  .success-card { padding: 28px 24px; }
}
</style>
</head>
<body>

<div class="header">
  <span class="badge">wx-publisher</span>
  <span class="header-file">选择封面图<span class="header-sep"> / </span>${escapeHtml(fileName)}</span>
</div>

<div class="prompt-bar">
  <span class="prompt-label">Prompt</span>
  <span class="prompt-text">${escapeHtml(prompt)}</span>
</div>

<div class="grid" id="grid">${cardsHtml}</div>

<!-- 完成状态 overlay -->
<div class="success-overlay" id="successOverlay" role="dialog" aria-modal="true" aria-labelledby="successTitle">
  <div class="success-card">
    <div class="success-icon">
      <svg viewBox="0 0 24 24" fill="none" id="checkSvg"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <div class="success-title" id="successTitle">封面图已选定</div>
    <div class="success-sub" id="successSub">候选图已写入本地文件，终端正在等待此结果。</div>
    <div class="success-path" id="successPath"></div>
    <div class="close-hint">
      <kbd class="kbd">⌘W</kbd> 或 <kbd class="kbd">Ctrl W</kbd> 关闭此标签页
    </div>
  </div>
</div>

<!-- 错误 toast -->
<div class="toast" id="toast" role="alert" aria-live="assertive">
  <span class="toast-dot"></span>
  <span id="toastMsg">请求失败，请重试</span>
</div>

<script>
var locked = false;

function selectImage(index) {
  if (locked) return;
  locked = true;

  // 锁定所有卡片
  document.querySelectorAll('.card').forEach(function(c) {
    c.classList.add('locked');
  });

  // 选中高亮 + 显示 spinner
  var card = document.getElementById('card-' + index);
  card.classList.add('selected');
  var spinner = document.getElementById('spinner-' + index);
  if (spinner) spinner.style.display = 'flex';

  fetch('${base}/select?index=' + index)
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      // 隐藏 spinner
      if (spinner) spinner.style.display = 'none';
      showSuccess(index + 1, data.path || '');
    })
    .catch(function(err) {
      // 恢复：隐藏 spinner，解锁
      if (spinner) spinner.style.display = 'none';
      card.classList.remove('selected');
      document.querySelectorAll('.card').forEach(function(c) {
        c.classList.remove('locked');
      });
      locked = false;
      showToast('网络错误：' + (err.message || '请重试'));
    });
}

function showSuccess(num, path) {
  var overlay = document.getElementById('successOverlay');
  var sub = document.getElementById('successSub');
  var pathEl = document.getElementById('successPath');

  sub.textContent = '已选定候选 ' + num + '，封面图已写入本地文件。';

  if (path) {
    pathEl.textContent = path;
    pathEl.classList.add('show');
  }

  overlay.classList.add('show');
  overlay.focus();
}

var toastTimer;
function showToast(msg) {
  var toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, 4000);
}
</script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
