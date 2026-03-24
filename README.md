# wx-publisher

Markdown → 微信公众号草稿，**无需第三方 API Key**，排版转换完全本地完成。

## 安装

```bash
cd ~/code2/wx-publisher
npm install
npm run build
npm link   # 全局可用 wxp 命令
```

## 配置

```bash
wxp config set wechat_appid wx你的AppID
wxp config set wechat_secret 你的AppSecret
```

AppID/AppSecret 从[微信公众平台](https://mp.weixin.qq.com) → 设置与开发 → 基本配置获取。

## 使用

```bash
# 发布到草稿箱
wxp publish --file article.md --cover cover.jpg

# 在浏览器中预览所有主题效果（人类用）
wxp preview --file article.md

# 仅转换，输出到文件（AI Agent / 脚本用）
wxp convert --file article.md --theme tech --output preview.html

# 查看可用主题
wxp themes
```

## 主题

| 主题 | 说明 |
|------|------|
| `default` | 微信经典风，绿色强调 |
| `tech` | 技术文章，蓝色强调，深色代码块 |
| `elegant` | 优雅深色，金色强调，衬线字体 |
| `minimal` | 极简，内容优先 |

## 主题预览

运行 `wxp preview` 在浏览器中并排查看所有主题效果，底部直接生成可复制的发布命令：

```bash
wxp preview --file article.md
```

浏览器打开后进程立即退出，不阻塞终端。切换 tab 查看不同主题，填入封面图路径后底部命令即可直接复制执行。

> AI Agent 不需要预览，直接用 `--theme` 参数即可。

## AI Agent 使用

见 [AGENTS.md](./AGENTS.md)。
