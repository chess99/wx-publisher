import { describe, it, expect, vi, beforeEach } from "vitest"
import { MiniMaxImageProvider } from "../../src/image/providers/minimax.js"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

function makeResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  }
}

describe("MiniMaxImageProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("happy path: 返回 ImageResult 数组", async () => {
    const b64 = Buffer.from("fake-image-data").toString("base64")
    mockFetch.mockResolvedValue(makeResponse({
      base_resp: { status_code: 0, status_msg: "success" },
      data: { image_base64: [b64, b64] },
      metadata: { success_count: 2, failed_count: 0 },
    }))

    const provider = new MiniMaxImageProvider("minimax-key")
    const results = await provider.generateImages("a cat", { n: 2, size: "1536x1024" })

    expect(results).toHaveLength(2)
    expect(results[0].data.toString()).toBe("fake-image-data")
    expect(results[0].prompt).toBe("a cat")
  })

  it("请求体包含正确的 aspect_ratio（1536x1024 -> 3:2）", async () => {
    mockFetch.mockResolvedValue(makeResponse({
      base_resp: { status_code: 0, status_msg: "success" },
      data: { image_base64: [] },
    }))

    const provider = new MiniMaxImageProvider("key", "image-01")
    await provider.generateImages("test", { n: 1, size: "1536x1024" })

    const [_url, init] = mockFetch.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body.aspect_ratio).toBe("3:2")
    expect(body.model).toBe("image-01")
    expect(body.response_format).toBe("base64")
  })

  it("1024x1024 映射到 1:1", async () => {
    mockFetch.mockResolvedValue(makeResponse({
      base_resp: { status_code: 0, status_msg: "success" },
      data: { image_base64: [] },
    }))

    const provider = new MiniMaxImageProvider("key")
    await provider.generateImages("test", { n: 1, size: "1024x1024" })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.aspect_ratio).toBe("1:1")
  })

  it("API 返回 status_code 非 0 时抛出错误", async () => {
    mockFetch.mockResolvedValue(makeResponse({
      base_resp: { status_code: 1004, status_msg: "账号鉴权失败" },
      data: {},
    }))

    const provider = new MiniMaxImageProvider("bad-key")
    await expect(
      provider.generateImages("test", { n: 1, size: "1024x1024" })
    ).rejects.toThrow("1004")
  })

  it("HTTP 非 200 时抛出错误", async () => {
    mockFetch.mockResolvedValue(makeResponse("Unauthorized", false, 401))

    const provider = new MiniMaxImageProvider("key")
    await expect(
      provider.generateImages("test", { n: 1, size: "1024x1024" })
    ).rejects.toThrow("401")
  })

  it("过滤空 base64 项", async () => {
    const b64 = Buffer.from("img").toString("base64")
    mockFetch.mockResolvedValue(makeResponse({
      base_resp: { status_code: 0, status_msg: "success" },
      data: { image_base64: [b64, "", b64] },
    }))

    const provider = new MiniMaxImageProvider("key")
    const results = await provider.generateImages("test", { n: 3, size: "1024x1024" })
    expect(results).toHaveLength(2)
  })

  it("Authorization header 正确", async () => {
    mockFetch.mockResolvedValue(makeResponse({
      base_resp: { status_code: 0, status_msg: "success" },
      data: { image_base64: [] },
    }))

    const provider = new MiniMaxImageProvider("my-minimax-key")
    await provider.generateImages("test", { n: 1, size: "1024x1024" })

    const init = mockFetch.mock.calls[0][1]
    expect(init.headers["Authorization"]).toBe("Bearer my-minimax-key")
  })
})
