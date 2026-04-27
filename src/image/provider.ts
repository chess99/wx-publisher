export interface GenerateOptions {
  n: number
  size: "1024x1024" | "1792x1024" | "1024x1792"
}

export interface ImageResult {
  data: Buffer
  prompt: string
}

export interface ImageProvider {
  generateImages(prompt: string, options: GenerateOptions): Promise<ImageResult[]>
}
