# wx-publisher

Markdown → 微信公众号草稿，**无需第三方 API Key**，排版转换完全本地完成。

## 安装

```bash
git clone https://github.com/chess99/wx-publisher.git
cd wx-publisher
npm install
npm run build
npm link   # 全局可用 wxp 命令
```

## 配置

```bash
wxp config set wechat_appid wx你的AppID
wxp config set wechat_secret 你的AppSecret
```

**AppID / AppSecret 获取方式：**

1. 打开[微信开发者平台](https://developers.weixin.qq.com/platform)，管理员扫码登录
2. 「我的业务与服务」→「公众号」→ 选择目标公众号
3. 「基础信息」标签页可看到 AppID；「开发密钥」区域管理 AppSecret
4. 首次使用点「启用」，完成验证后**立即复制保存**，关闭弹窗后无法再次查看明文；丢失只能点「重置」获取新密钥（旧密钥立即失效）

## 使用

```bash
# 发布到草稿箱
wxp publish --file article.md --cover cover.jpg

# 打开本地 Studio：编辑、预览、复制并创建草稿
wxp studio --file article.md

# 在浏览器中预览所有主题效果（手动比较）
wxp preview --file article.md

# 仅转换，输出到文件（脚本/自动化用）
wxp convert --file article.md --theme tech --output preview.html

# 使用外部主题文件转换
wxp convert --file article.md --theme-file theme.json --output preview.html

# 使用外部主题文件创建草稿
wxp publish --file article.md --theme-file theme.json --cover cover.jpg

# 查看可用主题
wxp themes
```

## Studio 本地工作台

`wxp studio --file article.md` 会启动只监听 `127.0.0.1` 的本地网页工作台，并自动打开浏览器。

Studio 支持：

- 左侧编辑 Markdown，中间手机预览，右侧设置和发布面板
- 切换内置主题，调整主题色、字号、字体和代码块风格
- 复制微信富文本、复制 HTML、导出 HTML
- 使用本地配置创建微信公众号草稿

发布仍然在本机后端完成：AppSecret 不会发送给浏览器，也不会出现在页面状态接口里。Studio 只创建草稿，不会直接发布文章。

可选参数：

```bash
wxp studio --file article.md --port 8787 --no-open
```

## 常见错误

如果发布时报：

```text
获取 access_token 失败: invalid ip <当前出口 IP>, not in whitelist
```

说明当前机器的出口 IP 不在公众号 API IP 白名单中。处理路径已经迁移到微信开发者平台：

1. 打开[微信开发者平台](https://developers.weixin.qq.com/platform)，管理员扫码登录
2. 「我的业务与服务」→「公众号」→ 选择目标公众号
3. 进入「基础信息 / 开发接口管理」里的「API IP 白名单」
4. 添加当前出口 IP 后重试 `wxp publish`

## 主题

| 主题 | 说明 |
|------|------|
| `default` | 微信经典风，绿色强调 |
| `tech` | 技术文章，蓝色强调，深色代码块 |
| `elegant` | 优雅深色，金色强调，衬线字体 |
| `minimal` | 极简，内容优先 |

### 外部主题文件

外部主题文件用于为单篇文章定制排版样式。主题文件是 JSON 格式，包含主题 `name` 和各 Markdown 元素对应的 CSS 内联样式。

最小完整示例：

```json
{
  "name": "custom-article",
  "description": "自定义公众号排版主题",
  "styles": {
    "wrapper": "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #222; line-height: 1.8;",
    "h1": "font-size: 24px; font-weight: 700; margin: 24px 0 16px;",
    "h2": "font-size: 20px; font-weight: 700; margin: 24px 0 12px;",
    "h3": "font-size: 18px; font-weight: 700; margin: 20px 0 10px;",
    "h4": "font-size: 16px; font-weight: 700; margin: 16px 0 8px;",
    "p": "font-size: 16px; margin: 12px 0;",
    "strong": "font-weight: 700;",
    "em": "font-style: italic;",
    "code": "font-family: Menlo, Consolas, monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px;",
    "pre": "background: #1f2937; color: #f9fafb; padding: 16px; overflow-x: auto; border-radius: 6px;",
    "preCode": "font-family: Menlo, Consolas, monospace; font-size: 14px;",
    "blockquote": "border-left: 4px solid #d0d7de; padding-left: 12px; color: #57606a; margin: 16px 0;",
    "ul": "padding-left: 24px; margin: 12px 0;",
    "ol": "padding-left: 24px; margin: 12px 0;",
    "li": "margin: 6px 0;",
    "hr": "border: none; border-top: 1px solid #d0d7de; margin: 24px 0;",
    "img": "max-width: 100%; display: block; margin: 16px auto;",
    "a": "color: #0969da; text-decoration: none;",
    "table": "width: 100%; border-collapse: collapse; margin: 16px 0;",
    "th": "border: 1px solid #d0d7de; padding: 8px; font-weight: 700; background: #f6f8fa;",
    "td": "border: 1px solid #d0d7de; padding: 8px;"
  }
}
```

使用前可以先校验主题文件，或输出 JSON Schema：

```bash
wxp theme validate --file theme.json
wxp theme schema
```

## 主题预览

运行 `wxp preview` 在浏览器中并排查看所有主题效果，底部直接生成可复制的发布命令：

```bash
wxp preview --file article.md
```

浏览器打开后进程立即退出，不阻塞终端。切换 tab 查看不同主题，填入封面图路径后底部命令即可直接复制执行。

自动化流程通常不需要预览，直接用 `--theme` 参数即可。

## 自动化调用

见 [AGENTS.md](./AGENTS.md)。
