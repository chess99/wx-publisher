/**
 * 生成选图页 HTML。
 *
 * 图片通过本地 HTTP 服务（selection-server）提供，选定后向 /select?index=N 发请求。
 * 页面自包含，无外部依赖。
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

  const imagesHtml = Array.from({ length: imageCount }, (_, i) => `
    <div class="img-card" id="card-${i}" onclick="selectImage(${i})">
      <img src="${base}/image/${i}" alt="候选图 ${i + 1}" loading="lazy">
      <div class="img-label">候选 ${i + 1}</div>
      <div class="img-overlay">
        <button class="select-btn">选定这张</button>
      </div>
    </div>`).join("\n")

  const fileName = filePath.split("/").pop() ?? filePath

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>封面图选择 · ${escapeHtml(fileName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", Arial, sans-serif; background: #f0f0f0; min-height: 100vh; }

  .header { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 14px 24px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
  .header-badge { font-size: 11px; background: #07c160; color: #fff; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }
  .header-title { font-size: 14px; color: #666; }

  .prompt-bar { background: #fffbe6; border-bottom: 1px solid #ffe58f; padding: 10px 24px; display: flex; align-items: flex-start; gap: 10px; }
  .prompt-label { font-size: 12px; color: #ad8b00; white-space: nowrap; padding-top: 1px; }
  .prompt-text { font-size: 13px; color: #614700; flex: 1; line-height: 1.5; font-style: italic; }

  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; padding: 24px; max-width: 1400px; margin: 0 auto; }

  .img-card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; position: relative; transition: transform 0.15s, box-shadow 0.15s; }
  .img-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
  .img-card.selected { box-shadow: 0 0 0 3px #07c160, 0 6px 20px rgba(0,0,0,0.15); }
  .img-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #f5f5f5; }
  .img-label { padding: 8px 12px; font-size: 13px; color: #666; }

  .img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
  .img-card:hover .img-overlay { opacity: 1; }
  .select-btn { background: #07c160; color: #fff; border: none; border-radius: 6px; padding: 10px 24px; font-size: 15px; cursor: pointer; font-weight: 500; }
  .select-btn:hover { background: #06ae56; }

  .status { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 14px; display: none; }
</style>
</head>
<body>

<div class="header">
  <span class="header-badge">wx-publisher</span>
  <span class="header-title">选择封面图 · ${escapeHtml(fileName)}</span>
</div>

<div class="prompt-bar">
  <span class="prompt-label">提示词：</span>
  <span class="prompt-text">${escapeHtml(prompt)}</span>
</div>

<div class="grid">
${imagesHtml}
</div>

<div class="status" id="status"></div>

<script>
  function selectImage(index) {
    // 禁用再次点击
    document.querySelectorAll('.img-card').forEach(c => c.style.pointerEvents = 'none');
    document.getElementById('card-' + index).classList.add('selected');

    const status = document.getElementById('status');
    status.textContent = '正在确认选择...';
    status.style.display = 'block';

    fetch('${base}/select?index=' + index)
      .then(r => r.json())
      .then(() => {
        status.textContent = '✓ 已选定候选 ' + (index + 1) + '，终端将输出封面图路径';
        status.style.background = '#07c160';
      })
      .catch(() => {
        status.textContent = '网络错误，请重试';
        status.style.background = '#ff4d4f';
        document.querySelectorAll('.img-card').forEach(c => c.style.pointerEvents = '');
      });
  }
</script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
