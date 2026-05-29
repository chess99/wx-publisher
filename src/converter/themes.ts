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

  "warm-tech": {
    name: "warm-tech",
    description: "暖色编辑部技术风，适合 AI、产品设计和工程实践长文",
    styles: {
      wrapper: "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Helvetica Neue',Arial,sans-serif;max-width:677px;margin:0 auto;padding:0 16px;background:#fffdf8;color:#342a20;",
      h1: "font-size:25px;font-weight:800;color:#17120d;margin:28px 0 14px;line-height:1.35;",
      h2: "font-size:20px;font-weight:800;color:#19140f;margin:30px 0 14px;line-height:1.45;padding:10px 14px 10px 16px;background:#fbf3e6;border-left:4px solid #9a6b2f;border-radius:8px;",
      h3: "font-size:17px;font-weight:700;color:#7a4f18;margin:22px 0 10px;line-height:1.45;padding-bottom:5px;border-bottom:1px solid #ead9c1;",
      h4: "font-size:16px;font-weight:700;color:#3b3025;margin:18px 0 8px;",
      p: "font-size:16px;line-height:1.9;color:#3f3529;margin:0 0 17px 0;",
      strong: "font-weight:800;color:#15110d;",
      em: "font-style:italic;color:#6a5a49;",
      code: "font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;background:#f4eadb;padding:2px 6px;border-radius:5px;color:#8a4f13;border:1px solid #e3d2bd;",
      pre: "background:#17120d;border:1px solid #3a2d20;border-radius:10px;padding:16px 18px;margin:18px 0;overflow-x:auto;display:block;",
      preCode: "font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;color:#f4efe7;background:none;padding:0;border-radius:0;display:block;white-space:nowrap;overflow-x:auto;",
      blockquote: "border-left:4px solid #b88742;margin:18px 0;padding:12px 16px;background:#fbf3e6;color:#5a4937;font-size:15px;line-height:1.85;border-radius:0 8px 8px 0;",
      ul: "list-style:none;padding-left:0;margin:0 0 17px 0;",
      ol: "list-style:none;padding-left:0;margin:0 0 17px 0;",
      li: "display:block;margin:0.22em 8px;font-size:16px;line-height:1.85;color:#3f3529;",
      hr: "border:none;border-top:1px solid #e8d8c4;margin:28px 0;",
      img: "max-width:100%;border-radius:10px;display:block;margin:20px auto;box-shadow:0 8px 24px rgba(62,44,24,0.10);",
      a: "color:#7a4f18;text-decoration:none;font-weight:700;border-bottom:1px dotted #d1ad7a;",
      table: "width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;background:#fffaf1;",
      th: "background:#f3e6d3;font-weight:700;padding:9px 12px;border:1px solid #dfc8aa;text-align:left;color:#2f251b;",
      td: "padding:9px 12px;border:1px solid #ead8be;color:#3f3529;",
    },
  },

  studio: {
    name: "studio",
    description: "暖橙作品风，适合高级模块和品牌化公众号长文",
    styles: {
      wrapper: "font-family:'PingFang SC',-apple-system-font,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif;max-width:677px;margin:0 auto;padding:12px;background-color:#faf9f5;",
      h1: "margin:1.5em 8px 0.75em 0;padding:0.8em 1.5em;background:rgb(200,100,66);font-size:22px;font-weight:bold;line-height:1.2;color:#ffffff;text-align:center;border-radius:8px;box-shadow:0 2px 8px rgba(200,100,66,0.2);",
      h2: "margin:2em 8px 0.75em 0;padding:0 0 0.5em 12px;border-left:4px solid rgb(200,100,66);border-bottom:1px dashed rgb(200,100,66);font-size:20px;font-weight:bold;line-height:1.2;color:rgb(63,63,63);",
      h3: "margin:2em 8px 0.75em 0;padding:0 0 0.4em 12px;font-size:18px;font-weight:bold;line-height:1.2;color:rgb(63,63,63);border-left:4px solid rgb(200,100,66);border-bottom:1px dashed rgb(200,100,66);",
      h4: "margin:1.5em 8px 0.5em 0;padding-left:12px;font-size:16px;font-weight:bold;line-height:1.2;color:rgb(63,63,63);border-left:4px solid rgb(200,100,66);",
      p: "margin:1.2em 8px;text-align:justify;line-height:1.75;font-family:'PingFang SC',-apple-system-font,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif;font-size:15px;letter-spacing:0.1em;color:rgb(34,34,34);overflow-wrap:break-word;",
      strong: "font-weight:bold;color:rgb(200,100,66);",
      em: "font-style:italic;color:rgb(102,102,102);",
      code: "display:inline-block;background:linear-gradient(180deg,rgba(200,100,66,0.14),rgba(200,100,66,0.08));color:#9f452c;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;padding:2px 7px;border-radius:999px;border:1px solid rgba(200,100,66,0.18);font-size:90%;line-height:1.4;",
      pre: "display:block;box-sizing:border-box;margin:1.5em 8px;padding:1.15em 1.2em 1.2em;background:linear-gradient(180deg,rgba(200,100,66,0.14) 0,rgba(200,100,66,0.14) 12px,rgba(250,250,249,0.98) 12px,rgba(250,250,249,0.98) 100%);border:1px solid rgba(200,100,66,0.18);border-radius:14px;overflow-x:auto;font-size:14px;line-height:1.6;box-shadow:0 8px 20px rgba(200,100,66,0.1),inset 0 1px 0 rgba(255,255,255,0.85);white-space:pre;word-break:normal;overflow-wrap:normal;-webkit-overflow-scrolling:touch;tab-size:2;",
      preCode: "background:none;padding:0;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;font-size:14px;color:#3b342f;line-height:1.6;",
      blockquote: "margin:1.5em 0 2em;padding:1em 1em 1em 2em;border-width:0 0 0 4px;border-style:solid;border-color:rgb(229,229,229) rgb(229,229,229) rgb(229,229,229) rgb(200,100,66);border-radius:6px;background:rgb(247,247,247);color:rgba(0,0,0,0.6);font-style:italic;box-shadow:rgba(0,0,0,0.05) 0 4px 6px;",
      ul: "list-style:none;margin:0 8px 1.5em;padding:0;text-align:left;line-height:1.75;font-family:'PingFang SC',-apple-system-font,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif;font-size:15px;color:rgb(63,63,63);",
      ol: "list-style:none;margin:0 8px 1.5em;padding:0;text-align:left;line-height:1.75;font-family:'PingFang SC',-apple-system-font,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif;font-size:15px;color:rgb(63,63,63);",
      li: "display:block;margin:0.5em 0;padding:0;text-align:left;line-height:1.75;font-family:'PingFang SC',-apple-system-font,BlinkMacSystemFont,'Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif;font-size:15px;color:rgb(63,63,63);",
      hr: "border:none;height:1px;margin:2em 0;background:linear-gradient(to right,rgba(200,100,66,0),rgba(200,100,66,0.6),rgba(200,100,66,0));",
      img: "max-width:100%;border-radius:8px;display:block;margin:16px auto;",
      a: "color:rgb(200,100,66);text-decoration:none;border-bottom:1px solid rgba(200,100,66,0.3);word-break:break-all;overflow-wrap:anywhere;white-space:normal;",
      table: "width:100%;margin:16px 8px;border-collapse:collapse;font-size:15px;",
      th: "padding:8px 12px;border:1px solid rgb(229,229,229);background-color:rgb(246,246,244);font-weight:bold;text-align:left;",
      td: "padding:8px 12px;border:1px solid rgb(229,229,229);",
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
