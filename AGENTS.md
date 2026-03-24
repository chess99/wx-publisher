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
