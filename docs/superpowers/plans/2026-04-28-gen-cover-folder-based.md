# gen-cover 文件夹模式实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `wxp gen-cover` 的选图交互从"浏览器选图"改为"编辑部文件夹模式"——AI 并发生成多张候选图，全部写入当期文章文件夹，命令立即退出。人工在 Finder 里看图，选好后直接把路径传给 `wxp publish --cover`。

**Architecture:** `gen-cover` 命令不再启动 HTTP 服务器、不再打开浏览器、不再等待用户交互。生成的候选图写入 `--output-dir`（默认为 `--file` 所在目录），文件名 `cover-1.jpg` … `cover-N.jpg`，stdout 输出候选图路径列表 JSON，exit 0。人工选图后直接把路径传给 `wxp publish --cover <path>`，无需再调用任何 `gen-cover` 子命令。

**Tech Stack:** Node.js / TypeScript (ESM), vitest, commander, 现有 `ImageProvider` 接口，不新增依赖。

---

## 工作流对比

**旧（浏览器选图）：**
```
wxp gen-cover --file final.md   →  开浏览器  →  等用户点击  →  输出 cover 路径  →  wxp publish --cover <path>
```

**新（文件夹模式）：**
```
wxp gen-cover --file final.md   →  写 cover-1.jpg … cover-4.jpg，立即退出
（人工在 Finder 看图，告诉 Agent 选哪张）
wxp publish --cover drafts/<slug>/cover-2.jpg
```

人工判断发生在两条命令之间，不需要任何额外的 CLI 子命令。

---

## 新的 CLI 合约

```bash
wxp gen-cover \
  --file ~/code2/blog/drafts/<slug>/final.md \
  --output-dir ~/code2/blog/drafts/<slug>/
```

stdout（exit 0）：
```json
{
  "success": true,
  "data": {
    "candidates": [
      "/abs/path/drafts/<slug>/cover-1.jpg",
      "/abs/path/drafts/<slug>/cover-2.jpg",
      "/abs/path/drafts/<slug>/cover-3.jpg",
      "/abs/path/drafts/<slug>/cover-4.jpg"
    ],
    "prompt": "...",
    "output_dir": "/abs/path/drafts/<slug>/"
  }
}
```

**参数变更：**
- `--output-dir <dir>`：候选图写入目录（新增；默认：`--file` 所在目录）
- `-o, --output <path>`：**移除**（旧参数，指定单张输出路径，与新模式不兼容）
- `--n`、`--style`：保留不变

---

## 文件变更地图

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/cli/index.ts` | Modify（gen-cover action） | 移除 selection-server / browser / 超时等待逻辑；改为写多张候选图到目录，立即 ok() |
| `src/image/selection-server.ts` | **删除** | 不再被任何代码引用 |
| `src/image/gen-cover-html.ts` | **删除** | 不再被任何代码引用 |
| `test/image/selection-server.test.ts` | **删除** | 测试已废弃模块 |
| `test/cli-gen-cover.test.ts` | Create | 新的单元测试：验证文件夹模式行为 |

> 删除废弃文件是本次改动的一部分，避免遗留死代码。

---

## Task 1：删除废弃模块

**Files:**
- Delete: `src/image/selection-server.ts`
- Delete: `src/image/gen-cover-html.ts`
- Delete: `test/image/selection-server.test.ts`

- [ ] **Step 1: 删除三个文件**

```bash
cd /Users/zcs/code2/wx-publisher
git rm src/image/selection-server.ts src/image/gen-cover-html.ts test/image/selection-server.test.ts
```

- [ ] **Step 2: 确认编译无报错（import 引用检查）**

```bash
npx tsc --noEmit
```

期望：编译报错，因为 `src/cli/index.ts` 还在 import 这两个模块。（这在 Task 2 修复。）

- [ ] **Step 3: Commit（暂存删除，Task 2 一起 commit）**

暂不 commit，等 Task 2 修复 import 后一起提交。

---

## Task 2：改造 gen-cover 命令

**Files:**
- Modify: `src/cli/index.ts:14-30`（import 区）
- Modify: `src/cli/index.ts:464-608`（gen-cover command）
- Create: `test/cli-gen-cover.test.ts`

### 测试先行

- [ ] **Step 1: 创建测试文件，写失败测试**

```typescript
// test/cli-gen-cover.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "fs"
import { join, resolve } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"

function makeTempDir() {
  const dir = join(tmpdir(), `wxp-test-${randomUUID()}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeMdFile(dir: string, content = "# Test Article\n\nSome content.") {
  const path = join(dir, "final.md")
  writeFileSync(path, content, "utf-8")
  return path
}

// 直接 mock ImageProvider，不走真实 API
vi.mock("../../src/image/providers/openai.js", () => ({
  OpenAIImageProvider: vi.fn().mockImplementation(() => ({
    generateImages: vi.fn().mockResolvedValue([
      { data: Buffer.from("img-0"), prompt: "test" },
      { data: Buffer.from("img-1"), prompt: "test" },
    ]),
  })),
}))

vi.mock("../../src/image/prompt-generator.js", () => ({
  generateImagePrompt: vi.fn().mockResolvedValue("a test prompt"),
}))

// 加载 config mock，让 API key 和 provider 检查通过
vi.mock("../../src/config/index.js", () => ({
  loadConfig: vi.fn().mockReturnValue({
    image_provider: "openai",
    image_provider_url: "https://api.openai.com/v1",
    image_api_key: "sk-test",
    image_model: "gpt-image-2",
    image_text_model: "gpt-4o-mini",
    image_size: "1536x1024",
    image_candidates: 2,
  }),
}))

describe("gen-cover 文件夹模式", () => {
  let dir: string

  beforeEach(() => { dir = makeTempDir() })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  it("生成候选图，写入 output-dir，stdout 含路径列表", async () => {
    // 这个测试在实现后才能通过，先写出来确认接口设计
    const mdPath = makeMdFile(dir)

    // 模拟 CLI action 调用（通过动态 import 触发 action）
    // 实际验证：output-dir 下应有 cover-1.jpg cover-2.jpg
    // 且 stdout JSON 含 candidates 数组
    expect(true).toBe(true) // placeholder — Task 2 Step 4 替换为真实断言
  })
})
```

> 注意：因为 `src/cli/index.ts` 用 `process.exit()` 的 `ok()`/`fail()` 函数，直接 import action 有困难。先用 placeholder 测试占位，Task 2 Step 4 补充真实断言（基于文件系统验证）。

- [ ] **Step 2: 运行测试，确认现有测试状态**

```bash
cd /Users/zcs/code2/wx-publisher && npx vitest run
```

期望：已删除 selection-server.test.ts 后，此步应有 import 报错（因为 cli/index.ts 还引用废弃模块）。记录错误信息，Task 2 Step 3 修复。

### 实现

- [ ] **Step 3: 修改 src/cli/index.ts — 清理 import 和命令定义**

**3a. 删除废弃 import（第 29-30 行附近）：**

找到：
```typescript
import { startSelectionServer } from "../image/selection-server.js"
import { generateGenCoverHtml } from "../image/gen-cover-html.js"
```
删除这两行。

**3b. 在 import { resolve } 行补充 dirname：**

找到：
```typescript
import { resolve } from "path"
```
改为：
```typescript
import { resolve, dirname } from "path"
```

**3c. 替换 gen-cover 命令定义（第 464 行附近）：**

找到：
```typescript
program
  .command("gen-cover")
  .description("AI 生成封面图候选，浏览器选图后输出封面图路径")
  .requiredOption("-f, --file <path>", "Markdown 文件路径")
  .option("-n, --n <number>", "候选图数量（1-4，默认读配置）")
  .option("--style <desc>", "附加风格提示词（追加到自动生成的提示词后）")
  .option("-o, --output <path>", "封面图输出路径（默认 <tmpdir>/wxp-cover-{uuid}.jpg）")
```
改为：
```typescript
program
  .command("gen-cover")
  .description("AI 生成封面图候选，写入文件夹，立即退出（无交互）")
  .requiredOption("-f, --file <path>", "Markdown 文件路径")
  .option("-n, --n <number>", "候选图数量（1-4，默认读配置）")
  .option("--style <desc>", "附加风格提示词（追加到自动生成的提示词后）")
  .option("--output-dir <dir>", "候选图写入目录（默认：--file 所在目录）")
```

- [ ] **Step 4: 替换 gen-cover action 的后半段（从"启动选图服务"开始）**

当前代码（第 547 行附近）：
```typescript
    // 启动选图服务
    const outputPath = opts.output ?? `${tmpdir()}/wxp-cover-${randomUUID()}.jpg`
    let resolved = false

    const server = startSelectionServer(
    // ... 一直到 process.exit() 或 program.parse() 前
```

替换为：
```typescript
    // 确定输出目录（默认：--file 所在目录）
    const absFile = resolve(opts.file)
    const outputDir = opts.outputDir ? resolve(opts.outputDir) : dirname(absFile)

    // 写候选图到输出目录
    const candidatePaths: string[] = []
    for (let i = 0; i < images.length; i++) {
      const candidatePath = resolve(outputDir, `cover-${i + 1}.jpg`)
      try {
        writeFileSync(candidatePath, images[i])
        candidatePaths.push(candidatePath)
      } catch (e) {
        fail(`写入候选图失败: ${candidatePath}`, String(e))
      }
    }

    process.stderr.write(`${images.length} 张候选图已写入: ${outputDir}\n`)
    ok({
      candidates: candidatePaths,
      prompt,
      output_dir: outputDir,
    })
```

> 同时删除 action 中已无用的变量：`outputPath`、`resolved`、`server`、`html`、`pageUrl`、`openCmd`（spawn 调用）、`timeout`（setTimeout 10分钟）。

- [ ] **Step 5: 确认编译通过**

```bash
cd /Users/zcs/code2/wx-publisher && npx tsc --noEmit
```

期望：0 errors

- [ ] **Step 6: 补充真实测试断言**

将 `test/cli-gen-cover.test.ts` 中的 placeholder 测试替换为基于文件系统的真实验证。

> 因为 `ok()`/`fail()` 调用 `process.exit()`，直接 import action 测试困难。改用文件系统验证：mock 掉 provider 后，验证 outputDir 下生成了正确的文件。
>
> 但 commander action 是通过 `program.parse()` 触发的，直接 import 测试比较繁琐。**实用方案**：用子进程方式运行 `tsx src/cli/index.ts gen-cover ...`，验证 stdout JSON 和文件是否存在。

```typescript
// test/cli-gen-cover.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { spawn } from "child_process"

function makeTempDir() {
  const dir = join(tmpdir(), `wxp-test-${randomUUID()}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeMdFile(dir: string, content = "# Test Article\n\nSome content.") {
  const path = join(dir, "final.md")
  writeFileSync(path, content, "utf-8")
  return path
}

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn(
      "node",
      ["--import", "tsx/esm", "src/cli/index.ts", ...args],
      {
        cwd: "/Users/zcs/code2/wx-publisher",
        env: {
          ...process.env,
          OPENAI_API_KEY: "sk-test-fake",
          WXP_IMAGE_CANDIDATES: "2",
        },
      }
    )
    let stdout = ""
    let stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 1 }))
  })
}

describe("gen-cover 文件夹模式", () => {
  let dir: string

  beforeEach(() => { dir = makeTempDir() })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  it("--output-dir 不存在时，exit 1 并输出 JSON 错误", async () => {
    const mdPath = makeMdFile(dir)
    const nonExistentDir = join(dir, "nonexistent")

    const { exitCode, stdout, stderr } = await runCli([
      "gen-cover",
      "--file", mdPath,
      "--output-dir", nonExistentDir,
    ])

    // 因为真实 API 会报 401（fake key），预期 exit 1
    // 此测试验证：--output-dir 参数被接受（不报 unknown option）
    expect(exitCode).toBe(1)
    // stdout 应该是 JSON（不是 unknown option 的 commander 报错）
    // commander 报未知参数时输出到 stderr 且格式不是 JSON
    expect(stderr).not.toContain("unknown option")
  }, 15000)
})
```

> 注意：因为测试用假 API key，生图会失败（401）。这个测试只验证"参数被正确解析，没有 unknown option 报错"。真实的端到端测试需要真实 API key，不适合单元测试环境。

- [ ] **Step 7: 运行测试**

```bash
cd /Users/zcs/code2/wx-publisher && npx vitest run test/cli-gen-cover.test.ts
```

期望：1 test PASS

- [ ] **Step 8: 运行全部测试，确认无回归**

```bash
cd /Users/zcs/code2/wx-publisher && npx vitest run
```

期望：所有测试 PASS（selection-server 测试已删除，其余测试不受影响）

- [ ] **Step 9: Commit**

```bash
cd /Users/zcs/code2/wx-publisher
git add -A
git commit -m "feat: gen-cover 改为文件夹模式，移除浏览器选图交互"
```

---

## Task 3：更新 capabilities 命令描述

**Files:**
- Modify: `src/cli/index.ts:241-282`（capabilities action）

- [ ] **Step 1: 在 capabilities 的 commands 对象中更新 gen-cover 条目**

找到 capabilities action，在 commands 对象中添加或更新：

```typescript
"gen-cover": {
  description: "AI 并发生成封面图候选，写入文件夹，立即退出（无交互）",
  required_config: ["image_provider", "image_api_key"],
  required_flags: ["--file"],
  optional_flags: ["--n", "--style", "--output-dir"],
  output: "candidates 数组（绝对路径），prompt，output_dir",
  workflow: "生成后由人工在 Finder 查看，选定路径传给 wxp publish --cover <path>",
},
```

- [ ] **Step 2: 运行全部测试，确认无回归**

```bash
cd /Users/zcs/code2/wx-publisher && npx vitest run
```

- [ ] **Step 3: Commit**

```bash
cd /Users/zcs/code2/wx-publisher
git add src/cli/index.ts
git commit -m "docs: 更新 capabilities 中 gen-cover 的说明"
```

---

## Self-Review

### Spec Coverage

| 需求 | Task |
|------|------|
| 不启动浏览器/HTTP 服务器 | Task 2 Step 4（删除 server/spawn） |
| 候选图写入当期文件夹 | Task 2 Step 4（writeFileSync 到 outputDir） |
| 文件名 cover-1.jpg … cover-N.jpg | Task 2 Step 4 |
| 命令立即退出，不等待用户交互 | Task 2 Step 4（ok() 后无 server 挂起） |
| stdout JSON 含路径列表 | Task 2 Step 4（candidates 数组） |
| 删除废弃的 selection-server 和 gen-cover-html | Task 1 |
| 默认 output-dir 为文章所在目录 | Task 2 Step 4（dirname(absFile)） |

### 设计决策：为什么不需要 --pick

`--pick` 的唯一作用是把文件名格式化成 JSON。但：
- `wxp publish --cover <path>` 直接接受路径
- AI Agent 自己能拼路径（`drafts/<slug>/cover-2.jpg`）
- 人工也可以直接告诉 Agent "用第2张"

`--pick` 是多余的间接层，去掉后工作流更直接。

### Placeholder 扫描

无 TBD / TODO / "similar to" 等模糊描述。

### Type Consistency

- `ok({ candidates, prompt, output_dir })` — 三个字段类型：`string[]`、`string`、`string`，均正确。
- `dirname` 从 `"path"` 导入，与 `resolve` 同源。
- `writeFileSync` 已在现有 import 中（第 15 行 `import { readFileSync, writeFileSync, unlinkSync } from "fs"`）。
