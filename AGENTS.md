# wx-publisher — Agent 工作手册

本文件面向 AI Agent（Claude、GPT 等）。人类开发者请读 README.md。

## 这个工具是什么

`wx-publisher` 是一个 CLI 工具，把 Markdown 文件发布到微信公众号草稿箱。
**无需第三方 API Key**，Markdown → HTML 转换完全本地完成。

## 快速判断：用不用这个工具

**用**：用户想把 Markdown/博客文章发到微信公众号草稿箱。

**不用**：
- 用户只是想预览排版（用 `convert` 命令即可，不需要微信凭证）
- 用户想直接发布（微信 API 不支持直接发布，只能创建草稿）

## 前置检查（每次使用前必做）

```bash
wxp capabilities        # 确认工具可用，查看支持的主题
wxp config get          # 检查微信凭证是否已配置
```

如果 `wechat_appid` 或 `wechat_secret` 显示 `(未设置)`，需要先配置：

```bash
wxp config set wechat_appid wx你的AppID
wxp config set wechat_secret 你的AppSecret
```

微信凭证从哪里获取：微信公众平台 → 设置与开发 → 基本配置。

## 发布流程

### 标准流程（有封面图）

```bash
wxp publish \
  --file /path/to/article.md \
  --cover /path/to/cover.jpg \
  --theme tech \
  --title "文章标题"
```

### 封面图是网络 URL

```bash
wxp publish \
  --file /path/to/article.md \
  --cover-url https://example.com/cover.jpg \
  --theme default
```

### 成功输出示例

```json
{
  "success": true,
  "data": {
    "media_id": "xxxxx",
    "title": "文章标题",
    "theme": "tech",
    "images_uploaded": 3,
    "message": "草稿已创建，请在微信公众号后台发布"
  }
}
```

`media_id` 是草稿 ID，可在微信公众号后台草稿箱找到对应文章。

## 主题选择指南

| 主题 | 适合场景 |
|------|---------|
| `default` | 通用，绿色强调，微信经典风 |
| `tech` | 技术文章，蓝色强调，代码高亮深色背景 |
| `elegant` | 深度内容，金色强调，衬线字体 |
| `minimal` | 内容优先，无装饰，简洁 |

查看所有主题：`wxp themes`

## 仅转换不发布

```bash
# 输出到文件
wxp convert --file article.md --theme tech --output /tmp/preview.html

# 输出到 stdout（方便 pipe）
wxp convert --file article.md --theme tech > /tmp/preview.html
```

## 错误处理

所有命令输出 JSON，失败时：

```json
{
  "success": false,
  "error": "错误描述",
  "details": "具体错误信息"
}
```

**常见错误及处理：**

| 错误 | 原因 | 处理 |
|------|------|------|
| `配置不完整` | AppID/Secret 未设置 | `wxp config set` 设置凭证 |
| `获取 access_token 失败` | AppID/Secret 错误 | 检查微信公众平台凭证 |
| `上传图片失败: invalid media_id` | 图片格式不支持 | 使用 jpg/png/gif/webp |
| `创建草稿失败: 48001` | 没有接口权限 | 需要认证公众号 |

## 项目结构（修改时参考）

```
src/
├── cli/index.ts          # CLI 入口，commander 定义所有命令
├── converter/
│   ├── index.ts          # Markdown → HTML 核心转换逻辑
│   └── themes.ts         # 主题定义（NodeStyles 接口 + 各主题样式）
├── wechat/
│   └── client.ts         # 微信 API 客户端（token/上传/草稿）
└── config/
    └── index.ts          # 配置读写（~/.config/wx-publisher/config.json）
```

## 新增主题（Agent 可直接操作）

在 `src/converter/themes.ts` 的 `themes` 对象里添加新条目：

```typescript
yourTheme: {
  name: "yourTheme",
  description: "主题描述",
  styles: {
    wrapper: "...",
    h1: "...",
    h2: "...",
    // ... 参考 NodeStyles 接口的所有字段
  }
}
```

主题样式要求：
- 所有样式必须是内联 CSS 字符串（`"font-size:16px;color:#333;"` 格式）
- 不能用 class 名，微信公众号不支持外部 CSS
- `wrapper` 是整体容器样式，设置字体族和最大宽度

## 微信 API 限制（重要）

- **草稿不等于发布**：`publish` 命令只创建草稿，需人工在后台发布
- **图片必须是微信 URL**：外链图片微信会屏蔽，工具会自动上传
- **素材库有容量限制**：永久素材最多 5000 个，超出会报错
- **access_token 有效期 7200s**：工具自动缓存，无需手动管理
- **每天调用次数限制**：获取 access_token 每天最多 2000 次（缓存机制避免浪费）
- **认证公众号才有草稿接口**：未认证的订阅号可能没有 `draft/add` 权限

## 运行环境

- Node.js 18+（使用原生 `fetch`，不需要 node-fetch）
- 开发时用 `npm run dev -- <命令>` 代替 `wxp`
- 构建：`npm run build`，产物在 `dist/`

---

## AI Agent 团队模式（自动化发布循环）

### 概述

本章节为需要做「开发→测试→发布→视觉验证→迭代」完整循环的 AI Agent 提供规范。
单次发布见上方标准流程；本章节针对需要验证微信 ProseMirror 渲染效果并自动修复样式问题的场景。

**核心问题链**：
```
Markdown → convertMarkdown()（本地，完全可控）
    ↓
微信草稿 API（createDraft）
    ↓
ProseMirror 二次解析（不可控，可能剥离样式）
    ↓
最终渲染 DOM（需要 CDP 验证）
```

### 角色分工

| 角色 | 职责 | 工具 |
|------|------|------|
| **Orchestrator** | 任务分解、状态追踪、循环控制、决定何时升级给人工 | 无直接工具，调度其他 Agent |
| **Builder** | 修改 `themes.ts` CSS 样式，运行 convert 生成 HTML | Bash、Edit |
| **Publisher** | 调用 `wxp publish` 发布到草稿箱 | Bash |
| **QA** | 用 CDP 在微信编辑器里验证渲染效果 | mcp__chrome-devtools__* |

### 标准循环

```
Builder（convert + validate）
    ↓ HTML 静态检查通过
Publisher（publish → media_id）
    ↓ 得到 draft_edit_url
QA（CDP 打开编辑器 → 运行 qa-checks.js）
    ↓ 全部 PASS → 通知用户
    ↓ 有 FAIL → Orchestrator 分析 → Builder 修复 → 重新循环
    ↓ 连续 3 次失败 → ESCALATE 给人工
```

### Builder Agent Prompt

```
你是 wx-publisher 的 Builder Agent。工作目录：~/code2/wx-publisher

任务：将 Markdown 转换为微信 HTML，并运行静态检查。

输入：{ file, theme, fix_instructions }

如果有 fix_instructions：
- 只修改 src/converter/themes.ts 中的内联 CSS 字符串
- 不修改 converter/index.ts 的结构逻辑（风险高）
- 修改后运行 npm run typecheck 确认无错误

执行步骤：
1. npm run dev -- convert --file {file} --theme {theme} --output /tmp/wx_preview_{timestamp}.html
2. npm run dev -- validate --file /tmp/wx_preview_{timestamp}.html
3. 输出 JSON 报告

输出格式：
{
  "html_path": "/tmp/wx_preview_xxx.html",
  "validate_result": { "overall": "PASS/FAIL", "checks": [...] },
  "modifications_made": "描述本次 CSS 修改（无修改则 null）"
}
```

### Publisher Agent Prompt

```
你是 wx-publisher 的 Publisher Agent。工作目录：~/code2/wx-publisher

任务：发布到微信草稿箱，返回 draft_edit_url。

执行：
npm run dev -- publish \
  --file {file} --theme {theme} \
  --cover-url "{cover_url}" --title "{title}"

从 JSON 输出提取 media_id，构造：
draft_edit_url = https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&appmsgid={media_id}

输出格式：
{ "success": true, "media_id": "xxx", "draft_edit_url": "https://..." }

错误处理：
- errcode 48001（权限不足）→ 标记 NEEDS_HUMAN，不重试
- invalid ip（IP 白名单）→ 标记 NEEDS_HUMAN，提示检查 103.37.140.0/24
- access_token 失败 → 标记 NEEDS_HUMAN，提示检查凭证配置
```

### QA Agent Prompt

```
你是 wx-publisher 的 QA Agent，用 CDP 工具验证微信编辑器渲染效果。

前置条件：微信登录态由人工维护。如果页面跳转到登录页：
立即返回 { "overall": "BLOCKED", "reason": "未登录，需要人工重新登录微信" }

输入：{ draft_edit_url, focus_checks }

步骤：
1. mcp__chrome-devtools__navigate_page 打开 draft_edit_url
2. mcp__chrome-devtools__wait_for 等待 ".ProseMirror"（超时 15s）
3. mcp__chrome-devtools__take_screenshot 截图保存 /tmp/qa_{timestamp}.png
4. mcp__chrome-devtools__evaluate_script 执行 scripts/qa-checks.js 的内容
   （读取文件后作为函数体执行，或直接把脚本内容粘贴进去）
5. 解析返回的 JSON，输出 QA 报告

输出格式：
{
  "overall": "PASS/FAIL/BLOCKED",
  "checks": [...],
  "screenshot": "/tmp/qa_xxx.png",
  "recommendation": "通过 | 需要修复: [CHECK_ID1, CHECK_ID2]"
}
```

### QA 检查项（7 项）

检查脚本在 `scripts/qa-checks.js`，可直接通过 CDP evaluate_script 执行。

| 检查 ID | 验证内容 | 期望值 |
|---------|---------|--------|
| `LIST_NO_LIST_ITEM` | li 不渲染为 list-item | `display` ≠ `list-item` |
| `LIST_HAS_BULLET` | ul li 有 • 前缀 | textContent 以 • 开头 |
| `OL_HAS_NUMBER` | ol li 有数字前缀 | textContent 以 `N. ` 开头 |
| `NO_EMPTY_LI` | 无空白 li | textContent 不为空 |
| `CODE_BLOCK_DARK_BG` | pre 深色背景 | 亮度 < 80 |
| `CODE_BLOCK_LIGHT_TEXT` | pre code 浅色文字 | 亮度 > 100 |
| `CODE_NOWRAP` | 代码不折行 | white-space = nowrap/pre |
| `CODE_INLINE_STYLE` | inline-code 有样式 | style 属性非空 |
| `H2_BORDER_LEFT` | h2 有左边框 | borderLeftWidth > 0 |
| `TABLE_BORDER` | 表格 border-collapse | = collapse |

### 修复决策表（Orchestrator 查询用）

| 失败检查 ID | 根因 | 修复动作 | 修改位置 |
|-------------|------|---------|---------|
| `LIST_NO_LIST_ITEM` | ProseMirror 恢复 list-style | `BASE_LI` 加 `list-style:none!important` | `themes.ts` |
| `LIST_HAS_BULLET` | • 前缀被剥离 | 检查 `inlineStyles` 里 ul case 的前缀注入逻辑 | `converter/index.ts` |
| `CODE_BLOCK_DARK_BG` | background 被覆盖 | 在 `pre` 样式加 `!important` | `themes.ts` |
| `CODE_BLOCK_LIGHT_TEXT` | color 被剥离 | 确认 `pre code` 的 color 值，加 `!important` | `themes.ts` |
| `CODE_INLINE_STYLE` | ProseMirror 剥离 style | 确认 `code` 节点用 raw 节点输出，style 硬写 | `converter/index.ts` |
| `H2_BORDER_LEFT` | border 被剥离 | 改用 `box-shadow` 模拟左边框，或加 `!important` | `themes.ts` |
| `NO_EMPTY_LI` | 松散列表产生空 li | 检查 `unwrapLiParagraphs` 逻辑 | `converter/index.ts` |

### 人工介入触发条件

**以下情况立即 ESCALATE，不继续自动修复：**
- 微信 cookie 失效（CDP 导航到登录页）
- 同一检查项连续 3 次修复后仍 FAIL
- API errcode 48001（权限不足）
- 需要修改 `converter/index.ts` 的 AST 遍历逻辑（风险高）
- 视觉判断类问题（颜色搭配、字体效果）

**以下情况 AI 可自主处理：**
- `themes.ts` 中内联 CSS 字符串的数值/颜色调整
- 添加 `!important` 提高样式优先级
- 用等效 CSS 属性替换（如 `border` → `box-shadow`）
- `unwrapLiParagraphs` 逻辑的小调整

### 微信编辑器 iframe 定位

微信草稿编辑器的内容区域在嵌套 iframe 里，CDP 查询时需要：

```javascript
// qa-checks.js 中的 getEditorDoc() 会自动尝试以下选择器：
// 1. iframe#js_editor_editable
// 2. iframe.rich_media_content
// 3. iframe[id*="editor"]
// 如果都失败，fallback 到 document（某些版本直接在主文档里）
```

草稿编辑 URL 格式：
```
https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&appmsgid={media_id}
```

**重要**：`wxp publish` 返回的 `media_id` 是字符串（如 `bpB07u_8H2Ns8YJA...`），但微信编辑器 URL 里的 `appmsgid` 需要的是**数字 ID**（如 `502719389`）。两者不同，不能直接用 media_id 构造编辑 URL。

正确做法：让用户在草稿箱手动打开草稿，QA Agent 通过 `list_pages` 找到已打开的编辑器页面，而不是自己导航。

---

## 团队经验积累（持续更新）

本章节记录团队在迭代过程中积累的经验教训。**每次发现新的坑或解法，必须更新此章节**，这是团队的集体记忆。

### CDP 操作经验

**经验 1：不要用 take_snapshot 做内容分析**
- 问题：take_snapshot 返回 a11y 树，数据量大，haiku 上下文容易超限
- 解法：直接用 evaluate_script 执行 JS，返回精确的 JSON 数据

**经验 2：take_screenshot 会导致上下文爆炸**
- 问题：截图作为图片传入 Agent 上下文，opus/sonnet 会超限
- 解法：QA Agent 用 haiku 运行，且不截图；只在必要时截图并保存到文件而不内联

**经验 3：微信草稿编辑器内容在主文档，不在 iframe**
- 问题：最初以为内容在 iframe 里（参考其他富文本编辑器经验）
- 验证：`document.querySelectorAll('iframe').length === 0`，ProseMirror 直接挂在主文档
- 解法：直接用 `document.querySelector('.ProseMirror')` 访问编辑器内容

**经验 4：media_id ≠ appmsgid**
- 问题：`wxp publish` 返回的 `media_id`（字符串）不能直接用于构造编辑器 URL
- 微信编辑器 URL 里的 `appmsgid` 是数字 ID，两者不同
- 解法：让用户手动打开草稿，QA Agent 通过 `list_pages` 找到已打开的编辑器页面（URL 含 `appmsg_edit`）

**经验 5：token 会过期，导航可能触发重新验证**
- 问题：从首页导航到草稿箱时，token 可能失效导致跳转到登录页
- 解法：导航时在 URL 里带上当前 token（从已登录页面的 URL 提取）

### ProseMirror 渲染经验

**经验 1：ul/ol 里的文本节点（\n）会被渲染成空 li**
- 问题：remark 生成的 hast 树中，ul/ol 的 children 包含换行文本节点
- 症状：每隔一个 li 就有一个空 li（`<li><section><br></section></li>`）
- 解法：在处理 ul/ol 时，用 `.filter(c => c.type === "element" && c.tagName === "li")` 过滤掉文本节点

**经验 2：li 的 display:block 会被 ProseMirror 覆盖为 list-item**
- 问题：我们写了 `display:block`，但 ProseMirror 的 schema 强制 li 为 `list-item`
- 当前状态：已知问题，尚未找到可靠解法（`!important` 待验证）
- 影响：列表项间距略大，但内容正确显示

**经验 3：inline code 的 style 必须用 raw 节点硬写，不能依赖 applyStyle**
- 问题：通过 hast 节点的 properties.style 设置的样式，ProseMirror 会剥离
- 解法：把 code 节点转成 raw 节点，直接输出 `<code class="inline-code" style="...">文字</code>`

**经验 4：pre > code 的高亮颜色需要 class + style 双写**
- 问题：只有 style 的 span 会被 ProseMirror 剥离文字内容
- 解法：hljs 的 class-based span 转换时，保留 class（`hljs-keyword` 等）并加上 style，ProseMirror 识别 class 后会保留内容

### 自我迭代规范

**何时更新本文件**：
- 发现新的 ProseMirror 行为 → 更新「ProseMirror 渲染经验」
- CDP 操作遇到新坑 → 更新「CDP 操作经验」
- 修复决策表有新条目 → 更新「修复决策表」
- 发现某个 Agent Prompt 需要调整 → 直接修改对应 Prompt 模板

**谁来更新**：
- Orchestrator Agent 在每次循环结束后，将新发现的经验追加到对应章节
- 格式：`**经验 N：标题**` + 问题/解法两行
- 不删除旧经验，只追加或修正
