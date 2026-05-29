import type { Theme } from "../themes.js"
import type { AdvancedModule } from "./parser.js"
import {
  attr,
  cardStyle,
  esc,
  getAdvancedPalette,
  imageTag,
  label,
  paragraph,
  safeUrl,
  sectionTitle,
  splitList,
  type AdvancedPalette,
} from "./styles.js"

export interface RenderedAdvancedBlock {
  marker: string
  html: string
}

export function renderAdvancedModules(modules: AdvancedModule[], theme: Theme): RenderedAdvancedBlock[] {
  const palette = getAdvancedPalette(theme)
  return modules.map(module => ({
    marker: module.marker,
    html: renderAdvancedModule(module, palette),
  }))
}

export function renderAdvancedModule(module: AdvancedModule, p: AdvancedPalette): string {
  switch (module.name) {
    case "hero": return renderHero(module, p)
    case "cards": return renderCards(module, p)
    case "metrics": return renderMetrics(module, p)
    case "infographic": return renderInfographic(module, p)
    case "audience-fit": return renderAudienceFit(module, p)
    case "verdict": return renderVerdict(module, p)
    case "people": return renderPeople(module, p)
    case "cases": return renderCases(module, p)
    case "pricing": return renderPricing(module, p)
    case "faq": return renderFaq(module, p)
    case "logos": return renderLogos(module, p)
    case "part": return renderPart(module, p)
    case "label-title": return renderLabelTitle(module, p)
    case "quote": return renderQuote(module, p)
    case "image-text": return renderImageText(module, p)
    case "image-compare": return renderImageCompare(module, p)
    case "image-annotate": return renderImageAnnotate(module, p)
    case "toc": return renderToc(module, p)
    case "checklist": return renderChecklist(module, p)
    case "toolbox": return renderToolbox(module, p)
    case "specs": return renderSpecs(module, p)
    case "image-steps": return renderImageSteps(module, p)
    case "notice": return renderNotice(module, p)
    case "dialogue": return renderDialogue(module, p)
    case "summary": return renderSummary(module, p)
    case "author-card": return renderAuthorCard(module, p)
    case "series": return renderSeries(module, p)
    case "subscribe": return renderSubscribe(module, p)
    case "cta": return renderCta(module, p)
    case "gallery": return renderGallery(module, p)
    case "longimage": return renderLongImage(module, p)
    default: return ""
  }
}

function renderHero(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  const [first, second] = splitTitle(f.title)
  const tags = splitList(f.tags)
  return `<section data-mpa-action-id="hero" style="margin:0 0 34px;background:${p.background};border:1px solid ${p.mutedBorder};border-radius:16px;overflow:hidden;box-shadow:${p.shadow};width:100%;">
<section style="padding:24px 22px 18px;background:linear-gradient(180deg, ${p.accentSoft} 0%, ${p.background} 46%, ${p.background} 100%);">
<section style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap;"><span style="width:10px;height:10px;background:${p.accentSofter};border:1px solid ${p.border};border-radius:3px;flex-shrink:0;"></span>${label(f.eyebrow ?? "", p)}${f.meta ? `<span style="font-size:13px;color:${p.muted};font-weight:700;letter-spacing:0.8px;padding:2px 8px;border:1px solid ${p.mutedBorder};border-radius:999px;background:${p.background};">${esc(f.meta)}</span>` : ""}</section>
${f.kicker ? `<p style="font-size:13px;color:${p.muted};margin:0 0 8px;letter-spacing:0.6px;font-weight:700;text-transform:uppercase;">${esc(f.kicker)}</p>` : ""}
<p style="font-size:22px;font-weight:900;color:${p.text};margin:0 0 10px;line-height:1.16;letter-spacing:-0.04em;">${esc(first)}${second ? `<span style="color:${p.accentDark};padding:0;">${esc(second)}</span>` : ""}</p>
<section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="width:26px;height:2px;background:${p.accentDark};border-radius:999px;"></span><span style="width:14px;height:2px;background:${p.border};border-radius:999px;"></span><span style="width:36px;height:1px;background:${p.mutedBorder};border-radius:999px;"></span></section>
${f.subtitle ? `<p style="font-size:13px;color:${p.text};margin:0;line-height:1.75;letter-spacing:0.2px;">${esc(f.subtitle)}</p>` : ""}
</section>
${f.image ? `<section style="background:${p.background};"><section style="width:100%;height:188px;overflow:hidden;border-top:1px solid ${p.mutedBorder};border-bottom:1px solid ${p.mutedBorder};background:${p.surfaceAlt};">${imageTag(f.image, f.title ?? "hero image", "width:100% !important;height:100% !important;object-fit:cover;display:block;")}</section></section>` : ""}
<section style="background:linear-gradient(180deg, ${p.background} 0%, ${p.surfaceAlt} 100%);padding:12px 22px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid ${p.mutedBorder};">
${f.brand ? `<p style="display:inline-flex;align-items:center;font-size:13px;color:${p.text};margin:0;font-weight:700;letter-spacing:0.8px;padding:3px 10px;border-radius:999px;border:1px solid ${p.border};background:${p.accentSoft};">${esc(f.brand)}</p>` : ""}
<section style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-start;">${tags.map(tag => chip(tag, p)).join("")}</section>
</section></section>`
}

function renderCards(module: AdvancedModule, p: AdvancedPalette): string {
  return titledGrid("cards", module.title, p, module.rows.map(row => {
    const [kicker, title, body, variant] = row
    const accent = variant === "accent"
    return `<section style="min-width:0;${cardStyle(p, accent)}display:flex;flex-direction:column;gap:8px;">
<section style="margin:0 0 10px;display:flex;align-items:center;gap:8px;"><section style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:${accent ? p.accentSofter : "rgba(0,0,0,0.06)"};color:${p.accentDark};font-size:22px;font-weight:900;line-height:1;">${esc((kicker || "M").charAt(0))}</section><p style="display:inline-block;font-size:13px;font-weight:700;color:${accent ? p.accentDark : p.muted};letter-spacing:0.8px;margin:0;padding:2px 8px;border-radius:999px;background:${accent ? p.accentSofter : p.surfaceAlt};">${esc(kicker)}</p></section>
<p style="font-size:17px;font-weight:800;color:${p.text};margin:0 0 6px;line-height:1.45;">${esc(title)}</p>${paragraph(body ?? "", p, `color:${accent ? p.textStrong : p.muted};`)}</section>`
  }).join(""))
}

function renderMetrics(module: AdvancedModule, p: AdvancedPalette): string {
  return titledGrid("metrics", module.title, p, module.rows.map(row => {
    const [labelText, value, body, variant] = row
    const accent = variant === "accent"
    return `<section style="min-width:0;flex:1 1 0%;${cardStyle(p, accent)}">
<p style="display:inline-block;font-size:13px;font-weight:700;color:${p.muted};margin:0 0 12px;letter-spacing:0.8px;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:${accent ? p.surface : p.surfaceAlt};${accent ? `border:1px solid ${p.border};` : ""}">${esc(labelText)}</p>
<p style="font-size:26px;font-weight:900;color:${accent ? p.accentDark : p.text};margin:0 0 6px;line-height:1;letter-spacing:-0.04em;">${esc(value)}</p>${paragraph(body ?? "", p, `color:${p.muted};`)}</section>`
  }).join(""))
}

function renderInfographic(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  const [a, b, c] = (f.title ?? "").split("|")
  const title = b ? `${esc(a)}<span style="display:inline-block;padding:0 5px 2px;margin:0 2px 2px 0;border-bottom:1px solid ${p.border};box-shadow:inset 0 -0.55em 0 rgba(200,100,66,0.26);">${esc(b)}</span>${esc(c ?? "")}` : esc(f.title)
  return `<section data-mpa-action-id="infographic" style="margin:0 0 32px;"><section style="position:relative;overflow:hidden;border-radius:22px;background:linear-gradient(135deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.mutedBorder};box-shadow:0 8px 24px rgba(85,85,85,0.08);color:${p.text};"><section style="padding:24px 22px 20px;display:flex;flex-direction:column;justify-content:space-between;min-height:238px;">
<section style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">${label(f.eyebrow ?? "", p, `border:1px solid ${p.border};`)}</section>
<span style="display:inline-block;width:54px;height:2px;border-radius:999px;background:${p.accentDark};margin-bottom:16px;"></span>
<p style="margin:0;font-size:22px;font-weight:900;line-height:1.22;letter-spacing:-0.035em;color:${p.text};">${title}</p>
${f.subtitle ? `<p style="margin:12px 0 0;font-size:15px;color:${p.text};line-height:1.72;">${esc(f.subtitle)}</p>` : ""}
${f.quote ? `<p style="margin:18px 0 0;padding:12px 0 0 14px;border-left:2px solid ${p.border};font-size:22px;font-weight:800;color:${p.text};line-height:1.62;">${esc(f.quote)}</p>` : ""}
${f.note ? `<p style="margin:22px 0 0;font-size:13px;color:${p.muted};line-height:1.55;letter-spacing:0.5px;">${esc(f.note)}</p>` : ""}
</section></section></section>`
}

function renderAudienceFit(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="audience-fit" style="margin:0 0 30px;padding:18px;background:linear-gradient(180deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.mutedBorder};border-radius:16px;box-shadow:${p.shadow};">
<p style="margin:0 0 14px;font-size:17px;font-weight:900;color:${p.text};line-height:1.42;">${esc(f.title)}</p>
<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">${fitBox("适合", splitList(f.fit), true, p)}${fitBox("不适合", splitList(f.avoid), false, p)}</section></section>`
}

function renderVerdict(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="verdict" style="margin:0 0 30px;padding:18px 18px 16px;background:linear-gradient(135deg, ${p.accentSoft} 0%, ${p.surface} 48%, ${p.surfaceAlt} 100%);border:1px solid ${p.border};border-radius:16px;box-shadow:${p.shadow};"><section style="display:flex;align-items:center;gap:8px;margin:0 0 10px;"><span style="display:inline-block;width:11px;height:11px;border-radius:4px;background:${p.accentDark};box-shadow:0 0 0 4px ${p.accentSoft};"></span><p style="margin:0;font-size:13px;font-weight:900;color:${p.accentDark};letter-spacing:1px;line-height:1.45;">${esc(f.eyebrow)}</p></section><p style="margin:0;font-size:17px;font-weight:900;color:${p.text};line-height:1.45;">${esc(f.title)}</p>${f.body ? `<p style="margin:9px 0 0;font-size:15px;color:${p.text};line-height:1.75;">${esc(f.body)}</p>` : ""}</section>`
}

function renderPeople(module: AdvancedModule, p: AdvancedPalette): string {
  return titledGrid("people", module.title, p, module.rows.map(row => {
    const [name, role, body, variant] = row
    const accent = variant === "accent"
    return `<section style="${cardStyle(p, accent)}"><section style="display:flex;align-items:center;gap:12px;margin-bottom:10px;"><span style="width:38px;height:38px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:${accent ? `linear-gradient(135deg, ${p.accentDark}, ${p.accentDark})` : p.surfaceAlt};color:${accent ? "#ffffff" : p.text};font-size:13px;font-weight:800;border:${accent ? "none" : `1px solid ${p.mutedBorder}`};">${esc((name ?? "").slice(0, 2))}</span><section><p style="font-size:17px;font-weight:800;color:${p.text};margin:0 0 2px;">${esc(name)}</p><p style="font-size:13px;color:${p.muted};margin:0;letter-spacing:1px;text-transform:uppercase;">${esc(role)}</p></section></section>${paragraph(body ?? "", p)}</section>`
  }).join(""))
}

function renderCases(module: AdvancedModule, p: AdvancedPalette): string {
  return titledGrid("cases", module.title, p, module.rows.map(row => {
    const [name, metric, body, variant] = row
    const accent = variant === "accent"
    return `<section style="${cardStyle(p, accent)}"><p style="display:inline-block;margin:0 0 8px;padding:3px 8px;border-radius:999px;background:${p.accentSoft};color:${p.accentDark};font-size:13px;font-weight:700;${accent ? `border:1px solid ${p.border};` : ""}">${esc(metric)}</p><p style="font-size:17px;font-weight:800;color:${p.text};margin:0 0 4px;">${esc(name)}</p>${paragraph(body ?? "", p)}</section>`
  }).join(""))
}

function renderPricing(module: AdvancedModule, p: AdvancedPalette): string {
  return titledGrid("pricing", module.title, p, module.rows.map(row => {
    const [name, price, items, variant] = row
    const accent = variant === "accent"
    return `<section style="${cardStyle(p, accent)}min-width:0;flex:1 1 0%;"><p style="font-size:13px;font-weight:700;color:${p.muted};margin:0 0 6px;letter-spacing:1px;text-transform:uppercase;">${esc(name)}</p><p style="font-size:26px;font-weight:900;color:${p.text};margin:0 0 10px;line-height:1;">${esc(price)}</p><ul style="margin:0;padding-left:18px;">${splitList(items).map(item => `<li style="font-size:15px;color:${p.text};margin:0 0 6px;line-height:1.7;">${esc(item)}</li>`).join("")}</ul></section>`
  }).join(""))
}

function renderFaq(module: AdvancedModule, p: AdvancedPalette): string {
  return `<section data-mpa-action-id="faq" style="margin:0 0 30px;">${sectionTitle(module.title, p)}${module.rows.map(row => `<section style="margin:0 0 12px;border-radius:12px;overflow:hidden;border:1px solid ${p.mutedBorder};"><section style="display:flex;align-items:flex-start;gap:8px;padding:12px 16px;background:${p.surfaceAlt};"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:${p.text};color:${p.surface};font-size:11px;font-weight:900;flex-shrink:0;margin-top:1px;">Q</span><p data-mpa-action-id="faq_question" style="margin:0;font-size:15px;font-weight:700;color:${p.text};line-height:1.55;">${esc(row[0])}</p></section><section style="display:flex;align-items:flex-start;gap:8px;padding:12px 16px;background:${p.surface};"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:${p.accentDark};color:${p.surface};font-size:11px;font-weight:900;flex-shrink:0;margin-top:1px;">A</span><p data-mpa-action-id="faq_answer" style="margin:0;font-size:15px;color:${p.text};line-height:1.7;">${esc(row[1])}</p></section></section>`).join("")}</section>`
}

function renderLogos(module: AdvancedModule, p: AdvancedPalette): string {
  return titledGrid("logos", module.title, p, module.rows.map(row => `<section style="background:${p.surface};border:1px solid ${p.mutedBorder};border-radius:8px;padding:14px 12px;text-align:center;box-shadow:${p.shadow};"><p style="font-size:17px;font-weight:800;color:${p.text};margin:0 0 3px;">${esc(row[0])}</p><p style="font-size:15px;color:${p.muted};margin:0;line-height:1.5;">${esc(row[1])}</p></section>`).join(""), "repeat(2,minmax(0,1fr))")
}

function renderPart(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="part" style="display:flex;align-items:center;gap:12px;margin:36px 0 20px;padding:14px 16px;background:${p.surface};border:1px solid ${p.mutedBorder};border-radius:12px;box-shadow:${p.shadow};"><section style="display:flex;align-items:center;justify-content:center;text-align:center;flex-shrink:0;width:56px;height:56px;background:linear-gradient(180deg, ${p.accentSoft} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.border};border-radius:999px;box-shadow:${p.shadow};"><p style="margin:0;font-size:24px;font-weight:900;color:${p.accentDark};line-height:1;letter-spacing:-1.1px;">${esc(f.index)}</p></section><span style="width:2px;border-radius:999px;background:linear-gradient(${p.accentSofter}, transparent);flex-shrink:0;"></span><section style="display:flex;flex-direction:column;justify-content:center;flex:1 1 0%;min-width:0;"><p style="margin:0 0 4px;font-size:17px;font-weight:900;color:${p.text};line-height:1.35;">${esc(f.title)}</p><p style="margin:0;font-size:13px;font-weight:600;color:${p.muted};letter-spacing:1.1px;">${esc(f.subtitle)}</p></section></section>`
}

function renderLabelTitle(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="label-title" style="display:flex;align-items:center;gap:8px;margin:34px 0 14px;flex-wrap:wrap;">${label(f.label ?? "", p, `border:1px solid ${p.border};`)}<h4 style="font-size:17px;font-weight:900;color:${p.text};margin:0;">${esc(f.title)}</h4></section>`
}

function renderQuote(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  const quote = f.quote ?? f.title ?? ""
  return `<section data-mpa-action-id="quote" style="margin:0 0 28px;padding:16px 16px 14px;background:${p.surface};border:1px solid ${p.mutedBorder};border-radius:12px;box-shadow:${p.shadow};"><section style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="width:24px;height:2px;background:${p.accentDark};border-radius:999px;flex-shrink:0;"></span><p style="font-size:13px;color:${p.accentDark};margin:0;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${esc(f.eyebrow ?? f.label ?? "")}</p></section><p style="font-size:22px;font-weight:850;color:${p.text};margin:0;line-height:1.7;letter-spacing:0.1px;">${esc(quote)}</p><section style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid ${p.mutedBorder};">${f.source ? `<p style="font-size:13px;font-weight:700;color:${p.text};margin:0;">-- ${esc(f.source)}</p>` : ""}${f.note ?? f.body ? `<p style="font-size:15px;color:${p.muted};margin:0;line-height:1.6;">${esc(f.note ?? f.body)}</p>` : ""}</section></section>`
}

function renderImageText(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  const image = `<section style="flex:1 1 320px;min-width:0;"><section style="border-radius:12px;overflow:hidden;background:${p.surface};height:100%;min-height:214px;border:1px solid ${p.mutedBorder};box-shadow:${p.shadow};">${imageTag(f.image, f.alt ?? f.title ?? "", "width:100% !important;height:100% !important;min-height:172px;object-fit:cover;display:block;")}</section></section>`
  const text = `<section style="flex:1 1 280px;min-width:0;background:linear-gradient(180deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.mutedBorder};border-radius:12px;padding:16px 16px 14px;box-shadow:${p.shadow};">${label(f.eyebrow ?? "", p, "margin:0 0 8px;")}<p style="margin:0 0 8px;font-size:17px;font-weight:800;color:${p.text};line-height:1.45;">${esc(f.title)}</p>${paragraph(f.body ?? "", p, `color:${p.textStrong};margin:0 0 8px;`)}${f.note ? paragraph(f.note, p, `color:${p.muted};margin:10px 0 0;`) : ""}</section>`
  return `<section data-mpa-action-id="image-text" style="margin:0 0 32px;"><section style="display:flex;flex-wrap:wrap;gap:16px;">${f.layout === "left" ? image + text : text + image}</section></section>`
}

function renderImageCompare(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="image-compare" style="margin:0 0 28px;"><section style="margin:0 0 14px;">${label(f.eyebrow ?? "", p, "margin:0 0 8px;")}<p style="margin:0;font-size:17px;font-weight:800;color:${p.text};line-height:1.45;">${esc(f.title)}</p></section><section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">${compareImage(f.left_title, f.left_image, p)}${compareImage(f.right_title, f.right_image, p)}</section>${f.note ? `<p style="margin:10px 0 0;font-size:15px;color:${p.muted};line-height:1.65;">${esc(f.note)}</p>` : ""}</section>`
}

function renderImageAnnotate(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  const points = (module.fieldLists.point ?? []).map(point => point.split("|").map(part => part.trim()))
  return `<section data-mpa-action-id="image-annotate" style="margin:0 0 28px;"><section style="margin:0 0 14px;">${label(f.eyebrow ?? "", p, "margin:0 0 8px;")}<p style="margin:0;font-size:17px;font-weight:800;color:${p.text};line-height:1.45;">${esc(f.title)}</p></section><section style="border-radius:12px;overflow:hidden;background:${p.surface};position:relative;min-height:200px;border:1px solid ${p.mutedBorder};box-shadow:${p.shadow};aspect-ratio:4/3;">${imageTag(f.image, f.alt ?? f.title ?? "", "width:100% !important;height:100% !important;object-fit:cover !important;display:block;")}${points.map(point => `<span style="position:absolute;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${p.surface};color:${p.accentDark};font-size:13px;font-weight:800;border:1px solid ${p.border};box-shadow:${p.shadow};left:${attr(point[1] ?? "50")}%;top:${attr(point[2] ?? "50")}%;">${esc(point[0])}</span>`).join("")}</section><section style="display:flex;flex-direction:column;gap:12px;margin-top:14px;">${points.map(point => listCard(point[0], point[3], point[4], p)).join("")}</section>${f.note ? `<p style="margin:10px 0 0;font-size:15px;color:${p.muted};line-height:1.65;">${esc(f.note)}</p>` : ""}</section>`
}

function renderToc(module: AdvancedModule, p: AdvancedPalette): string {
  return `<section data-mpa-action-id="toc" style="margin:0 0 30px;padding:18px;background:linear-gradient(135deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.mutedBorder};border-radius:12px;box-shadow:${p.shadow};">${label(module.title, p, "margin:0 0 12px;")}<section style="display:flex;flex-direction:column;gap:12px;">${module.rows.map(row => tocRow(row, p)).join("")}</section></section>`
}

function renderChecklist(module: AdvancedModule, p: AdvancedPalette): string {
  return `<section data-mpa-action-id="checklist" style="margin:0 0 30px;">${sectionTitle(module.title, p)}<section style="display:flex;flex-direction:column;gap:12px;">${module.rows.map(row => {
    const status = row[0]
    const done = status === "done"
    const warn = status === "warn"
    const symbol = done ? "✓" : warn ? "!" : "•"
    const bg = done ? p.accentSofter : warn ? "#FEF3C7" : p.surfaceAlt
    const color = done ? p.accentDark : warn ? "#B45309" : p.muted
    return `<section style="padding:12px 16px;border-bottom:1px solid ${p.mutedBorder};display:flex;align-items:flex-start;gap:8px;"><p style="margin:0;width:22px;height:22px;border-radius:999px;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0;">${symbol}</p><section style="flex:1 1 0%;min-width:0;"><p style="margin:0 0 2px;font-size:17px;font-weight:800;color:${p.text};line-height:1.55;${done ? "text-decoration:line-through;text-decoration-thickness:1px;" : ""}">${esc(row[1])}</p><p style="margin:0;font-size:15px;color:${p.muted};line-height:1.6;">${esc(row[2])}</p></section></section>`
  }).join("")}</section></section>`
}

function renderToolbox(module: AdvancedModule, p: AdvancedPalette): string {
  return stackedRows("toolbox", module.title, p, module.rows.map(row => `<section style="background:linear-gradient(180deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.mutedBorder};border-radius:12px;padding:14px;box-shadow:${p.shadow};"><section style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px;"><p style="display:inline-block;margin:0;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${p.accentDark};background:${p.accentSoft};padding:2px 8px;border-radius:999px;">${esc(row[0])}</p><p style="margin:0;font-size:13px;color:${p.muted};">↗</p></section><p style="margin:0 0 4px;"><a href="${attr(safeUrl(row[3] ?? ""))}" style="font-size:17px;font-weight:800;color:${p.text};line-height:1.55;text-decoration:none;border-bottom:1px solid ${p.border};">${esc(row[1])}</a></p><p style="margin:0;font-size:15px;color:${p.muted};line-height:1.65;">${esc(row[2])}</p></section>`).join(""))
}

function renderSpecs(module: AdvancedModule, p: AdvancedPalette): string {
  return keyValueRows("specs", module.title, module.rows, p)
}

function renderImageSteps(module: AdvancedModule, p: AdvancedPalette): string {
  return `<section data-mpa-action-id="image-steps" style="margin:0 0 28px;">${label(module.title, p, "margin:0 0 12px;")}<section style="display:flex;flex-direction:column;gap:12px;">${module.rows.map(row => `<section style="display:flex;flex-direction:column;align-items:stretch;gap:12px;background:linear-gradient(180deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.mutedBorder};border-radius:12px;padding:16px;box-shadow:${p.shadow};"><section style="width:100%;min-width:0;flex-shrink:0;"><section style="border-radius:8px;overflow:hidden;background:${p.surfaceAlt};height:100%;min-height:200px;border:1px solid ${p.mutedBorder};">${imageTag(row[3] ?? "", row[1] ?? "", "width:100% !important;height:100% !important;min-height:136px;object-fit:cover;display:block;")}</section></section><section style="flex:1 1 0%;min-width:0;"><p style="display:inline-block;margin:0 0 8px;font-size:13px;font-weight:700;color:${p.accentDark};letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:${p.accentSoft};">${esc(row[0])}</p><p style="margin:0 0 6px;font-size:17px;font-weight:800;color:${p.text};line-height:1.55;">${esc(row[1])}</p>${paragraph(row[2] ?? "", p, `color:${p.textStrong};margin:0 0 6px;`)}${paragraph(row[4] ?? "", p, `color:${p.muted};`)}</section></section>`).join("")}</section></section>`
}

function renderNotice(module: AdvancedModule, p: AdvancedPalette): string {
  return keyValueRows("notice", module.title, module.rows, p, true)
}

function renderDialogue(module: AdvancedModule, p: AdvancedPalette): string {
  const turns = module.body.split("\n")
    .map(line => line.match(/^([^:：]{1,20})[:：]\s*(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map(match => ({ role: match[1].trim(), text: match[2].trim() }))
  return `<section data-mpa-action-id="dialogue" style="margin:12px 8px 16px;padding:12px;background:linear-gradient(135deg, ${p.surface}, ${p.surfaceAlt});border:1px solid ${p.border};border-radius:12px;box-shadow:${p.accentShadow};box-sizing:border-box;"><section style="text-align:center;font-size:17px;font-weight:600;color:${p.accentDark};margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid ${p.border};letter-spacing:0.5px;"><p style="margin:0;text-align:center;">${esc(module.title)}</p></section>${turns.map((turn, index) => dialogueTurn(turn.role, turn.text, index % 2 === 1, p)).join("")}</section>`
}

function renderSummary(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="summary" style="background:linear-gradient(180deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.mutedBorder};border-left:3px solid ${p.accentDark};border-radius:12px;padding:18px 18px 16px;margin:0 0 28px;text-align:left;box-shadow:${p.shadow};">${f.eyebrow ? `<p style="font-size:13px;color:${p.accentDark};display:inline-block;margin:0 0 8px;padding:2px 8px;border-radius:999px;background:${p.accentSoft};font-weight:700;">${esc(f.eyebrow)}</p>` : ""}<p style="color:${p.text};font-size:17px;font-weight:800;display:block;line-height:1.45;margin:0;">${esc(f.highlight ?? f.title)}</p>${f.body ? `<p style="font-size:15px;color:${p.text};line-height:1.7;margin:8px 0 0;">${esc(f.body)}</p>` : ""}</section>`
}

function renderAuthorCard(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="author-card" style="position:relative;overflow:hidden;margin:0 0 30px;padding:18px 18px 16px;background:linear-gradient(135deg, ${p.accentSoft} 0%, ${p.surface} 42%, ${p.surfaceAlt} 100%);border:1px solid ${p.border};border-radius:16px;box-shadow:${p.shadow};"><section style="display:flex;align-items:center;gap:12px;margin:0 0 14px;"><span style="width:46px;height:46px;border-radius:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg, ${p.accentDark}, ${p.accentDark});color:#ffffff;font-size:17px;font-weight:900;">${esc((f.name ?? "").slice(0, 2))}</span><section style="min-width:0;flex:1 1 0%;"><p style="margin:0 0 3px;font-size:17px;font-weight:900;color:${p.text};line-height:1.28;">${esc(f.name)}</p><p style="margin:0;font-size:13px;font-weight:800;color:${p.muted};letter-spacing:0.8px;line-height:1.45;">${esc(f.role)}</p></section></section>${paragraph(f.bio ?? "", p)}<section style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0;">${splitList(f.tags).map(tag => chip(tag, p, true)).join("")}</section><section style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:16px 0 0;padding-top:12px;border-top:1px solid ${p.mutedBorder};">${f.note ? `<p style="margin:0;flex:1 1 180px;font-size:15px;color:${p.muted};line-height:1.65;">${esc(f.note)}</p>` : ""}${f.link ? `<p style="margin:0;display:inline-block;padding:3px 9px;border-radius:999px;background:${p.surface};border:1px solid ${p.mutedBorder};color:${p.text};font-size:13px;font-weight:800;line-height:1.45;">${esc(f.link)}</p>` : ""}</section></section>`
}

function renderSeries(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="series" style="margin:0 0 30px;padding:18px 18px 16px;background:${p.surface};border:1px solid ${p.mutedBorder};border-radius:16px;box-shadow:${p.shadow};"><section style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 12px;"><span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${p.accentSoft};border:1px solid ${p.border};color:${p.accentDark};font-size:13px;font-weight:900;letter-spacing:0.8px;line-height:1.4;">${esc(f.name)}</span><span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${p.surfaceAlt};border:1px solid ${p.mutedBorder};color:${p.muted};font-size:13px;font-weight:900;letter-spacing:0.8px;line-height:1.4;">${esc(f.issue)}</span></section><p style="margin:0;font-size:17px;font-weight:900;color:${p.text};line-height:1.38;">${esc(f.title)}</p>${paragraph(f.desc ?? "", p, "margin:8px 0 0;")}<section style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0;">${splitList(f.tags).map(tag => chip(tag, p)).join("")}</section>${f.next ? `<p style="margin:15px 0 0;padding:11px 12px;border-radius:8px;background:linear-gradient(180deg, ${p.accentSoft} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.border};color:${p.text};font-size:15px;font-weight:800;line-height:1.62;">${esc(f.next)}</p>` : ""}</section>`
}

function renderSubscribe(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="subscribe" style="margin:0 0 30px;padding:20px 18px 16px;background:linear-gradient(180deg, ${p.accentSoft} 0%, ${p.surface} 72%, ${p.surface} 100%);border:1px solid ${p.border};border-radius:16px;box-shadow:${p.shadow};">${label(f.label ?? "", p, `margin:0 0 10px;background:${p.surface};border:1px solid ${p.mutedBorder};`)}<p style="margin:0;font-size:17px;font-weight:900;color:${p.text};line-height:1.42;">${esc(f.title)}</p>${paragraph(f.subtitle ?? "", p, "margin:9px 0 0;")}<section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:16px 0 0;">${buttonLike(f.primary ?? "", true, p)}${buttonLike(f.secondary ?? "", false, p)}</section>${f.note ? `<p style="margin:12px 0 0;padding-top:11px;border-top:1px solid ${p.mutedBorder};color:${p.muted};font-size:13px;font-weight:800;letter-spacing:0.4px;line-height:1.55;">${esc(f.note)}</p>` : ""}</section>`
}

function renderCta(module: AdvancedModule, p: AdvancedPalette): string {
  const f = module.fields
  return `<section data-mpa-action-id="cta" style="background:linear-gradient(135deg, ${p.accentSoft} 0%, ${p.surface} 44%, ${p.surfaceAlt} 100%);border:1px solid ${p.border};border-radius:16px;padding:18px 18px 16px;text-align:left;box-shadow:${p.shadow};margin:0 0 24px;"><p style="font-size:17px;font-weight:800;color:${p.text};margin:0 0 14px;line-height:1.45;">${esc(f.title)}</p><section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px;">${["保存灵感", "直接套用", "继续体验"].map((text, i) => `<section style="text-align:center;color:${i === 2 ? "#ffffff" : p.text};min-width:0;background:${i === 2 ? `linear-gradient(135deg, ${p.accentDark}, ${p.accentDark})` : p.surfaceAlt};border:1px solid ${i === 2 ? p.border : p.mutedBorder};border-radius:12px;padding:12px 8px;${i === 2 ? `box-shadow:${p.accentShadow};` : ""}"><span style="font-size:13px;font-weight:700;">${text}</span></section>`).join("")}</section>${f.note ? `<p style="font-size:13px;color:${p.muted};letter-spacing:0.8px;margin:0;padding-top:12px;border-top:1px solid ${p.mutedBorder};text-transform:uppercase;">${esc(f.note)}</p>` : ""}</section>`
}

function renderGallery(module: AdvancedModule, p: AdvancedPalette): string {
  const images = parseMarkdownImages(module.body)
  return `<section data-mpa-action-id="gallery" style="margin:0 0 30px;">${label(module.title, p, "margin:0 0 12px;")}<section style="display:flex;gap:10px;overflow-x:auto;padding:4px 0 10px;-webkit-overflow-scrolling:touch;">${images.map(img => `<section style="flex:0 0 78%;border-radius:12px;overflow:hidden;border:1px solid ${p.mutedBorder};background:${p.surfaceAlt};box-shadow:${p.shadow};">${imageTag(img.src, img.alt, "width:100% !important;height:auto !important;display:block;")}</section>`).join("")}</section></section>`
}

function renderLongImage(module: AdvancedModule, p: AdvancedPalette): string {
  const image = parseMarkdownImages(module.body)[0]
  return `<section data-mpa-action-id="longimage" style="margin:0 0 30px;">${label(module.title, p, "margin:0 0 12px;")}<section style="max-height:520px;overflow-y:auto;border:1px solid ${p.mutedBorder};border-radius:12px;background:${p.surfaceAlt};box-shadow:${p.shadow};-webkit-overflow-scrolling:touch;">${image ? imageTag(image.src, image.alt, "width:100% !important;height:auto !important;display:block;") : ""}</section></section>`
}

function titledGrid(id: string, title: string, p: AdvancedPalette, body: string, columns = "repeat(auto-fit,minmax(160px,1fr))"): string {
  return `<section data-mpa-action-id="${id}" style="margin:0 0 30px;">${sectionTitle(title, p)}<section style="display:grid;grid-template-columns:${columns};gap:12px;">${body}</section></section>`
}

function stackedRows(id: string, title: string, p: AdvancedPalette, body: string): string {
  return `<section data-mpa-action-id="${id}" style="margin:0 0 28px;">${sectionTitle(title, p)}<section style="display:flex;flex-direction:column;gap:12px;">${body}</section></section>`
}

function keyValueRows(id: string, title: string, rows: string[][], p: AdvancedPalette, colored = false): string {
  return `<section data-mpa-action-id="${id}" style="margin:0 0 28px;">${sectionTitle(title, p)}<section style="display:flex;flex-direction:column;gap:12px;">${rows.map((row, i) => `<section style="padding:12px 16px;border-bottom:1px solid ${p.mutedBorder};display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;"><section><p style="display:inline-block;margin:0;font-size:13px;font-weight:700;color:${colored && i === 1 ? "#1D4ED8" : colored && i === 2 ? "#B45309" : p.accentDark};background:${colored && i === 1 ? "#DBEAFE" : colored && i === 2 ? "#FEF3C7" : p.accentSoft};border:1px solid ${colored && i === 1 ? "#93C5FD" : colored && i === 2 ? "#FCD34D" : p.border};border-radius:8px;padding:4px 10px;text-align:center;min-width:64px;box-sizing:border-box;">${esc(row[0])}</p></section><section style="min-width:0;"><p style="margin:0 0 3px;font-size:15px;color:${p.text};line-height:1.7;">${esc(row[1])}</p><p style="margin:0;font-size:15px;color:${p.muted};line-height:1.6;">${esc(row[2])}</p></section></section>`).join("")}</section></section>`
}

function fitBox(title: string, items: string[], accent: boolean, p: AdvancedPalette): string {
  return `<section style="padding:13px;border-radius:12px;background:${accent ? p.accentSoft : p.surface};border:1px solid ${accent ? p.border : p.mutedBorder};"><p style="display:inline-block;margin:0 0 9px;padding:3px 9px;border-radius:999px;background:${accent ? p.surface : p.surfaceAlt};border:1px solid ${accent ? p.border : p.mutedBorder};color:${accent ? p.accentDark : p.muted};font-size:13px;font-weight:900;line-height:1.4;">${title}</p>${items.map(item => `<section style="display:flex;align-items:flex-start;gap:8px;margin:0 0 7px;font-size:15px;font-weight:750;color:${p.text};line-height:1.65;"><span style="margin-top:0.62em;display:inline-block;width:6px;height:6px;border-radius:999px;background:${accent ? p.accentDark : p.muted};opacity:${accent ? "1" : "0.58"};flex-shrink:0;"></span><p style="margin:0;">${esc(item)}</p></section>`).join("")}</section>`
}

function chip(text: string, p: AdvancedPalette, accent = false): string {
  return `<span style="display:inline-block;background:${accent ? p.accentSoft : p.surfaceAlt};padding:3px 8px;border-radius:999px;font-size:13px;color:${accent ? p.accentDark : p.muted};font-weight:800;line-height:1.45;border:1px solid ${accent ? p.border : p.mutedBorder};">${esc(text)}</span>`
}

function splitTitle(title = ""): [string, string] {
  const parts = title.split("|").map(part => part.trim())
  return [parts[0] ?? "", parts.slice(1).join(" ")]
}

function compareImage(title: string, src: string, p: AdvancedPalette): string {
  return `<section style="background:${p.surface};border:1px solid ${p.mutedBorder};border-radius:12px;padding:16px;box-shadow:${p.shadow};"><p style="display:inline-block;margin:0 0 10px;font-size:13px;font-weight:700;color:${p.muted};letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:${p.surfaceAlt};border:1px solid ${p.mutedBorder};">${esc(title)}</p><section style="overflow:hidden;background:${p.surfaceAlt};border-radius:8px;min-height:200px;border:1px solid ${p.mutedBorder};">${imageTag(src, title, "width:100% !important;height:auto !important;display:block;")}</section></section>`
}

function listCard(index: string, title: string, body: string, p: AdvancedPalette): string {
  return `<section style="display:flex;align-items:flex-start;gap:12px;background:linear-gradient(180deg, ${p.surface} 0%, ${p.surfaceAlt} 100%);border:1px solid ${p.mutedBorder};border-radius:12px;padding:14px;box-shadow:${p.shadow};"><p style="margin:0;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${p.accentSofter};color:${p.accentDark};font-size:13px;font-weight:800;flex-shrink:0;border:1px solid ${p.border};">${esc(index)}</p><section style="flex:1 1 0%;min-width:0;"><p style="margin:0 0 3px;font-size:17px;font-weight:800;color:${p.text};line-height:1.55;">${esc(title)}</p><p style="margin:0;font-size:15px;color:${p.muted};line-height:1.65;">${esc(body)}</p></section></section>`
}

function tocRow(row: string[], p: AdvancedPalette): string {
  return `<section style="display:flex;align-items:flex-start;gap:12px;padding-bottom:10px;border-bottom:1px solid ${p.mutedBorder};"><p style="margin:0;min-width:34px;font-size:13px;font-weight:800;color:${p.accentDark};letter-spacing:0.6px;">${esc(row[0])}</p><section style="flex:1 1 0%;min-width:0;"><p style="margin:0 0 2px;font-size:17px;font-weight:800;color:${p.text};line-height:1.55;">${esc(row[1])}</p><p style="margin:0;font-size:15px;color:${p.muted};line-height:1.6;">${esc(row[2])}</p></section></section>`
}

function dialogueTurn(role: string, text: string, right: boolean, p: AdvancedPalette): string {
  const avatar = esc(role.slice(0, 1).toUpperCase())
  return `<section style="margin:0.8em 0;display:flex;align-items:flex-start;justify-content:${right ? "flex-end;flex-direction:row-reverse" : "flex-start"};"><section style="display:inline-block;vertical-align:middle;width:36px;height:36px;${right ? "margin-left" : "margin-right"}:10px;box-sizing:border-box;position:relative;top:2px;"><section style="width:32px;height:32px;border-radius:50%;background:${right ? p.muted : `linear-gradient(135deg, ${p.accentDark}, ${p.accentDark})`};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;box-shadow:${right ? p.shadow : p.accentShadow};">${avatar}</section></section><section style="display:inline-block;vertical-align:middle;width:calc(100% - 50px);box-sizing:border-box;"><section style="background:linear-gradient(135deg, ${p.surface}, ${p.surfaceAlt});border:1px solid ${p.border};border-radius:${right ? "16px 16px 4px 16px" : "16px 16px 16px 4px"};padding:8px 14px;max-width:80%;color:${p.textStrong};line-height:1.5;font-size:15px;${right ? "margin-left:auto;" : ""}box-shadow:${p.shadow};word-wrap:break-word;box-sizing:border-box;text-align:left;"><p style="margin:0;color:inherit;line-height:inherit;font-size:inherit;text-align:left;">${esc(text)}</p></section></section></section>`
}

function buttonLike(text: string, primary: boolean, p: AdvancedPalette): string {
  return `<span style="display:block;min-width:0;text-align:center;padding:11px 8px;border-radius:12px;background:${primary ? `linear-gradient(135deg, ${p.accentDark}, ${p.accentDark})` : p.surface};border:1px solid ${primary ? p.border : p.mutedBorder};color:${primary ? "#ffffff" : p.text};font-size:13px;font-weight:900;line-height:1.45;${primary ? `box-shadow:${p.accentShadow};` : ""}">${esc(text)}</span>`
}

function parseMarkdownImages(markdown: string): Array<{ alt: string; src: string }> {
  return [...markdown.matchAll(/!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
    .map(match => ({ alt: match[1], src: match[2] }))
}
