# TODOS

## 待办事项

### wxp themes 输出加入 sample_html 字段

**What:** 在 `wxp themes` 和 `wxp capabilities` 的 JSON 输出里，为每个主题加入 `sample_html` 字段——对一段标准 Markdown 片段（含 h1/h2/代码块/列表）调用 `convertMarkdown()` 后的 HTML 片段。

**Why:** 当前 AI Agent 选择主题时只能依赖文字描述（"蓝色强调，深色代码块"），无法感知实际渲染风格。加入 `sample_html` 后，Agent 可以通过读取实际 HTML 来判断主题是否适合当前文章风格。

**Pros:**
- Agent 选主题更准确，减少"先发布再调整"的循环
- 不需要 Agent 运行 `wxp preview`（无头环境友好）

**Cons:**
- `wxp themes` 和 `wxp capabilities` 输出体积增大（每个主题约 2-5KB 的 HTML）
- 需要维护一个标准 sample Markdown 片段

**Context:** 在 `plan-eng-review` 架构评审中作为可选优化项提出。当前 `wxp themes` 输出只有 `name` 和 `description` 两个字段。实现时在 `src/cli/index.ts` 的 `themes` action 里，对每个主题调用 `convertMarkdown(SAMPLE_MD, {theme})` 并附加到输出。

**Depends on:** `wxp preview` 功能完成后（两者都依赖 `convertMarkdown()`，确认接口稳定后再改）

---
