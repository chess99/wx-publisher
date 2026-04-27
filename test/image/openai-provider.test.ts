import { describe, it, expect, vi, beforeEach } from "vitest"

// We need to mock OpenAI before importing the provider
const mockGenerate = vi.fn()

vi.mock("openai", () => {
  class MockOpenAI {
    images = { generate: mockGenerate }
    constructor(public config: unknown) {}
  }
  return { default: MockOpenAI }
})

// Import after mock is set up
const { OpenAIImageProvider } = await import("../../src/image/providers/openai.js")

describe("OpenAIImageProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("happy path: 返回 ImageResult 数组", async () => {
    const b64 = Buffer.from("fake-image-data").toString("base64")
    mockGenerate.mockResolvedValue({
      data: [
        { b64_json: b64, revised_prompt: "a cat" },
        { b64_json: b64, revised_prompt: "a dog" },
      ],
    })

    const provider = new OpenAIImageProvider("sk-test")
    const results = await provider.generateImages("test prompt", { n: 2, size: "1792x1024" })

    expect(results).toHaveLength(2)
    expect(results[0].prompt).toBe("a cat")
    expect(results[0].data).toBeInstanceOf(Buffer)
    expect(results[0].data.toString()).toBe("fake-image-data")
  })

  it("无 revised_prompt 时使用原始 prompt", async () => {
    mockGenerate.mockResolvedValue({
      data: [{ b64_json: Buffer.from("x").toString("base64") }],
    })

    const provider = new OpenAIImageProvider("sk-test")
    const results = await provider.generateImages("my prompt", { n: 1, size: "1024x1024" })
    expect(results[0].prompt).toBe("my prompt")
  })

  it("API 报错时抛出异常", async () => {
    mockGenerate.mockRejectedValue(new Error("rate limit exceeded"))

    const provider = new OpenAIImageProvider("sk-test")
    await expect(
      provider.generateImages("test", { n: 1, size: "1024x1024" })
    ).rejects.toThrow("rate limit exceeded")
  })

  it("data 为空数组时返回空结果", async () => {
    mockGenerate.mockResolvedValue({ data: [] })

    const provider = new OpenAIImageProvider("sk-test")
    const results = await provider.generateImages("test", { n: 1, size: "1024x1024" })
    expect(results).toHaveLength(0)
  })

  it("使用 generate 时传入正确的 model 和 size", async () => {
    mockGenerate.mockResolvedValue({ data: [] })

    const provider = new OpenAIImageProvider("sk-test", undefined, "gpt-image-1")
    await provider.generateImages("test", { n: 2, size: "1024x1024" })

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-image-1", n: 2, size: "1024x1024" })
    )
  })
})
