/**
 * 文艺期刊版草稿发布脚本
 *
 * 设计方向：当代文学期刊（Literary Journal）
 * ─ 暖象牙底 · 衬线排版 · 砖红强调 · 罗马数字章节 · 大引言
 * ─ 灵感来源：n+1, Paris Review, Granta 等英文文学季刊
 */

import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir, tmpdir } from "os"
import { randomUUID } from "crypto"
import { WechatClient } from "../dist/wechat/client.js"
import { PLACEHOLDER_COVER_BASE64 } from "../dist/converter/placeholder-cover.js"

function loadConfig() {
  const globalPath = join(homedir(), ".config", "wx-publisher", "config.json")
  const localPath  = join(process.cwd(), ".wxp.json")
  const readJson   = p => existsSync(p) ? JSON.parse(readFileSync(p, "utf-8")) : {}
  return { ...readJson(globalPath), ...readJson(localPath) }
}

// ─── 设计 Token ───────────────────────────────────────────────────────────────

const C = {
  paper:      "#F9F5ED",   // 暖象牙纸
  ink:        "#1A1614",   // 墨黑（带暖调）
  inkMid:     "#5C5650",   // 中灰
  inkLight:   "#9C968E",   // 浅灰
  vermillion: "#A0291E",   // 砖红（唯一强调色）
  vermLight:  "#FDF1EF",   // 砖红浅底
  codeInk:    "#0E0B08",   // 代码块暖黑
  codeText:   "#D9CBBA",   // 代码正文（泛黄奶油）
  codeMuted:  "#807060",   // 代码注释
  inlineBg:   "#EEE8DC",   // 行内代码底
  inlineText: "#8B1A12",   // 行内代码字（深砖红）
  rule:       "#D8D1C4",   // 分割线
  serif:      "Georgia, 'Songti SC', STSong, 'Times New Roman', serif",
  mono:       "'SF Mono', Menlo, Monaco, 'Courier New', monospace",
}

// ─── 排版工具 ─────────────────────────────────────────────────────────────────

// 内联样式对象 → style 字符串
const s = obj => Object.entries(obj).map(([k,v]) => `${k}:${v}`).join(";")

// 段落：衬线、恰当行距
const P = (txt, extra = {}) =>
  `<p style="${s({ "font-family":C.serif, "font-size":"16px", "line-height":"1.9", "color":C.ink, "margin":"0 0 18px", ...extra })}">${txt}</p>`

// h2 section header with decorative roman numeral
const H2 = (roman, title) => `
<section style="margin:44px 0 20px;">
  <p style="${s({
    "font-family":    C.serif,
    "font-size":      "38px",
    "font-weight":    "700",
    "color":          C.vermillion,
    "opacity":        "0.18",
    "line-height":    "1",
    "margin":         "0 0 -22px",
    "letter-spacing": "-1px",
  })}">${roman}</p>
  <h2 style="${s({
    "font-family":  C.serif,
    "font-size":    "20px",
    "font-weight":  "700",
    "color":        C.ink,
    "margin":       "0",
    "padding":      "0 0 12px",
    "border-bottom":`2px solid ${C.vermillion}`,
    "line-height":  "1.35",
    "letter-spacing":"-0.3px",
  })}">${title}</h2>
</section>`

// h3 三级标题
const H3 = (title) =>
  `<h3 style="${s({
    "font-family":  C.serif,
    "font-size":    "16.5px",
    "font-weight":  "700",
    "color":        C.ink,
    "margin":       "26px 0 10px",
    "padding-left": "10px",
    "border-left":  `3px solid ${C.rule}`,
    "line-height":  "1.4",
  })}">${title}</h3>`

// 行内代码
const CODE = txt =>
  `<code style="${s({
    "font-family":   C.mono,
    "font-size":     "13.5px",
    "background":    C.inlineBg,
    "color":         C.inlineText,
    "padding":       "1px 5px",
    "border-radius": "3px",
    "border":        `1px solid ${C.rule}`,
  })}">${txt}</code>`

// 代码块（shell 风）
const SHELL_BLOCK = (content) => `
<pre style="${s({
  "background":    C.codeInk,
  "padding":       "20px 22px",
  "margin":        "0 0 22px",
  "border-radius": "4px",
  "border-left":   `4px solid ${C.vermillion}`,
  "overflow-x":    "auto",
})}"><code style="${s({
  "font-family": C.mono,
  "font-size":   "13px",
  "line-height": "1.75",
  "color":       C.codeText,
  "white-space": "nowrap",
  "display":     "block",
})}">${content}</code></pre>`

// 代码块（TS 风，深底暖色）
const TS_BLOCK = (content) => `
<pre style="${s({
  "background":    C.codeInk,
  "padding":       "20px 22px",
  "margin":        "0 0 22px",
  "border-radius": "4px",
  "border":        `1px solid #2A2520`,
  "overflow-x":    "auto",
})}"><code style="${s({
  "font-family": C.mono,
  "font-size":   "13px",
  "line-height": "1.75",
  "color":       C.codeText,
  "white-space": "nowrap",
  "display":     "block",
})}">${content}</code></pre>`

// 无序列表项（以 en dash 为 bullet）
const LI = (txt, indent = 0) =>
  `<p style="${s({
    "font-family":  C.serif,
    "font-size":    "16px",
    "line-height":  "1.85",
    "color":        indent ? C.inkMid : C.ink,
    "margin":       "0 0 7px",
    "padding-left": indent ? "38px" : "20px",
  })}"><span style="color:${C.vermillion};margin-right:9px;font-size:${indent ? "10px" : "14px"};">${indent ? "○" : "—"}</span>${txt}</p>`

// 有序列表项
const OLI = (n, txt) =>
  `<p style="${s({
    "font-family":  C.serif,
    "font-size":    "16px",
    "line-height":  "1.85",
    "color":        C.ink,
    "margin":       "0 0 7px",
    "padding-left": "20px",
  })}"><span style="${s({
    "color":          C.vermillion,
    "font-weight":    "700",
    "margin-right":   "9px",
    "font-family":    C.serif,
    "font-style":     "italic",
  })}">${n}.</span>${txt}</p>`

// 大引言 pull quote
const PULLQUOTE = (txt) => `
<section style="${s({
  "margin":        "36px 0",
  "padding":       "28px 24px",
  "background":    C.vermLight,
  "border-top":    `2px solid ${C.vermillion}`,
  "border-bottom": `2px solid ${C.vermillion}`,
})}">
  <p style="${s({
    "font-family":  C.serif,
    "font-size":    "19px",
    "font-weight":  "400",
    "font-style":   "italic",
    "line-height":  "1.7",
    "color":        C.vermillion,
    "margin":       "0",
    "text-align":   "center",
    "letter-spacing":"0.2px",
  })}">&ldquo;${txt}&rdquo;</p>
</section>`

// 警告引用
const WARN_QUOTE = (title, txt) => `
<section style="${s({
  "margin":        "20px 0 28px",
  "padding":       "16px 20px",
  "background":    "#F5F0E8",
  "border-left":   `3px solid ${C.inkLight}`,
  "border-radius": "0 4px 4px 0",
})}">
  <p style="${s({
    "font-family": C.serif,
    "font-size":   "15px",
    "line-height": "1.8",
    "color":       C.inkMid,
    "margin":      "0",
  })}"><strong style="color:${C.ink};">${title}</strong>${txt}</p>
</section>`

// 分节装饰
const ORNAMENT = () =>
  `<p style="text-align:center;margin:40px 0;color:${C.inkLight};letter-spacing:8px;font-size:11px;">✦ &nbsp; ✦ &nbsp; ✦</p>`

// ─── 完整 HTML ────────────────────────────────────────────────────────────────

const html = `<section style="${s({
  "font-family":   C.serif,
  "background":    C.paper,
  "color":         C.ink,
  "padding":       "12px 6px 48px",
  "line-height":   "1.9",
  "font-size":     "16px",
  "-webkit-font-smoothing": "antialiased",
})}">

<!-- ═══ 标题区 ═══════════════════════════════════════════════ -->
<section style="margin:0 0 36px;padding-bottom:28px;border-bottom:1px solid ${C.rule};">

  <p style="${s({
    "font-family":    C.serif,
    "font-size":      "11px",
    "letter-spacing": "3px",
    "color":          C.vermillion,
    "text-transform": "uppercase",
    "margin":         "0 0 16px",
  })}">排版与写作</p>

  <h1 style="${s({
    "font-family":    C.serif,
    "font-size":      "28px",
    "font-weight":    "700",
    "color":          C.ink,
    "line-height":    "1.25",
    "letter-spacing": "-0.8px",
    "margin":         "0 0 22px",
  })}">写给开发者的<br>排版指南</h1>

  <p style="${s({
    "font-family":  C.serif,
    "font-size":    "17px",
    "font-style":   "italic",
    "color":        C.inkMid,
    "line-height":  "1.75",
    "margin":       "0",
  })}">好的排版不是装饰，是思维的组织方式。<br>当代码有了层次，读者才有了方向。</p>

</section>


<!-- ═══ Ⅰ 为什么 ════════════════════════════════════════════ -->
${H2("Ⅰ", "为什么开发者也要懂排版")}

${P("很多开发者认为排版是设计师的事。但当你写 README、技术博客、设计文档时，<strong>你就是那个设计师</strong>。")}

${P("文字的<strong>视觉层次</strong>和代码的<em>逻辑层次</em>遵循同样的原则：让读者能够快速找到关键信息，跳过已知内容，停留在需要深度理解的部分。")}

${PULLQUOTE("一份好的技术文档，能把三十分钟的 code review 压缩到五分钟。这不是魔法，是排版。")}


<!-- ═══ Ⅱ 标题层级 ══════════════════════════════════════════ -->
${H2("Ⅱ", "标题层级的使用")}

${P("合理使用标题层级，就像函数的命名一样，越具体越好。")}

${H3("三级标题：章节划分")}
${P("三级标题用于划分大章节内的具体话题，读者扫视标题应能大致了解全文结构。")}

${H3("四级标题：细节分组")}
${P(`四级标题适合参数列表或对比分组。如果你发现自己经常用到四级标题，考虑把这篇文档拆分成多篇。`, { "color": C.inkMid })}


<!-- ═══ Ⅲ 文字强调 ══════════════════════════════════════════ -->
${H2("Ⅲ", "文字强调与修饰")}

${P("行文中的强调要克制，用多了就失去了强调的意义：")}

${LI(`<strong>粗体</strong>：关键术语、需要读者特别注意的信息`)}
${LI(`<em>斜体</em>：引用词汇、对比场景、外来语`)}
${LI(`${CODE("行内代码")}：技术名词、命令、文件路径`)}
${LI(`<strong><em>粗斜体</em></strong>：双重强调，谨慎使用`)}
${LI(`<span style="text-decoration:line-through;color:${C.inkLight};">删除线</span>：已废弃的方案或修订痕迹`)}

<p style="margin-bottom:0;"></p>


<!-- ═══ Ⅳ 代码展示 ══════════════════════════════════════════ -->
${H2("Ⅳ", "代码展示")}

${P(`行内引用 ${CODE("const result = await fetch(url)")} 用于短片段、变量名、文件名。`)}

${P("代码块要标注语言，启用语法高亮：")}

${TS_BLOCK(
  `<span style="color:#9AA8FF;">interface</span>&nbsp;<span style="color:#89D4F5;">Article</span>&nbsp;{<br>`+
  `&nbsp;&nbsp;title:&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#A8D8A8;">string</span><br>`+
  `&nbsp;&nbsp;content:&nbsp;&nbsp;<span style="color:#A8D8A8;">string</span><br>`+
  `&nbsp;&nbsp;publishedAt:&nbsp;<span style="color:#A8D8A8;">Date</span><br>`+
  `}<br><br>`+
  `<span style="color:#9AA8FF;">async</span>&nbsp;<span style="color:#9AA8FF;">function</span>&nbsp;<span style="color:#89D4F5;">publishDraft</span>`+
  `(article:&nbsp;<span style="color:#89D4F5;">Article</span>):&nbsp;<span style="color:#9AA8FF;">Promise</span>&lt;<span style="color:#A8D8A8;">string</span>&gt;&nbsp;{<br>`+
  `&nbsp;&nbsp;<span style="color:${C.codeMuted};">//&nbsp;上传封面、转换内容、创建草稿</span><br>`+
  `&nbsp;&nbsp;<span style="color:#9AA8FF;">const</span>&nbsp;draft&nbsp;=&nbsp;<span style="color:#9AA8FF;">await</span>&nbsp;client.<span style="color:#89D4F5;">createDraft</span>([{<br>`+
  `&nbsp;&nbsp;&nbsp;&nbsp;title:&nbsp;article.title,&nbsp;content:&nbsp;article.content,<br>`+
  `&nbsp;&nbsp;&nbsp;&nbsp;thumb_media_id:&nbsp;<span style="color:#9AA8FF;">await</span>&nbsp;<span style="color:#89D4F5;">uploadCover</span>(),<br>`+
  `&nbsp;&nbsp;}])<br>`+
  `&nbsp;&nbsp;<span style="color:#9AA8FF;">return</span>&nbsp;draft.media_id<br>`+
  `}`
)}

${P("Shell 命令同样需要高亮：")}

${SHELL_BLOCK(
  `<span style="color:${C.codeMuted};">#&nbsp;发布到草稿箱，使用&nbsp;tech&nbsp;主题</span><br>`+
  `<span style="color:#A8D8A8;">wxp</span>&nbsp;publish&nbsp;--file&nbsp;article.md&nbsp;<span style="color:#C4A882;">\\</span><br>`+
  `&nbsp;&nbsp;--theme&nbsp;tech&nbsp;<span style="color:#C4A882;">\\</span><br>`+
  `&nbsp;&nbsp;--digest&nbsp;<span style="color:#D4A882;">"技术文章排版实战指南"</span>`
)}


<!-- ═══ Ⅴ 列表与层级 ════════════════════════════════════════ -->
${H2("Ⅴ", "列表与层级")}

${P("<strong>无序列表</strong>适合并列项，没有优先级顺序：")}

${LI("简洁：每条只说一件事，不要用一个列表项讲两件事")}
${LI("对称：用相同的语法结构（都用动词开头，或都用名词开头）")}
${LI("克制：超过七项考虑分组，超过十项考虑用表格")}

<p style="margin:0 0 10px;font-family:${C.serif};font-size:16px;color:${C.ink};"><strong>有序列表</strong>适合步骤，顺序至关重要：</p>

${OLI(1, "确定核心信息：你想让读者记住什么？")}
${OLI(2, "组织逻辑结构：先总后分，还是问题驱动？")}
${OLI(3, "选择合适格式：段落、列表还是表格？")}
${OLI(4, "初稿完成后放一天再修改")}

<p style="margin:16px 0 10px;font-family:${C.serif};font-size:16px;color:${C.ink};"><strong>嵌套列表</strong>表示从属关系，最多两层：</p>

${LI("写作阶段")}
${LI("初稿：先写完，不求完美，把思路倒出来", 1)}
${LI("修改：删减冗余，强化重点，检查逻辑链", 1)}
${LI("发布阶段")}
${LI("排版预览：所见即所得的检查", 1)}
${LI("图片处理：替换外链图片为素材库 URL", 1)}

<p style="margin-bottom:0;"></p>

<!-- ═══ Ⅵ 引用块 ═════════════════════════════════════════════ -->
${H2("Ⅵ", "引用块")}

${P("引用块用于突出核心论点，或明确区分「引用他人观点」和「自己的表述」：")}

${PULLQUOTE("文档是给未来的自己写的情书。当你六个月后回头看，会感谢现在认真写文档的自己。")}

${P("引用也适合做「注意事项」的标记：")}

${WARN_QUOTE("⚠️ 注意：", "微信公众号不支持外链跳转，正文中的 URL 链接会在发布后降级为带下划线的纯文字。需要引导读者的链接，建议放到文末用二维码呈现。")}


<!-- ═══ Ⅶ 表格 ═══════════════════════════════════════════════ -->
${H2("Ⅶ", "表格")}

${P("表格适合对比和结构化数据，不适合描述性内容：")}

<table style="${s({
  "width":           "100%",
  "border-collapse": "collapse",
  "font-family":     C.serif,
  "font-size":       "14px",
  "margin":          "0 0 28px",
})}">
  <thead>
    <tr>
      <th style="${s({ "background":C.ink, "color":"#F9F5ED", "padding":"11px 14px", "text-align":"left", "font-weight":"700", "white-space":"nowrap", "font-style":"italic", "letter-spacing":"0.3px" })}">元素</th>
      <th style="${s({ "background":C.ink, "color":"#F9F5ED", "padding":"11px 14px", "text-align":"left", "font-weight":"700", "font-style":"italic", "letter-spacing":"0.3px" })}">适用场景</th>
      <th style="${s({ "background":C.ink, "color":"#F9F5ED", "padding":"11px 14px", "text-align":"left", "font-weight":"700", "font-style":"italic", "letter-spacing":"0.3px" })}">常见误用</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "white-space":"nowrap", "font-weight":"700" })}">粗体</td>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "color":C.inkMid })}">关键术语首次出现</td>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "color":C.inkMid })}">每句话都加粗</td>
    </tr>
    <tr>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "white-space":"nowrap", "font-style":"italic" })}">斜体</td>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "color":C.inkMid })}">引用、外来词、对比</td>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "color":C.inkMid })}">代替粗体做强调</td>
    </tr>
    <tr>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "white-space":"nowrap" })}">${CODE("代码块")}</td>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "color":C.inkMid })}">可执行内容、技术名词</td>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "color":C.inkMid })}">仅为等宽效果</td>
    </tr>
    <tr>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "white-space":"nowrap" })}">表格</td>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "color":C.inkMid })}">对比、参数列表</td>
      <td style="${s({ "padding":"9px 14px", "border-bottom":`1px solid ${C.rule}`, "color":C.inkMid })}">流水账式内容</td>
    </tr>
    <tr>
      <td style="${s({ "padding":"9px 14px", "white-space":"nowrap" })}">引用块</td>
      <td style="${s({ "padding":"9px 14px", "color":C.inkMid })}">核心论点、引语</td>
      <td style="${s({ "padding":"9px 14px", "color":C.inkMid })}">纯装饰目的</td>
    </tr>
  </tbody>
</table>


${ORNAMENT()}


<!-- ═══ Ⅷ 小结 ═══════════════════════════════════════════════ -->
${H2("Ⅷ", "小结")}

${P("好的排版服务于内容，坏的排版消耗读者注意力。每个格式决策背后都应该有理由：")}

<section style="${s({
  "margin":        "24px 0 0",
  "padding":       "22px 24px",
  "border-top":    `2px solid ${C.ink}`,
  "border-bottom": `2px solid ${C.ink}`,
})}">
  <p style="${s({
    "font-family":    C.serif,
    "font-size":      "17px",
    "font-weight":    "700",
    "font-style":     "italic",
    "color":          C.ink,
    "margin":         "0 0 10px",
    "line-height":    "1.6",
  })}">这样写，读者能更快理解我想表达的意思吗？</p>
  <p style="${s({
    "font-family": C.serif,
    "font-size":   "15px",
    "color":       C.inkMid,
    "margin":      "0",
    "line-height": "1.8",
  })}">如果答案是否定的，删掉那个格式。如果答案是肯定的，留下它，但不要加更多。</p>
</section>

</section>`

// ─── 发布 ─────────────────────────────────────────────────────────────────────

const config = loadConfig()
if (!config.wechat_appid || !config.wechat_secret) {
  console.error("❌  未找到 wechat_appid / wechat_secret 配置")
  process.exit(1)
}

const client = new WechatClient({ appid: config.wechat_appid, secret: config.wechat_secret })

const tmpPath = join(tmpdir(), `literary-cover-${randomUUID()}.png`)
writeFileSync(tmpPath, Buffer.from(PLACEHOLDER_COVER_BASE64, "base64"))
let thumbMediaId
try {
  const r = await client.uploadImage(tmpPath)
  thumbMediaId = r.media_id
} finally {
  try { import("fs").then(m => m.unlinkSync(tmpPath)) } catch {}
}

const draft = await client.createDraft([{
  title:          "[基准测试] 写给开发者的排版指南 · 文艺期刊版",
  content:        html,
  thumb_media_id: thumbMediaId,
  digest:         "衬线字体、罗马数字章节、大引言、砖红强调——当代文学期刊排版风格在微信文章里的实验。",
  show_cover_pic: 1,
  need_open_comment: 0,
}])

console.log(JSON.stringify({
  success:   true,
  media_id:  draft.media_id,
  message:   "文艺期刊版草稿已创建",
  design:    "当代文学期刊风格 · 暖象牙底 · 砖红强调 · 衬线排版",
}, null, 2))
