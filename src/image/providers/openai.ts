import OpenAI from "openai"
import type { ImagesResponse } from "openai/resources/images.js"
import type { ImageProvider, GenerateOptions, ImageResult } from "../provider.js"

export class OpenAIImageProvider implements ImageProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, baseURL?: string, model?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseURL ?? "https://api.openai.com/v1",
    })
    this.model = model ?? "gpt-image-2"
  }

  async generateImages(prompt: string, opts: GenerateOptions): Promise<ImageResult[]> {
    // Cast through unknown to bypass streaming union — we always get ImagesResponse here
    const response = await this.client.images.generate({
      model: this.model,
      prompt,
      n: opts.n,
      size: opts.size,
      response_format: "b64_json",
    }) as unknown as ImagesResponse

    return (response.data ?? []).map(item => ({
      data: Buffer.from(item.b64_json ?? "", "base64"),
      prompt: item.revised_prompt ?? prompt,
    }))
  }
}
