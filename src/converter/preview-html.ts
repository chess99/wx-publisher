/**
 * 生成主题预览 HTML
 *
 * 输入：Markdown 原文 + 各主题预渲染结果 + 原始文件绝对路径
 * 输出：自包含的单页 HTML，无外部依赖
 *
 * 页面结构：
 *   顶部 tab 栏（每个主题一个 tab）
 *   中间内容区（各主题 div，非当前主题 display:none）
 *   底部命令栏（封面图输入框 + 完整 wxp publish 命令 + 复制按钮）
 */

export interface ThemePreviewResult {
  theme: string
  html: string
  error?: string
}

export function generatePreviewHtml(
  results: ThemePreviewResult[],
  filePath: string
): string {
  const successResults = results.filter(r => !r.error)
  const firstTheme = successResults[0]?.theme ?? ""

  const tabsHtml = results
    .map(r => {
      const active = r.theme === firstTheme ? " tab-active" : ""
      const disabled = r.error ? ' style="opacity:0.4;cursor:not-allowed;"' : ""
      const title = r.error ? ` title="渲染失败: ${escapeAttr(r.error)}"` : ""
      return `<button class="tab${active}" data-theme="${escapeAttr(r.theme)}"${disabled}${title}>${escapeHtml(r.theme)}</button>`
    })
    .join("\n    ")

  const panelsHtml = results
    .map(r => {
      const visible = r.theme === firstTheme ? "" : ' style="display:none"'
      const content = r.error
        ? `<div style="padding:40px;color:#e06c75;font-family:monospace;">渲染失败：${escapeHtml(r.error)}</div>`
        : r.html
      return `<div class="panel" data-theme="${escapeAttr(r.theme)}"${visible}>${content}</div>`
    })
    .join("\n    ")

  // 为每个主题预生成命令字符串（不含 --cover，由 JS 动态拼接）
  const commandsJson = JSON.stringify(
    Object.fromEntries(results.filter(r => !r.error).map(r => [
      r.theme,
      `wxp publish --file ${filePath} --theme ${r.theme}`,
    ]))
  )

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>wx-publisher 预览 · ${escapeHtml(filePath.split("/").pop() ?? filePath)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif; background: #f5f5f5; }

  /* 顶部 header */
  .header { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 12px 20px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
  .header-title { font-size: 14px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header-badge { font-size: 11px; background: #07c160; color: #fff; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }

  /* Tab 栏 */
  .tabs { display: flex; gap: 4px; background: #fff; padding: 0 20px; border-bottom: 1px solid #e8e8e8; }
  .tab { border: none; background: none; padding: 12px 16px; font-size: 14px; color: #666; cursor: pointer; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; }
  .tab:hover { color: #333; }
  .tab-active { color: #07c160; border-bottom-color: #07c160; font-weight: 500; }

  /* 内容区 */
  .content { padding: 24px 20px 120px; max-width: 760px; margin: 0 auto; }
  .panel { background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

  /* 底部命令栏 */
  .bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e8e8e8; padding: 12px 20px; box-shadow: 0 -2px 8px rgba(0,0,0,0.06); }
  .bottom-inner { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
  .cover-row { display: flex; align-items: center; gap: 8px; }
  .cover-label { font-size: 12px; color: #999; white-space: nowrap; }
  .cover-input { flex: 1; border: 1px solid #d9d9d9; border-radius: 4px; padding: 5px 10px; font-size: 13px; font-family: "SFMono-Regular", Consolas, monospace; color: #333; outline: none; transition: border-color 0.15s; }
  .cover-input:focus { border-color: #07c160; }
  .cover-input::placeholder { color: #bbb; }
  .cmd-row { display: flex; align-items: center; gap: 8px; }
  .cmd-text { flex: 1; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 13px; color: #333; background: #f8f8f8; border: 1px solid #e8e8e8; border-radius: 4px; padding: 6px 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .copy-btn { flex-shrink: 0; background: #07c160; color: #fff; border: none; border-radius: 4px; padding: 6px 16px; font-size: 13px; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .copy-btn:hover { background: #06ae56; }
  .copy-btn.copied { background: #52c41a; }
</style>
</head>
<body>

<div class="header">
  <span class="header-badge">wx-publisher</span>
  <span class="header-title">预览 · ${escapeHtml(filePath)}</span>
</div>

<div class="tabs">
  ${tabsHtml}
</div>

<div class="content">
  ${panelsHtml}
</div>

<div class="bottom-bar">
  <div class="bottom-inner">
    <div class="cover-row">
      <span class="cover-label">封面图：</span>
      <input class="cover-input" id="coverInput" type="text" placeholder="本地路径 /path/to/cover.jpg  或  URL https://example.com/cover.jpg">
    </div>
    <div class="cmd-row">
      <span class="cmd-text" id="cmdText"></span>
      <button class="copy-btn" id="copyBtn">复制命令</button>
    </div>
  </div>
</div>

<script>
  const COMMANDS = ${commandsJson};
  let activeTheme = ${JSON.stringify(firstTheme)};

  function updateCommand() {
    const cover = document.getElementById('coverInput').value.trim();
    let cmd = COMMANDS[activeTheme] || '';
    if (cover) {
      const isUrl = cover.startsWith('http://') || cover.startsWith('https://');
      cmd += isUrl ? ' --cover-url ' + cover : ' --cover ' + cover;
    }
    document.getElementById('cmdText').textContent = cmd;
  }

  function switchTab(theme) {
    activeTheme = theme;
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('tab-active', t.dataset.theme === theme);
    });
    document.querySelectorAll('.panel').forEach(p => {
      p.style.display = p.dataset.theme === theme ? '' : 'none';
    });
    updateCommand();
  }

  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) switchTab(btn.dataset.theme);
    });
  });

  document.getElementById('coverInput').addEventListener('input', updateCommand);

  document.getElementById('copyBtn').addEventListener('click', () => {
    const cmd = document.getElementById('cmdText').textContent;
    if (!cmd) return;
    navigator.clipboard.writeText(cmd).then(() => {
      const btn = document.getElementById('copyBtn');
      btn.textContent = '已复制 ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '复制命令'; btn.classList.remove('copied'); }, 2000);
    });
  });

  updateCommand();
</script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}
