# wx-publisher 自动化调用说明

本文件面向脚本、CLI 自动化和单个 AI 助手。人类开发者请优先阅读 README.md。

## 工具定位

`wx-publisher` 是一个 CLI 工具，把 Markdown 文件转换为微信公众号兼容 HTML，并创建微信公众号草稿。

- Markdown 到 HTML 的排版转换在本地完成
- `publish` 只创建草稿，不能直接发布
- 除 `convert` 未指定 `--output` 时直接输出 HTML 外，CLI 面向机器调用，成功和失败默认输出 JSON

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

### 发布到草稿箱

```bash
wxp publish \
  --file /path/to/article.md \
  --cover /path/to/cover.jpg \
  --theme tech \
  --title "文章标题"
```

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
wxp convert --file article.md --theme tech --output /tmp/preview.html
wxp convert --file article.md --theme tech > /tmp/preview.html
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
    "theme": "tech",
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

| 主题 | 适合场景 |
|------|---------|
| `default` | 通用，绿色强调，微信经典风 |
| `tech` | 技术文章，蓝色强调，代码高亮深色背景 |
| `elegant` | 深度内容，金色强调，衬线字体 |
| `minimal` | 内容优先，无装饰，简洁 |

查看主题：

```bash
wxp themes
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
├── wechat/client.ts                # 微信 API 客户端
├── config/index.ts                 # 配置读写
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
