/**
 * 创意版草稿发布脚本
 * 设计风格：墨与金——纯白底，深墨文字，金色强调，杂志编辑排版
 * 与 wxp 工具版形成对照，内容相同，视觉设计完全自定义
 */

import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { WechatClient } from "../dist/wechat/client.js"

// ─── 读取配置（复用 wxp 的配置查找逻辑）───────────────────────────────────────

function loadConfig() {
  const globalPath = join(homedir(), ".config", "wx-publisher", "config.json")
  const localPath  = join(process.cwd(), ".wxp.json")
  const readJson   = p => existsSync(p) ? JSON.parse(readFileSync(p, "utf-8")) : {}
  return { ...readJson(globalPath), ...readJson(localPath) }
}

// ─── 设计 Token ───────────────────────────────────────────────────────────────

const D = {
  bg:          "#FFFFFF",
  text:        "#1A1A1A",
  textMuted:   "#555555",
  accent:      "#B8870C",         // 深金
  accentLight: "#FFFDF0",         // 金的浅底
  accentBorder:"#E8C96A",         // 金的淡边
  codeBg:      "#1C1C1E",         // Apple 暗色
  codeText:    "#F5F5F7",         // Apple 亮文字
  inlineCodeBg:"#F3EFE8",         // 暖米色
  inlineCode:  "#B5260C",         // 砖红
  tableHead:   "#1A1A1A",
  tableHeadTxt:"#FFFFFF",
  tableAlt:    "#FAF9F7",
  border:      "#E8E3D8",
  font:        "-apple-system, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif",
  mono:        "'SF Mono', Menlo, Monaco, 'Courier New', monospace",
}

// ─── HTML 拼装工具 ────────────────────────────────────────────────────────────

const s = obj => Object.entries(obj).map(([k,v]) => `${k}:${v}`).join(";")

// ─── 创意正文 HTML ────────────────────────────────────────────────────────────

const html = `<section style="${s({
  "font-family":    D.font,
  "color":          D.text,
  "background":     D.bg,
  "padding":        "8px 4px 32px",
  "line-height":    "1.85",
  "font-size":      "15.5px",
  "-webkit-font-smoothing": "antialiased",
})}">

<!-- ═══ 标题区 ═══ -->
<h1 style="${s({
  "font-size":      "27px",
  "font-weight":    "900",
  "color":          "#0A0A0A",
  "letter-spacing": "-0.5px",
  "line-height":    "1.25",
  "margin":         "0 0 20px",
  "padding-bottom": "18px",
  "border-bottom":  `3px solid ${D.accent}`,
})}">写给开发者的排版指南</h1>

<!-- 引言 standfirst -->
<p style="${s({
  "font-size":     "16.5px",
  "color":         D.accent,
  "font-style":    "italic",
  "line-height":   "1.75",
  "margin":        "0 0 32px",
  "padding":       "14px 18px",
  "background":    D.accentLight,
  "border-left":   `4px solid ${D.accent}`,
  "border-radius": "0 6px 6px 0",
})}">好的排版不是装饰，是思维的组织方式。当代码有了层次，读者才有了方向。</p>


<!-- ═══ 第一节 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
  "line-height":  "1.4",
})}">为什么开发者也要懂排版</h2>

<p style="margin:0 0 14px;line-height:1.85;">很多开发者认为排版是设计师的事。但当你写 README、技术博客、设计文档时，<strong style="color:${D.accent};font-weight:700;">你就是那个设计师</strong>。</p>

<p style="margin:0 0 14px;line-height:1.85;">文字的<strong style="color:${D.accent};font-weight:700;">视觉层次</strong>和代码的<em style="font-style:italic;color:#555;">逻辑层次</em>遵循同样的原则：让读者能够快速找到关键信息，跳过已知内容，停留在需要深度理解的部分。</p>

<p style="margin:0 0 28px;line-height:1.85;">一份好的技术文档，能把三十分钟的 code review 压缩到五分钟。这不是魔法，是排版。</p>


<!-- ═══ 第二节 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
  "line-height":  "1.4",
})}">标题层级的使用</h2>

<p style="margin:0 0 14px;line-height:1.85;">合理使用标题层级，就像函数的命名一样，越具体越好。</p>

<h3 style="${s({
  "font-size":    "16px",
  "font-weight":  "600",
  "color":        "#0A0A0A",
  "margin":       "24px 0 10px",
  "padding-left": "12px",
  "border-left":  `3px solid ${D.accentBorder}`,
})}">三级标题：章节划分</h3>

<p style="margin:0 0 14px;line-height:1.85;">三级标题用于划分大章节内的具体话题，读者扫视标题应能大致了解全文结构。</p>

<h4 style="${s({
  "font-size":    "15px",
  "font-weight":  "600",
  "color":        D.textMuted,
  "margin":       "20px 0 8px",
  "letter-spacing":"0.3px",
})}">四级标题：细节分组</h4>

<p style="margin:0 0 28px;line-height:1.85;">四级标题适合参数列表或对比分组。如果你发现自己经常用到四级标题，考虑把这篇文档拆分成多篇。</p>


<!-- ═══ 第三节 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
})}">文字强调与修饰</h2>

<p style="margin:0 0 12px;line-height:1.85;">行文中的强调要克制，用多了就失去了强调的意义：</p>

<p style="${s({ "margin":"0 0 6px", "padding-left":"20px", "line-height":"1.85" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">▸</span><strong style="color:${D.accent};">粗体</strong>：关键术语、需要读者特别注意的信息</p>
<p style="${s({ "margin":"0 0 6px", "padding-left":"20px", "line-height":"1.85" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">▸</span><em style="font-style:italic;">斜体</em>：引用词汇、对比场景、外来语</p>
<p style="${s({ "margin":"0 0 6px", "padding-left":"20px", "line-height":"1.85" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">▸</span><code style="font-family:${D.mono};background:${D.inlineCodeBg};color:${D.inlineCode};padding:1px 5px;border-radius:3px;font-size:13.5px;">行内代码</code>：技术名词、命令、文件路径</p>
<p style="${s({ "margin":"0 0 6px", "padding-left":"20px", "line-height":"1.85" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">▸</span><strong style="color:${D.accent};"><em>粗斜体</em></strong>：双重强调，谨慎使用，通常一篇文章里不超过两次</p>
<p style="${s({ "margin":"0 0 28px", "padding-left":"20px", "line-height":"1.85" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">▸</span><span style="text-decoration:line-through;color:#999;">删除线</span>：已废弃的方案或修订痕迹</p>


<!-- ═══ 第四节 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
})}">代码展示</h2>

<p style="margin:0 0 14px;line-height:1.85;">行内引用 <code style="font-family:${D.mono};background:${D.inlineCodeBg};color:${D.inlineCode};padding:2px 6px;border-radius:3px;font-size:13.5px;">const result = await fetch(url)</code> 用于短片段、变量名、文件名。</p>

<p style="margin:0 0 8px;line-height:1.85;">代码块要标注语言，启用语法高亮：</p>

<pre style="${s({
  "background":    D.codeBg,
  "border-radius": "8px",
  "padding":       "18px 20px",
  "margin":        "0 0 16px",
  "overflow-x":    "auto",
  "border":        `1px solid #333`,
})}"><code style="${s({
  "font-family":  D.mono,
  "font-size":    "13px",
  "line-height":  "1.7",
  "color":        D.codeText,
  "white-space":  "nowrap",
  "display":      "block",
})}"><span style="color:#9AA8FF;">interface</span>&nbsp;<span style="color:#7DD3FC;">Article</span>&nbsp;{<br>&nbsp;&nbsp;title:&nbsp;<span style="color:#86EFAC;">string</span><br>&nbsp;&nbsp;content:&nbsp;<span style="color:#86EFAC;">string</span><br>&nbsp;&nbsp;publishedAt:&nbsp;<span style="color:#86EFAC;">Date</span><br>}<br><br><span style="color:#9AA8FF;">async</span>&nbsp;<span style="color:#9AA8FF;">function</span>&nbsp;<span style="color:#7DD3FC;">publishDraft</span>(article:&nbsp;<span style="color:#7DD3FC;">Article</span>):&nbsp;<span style="color:#9AA8FF;">Promise</span>&lt;<span style="color:#86EFAC;">string</span>&gt;&nbsp;{<br>&nbsp;&nbsp;<span style="color:#9AA8FF;">const</span>&nbsp;response&nbsp;=&nbsp;<span style="color:#9AA8FF;">await</span>&nbsp;client.<span style="color:#7DD3FC;">createDraft</span>([{<br>&nbsp;&nbsp;&nbsp;&nbsp;title:&nbsp;article.title,<br>&nbsp;&nbsp;&nbsp;&nbsp;content:&nbsp;article.content,<br>&nbsp;&nbsp;&nbsp;&nbsp;thumb_media_id:&nbsp;<span style="color:#9AA8FF;">await</span>&nbsp;<span style="color:#7DD3FC;">uploadCover</span>(),<br>&nbsp;&nbsp;}])<br>&nbsp;&nbsp;<span style="color:#9AA8FF;">return</span>&nbsp;response.media_id<br>}</code></pre>

<p style="margin:0 0 8px;line-height:1.85;">Shell 命令同样需要高亮：</p>

<pre style="${s({
  "background":    "#0D1117",
  "border-radius": "8px",
  "padding":       "16px 20px",
  "margin":        "0 0 28px",
  "border-left":   `3px solid ${D.accent}`,
})}"><code style="${s({
  "font-family":  D.mono,
  "font-size":    "13px",
  "line-height":  "1.7",
  "color":        "#C9D1D9",
  "white-space":  "nowrap",
  "display":      "block",
})}"><span style="color:#6E7681;">#&nbsp;发布到草稿箱，使用&nbsp;tech&nbsp;主题</span><br><span style="color:#79C0FF;">wxp</span>&nbsp;publish&nbsp;--file&nbsp;article.md&nbsp;<span style="color:#FFA657;">\</span><br>&nbsp;&nbsp;--theme&nbsp;tech&nbsp;<span style="color:#FFA657;">\</span><br>&nbsp;&nbsp;--digest&nbsp;<span style="color:#A5D6FF;">"技术文章排版实战指南"</span></code></pre>


<!-- ═══ 第五节 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
})}">列表与层级</h2>

<p style="margin:0 0 10px;line-height:1.85;"><strong style="color:${D.accent};">无序列表</strong>适合并列项，没有优先级顺序：</p>
<p style="${s({ "margin":"0 0 5px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};margin-right:8px;">▸</span>简洁：每条只说一件事，不要用一个列表项讲两件事</p>
<p style="${s({ "margin":"0 0 5px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};margin-right:8px;">▸</span>对称：用相同的语法结构（都用动词开头，或都用名词开头）</p>
<p style="${s({ "margin":"0 0 16px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};margin-right:8px;">▸</span>克制：超过七项考虑分组，超过十项考虑用表格</p>

<p style="margin:0 0 10px;line-height:1.85;"><strong style="color:${D.accent};">有序列表</strong>适合步骤，顺序至关重要：</p>
<p style="${s({ "margin":"0 0 5px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">1.</span>确定核心信息：你想让读者记住什么？</p>
<p style="${s({ "margin":"0 0 5px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">2.</span>组织逻辑结构：先总后分，还是问题驱动？</p>
<p style="${s({ "margin":"0 0 5px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">3.</span>选择合适格式：段落、列表还是表格？</p>
<p style="${s({ "margin":"0 0 16px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};font-weight:700;margin-right:8px;">4.</span>初稿完成后放一天再修改</p>

<p style="margin:0 0 10px;line-height:1.85;"><strong style="color:${D.accent};">嵌套列表</strong>表示从属关系，最多两层，三层就是结构问题：</p>
<p style="${s({ "margin":"0 0 3px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};margin-right:8px;">▸</span>写作阶段</p>
<p style="${s({ "margin":"0 0 3px", "padding-left":"42px", "line-height":"1.8", "color":D.textMuted })}"><span style="margin-right:8px;">◦</span>初稿：先写完，不求完美，把思路倒出来</p>
<p style="${s({ "margin":"0 0 10px", "padding-left":"42px", "line-height":"1.8", "color":D.textMuted })}"><span style="margin-right:8px;">◦</span>修改：删减冗余，强化重点，检查逻辑链</p>
<p style="${s({ "margin":"0 0 3px", "padding-left":"20px", "line-height":"1.8" })}"><span style="color:${D.accent};margin-right:8px;">▸</span>发布阶段</p>
<p style="${s({ "margin":"0 0 3px", "padding-left":"42px", "line-height":"1.8", "color":D.textMuted })}"><span style="margin-right:8px;">◦</span>排版预览：所见即所得的检查</p>
<p style="${s({ "margin":"0 0 28px", "padding-left":"42px", "line-height":"1.8", "color":D.textMuted })}"><span style="margin-right:8px;">◦</span>图片处理：替换外链图片为素材库 URL</p>


<!-- ═══ 第六节 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
})}">引用块</h2>

<p style="margin:0 0 12px;line-height:1.85;">引用块用于突出核心论点，或明确区分「引用他人观点」和「自己的表述」：</p>

<blockquote style="${s({
  "border-left":   `4px solid ${D.accent}`,
  "background":    D.accentLight,
  "padding":       "18px 20px 18px 24px",
  "margin":        "0 0 16px",
  "border-radius": "0 8px 8px 0",
  "position":      "relative",
})}">
  <p style="${s({
    "font-size":   "15.5px",
    "font-style":  "italic",
    "color":       "#3A2E1A",
    "line-height": "1.8",
    "margin":      "0",
  })}">文档是给未来的自己写的情书。当你六个月后回头看，会感谢现在认真写文档的自己。</p>
</blockquote>

<p style="margin:0 0 12px;line-height:1.85;">引用也适合做「注意事项」的标记：</p>

<blockquote style="${s({
  "border-left":   `4px solid #E57373`,
  "background":    "#FFF8F8",
  "padding":       "16px 20px 16px 24px",
  "margin":        "0 0 28px",
  "border-radius": "0 8px 8px 0",
})}">
  <p style="${s({
    "font-size":   "15px",
    "color":       "#5A2020",
    "line-height": "1.8",
    "margin":      "0",
  })}"><strong style="color:#C0392B;">⚠️ 注意</strong>：微信公众号不支持外链跳转，正文中的 URL 链接会在发布后降级为带下划线的纯文字。需要引导读者的链接，建议放到文末用二维码呈现。</p>
</blockquote>


<!-- ═══ 第七节 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
})}">表格</h2>

<p style="margin:0 0 12px;line-height:1.85;">表格适合对比和结构化数据，不适合描述性、流水账式的内容：</p>

<table style="${s({
  "width":           "100%",
  "border-collapse": "collapse",
  "font-size":       "14px",
  "margin":          "0 0 28px",
  "border-radius":   "8px",
  "overflow":        "hidden",
  "border":          `1px solid ${D.border}`,
})}">
  <thead>
    <tr>
      <th style="${s({ "background":D.tableHead, "color":D.tableHeadTxt, "padding":"11px 14px", "text-align":"left", "font-weight":"600", "white-space":"nowrap" })}">元素</th>
      <th style="${s({ "background":D.tableHead, "color":D.tableHeadTxt, "padding":"11px 14px", "text-align":"left", "font-weight":"600" })}">适用场景</th>
      <th style="${s({ "background":D.tableHead, "color":D.tableHeadTxt, "padding":"11px 14px", "text-align":"left", "font-weight":"600" })}">常见误用</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "white-space":"nowrap" })}"><strong style="color:${D.accent};">粗体</strong></td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">关键术语首次出现</td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">每句话都加粗，弱化了重点</td>
    </tr>
    <tr style="background:${D.tableAlt};">
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "white-space":"nowrap" })}"><em style="font-style:italic;">斜体</em></td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">引用、外来词、对比</td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">代替粗体做强调</td>
    </tr>
    <tr>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "white-space":"nowrap" })}"><code style="font-family:${D.mono};background:${D.inlineCodeBg};color:${D.inlineCode};padding:1px 5px;border-radius:3px;font-size:12.5px;">代码块</code></td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">可执行内容、技术名词</td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">仅仅想要等宽字体效果</td>
    </tr>
    <tr style="background:${D.tableAlt};">
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "white-space":"nowrap" })}">表格</td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">对比、参数列表、矩阵</td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">流水账式的内容</td>
    </tr>
    <tr>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "white-space":"nowrap" })}">引用块</td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">核心论点、他人引语</td>
      <td style="${s({ "padding":"10px 14px", "border-top":`1px solid ${D.border}`, "color":D.textMuted })}">纯装饰目的</td>
    </tr>
  </tbody>
</table>


<!-- ═══ 分割线 ═══ -->
<p style="text-align:center;margin:32px 0;"><span style="${s({
  "display":         "inline-block",
  "width":           "48px",
  "height":          "2px",
  "background":      D.accent,
  "vertical-align":  "middle",
  "margin":          "0 8px",
})}"></span><span style="color:${D.accent};font-size:12px;letter-spacing:3px;vertical-align:middle;">✦</span><span style="${s({
  "display":         "inline-block",
  "width":           "48px",
  "height":          "2px",
  "background":      D.accent,
  "vertical-align":  "middle",
  "margin":          "0 8px",
})}"></span></p>


<!-- ═══ 第八节 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
})}">链接处理</h2>

<p style="margin:0 0 28px;line-height:1.85;">微信公众号正文不支持外链跳转，链接在发布时会降级为带下划线的纯文字。建议做法：需要跳转的内容放到<strong style="color:${D.accent};">文末</strong>，配合二维码或「阅读原文」按钮引导读者。正文中只写出链接的文字描述。</p>


<!-- ═══ 小结 ═══ -->
<h2 style="${s({
  "font-size":    "18px",
  "font-weight":  "700",
  "color":        "#0A0A0A",
  "padding":      "10px 16px",
  "background":   D.accentLight,
  "border-left":  `4px solid ${D.accent}`,
  "border-radius":"0 6px 6px 0",
  "margin":       "36px 0 16px",
})}">小结</h2>

<p style="margin:0 0 14px;line-height:1.85;">好的排版服务于内容，坏的排版消耗读者注意力。每个格式决策背后都应该有理由：</p>

<!-- 尾部引言卡片 -->
<p style="${s({
  "font-size":     "17px",
  "font-weight":   "700",
  "color":         D.accent,
  "text-align":    "center",
  "padding":       "24px 20px",
  "background":    D.accentLight,
  "border":        `1px solid ${D.accentBorder}`,
  "border-radius": "8px",
  "margin":        "0 0 16px",
  "line-height":   "1.6",
})}">这样写，读者能更快理解我想表达的意思吗？</p>

<p style="margin:0 0 0;line-height:1.85;color:${D.textMuted};">如果答案是否定的，删掉那个格式。如果答案是肯定的，留下它，但不要加更多。</p>

</section>`

// ─── 发布 ─────────────────────────────────────────────────────────────────────

const config = loadConfig()
if (!config.wechat_appid || !config.wechat_secret) {
  console.error("❌  未找到 wechat_appid / wechat_secret 配置")
  process.exit(1)
}

const client = new WechatClient({ appid: config.wechat_appid, secret: config.wechat_secret })

// 上传占位封面（复用 CLI 里的逻辑）
import { writeFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { PLACEHOLDER_COVER_BASE64 } from "../dist/converter/placeholder-cover.js"

const tmpPath = join(tmpdir(), `creative-cover-${randomUUID()}.png`)
writeFileSync(tmpPath, Buffer.from(PLACEHOLDER_COVER_BASE64, "base64"))
let thumbMediaId
try {
  const r = await client.uploadImage(tmpPath)
  thumbMediaId = r.media_id
} finally {
  try { unlinkSync(tmpPath) } catch {}
}

const draft = await client.createDraft([{
  title:          "[基准测试] 写给开发者的排版指南 · 创意版",
  content:        html,
  thumb_media_id: thumbMediaId,
  digest:         "同样的内容，不同的视觉语言。墨与金——纯白底，深墨文字，金色强调，杂志编辑风排版。",
  show_cover_pic: 1,
  need_open_comment: 0,
}])

console.log(JSON.stringify({ success: true, media_id: draft.media_id, message: "创意版草稿已创建" }, null, 2))
