import type { ImageProvider, GenerateOptions, ImageResult } from "../provider.js"

const MINIMAX_BASE_URL = "https://api.minimaxi.com"

export class MiniMaxImageProvider implements ImageProvider {
  constructor(
    private apiKey: string,
    private model: string = "image-01"
  ) {}

  async generateImages(prompt: string, opts: GenerateOptions): Promise<ImageResult[]> {
    // MiniMax 用 aspect_ratio 而不是像素尺寸
    // 把 GenerateOptions.size 映射到最接近的比例
    const aspectRatio = sizeToAspectRatio(opts.size)

    const body = {
      model: this.model,
      prompt,
      aspect_ratio: aspectRatio,
      response_format: "base64",
      n: opts.n,
    }

    const resp = await fetch(`${MINIMAX_BASE_URL}/v1/image_generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => `HTTP ${resp.status}`)
      throw new Error(`MiniMax API 请求失败 (${resp.status}): ${text}`)
    }

    const json = await resp.json() as MiniMaxResponse

    if (json.base_resp?.status_code !== 0) {
      throw new Error(
        `MiniMax API 错误 (${json.base_resp?.status_code}): ${json.base_resp?.status_msg}`
      )
    }

    const b64List = json.data?.image_base64 ?? []
    return b64List
      .filter(b64 => b64)
      .map(b64 => ({
        data: Buffer.from(b64, "base64"),
        prompt,
      }))
  }
}

function sizeToAspectRatio(
  size: GenerateOptions["size"]
): string {
  // 映射到 MiniMax 支持的 aspect_ratio
  // 封面图优先用横图比例
  switch (size) {
    case "1536x1024":
    case "1792x1024": return "3:2"   // 最接近 1.5:1
    case "1024x1536":
    case "1024x1792": return "2:3"   // 竖图
    case "1024x1024": return "1:1"
    default:          return "3:2"   // 封面图默认横图
  }
}

interface MiniMaxResponse {
  id?: string
  data?: {
    image_urls?: string[]
    image_base64?: string[]
  }
  metadata?: {
    success_count?: number
    failed_count?: number
  }
  base_resp?: {
    status_code: number
    status_msg: string
  }
}
