import { describe, it, expect } from "vitest"
import { formatCliError } from "../src/cli/errors.js"

describe("formatCliError", () => {
  it("adds a developer platform hint for WeChat invalid IP whitelist errors", () => {
    const result = formatCliError(
      "上传封面图失败",
      "Error: 获取 access_token 失败: invalid ip <当前出口 IP> ipv6 ::ffff:<当前出口 IP>, not in whitelist rid: test"
    )

    expect(result).toEqual({
      success: false,
      error: "上传封面图失败",
      details: "Error: 获取 access_token 失败: invalid ip <当前出口 IP> ipv6 ::ffff:<当前出口 IP>, not in whitelist rid: test",
      code: "WECHAT_IP_NOT_IN_WHITELIST",
      hint: expect.stringContaining("微信开发者平台"),
    })
    expect(result.hint).toContain("API IP 白名单")
    expect(result.hint).not.toContain("微信公众号后台「开发 → 基本配置")
  })

  it("keeps generic errors compact", () => {
    const result = formatCliError("读取文件失败", "ENOENT")

    expect(result).toEqual({
      success: false,
      error: "读取文件失败",
      details: "ENOENT",
    })
  })
})
