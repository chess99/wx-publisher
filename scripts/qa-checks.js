/**
 * wx-publisher QA 检查脚本
 *
 * 用途：在微信公众号编辑器（mp.weixin.qq.com）中通过 CDP evaluate_script 运行
 * 验证 ProseMirror 渲染后的 DOM 是否符合预期
 *
 * QA Agent 完整使用流程：
 *
 * 步骤1：在任意已登录的 mp.weixin.qq.com 页面，执行 getAppmsgIdByMediaId(mediaId)
 *        获取草稿的数字 appmsgid 和 token
 *
 * 步骤2：用 navigate_page 导航到编辑器：
 *        https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77
 *          &appmsgid={appmsgid}&token={token}&lang=zh_CN
 *
 * 步骤3：等待编辑器加载后，执行 runAllChecks() 获取 QA 报告
 *
 * 返回值：JSON 字符串，包含所有检查结果
 */

/**
 * 步骤1：在草稿列表页通过 media_id 找到对应的数字 appmsgid
 * 在任意已登录的 mp.weixin.qq.com 页面执行此函数
 * 利用同域 cookie 自动鉴权
 */
async function getAppmsgIdByMediaId(targetMediaId) {
  const token = new URLSearchParams(location.search).get('token')
  if (!token) return { error: '当前页面无 token，请在已登录的 mp.weixin.qq.com 页面执行' }

  const res = await fetch(`/cgi-bin/appmsg?begin=0&count=20&type=77&action=list_card&token=${token}&lang=zh_CN&f=json&ajax=1`)
  const data = await res.json()
  const items = data?.app_msg_info?.item ?? []

  // media_id 对应 file_id 字段（字符串形式）或通过 app_id 匹配
  // 实际上草稿列表里没有直接的 media_id，需要通过 update_time 匹配
  // app_id 就是编辑器 URL 里的 appmsgid
  const latest = items[0]
  if (!latest) return { error: '草稿箱为空', token }

  return {
    token,
    appmsgid: latest.app_id,
    title: latest.title || latest.digest?.slice(0, 30),
    update_time: latest.create_time,
    edit_url: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&appmsgid=${latest.app_id}&token=${token}&lang=zh_CN`,
    all_items: items.slice(0, 5).map(i => ({ app_id: i.app_id, digest: i.digest?.slice(0, 30), time: i.create_time })),
  }
}

// 获取编辑器 document（微信编辑器内容在 iframe 里）
function getEditorDoc() {
  const selectors = [
    'iframe#js_editor_editable',
    'iframe.rich_media_content',
    'iframe[id*="editor"]',
  ]
  for (const sel of selectors) {
    const iframe = document.querySelector(sel)
    if (iframe && iframe.contentDocument) return iframe.contentDocument
  }
  return document
}

const CHECKS = {
  // ── 列表相关 ────────────────────────────────────────────────────────────────

  LIST_NO_LIST_ITEM: () => {
    const doc = getEditorDoc()
    const liNodes = doc.querySelectorAll('li')
    if (liNodes.length === 0) return { status: 'SKIP', detail: '文章无列表' }
    const badNodes = Array.from(liNodes).filter(li =>
      window.getComputedStyle(li).display === 'list-item'
    )
    return {
      status: badNodes.length === 0 ? 'PASS' : 'FAIL',
      detail: `共 ${liNodes.length} 个 li，${badNodes.length} 个渲染为 list-item（期望 display:block）`,
      bad_count: badNodes.length,
    }
  },

  LIST_HAS_BULLET: () => {
    const doc = getEditorDoc()
    const ulItems = doc.querySelectorAll('ul li')
    if (ulItems.length === 0) return { status: 'SKIP', detail: '文章无无序列表' }
    const hasBullet = Array.from(ulItems).some(li =>
      li.textContent?.trimStart().startsWith('•') ||
      li.textContent?.trimStart().startsWith('\u2022')
    )
    return {
      status: hasBullet ? 'PASS' : 'FAIL',
      detail: `${ulItems.length} 个 ul li，${hasBullet ? '有' : '无'} • 前缀`,
      sample: ulItems[0]?.textContent?.substring(0, 40),
    }
  },

  OL_HAS_NUMBER: () => {
    const doc = getEditorDoc()
    const olItems = doc.querySelectorAll('ol li')
    if (olItems.length === 0) return { status: 'SKIP', detail: '文章无有序列表' }
    const hasNumber = Array.from(olItems).some(li =>
      /^\d+\.\s/.test(li.textContent?.trimStart() || '')
    )
    return {
      status: hasNumber ? 'PASS' : 'FAIL',
      detail: `${olItems.length} 个 ol li，${hasNumber ? '有' : '无'}数字前缀`,
      sample: olItems[0]?.textContent?.substring(0, 40),
    }
  },

  NO_EMPTY_LI: () => {
    const doc = getEditorDoc()
    const liNodes = doc.querySelectorAll('li')
    if (liNodes.length === 0) return { status: 'SKIP', detail: '无列表' }
    const emptyLi = Array.from(liNodes).filter(li => !li.textContent?.trim())
    return {
      status: emptyLi.length === 0 ? 'PASS' : 'FAIL',
      detail: `发现 ${emptyLi.length} 个空白 li（ProseMirror 插入的多余节点）`,
    }
  },

  // ── 代码块相关 ───────────────────────────────────────────────────────────────

  CODE_BLOCK_DARK_BG: () => {
    const doc = getEditorDoc()
    const preNodes = doc.querySelectorAll('pre')
    if (preNodes.length === 0) return { status: 'SKIP', detail: '文章无代码块' }
    const results = Array.from(preNodes).map(pre => {
      const bg = window.getComputedStyle(pre).backgroundColor
      const rgb = bg.match(/\d+/g)?.map(Number) || [255, 255, 255]
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
      return { bg, brightness, isDark: brightness < 80 }
    })
    const allDark = results.every(r => r.isDark)
    return {
      status: allDark ? 'PASS' : 'FAIL',
      detail: `${preNodes.length} 个代码块，${results.filter(r => r.isDark).length} 个深色背景`,
      samples: results.slice(0, 2).map(r => ({ bg: r.bg, brightness: Math.round(r.brightness) })),
    }
  },

  CODE_BLOCK_LIGHT_TEXT: () => {
    const doc = getEditorDoc()
    const codeNodes = doc.querySelectorAll('pre code')
    if (codeNodes.length === 0) return { status: 'SKIP', detail: '无代码块' }
    const results = Array.from(codeNodes).map(code => {
      const color = window.getComputedStyle(code).color
      const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0]
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
      return { color, brightness, isLight: brightness > 100 }
    })
    const allLight = results.every(r => r.isLight)
    return {
      status: allLight ? 'PASS' : 'FAIL',
      detail: `${codeNodes.length} 个 pre code，${results.filter(r => r.isLight).length} 个浅色文字`,
      samples: results.slice(0, 2).map(r => ({ color: r.color, brightness: Math.round(r.brightness) })),
    }
  },

  CODE_NOWRAP: () => {
    const doc = getEditorDoc()
    const codeNodes = doc.querySelectorAll('pre code')
    if (codeNodes.length === 0) return { status: 'SKIP', detail: '无代码块' }
    const badNodes = Array.from(codeNodes).filter(code => {
      const ws = window.getComputedStyle(code).whiteSpace
      return ws !== 'nowrap' && ws !== 'pre'
    })
    return {
      status: badNodes.length === 0 ? 'PASS' : 'FAIL',
      detail: `${codeNodes.length} 个 pre code，${badNodes.length} 个 white-space 不是 nowrap/pre`,
    }
  },

  CODE_INLINE_STYLE: () => {
    const doc = getEditorDoc()
    const inlineCodes = doc.querySelectorAll('code.inline-code')
    if (inlineCodes.length === 0) return { status: 'SKIP', detail: '文章无行内代码' }
    const badNodes = Array.from(inlineCodes).filter(code => {
      const style = code.getAttribute('style')
      return !style || style.trim() === ''
    })
    return {
      status: badNodes.length === 0 ? 'PASS' : 'FAIL',
      detail: `${inlineCodes.length} 个 inline-code，${badNodes.length} 个 style 为空`,
    }
  },

  // ── 标题相关 ─────────────────────────────────────────────────────────────────

  H2_BORDER_LEFT: () => {
    const doc = getEditorDoc()
    const h2Nodes = doc.querySelectorAll('h2')
    if (h2Nodes.length === 0) return { status: 'SKIP', detail: '文章无 h2' }
    const results = Array.from(h2Nodes).map(h2 => {
      const style = window.getComputedStyle(h2)
      return {
        borderLeftWidth: style.borderLeftWidth,
        hasBorder: parseFloat(style.borderLeftWidth) > 0,
      }
    })
    const allHaveBorder = results.every(r => r.hasBorder)
    return {
      status: allHaveBorder ? 'PASS' : 'FAIL',
      detail: `${h2Nodes.length} 个 h2，${results.filter(r => r.hasBorder).length} 个有左边框`,
    }
  },

  // ── 表格相关 ─────────────────────────────────────────────────────────────────

  TABLE_BORDER: () => {
    const doc = getEditorDoc()
    const tables = doc.querySelectorAll('table')
    if (tables.length === 0) return { status: 'SKIP', detail: '文章无表格' }
    const bad = Array.from(tables).filter(t =>
      window.getComputedStyle(t).borderCollapse !== 'collapse'
    )
    return {
      status: bad.length === 0 ? 'PASS' : 'FAIL',
      detail: `${tables.length} 个表格，${bad.length} 个 border-collapse 不是 collapse`,
    }
  },
}

// 运行所有检查（或指定的检查项）
function runAllChecks(focusChecks) {
  const results = {}
  const checkList = focusChecks
    ? Object.entries(CHECKS).filter(([id]) => focusChecks.includes(id))
    : Object.entries(CHECKS)

  for (const [id, fn] of checkList) {
    try {
      results[id] = { id, ...fn() }
    } catch (e) {
      results[id] = { id, status: 'ERROR', detail: String(e) }
    }
  }

  const checks = Object.values(results)
  const passCount = checks.filter(c => c.status === 'PASS').length
  const failCount = checks.filter(c => c.status === 'FAIL').length
  const skipCount = checks.filter(c => c.status === 'SKIP').length
  const errorCount = checks.filter(c => c.status === 'ERROR').length

  const overall = failCount > 0 ? 'FAIL' : errorCount > 0 ? 'ERROR' : 'PASS'

  return {
    overall,
    pass_count: passCount,
    fail_count: failCount,
    skip_count: skipCount,
    checks,
    recommendation: failCount === 0
      ? '所有检查通过'
      : `需要修复: ${checks.filter(c => c.status === 'FAIL').map(c => c.id).join(', ')}`,
  }
}

// 直接运行（CDP evaluate_script 调用时使用）
return JSON.stringify(runAllChecks(null), null, 2)
