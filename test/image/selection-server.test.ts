import { describe, it, expect, afterEach } from "vitest"
import { startSelectionServer } from "../../src/image/selection-server.js"
import type { SelectionServer } from "../../src/image/selection-server.js"

const fakeImages = [
  Buffer.from("image-0-data"),
  Buffer.from("image-1-data"),
  Buffer.from("image-2-data"),
]

let server: SelectionServer | null = null

afterEach(() => {
  server?.close()
  server = null
})

async function get(port: number, path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`http://localhost:${port}${path}`)
  return { status: res.status, body: await res.text() }
}

describe("startSelectionServer", () => {
  it("在随机端口启动，port > 0", () => {
    server = startSelectionServer(fakeImages, () => {})
    expect(server.port).toBeGreaterThan(0)
  })

  it("GET /image/:idx — 返回图片内容", async () => {
    server = startSelectionServer(fakeImages, () => {})
    const res = await get(server.port, "/image/1")
    expect(res.status).toBe(200)
    expect(res.body).toBe("image-1-data")
  })

  it("GET /image/:idx — 越界返回 404", async () => {
    server = startSelectionServer(fakeImages, () => {})
    const res = await get(server.port, "/image/99")
    expect(res.status).toBe(404)
  })

  it("GET /image/:idx — 负数返回 404", async () => {
    server = startSelectionServer(fakeImages, () => {})
    const res = await get(server.port, "/image/-1")
    expect(res.status).toBe(404)
  })

  it("GET /select?index=N — 触发回调并返回 {ok:true}", async () => {
    let selected = -1
    server = startSelectionServer(fakeImages, (i) => { selected = i })
    const res = await get(server.port, "/select?index=1")
    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })
    expect(selected).toBe(1)
  })

  it("GET /select?index=N — 无效 index 返回 400", async () => {
    server = startSelectionServer(fakeImages, () => {})
    const res = await get(server.port, "/select?index=99")
    expect(res.status).toBe(400)
  })

  it("GET /select?index=NaN — 返回 400", async () => {
    server = startSelectionServer(fakeImages, () => {})
    const res = await get(server.port, "/select?index=abc")
    expect(res.status).toBe(400)
  })

  it("未知路由返回 404", async () => {
    server = startSelectionServer(fakeImages, () => {})
    const res = await get(server.port, "/unknown")
    expect(res.status).toBe(404)
  })
})
