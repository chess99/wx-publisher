/**
 * 微信公众号排版主题
 * 每个主题定义每种 HTML 节点的内联样式
 * 微信不支持外部 CSS，所有样式必须内联
 */

export interface Theme {
  name: string
  description: string
  styles: NodeStyles
}

export interface NodeStyles {
  /** 整体容器 */
  wrapper: string
  /** h1 */
  h1: string
  /** h2 */
  h2: string
  /** h3 */
  h3: string
  /** h4 */
  h4: string
  /** 正文段落 */
  p: string
  /** 粗体 */
  strong: string
  /** 斜体 */
  em: string
  /** 行内代码 */
  code: string
  /** 代码块容器 pre */
  pre: string
  /** 代码块内 code */
  preCode: string
  /** 引用块 */
  blockquote: string
  /** 无序列表 */
  ul: string
  /** 有序列表 */
  ol: string
  /** 列表项 */
  li: string
  /** 分割线 */
  hr: string
  /** 图片 */
  img: string
  /** 链接（微信不支持外链，转为加粗文字） */
  a: string
  /** 表格 */
  table: string
  /** 表头 th */
  th: string
  /** 表格单元格 td */
  td: string
}

const BASE_P = "font-size:16px;line-height:1.8;color:#333;margin:0 0 16px 0;"
// 列表：display:block 消除浏览器默认 list-item 行为，避免微信二次处理产生空行
const BASE_UL = "list-style:none;padding-left:0;margin:0 0 16px 0;"
const BASE_OL = "list-style:none;padding-left:0;margin:0 0 16px 0;"
const BASE_LI = "display:block;margin:0.2em 8px;font-size:16px;line-height:1.8;color:#333;"
// pre 容器：深色背景
const BASE_CODE_BLOCK = "background:#282c34;border-radius:8px;padding:16px 20px;margin:16px 0;overflow-x:auto;display:block;"
// pre > code：浅色文字，必须显式设置 color，微信不继承 class-based 样式
// white-space:nowrap 保证代码不折行（doocs/md 的做法），配合 pre 的 overflow-x:auto 横向滚动
const BASE_PRE_CODE = "font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;color:#abb2bf;background:none;padding:0;border-radius:0;display:block;white-space:nowrap;overflow-x:auto;"

export const themes: Record<string, Theme> = {
  default: {
    name: "default",
    description: "微信经典风格，黑色标题，适合大多数场景",
    styles: {
      wrapper: "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif;max-width:677px;margin:0 auto;padding:0 16px;",
      h1: "font-size:24px;font-weight:700;color:#1a1a1a;margin:24px 0 12px;line-height:1.4;",
      h2: "font-size:20px;font-weight:700;color:#1a1a1a;margin:24px 0 10px;line-height:1.4;border-left:4px solid #07c160;padding-left:10px;",
      h3: "font-size:18px;font-weight:600;color:#1a1a1a;margin:20px 0 8px;line-height:1.4;",
      h4: "font-size:16px;font-weight:600;color:#333;margin:16px 0 6px;",
      p: BASE_P,
      strong: "font-weight:700;color:#1a1a1a;",
      em: "font-style:italic;color:#555;",
      code: "font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:14px;background:#f0f0f0;padding:2px 6px;border-radius:4px;color:#c7254e;",
      pre: BASE_CODE_BLOCK,
      preCode: BASE_PRE_CODE,
      blockquote: "border-left:4px solid #07c160;margin:16px 0;padding:10px 16px;background:#f9f9f9;color:#666;font-size:15px;",
      ul: BASE_UL,
      ol: BASE_OL,
      li: BASE_LI,
      hr: "border:none;border-top:1px solid #e5e5e5;margin:24px 0;",
      img: "max-width:100%;border-radius:4px;display:block;margin:16px auto;",
      a: "color:#07c160;text-decoration:none;font-weight:500;",
      table: "width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;",
      th: "background:#f5f5f5;font-weight:600;padding:8px 12px;border:1px solid #e0e0e0;text-align:left;",
      td: "padding:8px 12px;border:1px solid #e0e0e0;color:#333;",
    },
  },

  elegant: {
    name: "elegant",
    description: "优雅深色风格，金色强调，适合深度内容",
    styles: {
      wrapper: "font-family:'Georgia','Times New Roman',serif;max-width:677px;margin:0 auto;padding:0 16px;background:#fafaf8;",
      h1: "font-size:26px;font-weight:700;color:#1a1a1a;margin:28px 0 14px;line-height:1.3;letter-spacing:-0.5px;",
      h2: "font-size:21px;font-weight:700;color:#1a1a1a;margin:26px 0 12px;line-height:1.3;border-bottom:2px solid #c9a84c;padding-bottom:6px;",
      h3: "font-size:18px;font-weight:600;color:#2c2c2c;margin:20px 0 8px;",
      h4: "font-size:16px;font-weight:600;color:#444;margin:16px 0 6px;",
      p: "font-size:16px;line-height:1.9;color:#3a3a3a;margin:0 0 18px 0;",
      strong: "font-weight:700;color:#1a1a1a;",
      em: "font-style:italic;color:#666;",
      code: "font-family:'SFMono-Regular',Consolas,monospace;font-size:13px;background:#f0ece0;padding:2px 6px;border-radius:3px;color:#8b4513;",
      pre: BASE_CODE_BLOCK,
      preCode: BASE_PRE_CODE,
      blockquote: "border-left:3px solid #c9a84c;margin:20px 0;padding:12px 20px;background:#fdf8ec;color:#5a4a2a;font-size:15px;font-style:italic;",
      ul: BASE_UL,
      ol: BASE_OL,
      li: BASE_LI,
      hr: "border:none;border-top:1px solid #d4c9a8;margin:28px 0;",
      img: "max-width:100%;border-radius:4px;display:block;margin:20px auto;box-shadow:0 2px 8px rgba(0,0,0,0.1);",
      a: "color:#c9a84c;text-decoration:none;font-weight:500;",
      table: "width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;",
      th: "background:#f5f0e0;font-weight:600;padding:10px 14px;border:1px solid #d4c9a8;text-align:left;",
      td: "padding:8px 14px;border:1px solid #d4c9a8;color:#3a3a3a;",
    },
  },

  tech: {
    name: "tech",
    description: "科技感风格，蓝色强调，适合技术文章",
    styles: {
      wrapper: "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif;max-width:677px;margin:0 auto;padding:0 16px;",
      h1: "font-size:24px;font-weight:800;color:#0d1117;margin:24px 0 12px;line-height:1.3;",
      h2: "font-size:20px;font-weight:700;color:#0d1117;margin:24px 0 10px;padding:8px 14px;background:linear-gradient(90deg,#e8f4fd,transparent);border-left:4px solid #0969da;",
      h3: "font-size:17px;font-weight:600;color:#0969da;margin:20px 0 8px;",
      h4: "font-size:16px;font-weight:600;color:#333;margin:16px 0 6px;",
      p: BASE_P,
      strong: "font-weight:700;color:#0d1117;",
      em: "font-style:italic;color:#57606a;",
      code: "font-family:'SFMono-Regular',Consolas,monospace;font-size:85%;background:#f6f8fa;padding:2px 6px;border-radius:6px;color:#0969da;border:1px solid #d0d7de;",
      pre: "background:#0d1117;border-radius:8px;padding:16px 20px;margin:16px 0;overflow-x:auto;display:block;border:1px solid #30363d;",
      preCode: "font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;color:#c9d1d9;background:none;padding:0;border-radius:0;display:block;white-space:nowrap;overflow-x:auto;",
      blockquote: "border-left:4px solid #0969da;margin:16px 0;padding:10px 16px;background:#f6f8fa;color:#57606a;font-size:15px;",
      ul: BASE_UL,
      ol: BASE_OL,
      li: BASE_LI,
      hr: "border:none;border-top:1px solid #d0d7de;margin:24px 0;",
      img: "max-width:100%;border-radius:6px;display:block;margin:16px auto;",
      a: "color:#0969da;text-decoration:none;font-weight:500;",
      table: "width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;",
      th: "background:#f6f8fa;font-weight:600;padding:8px 12px;border:1px solid #d0d7de;text-align:left;",
      td: "padding:8px 12px;border:1px solid #d0d7de;color:#333;",
    },
  },

  minimal: {
    name: "minimal",
    description: "极简风格，无装饰，内容优先",
    styles: {
      wrapper: "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Arial,sans-serif;max-width:677px;margin:0 auto;padding:0 16px;",
      h1: "font-size:22px;font-weight:700;color:#000;margin:28px 0 14px;line-height:1.3;",
      h2: "font-size:18px;font-weight:700;color:#000;margin:24px 0 10px;",
      h3: "font-size:16px;font-weight:600;color:#111;margin:20px 0 8px;",
      h4: "font-size:15px;font-weight:600;color:#222;margin:16px 0 6px;",
      p: "font-size:16px;line-height:1.75;color:#444;margin:0 0 14px 0;",
      strong: "font-weight:700;color:#000;",
      em: "font-style:italic;",
      code: "font-family:'SFMono-Regular',Consolas,monospace;font-size:13px;background:#f4f4f4;padding:1px 5px;border-radius:3px;color:#333;",
      pre: BASE_CODE_BLOCK,
      preCode: BASE_PRE_CODE,
      blockquote: "border-left:3px solid #ccc;margin:14px 0;padding:8px 14px;color:#666;font-size:15px;",
      ul: BASE_UL,
      ol: BASE_OL,
      li: BASE_LI,
      hr: "border:none;border-top:1px solid #eee;margin:20px 0;",
      img: "max-width:100%;display:block;margin:14px auto;",
      a: "color:#333;text-decoration:underline;",
      table: "width:100%;border-collapse:collapse;margin:14px 0;font-size:14px;",
      th: "font-weight:600;padding:7px 10px;border-bottom:2px solid #333;text-align:left;",
      td: "padding:7px 10px;border-bottom:1px solid #eee;color:#444;",
    },
  },
}

export function getTheme(name: string): Theme {
  return themes[name] ?? themes["default"]
}

export function listThemes(): string[] {
  return Object.keys(themes)
}
