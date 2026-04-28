import { createServer } from "http"
import type { AddressInfo } from "net"

export interface SelectionServer {
  port: number
  close: () => void
  setHtml: (html: string) => void
}

/**
 * 启动轻量本地 HTTP 服务，供选图页回传用户选择结果。
 *
 * 路由：
 *   GET /             — 返回选图页 HTML
 *   GET /index.html   — 同上（别名）
 *   GET /image/:idx   — 返回候选图二进制（image/jpeg）
 *   GET /select?index=N — 用户选定第 N 张图，触发 onSelected 回调
 *
 * 关闭检测：
 *   用户加载选图页后如果关闭浏览器而不选图，所有活跃连接断开后触发 onBrowserClose 回调。
 *   onBrowserClose 只在"页面已加载且未选图"时触发，不会在 server.close() 后误触发。
 */
export function startSelectionServer(
  images: Buffer[],
  onSelected: (index: number) => void,
  onBrowserClose?: () => void
): SelectionServer {
  let pageHtml = "<html><body>Loading...</body></html>"
  let pageLoaded = false
  let selectionMade = false
  let activeConnections = 0

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost")

    // 根路由：直接从 server 返回 HTML，避免 file:// → http:// CORS 问题
    if (url.pathname === "/" || url.pathname === "/index.html") {
      pageLoaded = true
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(pageHtml)
      return
    }

    if (url.pathname === "/select") {
      const raw = url.searchParams.get("index") ?? ""
      const index = parseInt(raw, 10)
      if (isNaN(index) || index < 0 || index >= images.length) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: `invalid index: ${raw}` }))
        return
      }
      selectionMade = true
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

  // 追踪活跃连接数，用于检测浏览器关闭
  server.on("connection", (socket) => {
    activeConnections++
    socket.once("close", () => {
      activeConnections--
      // 页面已加载、未选图、所有连接已断开 → 浏览器关闭了
      if (pageLoaded && !selectionMade && activeConnections === 0) {
        onBrowserClose?.()
      }
    })
  })

  server.listen(0) // 随机可用端口
  const { port } = server.address() as AddressInfo
  return {
    port,
    close: () => server.close(),
    setHtml: (html: string) => { pageHtml = html },
  }
}
