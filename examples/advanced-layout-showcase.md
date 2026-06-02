# wx-publisher 高级模块效果预览

**这是一篇用于验收排版能力的示例文章。** 它覆盖普通 Markdown、高级模块、GFM 提示框、脚注、代码、表格、图片和草稿发布链路。

这份文件是长期维护的全特性样本。新增或调整渲染能力时，应同步更新这里，保证人工预览和自动化测试看到的是同一套输入。

![示例封面图](https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900)

---

## 基础 Markdown 能力

### 文本与段落

普通段落用于验证正文节奏、字距、行高和移动端阅读密度。这里包含 `inlineCode`、**加粗文本**、*斜体文本* 和一个普通链接：[项目主页](https://example.com)。

> 这是一个普通引用块，用来验证引用样式和正文之间的间距。

> [!NOTE]
> 这是 NOTE 提示框，适合补充说明。

> [!TIP]
> 这是 TIP 提示框，适合放操作技巧。

> [!IMPORTANT]
> 这是 IMPORTANT 提示框，适合强调关键限制。

> [!WARNING]
> 这是 WARNING 提示框，适合提醒潜在风险。

> [!CAUTION]
> 这是 CAUTION 提示框，适合放高风险操作提醒。

### 列表

无序列表：

- 保持正文清晰
- 保持模块克制
- 保持草稿可检查

有序列表：

1. 编写 Markdown
2. 转换为微信 HTML
3. 创建草稿并人工检查

### 代码块

```ts
type PublishResult = {
  success: boolean
  media_id?: string
}

export function shouldReviewDraft(result: PublishResult): boolean {
  return result.success && Boolean(result.media_id)
}
```

### 表格

| 能力 | 示例位置 | 状态 |
| --- | --- | --- |
| 普通 Markdown | 基础章节 | 已覆盖 |
| 高级模块 | 模块章节 | 已覆盖 |
| 本地 API | 文档章节 | 已覆盖 |

### 脚注

这句话带有脚注引用[^1]，用于验证脚注编号、回链和末尾引用区。

[^1]: 脚注内容会在文章末尾生成引用链接区域。

---

## 高级模块能力

:::hero
eyebrow: FEATURE
meta: 2026.05
kicker: 全特性样例
title: 结构负责信息骨架 | 主题负责阅读气质
subtitle: 这份文章集中展示高级模块在公众号草稿中的实际渲染效果，便于每次迭代后快速人工检查
image: https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900
brand: wx-publisher
tags: 示例 | 验收 | 草稿
:::

:::cards[高级模块分组]
PART 01 | 开场模块 | 快速交代文章判断和阅读入口 | accent
PART 02 | 证据模块 | 用数据、案例、步骤和对比支撑观点 | default
PART 03 | 收尾模块 | 用作者、系列、订阅和行动完成闭环 | default
:::

:::metrics[关键指标]
模块覆盖 | 43+ | 当前公开高级模块都会在本文出现 | accent
维护成本 | 单文件 | 人工验收和自动测试共用同一份示例 | default
:::

:::steps[执行步骤]
01 | 先写判断 | 让读者先知道这篇文章要解决什么问题 | 适合流程说明
02 | 再放证据 | 用数据、案例和对比支撑判断 | 适合教程和方案
03 | 最后收口 | 用总结、订阅和行动模块完成闭环 | 适合转化场景
:::

:::compare[前后变化]
旧方式 | 只靠普通标题和段落堆内容 | 新方式 | 用模块承载不同阅读任务 | accent
弱验收 | 每次只看局部效果 | 强验收 | 一篇示例覆盖所有核心能力 | default
:::

:::timeline[迭代节奏]
阶段 1 | 合并基础能力 | 恢复高级模块解析、主题和本地 API
阶段 2 | 补齐模块 | 让 43 个公开模块都能真实渲染
阶段 3 | 扩展主题 | 用系列化主题矩阵覆盖更多内容气质
:::

:::infographic
type: statement
eyebrow: 信息图判断
title: 先让|一个结论|被读者看到
subtitle: 信息图模块适合把文章里的关键判断提前放大
quote: 一个屏幕只讲一个重点。
note: 适合开场、中段转场和结论强化
:::

:::audience-fit
title: 这篇示例适合谁
fit: 正在维护排版能力的人 | 需要验收草稿效果的人 | 想快速检查模块覆盖的人
avoid: 只想看最短说明的人 | 不需要人工预览的人
:::

:::bridge
label: 下一段为什么重要
title: 判断之后必须接上证据
body: 读者已经知道这篇文章的目标，接下来要看到模块、场景和验收方式如何落地。
next: 继续看判断与证据模块
:::

:::manifesto
label: 维护原则
title: 示例不是装饰，而是渲染能力的契约
body: 只要能力发生重大变化，示例、文档、测试和草稿预览就要一起更新。
believe: 示例优先覆盖真实能力 | 文档只写我们自己的口径 | 每次迭代自行验证并提交
against: 只复制外部命名 | 只做样式不做测试 | 让示例长期落后于代码
note: 适合记录团队长期维护原则
:::

:::myth-fact[误区澄清]
模块越多越好 | 模块必须服务阅读任务，否则只会增加噪音
主题只是换颜色 | 主题应该影响内容气质、节奏和强调方式
示例文件可有可无 | 示例是人工验收和自动测试共同入口
:::

:::verdict
eyebrow: 最终判断
title: 示例文件应该跟着能力一起演进
body: 如果模块、主题或 API 输出发生重大变化，而示例没有更新，人工验收就会失真。
:::

:::people[参与角色]
维护者 | 规则制定 | 决定哪些能力必须进入示例 | accent
审核者 | 效果检查 | 在公众号后台检查草稿真实观感 | default
:::

:::cases[使用场景]
发布前验收 | 降低遗漏 | 一次草稿预览覆盖主要渲染能力 | accent
回归测试 | 更稳定 | 测试直接读取示例文件，避免样本漂移 | default
:::

:::pricing[方案组合]
快速检查 | ￥0 | 转换 HTML / 浏览器预览 / 草稿验收 | default
完整验收 | ￥0 | 全模块覆盖 / 图片上传 / 脚注提示框 | accent
:::

:::faq[常见问题]
为什么需要单独维护示例文件？ | 因为它是人工验收和自动化测试之间的共同输入。
示例要写得像真实文章吗？ | 不需要，它首先要覆盖能力，其次才是阅读自然。
:::

:::logos[相关对象]
Markdown | 内容源
HTML | 转换结果
WeChat Draft | 人工预览
:::

:::part
index: 01
title: 正文能力和模块能力一起验收
subtitle: MARKDOWN · MODULES · DRAFT
:::

:::label-title
label: 维护规则
title: 重大能力变化必须同步更新全特性示例
:::

:::quote
eyebrow: 核心原则
quote: 示例不是装饰文档，而是验收入口。
source: wx-publisher 维护约定
note: 适合在迭代前后做人工检查
:::

:::image-text
layout: right
eyebrow: 图文说明
title: 图文模块用于检查图片和说明的并排组织
body: 图片类模块会收集图片 URL，发布草稿时按原有逻辑上传到微信素材库。
note: 适合产品截图、操作说明和结果展示
image: https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900
alt: 写作工作台
:::

:::image-compare
eyebrow: 前后对比
title: 对比模块用于检查双图结构
left_title: 调整前
left_image: https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900
right_title: 调整后
right_image: https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900
note: 适合界面改版、封面优化和方案 A/B 对比
:::

:::image-annotate
eyebrow: 图片标注
title: 标注模块用于检查定位点和说明列表
note: 标注点使用百分比定位
image: https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900
alt: 标注示例图片
point: 01 | 22 | 28 | 主信息区 | 第一眼要看到标题和核心判断
point: 02 | 68 | 42 | 证据区 | 放指标、截图或案例
point: 03 | 52 | 78 | 行动区 | 放下一步动作或检查项
:::

:::toc[阅读导航]
01 | 看基础能力 | 检查标题、段落、列表、代码和表格
02 | 看高级模块 | 检查结构模块、图片模块和收尾模块
03 | 看草稿效果 | 在公众号后台确认真实渲染结果
:::

:::checklist[发布前检查]
done | 示例文件已更新 | 重大能力变化先同步示例
pending | 草稿效果待确认 | 发布后在后台人工检查
warn | 图片上传需关注 | 外链图片可能受网络或微信限制影响
:::

:::toolbox[资源工具箱]
文档 | 高级模块使用指南 | 查看完整字段、别名和 API 说明 | docs/advanced-layout.md
命令 | 转换预览命令 | 生成 HTML 后人工检查 | npm run dev -- convert
草稿 | 发布草稿命令 | 创建公众号后台可见草稿 | npm run dev -- publish
:::

:::specs[参数信息]
主题 | studio | 高级模块推荐使用该主题检查效果
输入 | Markdown 文件 | 示例文件是人工验收的单一来源
输出 | 微信兼容 HTML | 所有样式以内联 style 输出
:::

:::image-steps[操作步骤]
01 | 转换示例 | 先生成 HTML，确认没有原始模块语法泄漏。 | https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900 | 适合本地快速检查
02 | 预览主题 | 打开浏览器预览页，检查整体排版节奏。 | https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900 | 适合人工比较主题
03 | 创建草稿 | 发布到公众号草稿箱，检查微信后台真实效果。 | https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900 | 适合最终验收
:::

:::notice[适用说明]
适合 | 重大模块、主题、渲染变更 | 需要人工确认视觉和结构
前提 | 示例必须同步更新 | 不要只改代码不改验收样本
风险 | 示例过长 | 这份文件优先保证覆盖率
不适合 | 单个小文案修正 | 这类改动通常无需更新全特性示例
:::

:::callout[重点提醒]
提示 | 示例要保持可运行 | 不要放需要登录或容易失效的资源
注意 | 草稿不等于发布 | 后台仍需要人工检查后再发布
:::

:::changelog
{"version":"v2","date":"2026.05","added":["补齐公开高级模块的本地渲染能力"],"changed":["示例文件覆盖所有模块和基础 Markdown"],"fixed":["转换、测试、构建、草稿预览一起执行"]}
:::

:::comparison-table
{"left":{"title":"原状态","items":["高级模块部分覆盖","主题数量较少","验收样例零散"]},"right":{"title":"目标状态","items":["43 个公开模块全部可渲染","系列化主题矩阵","单一 canonical 示例"]}}
:::

:::definition
{"term":"全特性示例","def":"一篇长期维护的 Markdown 文章，用来同时覆盖普通语法、高级模块、主题和发布链路。","termLabel":"定义"}
:::

:::question
[{"q":"为什么要维护这么长的示例？","a":"因为公众号后台的真实渲染和浏览器预览可能存在差异，完整样例能减少重大变更后的遗漏。"}]
:::

:::quote-card
{"text":"示例文件是渲染能力的快照。","source":"本地维护规范"}
:::

:::resource-list
[{"name":"高级模块使用指南","url":"https://example.com/docs","desc":"查看完整字段和 API 说明","icon":"文档"},{"name":"转换预览命令","url":"https://example.com/convert","desc":"生成 HTML 后人工检查","icon":"命令"},{"name":"发布草稿命令","url":"https://example.com/publish","desc":"创建公众号后台可见草稿","icon":"草稿"}]
:::

:::stat-row
[{"value":"43","label":"公开模块","note":"作为模块覆盖率基准"},{"value":"3","label":"增强模块","note":"对话、画廊和长图"},{"value":"48","label":"配色备用","note":"用本地参考资料维护"}]
:::

:::tweet
{"name":"本地维护笔记","handle":"@local","text":"一个本地排版工具，真正重要的是可重复、可验证、可发布到草稿箱。","timestamp":"2026.05"}
:::

:::dialogue[维护者与审核者]
维护者: 我更新了一个高级模块，需要改示例吗？
审核者: 如果它影响语法、渲染结构、主题表现或 API 输出，就需要同步更新。
维护者: 更新后怎么验收？
审核者: 先跑测试和构建，再转换示例，最后发布草稿看后台效果。
:::

:::summary
eyebrow: 一句话总结
highlight: 全特性示例是能力变化的验收入口
body: 以后重大变更要同时更新示例、文档和测试，避免功能实现与人工预览脱节。
:::

:::author-card
name: wx-publisher
role: 本地公众号排版与草稿工具
bio: 负责把 Markdown 转换为微信公众号兼容 HTML，并创建可人工检查的公众号草稿。
tags: Markdown | 微信草稿 | 高级模块
note: 示例文件随能力一起维护
link: docs/advanced-layout.md
:::

:::series
name: 维护手册
issue: 01
title: 用示例文章守住渲染质量
desc: 这个系列用于沉淀工具能力、示例规范和发布检查流程。
tags: 示例 | 回归 | 草稿
next: 下一步：为更多主题补齐视觉验收
:::

:::subscribe
label: 持续维护
title: 每次重大变更都要回到这份示例
subtitle: 示例、文档、测试和草稿预览应该一起演进。
primary: 更新示例
secondary: 发布草稿
note: 先验证，再提交，再预览
:::

:::cta
title: 如果这篇草稿看起来稳定，就可以把它作为后续高级模块验收基准。
note: BUILD WITH STRUCTURE
:::

### 图片画廊

:::gallery[滑动图片示例]
![写作桌面](https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900)
![编辑工作](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900)
:::

### 长图展示

:::longimage[长图容器示例]
![长图示例](https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900&h=1400)
:::

---

## 结束语

这份示例的目标不是短，而是完整。只要高级模块、主题、图片、脚注、提示框或发布链路发生重大变化，就应该更新它，并重新生成草稿检查效果。
