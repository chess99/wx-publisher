import type { ImageProvider, GenerateOptions, ImageResult } from "../provider.js"

export class GeminiImageProvider implements ImageProvider {
  async generateImages(_prompt: string, _opts: GenerateOptions): Promise<ImageResult[]> {
    throw new Error(
      "Gemini Imagen 需要 Google Cloud 账号和 Vertex AI 权限，暂不支持直接通过 API key 使用。\n" +
      "如需使用 Gemini，可通过 LiteLLM 代理并设置 image_provider_url 指向本地代理。\n" +
      "参阅：https://cloud.google.com/vertex-ai/docs/generative-ai/image/generate-images"
    )
  }
}
