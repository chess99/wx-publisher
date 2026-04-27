import { describe, it, expect } from "vitest"
import { GeminiImageProvider } from "../../src/image/providers/gemini.js"

describe("GeminiImageProvider", () => {
  it("generateImages 抛出包含 Vertex AI 说明的错误", async () => {
    const provider = new GeminiImageProvider()
    await expect(
      provider.generateImages("test", { n: 1, size: "1024x1024" })
    ).rejects.toThrow("Vertex AI")
  })
})
