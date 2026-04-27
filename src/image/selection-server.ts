import { createServer } from "http"
import type { AddressInfo } from "net"

export interface SelectionServer {
  port: number
  close: () => void
}

/**
 * 启动轻量本地 HTTP 服务，供选图页回传用户选择结果。
 *
 * 路由：
 *   GET /image/:idx     — 返回候选图二进制（image/jpeg）
 *   GET /select?index=N — 用户选定第 N 张图，触发 onSelected 回调
 */
export function startSelectionServer(
  images: Buffer[],
  onSelected: (index: number) => void
): SelectionServer {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost")

    if (url.pathname === "/select") {
      const raw = url.searchParams.get("index") ?? ""
      const index = parseInt(raw, 10)
      if (isNaN(index) || index < 0 || index >= images.length) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: `invalid index: ${raw}` }))
        return
      }
      onSelected(index)
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      })
      res.end(JSON.stringify({ ok: true }))
      return
    }

    if (url.pathname.startsWith("/image/")) {
      const idx = parseInt(url.pathname.split("/").pop() ?? "", 10)
      if (isNaN(idx) || idx < 0 || idx >= images.length || !images[idx]) {
        res.writeHead(404)
        res.end("Not found")
        return
      }
      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Access-Control-Allow-Origin": "*",
      })
      res.end(images[idx])
      return
    }

    res.writeHead(404)
    res.end("Not found")
  })

  server.listen(0) // 随机可用端口
  const { port } = server.address() as AddressInfo
  return { port, close: () => server.close() }
}
