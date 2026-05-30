# 高级模块与本地 API 使用指南

本文档说明 `wx-publisher` 的高级排版模块和本地 REST API。所有转换都在本机完成；`publish` 和草稿 API 只会创建微信公众号草稿，不会直接发布文章。

## 什么时候使用高级模块

高级模块适合需要比普通 Markdown 更强结构的文章：

- 发布稿：快速说明变化、价值和下一步
- 教程：把步骤、截图、注意事项和检查清单组织清楚
- 方法论文章：先给判断，再给目录、证据和总结
- 服务页：说明适合谁、案例、价格、FAQ 和行动入口
- 品牌或系列文章：强化作者、系列、订阅和转发动作

如果只是短消息或简单通知，普通 Markdown 加 `studio` 主题通常就够了。

## 快速开始

```bash
wxp convert --file article.md --theme studio --output preview.html
wxp preview --file article.md
wxp publish --file article.md --theme studio --cover cover.jpg
```

最小示例：

```md
:::hero
eyebrow: FEATURE
meta: 2026.03
kicker: 先把结构搭稳
title: 模块负责信息骨架 | 主题负责阅读气质
subtitle: 高级模块统一服务所有主题，让教程、方案、发布稿和长文都能更稳定地组织重点
image: https://example.com/cover.png
brand: wx-publisher
tags: 结构化 | 可复用
:::

:::cards[高级排版模块]
PART 01 | 开场模块 | 先交代判断和阅读入口 | accent
PART 02 | 证据模块 | 用数据、对比、步骤支撑结论 | default
PART 03 | 收尾模块 | 让行动和品牌一起落地 | default
:::
```

## 语法规则

字段型模块：

```md
:::module-name
field: value
:::
```

行型模块可以带标题：

```md
:::metrics[关键结果]
结构复用 | 34 模块 | 同一篇内容可切到不同主题 | accent
:::
```

规则：

- 字段必须使用英文冒号 `:`。
- 中文冒号 `：` 不会被识别为字段分隔符。
- 行型模块使用 `|` 分隔列。
- 未识别的模块会保留为普通 Markdown 文本。
- 支持模块即使字段不完整也不会中断转换，但可能出现空内容区。
- 模块里的图片字段和 Markdown 图片会被收集，`publish` 时按原有图片上传逻辑处理。

## 如何选择模块

先判断文章任务，再选最少的模块组合。

| 场景 | 推荐模块 |
| --- | --- |
| 发布稿 | `hero`, `cards`, `image-compare` 或 `image-steps`, `summary`, `cta` |
| 教程 | `hero`, `toc`, `image-steps`, `notice`, `checklist` |
| 方法论文章 | `verdict`, `toc`, `part`, `quote`, `summary`, `author-card` |
| 服务页 | `audience-fit`, `verdict`, `cases`, `pricing`, `faq`, `subscribe` 或 `cta` |
| 品牌或系列文章 | `hero`, `quote`, `series`, `author-card`, `subscribe` |

默认建议一篇文章使用 3 到 6 个高级模块。模块太多会打断手机阅读节奏。

## 模块目录

当前公开高级模块共 43 个。另有 3 个增强模块：`dialogue`, `gallery`, `longimage`。

### 开场与判断

| 模块 | 类型 | 字段 |
| --- | --- | --- |
| `hero` | 字段型 | `eyebrow`, `meta`, `kicker`, `title`, `subtitle`, `image`, `brand`, `tags` |
| `cards` | 行型 | 标签, 标题, 正文, 样式 |
| `toc` | 行型 | 序号, 标题, 说明 |
| `part` | 字段型 | `index`, `title`, `subtitle` |
| `label-title` | 字段型 | `label`, `title` |
| `infographic` | 字段型 | `type`, `eyebrow`, `title`, `subtitle`, `quote`, `note` |
| `audience-fit` | 字段型 | `title`, `fit`, `avoid` |
| `bridge` | 字段型 | `label`, `title`, `body`, `next` |
| `manifesto` | 字段型 | `label`, `title`, `body`, `believe`, `against`, `note` |
| `myth-fact` | 行型 | 误区, 事实 |
| `verdict` | 字段型 | `eyebrow`, `title`, `body` |
| `quote` | 字段型 | `eyebrow`, `quote`, `source`, `note` |

示例：

```md
:::verdict
eyebrow: 最终判断
title: 真正的护城河不是模块数量，而是品牌表达系统
body: 模块必须解决新的阅读任务，否则只是换皮。
:::
```

`infographic.title` 可以用 `|` 标记需要强调的词：

```md
title: 让|一句判断|先被读者看到
```

### 证据与列表

| 模块 | 行字段顺序 |
| --- | --- |
| `metrics` | 标签, 数值, 说明, 样式 |
| `steps` | 序号, 标题, 说明, 备注 |
| `compare` | 左标题, 左说明, 右标题, 右说明, 样式 |
| `timeline` | 时间, 标题, 说明 |
| `people` | 姓名, 角色, 说明, 样式 |
| `cases` | 案例名, 指标, 说明, 样式 |
| `pricing` | 方案名, 价格, 斜杠分隔的权益, 样式 |
| `faq` | 问题, 回答 |
| `logos` | 名称, 说明 |
| `checklist` | 状态, 标题, 说明 |
| `toolbox` | 标签, 标题, 说明, 链接 |
| `specs` | 标签, 值, 说明 |
| `notice` | 标签, 值, 说明 |
| `callout` | 类型, 标题, 说明 |
| `resource-list` | 类型, 标题, 说明, 链接 |
| `stat-row` | 标签, 数值, 说明 |

样式列支持 `accent` 和 `default`。`checklist` 的状态支持 `done`、`pending`、`warn`。

示例：

```md
:::checklist[发布前检查]
done | 结构先搭好 | 先把目录、重点和结论摆出来
pending | 数据再补齐 | 关键数字和案例放进对应模块
warn | 链接和说明单独检查 | 避免手机里出现跳读和看不清
:::
```

### 图片模块

| 模块 | 类型 | 字段或行字段 |
| --- | --- | --- |
| `image-text` | 字段型 | `layout`, `eyebrow`, `title`, `body`, `note`, `image`, `alt` |
| `image-compare` | 字段型 | `eyebrow`, `title`, `left_title`, `left_image`, `right_title`, `right_image`, `note` |
| `image-annotate` | 字段型 | `eyebrow`, `title`, `note`, `image`, `alt`, 多个 `point` |
| `image-steps` | 行型 | 序号, 标题, 说明, 图片, 备注 |
| `gallery` | 图片块 | 模块内写 Markdown 图片 |
| `longimage` | 图片块 | 模块内写一张 Markdown 图片 |

示例：

```md
:::image-annotate
eyebrow: 拆解说明
title: 图片标注卡适合直接告诉读者重点该看哪里
image: https://example.com/screenshot.png
alt: 图片标注卡示例
point: 01 | 24 | 24 | 主信息区 | 一进入页面先看到的核心判断和主标题
point: 02 | 74 | 36 | 指标区 | 适合讲关键数字、结果和变化
:::
```

`point` 的字段顺序是：标号、左侧百分比、顶部百分比、标题、说明。

### 收尾与身份

| 模块 | 类型 | 字段 |
| --- | --- | --- |
| `summary` | 字段型 | `eyebrow`, `highlight`, `body` |
| `changelog` | 字段型/行型 | `title`, `version`, `date`；或每行 变更类型, 说明 |
| `comparison-table` | 字段型/行型 | `columns`；每行对应表格单元格 |
| `definition` | 字段型 | `label`, `term`, `body`, `note` |
| `question` | 字段型 | `title`, `body` |
| `quote-card` | 字段型 | `quote`, `source` |
| `tweet` | 字段型 | `author`, `handle`, `body`, `note` |
| `author-card` | 字段型 | `name`, `role`, `bio`, `tags`, `note`, `link` |
| `series` | 字段型 | `name`, `issue`, `title`, `desc`, `tags`, `next` |
| `subscribe` | 字段型 | `label`, `title`, `subtitle`, `primary`, `secondary`, `note` |
| `cta` | 字段型 | `title`, `note` |
| `dialogue` | 对话块 | 每行一个 `角色: 内容` |

`dialogue` 支持英文冒号和中文冒号：

```md
:::dialogue[AI 助手与用户的对话]
用户: 这个模块适合什么场景？
AI: 适合客服对话、访谈记录、教学问答和产品演示。
用户：语法复杂吗？
AI：不复杂，一行一个角色和内容即可。
:::
```

## 主题矩阵

内置主题包含兼容主题和专业主题矩阵。

兼容主题：

`default`, `tech`, `elegant`, `minimal`, `warm-tech`, `studio`

专业主题系列：

- Basic：`default`, `bytedance`, `apple`, `sports`, `chinese`, `cyber`
- Minimal：`minimal-gold`, `minimal-green`, `minimal-blue`, `minimal-orange`, `minimal-red`, `minimal-navy`, `minimal-gray`, `minimal-sky`
- Focus：`focus-gold`, `focus-green`, `focus-blue`, `focus-orange`, `focus-red`, `focus-navy`, `focus-gray`, `focus-sky`
- Elegant：`elegant-gold`, `elegant-green`, `elegant-blue`, `elegant-orange`, `elegant-red`, `elegant-navy`, `elegant-gray`, `elegant-sky`
- Bold：`bold-gold`, `bold-green`, `bold-blue`, `bold-orange`, `bold-red`, `bold-navy`, `bold-gray`, `bold-sky`
- Featured：`sspai-red`, `wechat-native`

## GFM 提示框与脚注

支持 GitHub 风格提示框：

```md
> [!NOTE]
> 这是提示。

> [!WARNING]
> 这是警告。
```

支持的类型：

- `NOTE`
- `TIP`
- `IMPORTANT`
- `WARNING`
- `CAUTION`

脚注示例：

```md
正文引用脚注[^1]。

[^1]: 脚注内容。
```

最终脚注区标题会渲染为 `引用链接`。

## 本地 REST API

启动本地服务：

```bash
wxp serve --port 8080
```

健康检查：

```bash
curl http://127.0.0.1:8080/health
```

### 转换 Markdown

```bash
curl -X POST "http://127.0.0.1:8080/api/v1/convert" \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Hello\n\nBody",
    "theme": "studio",
    "fontSize": "medium",
    "convertVersion": "v1"
  }'
```

成功响应：

```json
{
  "success": true,
  "data": {
    "html": "<section style=\"...\">...</section>",
    "theme": "studio",
    "external_images": [],
    "local_images": [],
    "warnings": []
  }
}
```

`fontSize` 和 `convertVersion` 只用于兼容调用方。暂不支持的值会被忽略，并出现在 `warnings` 中。

### 创建图文草稿

```bash
curl -X POST "http://127.0.0.1:8080/api/v1/article-draft" \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# 标题\n\n正文",
    "theme": "studio",
    "title": "文章标题",
    "author": "作者",
    "digest": "摘要",
    "cover": "/absolute/path/to/cover.jpg"
  }'
```

也可以用 `coverUrl` 传公网封面图。

不传 `cover` 或 `coverUrl` 时，会使用内置占位封面图，并返回 `used_placeholder_cover: true`。

### 单图文草稿别名

`POST /api/v1/newspic-draft` 是 `article-draft` 的单图文别名。

### 批量上传图片

```bash
curl -X POST "http://127.0.0.1:8080/api/v1/batch-upload" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "/absolute/path/to/local.png",
      "https://example.com/remote.jpg"
    ]
  }'
```

草稿和上传端点需要先配置 `wechat_appid` 和 `wechat_secret`。

## 图片处理

图片来源会从以下位置收集：

- 普通 Markdown 图片
- 模块字段，例如 `image`、`left_image`、`right_image`
- 图片类模块的行字段
- `gallery` 和 `longimage` 模块里的 Markdown 图片

执行 `publish` 时，外链图片和本地图片会按原有逻辑上传到微信素材库。本地相对路径按 Markdown 文件所在目录解析。

## 兼容说明

- 转换结果只包含可发布的文章 HTML，不包含预览页外壳。
- 所有样式以内联 `style` 输出，面向微信公众号草稿。
- 高级模块生成的 HTML 使用 `section`、`p`、`span`、`img`、`a`、`ul`、`li` 等普通标签。
- 不支持外部 CSS、脚本、事件处理器、iframe 或用户手写的任意原始 HTML。
- 需要高级模块视觉风格时，使用 `--theme studio`。

## 故障排查

| 现象 | 检查项 |
| --- | --- |
| 模块按纯文本显示 | 模块名是否正确、是否缺少闭合 `:::`、模块块是否被缩进 |
| 字段值没有生效 | 是否用了英文冒号 `:`，不要用中文冒号 `：` |
| 行型模块内容为空 | 每个必需的 `|` 列是否都有内容 |
| 图片没有上传 | 先看 `convert` 返回的 `external_images` 和 `local_images` 是否包含该图片 |
| 草稿 API 返回 `配置不完整` | 执行 `wxp config set wechat_appid ...` 和 `wxp config set wechat_secret ...` |
| 微信提示 IP 不在白名单 | 到微信开发者平台添加当前出口 IP |

## 推荐自动化流程

1. 判断文章属于发布稿、教程、方法论、服务页还是品牌/系列文章。
2. 选一个开场模块。
3. 选一到两个证据模块。
4. 选一个收尾模块。
5. 使用 `theme: "studio"` 转换。
6. 检查 `external_images`、`local_images` 和 `warnings`。
7. 预览确认后再创建草稿。
