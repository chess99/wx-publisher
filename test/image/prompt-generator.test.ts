import { describe, it, expect, vi, beforeEach } from "vitest"

const mockCreate = vi.fn()
const constructorCalls: unknown[] = []

vi.mock("openai", () => {
  class MockOpenAI {
    chat = { completions: { create: mockCreate } }
    constructor(public config: unknown) {
      constructorCalls.push(config)
    }
  }
  return { default: MockOpenAI }
})

const { generateImagePrompt } = await import("../../src/image/prompt-generator.js")

describe("generateImagePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    constructorCalls.length = 0
  })

  it("happy path: 返回 LLM 生成的提示词", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "a beautiful sunset over mountains" } }],
    })

    const result = await generateImagePrompt("# 山间日落\n\n描写山间日落的文章...", "sk-test")
    expect(result).toBe("a beautiful sunset over mountains")
  })

  it("LLM 返回 null content 时 fallback 到文章摘要", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    })

    const markdown = "# 测试\n\n这是一篇测试文章内容"
    const result = await generateImagePrompt(markdown, "sk-test")
    // fallback 应包含文章文本（去掉标记后）
    expect(result).toContain("测试")
    expect(result).toContain("这是一篇测试文章内容")
  })

  it("空 markdown 不报错", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "abstract image" } }],
    })

    const result = await generateImagePrompt("", "sk-test")
    expect(result).toBe("abstract image")
  })

  it("使用自定义 baseURL 和 textModel", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "result" } }],
    })

    await generateImagePrompt("test", "sk-test", {
      baseURL: "http://localhost:4000/v1",
      textModel: "gpt-4o",
    })

    // 验证 baseURL 传给了构造函数
    expect(constructorCalls[0]).toMatchObject({
      apiKey: "sk-test",
      baseURL: "http://localhost:4000/v1",
    })
    // 验证 model 传给了 create
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o" })
    )
  })

  it("Markdown 标记被去掉，fallback 只保留纯文本", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    })

    const markdown = "# 标题\n\n**加粗** 和 `代码` 以及 [链接](http://x.com)"
    const result = await generateImagePrompt(markdown, "sk-test")
    expect(result).not.toContain("**")
    expect(result).not.toContain("`")
    expect(result).not.toContain("[链接]")
    expect(result).toContain("加粗")
    // inline code content is stripped (not meaningful for image prompts)
    expect(result).not.toContain("`代码`")
    expect(result).toContain("链接")
  })
})
