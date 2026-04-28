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

  it("GET / — 返回 setHtml 设置的 HTML 内容", async () => {
    server = startSelectionServer(fakeImages, () => {})
    server.setHtml("<html><body>test-content</body></html>")
    const res = await get(server.port, "/")
    expect(res.status).toBe(200)
    expect(res.body).toContain("test-content")
  })

  it("GET /index.html — 与 GET / 返回相同内容", async () => {
    server = startSelectionServer(fakeImages, () => {})
    server.setHtml("<html><body>alias-test</body></html>")
    const res = await get(server.port, "/index.html")
    expect(res.status).toBe(200)
    expect(res.body).toContain("alias-test")
  })

  it("onBrowserClose — 页面加载后手动销毁 socket 时触发", async () => {
    const { request } = await import("http")
    let closeFired = false
    server = startSelectionServer(fakeImages, () => {}, () => { closeFired = true })

    // 模拟浏览器：建立连接，加载页面，然后销毁 socket（模拟关闭标签页）
    await new Promise<void>((resolve, reject) => {
      const req = request(
        { hostname: "localhost", port: server!.port, path: "/", method: "GET" },
        (res) => {
          res.resume() // 消费响应体
          res.on("end", () => {
            // 页面已加载，销毁底层 socket 模拟浏览器关闭
            req.socket?.destroy()
            resolve()
          })
        }
      )
      req.on("error", reject)
      req.end()
    })

    // 等待 socket close 事件传播
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (closeFired) { clearInterval(check); resolve() }
      }, 10)
      setTimeout(() => { clearInterval(check); resolve() }, 500)
    })
    expect(closeFired).toBe(true)
  })

  it("onBrowserClose — 选图完成后不触发", async () => {
    const { request } = await import("http")
    let closeFired = false
    server = startSelectionServer(fakeImages, () => {}, () => { closeFired = true })

    // 加载页面
    await get(server.port, "/")
    // 选图
    await get(server.port, "/select?index=0")

    // 销毁连接模拟浏览器关闭
    await new Promise<void>((resolve, reject) => {
      const req = request(
        { hostname: "localhost", port: server!.port, path: "/", method: "GET" },
        (res) => {
          res.resume()
          res.on("end", () => { req.socket?.destroy(); resolve() })
        }
      )
      req.on("error", reject)
      req.end()
    })

    await new Promise(resolve => setTimeout(resolve, 200))
    expect(closeFired).toBe(false)
  })
})
