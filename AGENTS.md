# wx-publisher 自动化调用说明

本文件面向脚本、CLI 自动化和单个 AI 助手。人类开发者请优先阅读 README.md。

## 工具定位

`wx-publisher` 是一个 CLI 工具，把 Markdown 文件转换为微信公众号兼容 HTML，并创建微信公众号草稿。

- Markdown 到 HTML 的排版转换在本地完成
- `publish` 只创建草稿，不能直接发布
- 除 `convert` 未指定 `--output` 时直接输出 HTML 外，CLI 面向机器调用，成功和失败默认输出 JSON

## 迭代提交规则

AI 助手完成每次明确的代码或文档迭代后，应自行运行必要验证并创建 git commit，不必等待人类开发者再说“commit”。提交前只 stage 本轮相关文件，不要把已有未跟踪文件或无关改动带入提交。

## 示例文件维护规则

`examples/advanced-layout-showcase.md` 是长期维护的全特性验收文章，覆盖普通 Markdown、高级模块、提示框、脚注、代码、表格、图片、画廊和长图等能力。

当渲染语法、主题视觉、高级模块、图片处理、API 输出结构或微信公众号草稿效果发生重大变化时，必须同步更新这个示例文件，并运行转换验证，避免示例与真实能力漂移。

目录规范：

- `examples/`：放可运行、可人工验收的完整示例文章和示例说明
- `docs/`：放设计说明、接口说明、语法说明和实现文档
- `test/fixtures/`：放测试专用的最小输入，不复制完整示例文章

## 主题和阅读基线维护规则

主题可以改变颜色、标题装饰、代码块外观、引用框、表格、高级模块卡片和强调色，但普通文章正文的阅读基线默认应对所有主题一致生效。

普通正文、普通列表和基础字体栈属于跨主题阅读体验，不应因为当前只在调试某个主题就写进该主题的特殊分支。除非某个主题有明确产品理由必须改变阅读节奏，否则不要单独修改它的正文 `font-size`、`line-height`、段落间距、列表行高、字间距或字体优先级。

当前共享阅读基线应保持：

- 普通正文：`font-size:16px`，`line-height:1.82`，段落间距 `margin:0 0 16px 0`
- 普通列表：与正文同字号、同行高，使用微信安全结构避免原生列表重复 marker
- 字体栈：系统字体优先，`-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif`
- 中文正文默认不要加 `letter-spacing`；这会破坏中英文混排阅读节奏

如果确实需要改阅读基线，应先证明这是全局正确行为，而不是某个主题的局部修补；实现时优先改共享常量或共享渲染逻辑，并用至少一个非 `default` 主题一起覆盖测试。`default` 可以保留自己的标题、代码块、链接和高级模块配色，但不应独占普通正文/普通列表的阅读参数。

## 使用前检查

```bash
wxp capabilities
wxp config get
```

如果 `wechat_appid` 或 `wechat_secret` 显示 `(未设置)`，先配置：

```bash
wxp config set wechat_appid wx你的AppID
wxp config set wechat_secret 你的AppSecret
```

AppID / AppSecret 获取路径：微信开发者平台 → 我的业务与服务 → 公众号 → 选择目标公众号 → 基础信息。

## 常用流程

### 本地 API 转换

```bash
wxp serve --port 8080

curl -X POST "http://127.0.0.1:8080/api/v1/convert" \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# 标题\n\n正文","theme":"default","fontSize":"medium","convertVersion":"v1"}'
```

本地 API 端点：

- `POST /api/v1/convert`
- `POST /api/v1/article-draft`
- `POST /api/v1/newspic-draft`
- `POST /api/v1/batch-upload`

### 发布到草稿箱

```bash
wxp publish \
  --file /path/to/article.md \
  --cover /path/to/cover.jpg \
  --theme github-readme \
  --title "文章标题"
```

### 本地 Studio 工作台

```bash
wxp studio --file /path/to/article.md
```

`studio` 会启动只监听 `127.0.0.1` 的本地网页工作台，适合人工编辑、主题微调、复制富文本和点击创建草稿。它不是无头自动化接口；脚本自动化仍优先使用 `convert`、`preview` 和 `publish`。

可用于自动化启动但不打开浏览器：

```bash
wxp studio --file /path/to/article.md --port 8787 --no-open
```

成功启动时 stdout 输出 JSON，包含 `data.url`。进程会持续运行，调用方需要在不再使用时结束该进程。

### 使用外部主题文件

```bash
wxp theme validate --file /path/to/theme.json

wxp publish \
  --file /path/to/article.md \
  --cover /path/to/cover.jpg \
  --theme-file /path/to/theme.json \
  --title "文章标题"
```

`--theme-file` accepts external Theme JSON; successful publish JSON has `data.theme` equal to the theme file `name`.

封面图也可以使用公网 URL：

```bash
wxp publish \
  --file /path/to/article.md \
  --cover-url https://example.com/cover.jpg \
  --theme default
```

不传 `--cover` 或 `--cover-url` 时，工具会使用内置占位封面图。草稿仍会创建成功，但 JSON 中会包含 `used_placeholder_cover: true` 和 `warning`。

### 仅转换不发布

```bash
wxp convert --file article.md --theme github-readme --output /tmp/preview.html
wxp convert --file article.md --theme github-readme > /tmp/preview.html
```

### 预览主题

```bash
wxp preview --file article.md
```

`preview` 会生成浏览器预览页，便于人工比较主题效果。自动化流程通常直接使用 `--theme` 参数。

## JSON 输出契约

成功：

```json
{
  "success": true,
  "data": {
    "media_id": "xxxxx",
    "title": "文章标题",
    "theme": "github-readme",
    "images_uploaded": 3,
    "message": "草稿已创建，请在微信公众号后台发布",
    "used_placeholder_cover": false
  }
}
```

失败：

```json
{
  "success": false,
  "error": "错误描述",
  "details": "具体错误信息"
}
```

部分错误会额外包含：

```json
{
  "code": "WECHAT_IP_NOT_IN_WHITELIST",
  "hint": "处理建议"
}
```

调用方应检查：

- `success === true`：读取 `data.media_id`
- `data.used_placeholder_cover === true` 或 `data.warning`：提示使用者是否要换真实封面后重新发布
- `success === false`：展示 `error`、`details` 和可选 `hint`

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `配置不完整` | AppID/Secret 未设置 | 使用 `wxp config set` 设置凭证 |
| `获取 access_token 失败` | AppID/Secret 错误或接口受限 | 检查微信开发者平台中的凭证和接口权限 |
| `invalid ip ... not in whitelist` | 当前出口 IP 不在 API IP 白名单 | 在微信开发者平台配置 API IP 白名单 |
| `上传图片失败: invalid media_id` | 图片格式不支持或素材上传失败 | 使用 jpg/png/gif/webp，确认图片可读取 |
| `创建草稿失败: 48001` | 没有草稿接口权限 | 确认公众号认证状态和接口权限 |

API IP 白名单路径：微信开发者平台 → 我的业务与服务 → 公众号 → 选择目标公众号 → 基础信息 / 开发接口管理 → API IP 白名单。

## 主题

运行时主题严格对齐 48 个公开主题 ID，不保留旧兼容主题名。

| 系列 | 主题 |
|------|------|
| Built-in | `default`, `bytedance`, `apple`, `sports`, `chinese`, `cyber` |
| Classic | `wechat-native`, `nyt-classic` |
| Modern | `github-readme`, `sspai-red`, `mint-fresh`, `sunset-amber` |
| Extra | `ink-minimal`, `lavender-dream`, `coffee-house`, `bauhaus-primary` |
| Minimal | `minimal-gold`, `minimal-green`, `minimal-blue`, `minimal-orange`, `minimal-red`, `minimal-navy`, `minimal-gray`, `minimal-sky` |
| Focus | `focus-gold`, `focus-green`, `focus-blue`, `focus-orange`, `focus-red`, `focus-navy`, `focus-gray`, `focus-sky` |
| Elegant | `elegant-gold`, `elegant-green`, `elegant-blue`, `elegant-orange`, `elegant-red`, `elegant-navy`, `elegant-gray`, `elegant-sky` |
| Bold | `bold-gold`, `bold-green`, `bold-blue`, `bold-orange`, `bold-red`, `bold-navy`, `bold-gray`, `bold-sky` |

`wxp themes` 会返回每个主题的系列、适用场景、密度、对比度和强调色，AI 调用方应优先使用这些字段选型。

查看主题：

```bash
wxp themes
```

## 高级模块语法

`wxp convert`、`wxp publish` 和本地 `POST /api/v1/convert` 都支持 `:::` 高级模块。字段必须使用英文冒号，行型模块使用 `|` 分列。

完整模块目录、字段、别名、API 请求/响应和故障排查见 [`docs/advanced-layout.md`](./docs/advanced-layout.md)。

```md
:::hero
title: 模块负责信息骨架 | 主题负责阅读气质
subtitle: 让公众号长文更有结构
tags: 结构化 | 可复用
:::

:::cards[高级排版模块]
PART 01 | 开场模块 | 先交代判断和阅读入口 | accent
PART 02 | 证据模块 | 用数据、对比、步骤支撑结论 | default
:::
```

公开高级模块共 43 个：

`hero`, `cards`, `metrics`, `steps`, `compare`, `timeline`, `infographic`, `audience-fit`, `bridge`, `manifesto`, `myth-fact`, `verdict`, `people`, `cases`, `pricing`, `faq`, `logos`, `part`, `label-title`, `quote`, `image-text`, `image-compare`, `image-annotate`, `toc`, `checklist`, `toolbox`, `specs`, `image-steps`, `notice`, `summary`, `author-card`, `series`, `subscribe`, `cta`, `callout`, `changelog`, `comparison-table`, `definition`, `question`, `quote-card`, `resource-list`, `stat-row`, `tweet`。

增强模块：`dialogue`, `gallery`, `longimage`。

也支持 GFM 提示框和脚注：

```md
> [!NOTE]
> 这是提示。

正文引用脚注[^1]。

[^1]: 脚注内容。
```

## 开发参考

```
src/
├── cli/index.ts                    # CLI 入口
├── cli/errors.ts                   # CLI 错误归一化
├── converter/
│   ├── index.ts                    # Markdown → HTML 转换
│   ├── themes.ts                   # 主题定义
│   ├── preview-html.ts             # 浏览器预览页生成
│   └── placeholder-cover.ts        # 内置占位封面图
├── studio/
│   ├── server.ts                    # 本地 Studio HTTP 服务
│   └── theme-settings.ts            # Studio 主题派生
├── wechat/client.ts                # 微信 API 客户端
├── config/index.ts                 # 配置读写
studio-app/                         # Vite + Vanilla TS Studio 前端
test/                               # vitest 单元测试
```

## 微信 API 限制

- 草稿不等于发布，创建后仍需在微信公众号后台人工发布
- 外链图片可能被微信屏蔽，工具会尽量自动上传到微信素材库
- 永久素材库有容量限制
- access_token 有效期约 7200 秒，工具会本地缓存
- 未认证或权限不足的公众号可能无法使用草稿接口

## 运行环境

- Node.js 18+
- 开发时使用 `npm run dev -- <命令>`
- 构建使用 `npm run build`
