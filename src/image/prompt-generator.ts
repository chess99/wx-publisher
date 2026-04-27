import OpenAI from "openai"

export interface PromptGenOptions {
  baseURL?: string
  textModel?: string
}

/**
 * 从 Markdown 文章内容自动生成适合微信公众号封面图的英文提示词。
 * 使用与生图相同的 baseURL/apiKey，无需单独配置。
 */
export async function generateImagePrompt(
  markdown: string,
  apiKey: string,
  opts: PromptGenOptions = {}
): Promise<string> {
  const summary = extractSummary(markdown, 500)
  const client = new OpenAI({
    apiKey,
    baseURL: opts.baseURL ?? "https://api.openai.com/v1",
    timeout: 30_000, // 30s，防止 SDK 无限等待
  })
  const resp = await client.chat.completions.create({
    model: opts.textModel ?? "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `根据以下文章摘要，生成一段英文图像生成提示词，风格适合作为微信公众号文章封面图。
要求：
- 画面清晰、主题突出
- 适合横图（16:9）
- 不包含文字
- 50词以内

文章摘要：${summary}`,
    }],
  })

  let content = resp.choices[0]?.message?.content ?? ""
  // 部分推理模型（如 MiniMax-M2.7）把思考过程包在 <think>...</think> 里
  content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
  // 只取第一段英文提示词：截断到第一个 --- 分隔线或第一个中文字符前
  // 避免模型额外附上翻译或解释文字
  const hrIdx = content.indexOf("\n---")
  if (hrIdx > 0) content = content.slice(0, hrIdx).trim()
  // 去掉 markdown 粗体标记（**标题：**）
  content = content.replace(/^\*\*[^*]+\*\*[\s:：]*/m, "").trim()
  return content || summary
}

function extractSummary(markdown: string, maxChars: number): string {
  // 去掉 Markdown 标记，取前 maxChars 字
  const plain = markdown
    .replace(/^#+\s+/gm, "")       // headings
    .replace(/\*\*?|__?/g, "")     // bold/italic
    .replace(/`[^`]*`/g, "")       // inline code
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")    // images
    .replace(/\n{2,}/g, "\n")
    .trim()
  return plain.slice(0, maxChars)
}
