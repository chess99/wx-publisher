# 示例目录

`examples/` 存放可以直接运行的示例文章，用于人工预览和回归验收。实现说明放在 `docs/`，测试专用最小输入放在 `test/fixtures/`。

## 全特性示例

`advanced-layout-showcase.md` 是高级模块和 Markdown 能力的 canonical 示例，覆盖 43 个公开高级模块、3 个增强模块和常见 Markdown 语法。重大渲染、语法、主题、API 输出变更时，必须同步维护这个文件。

常用命令：

```bash
wxp convert --file examples/advanced-layout-showcase.md --theme studio --output /tmp/wxp-showcase.html
wxp preview --file examples/advanced-layout-showcase.md
wxp publish --file examples/advanced-layout-showcase.md --theme studio --title "wx-publisher 高级模块效果预览"
```

发布命令不传封面图时会使用内置占位封面，草稿 JSON 中会返回 `used_placeholder_cover: true`。
