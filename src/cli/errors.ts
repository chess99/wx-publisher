export interface CliErrorPayload {
  success: false
  error: string
  details?: unknown
  code?: string
  hint?: string
}

const INVALID_IP_PATTERN = /invalid ip\b[\s\S]*not in whitelist/i

export function formatCliError(message: string, details?: unknown): CliErrorPayload {
  const payload: CliErrorPayload = {
    success: false,
    error: message,
    details,
  }

  const detailText = typeof details === "string" ? details : JSON.stringify(details)
  if (detailText && INVALID_IP_PATTERN.test(detailText)) {
    payload.code = "WECHAT_IP_NOT_IN_WHITELIST"
    payload.hint = "当前出口 IP 不在 API IP 白名单中。请登录微信开发者平台，进入「我的业务与服务」→「公众号」→ 选择目标公众号 →「基础信息 / 开发接口管理」→「API IP 白名单」，添加当前出口 IP 后重试。"
  }

  return payload
}
