# Theme Palette Reference

This file documents the 48 runtime themes exposed by `wxp themes`. Runtime support comes from `src/converter/themes.ts`; `docs/theme-palette-reference.json` is the canonical machine-readable reference for AI and script callers.

## Sources

- Theme IDs and public selection surface: https://www.md2wechat.com/themes
- Rendered gallery and detail-page palette samples: https://www.md2wechat.cn/theme-gallery
- Last local extraction: 2026-06-03

`accent` is the gallery card/source color. `renderAccent`, `accentSoft`, `accentSofter`, `border`, `headingText`, and `text` are sampled from each theme detail page rendered article preview. Keep both layers: the source color is not always the same as the rendered module accent.

## Usage

- Use the theme IDs directly with `--theme`.
- Use `wxp themes` when an AI caller needs machine-readable selection metadata: collection, best fit, density, contrast, and accent color.
- Use `docs/theme-palette-reference.json` when an AI caller needs source URLs, rendered accents, soft fills, borders, and text colors.
- When editing the catalog, update `src/converter/themes.ts`, this document, `docs/theme-palette-reference.json`, and the theme tests together.

## Groups

| Group | Count | Purpose |
| --- | ---: | --- |
| `native` | 6 | Broad default directions for common content types. |
| `classic` | 2 | Conservative editorial directions for familiar, serious reading. |
| `modern` | 4 | Product, developer, media, and lifestyle directions. |
| `extra` | 4 | Stronger expressive directions for distinct columns or campaigns. |
| `minimal` | 8 | Low-friction template palette family. |
| `focus` | 8 | Centered, rhythm-first template palette family. |
| `elegant` | 8 | Layered editorial template palette family. |
| `bold` | 8 | High-impact template palette family. |

## Native Palettes

| ID | Display | Accent | Render Accent | Text | Notes |
| --- | --- | --- | --- | --- | --- |
| `default` | 默认主题 | `#a34e2e` | `#b3593b` | `#222222` | 默认主题 适合运营、知识内容，气质偏熟悉、微信原生。 |
| `bytedance` | 字节范 | `#1677ff` | `#1571f1` | `#4e5969` | 字节范 适合产品、品牌内容，气质偏科技、效率。 |
| `apple` | 苹果范 | `#007aff` | `#0072ef` | `#333333` | 苹果范 适合品牌、产品内容，气质偏精致、未来感。 |
| `sports` | 运动风 | `#00a968` | `#05875f` | `#2c2c2c` | 运动风 适合运营、专题内容，气质偏动感、活力。 |
| `chinese` | 中国风 | `#8b1e22` | `#8b1e22` | `#333333` | 中国风 适合专题、品牌内容，气质偏古典、文化。 |
| `cyber` | 赛博朋克 | `#f472b6` | `#8659ed` | `#333333` | 赛博朋克 适合专题、产品内容，气质偏赛博、实验性。 |

## Classic Palettes

| ID | Display | Accent | Render Accent | Text | Notes |
| --- | --- | --- | --- | --- | --- |
| `wechat-native` | 微信公众号原生 | `#07c160` | `#058844` | `#333333` | 微信公众号原生 适合运营、知识内容，气质偏熟悉、稳妥。 |
| `nyt-classic` | NYT | `#326891` | `#326891` | `#000000` | NYT 适合知识、专题内容，气质偏报刊、严肃。 |

## Modern Palettes

| ID | Display | Accent | Render Accent | Text | Notes |
| --- | --- | --- | --- | --- | --- |
| `github-readme` | GitHub | `#0969da` | `#0969da` | `#1f2328` | GitHub 适合产品、知识内容，气质偏技术、结构化。 |
| `sspai-red` | 少数派 | `#d71a1b` | `#d71a1b` | `#333333` | 少数派 适合产品、品牌内容，气质偏媒体感、中文科技。 |
| `mint-fresh` | 薄荷 | `#1a7a5a` | `#1a7a5a` | `#2d4a3e` | 薄荷 适合品牌、运营内容，气质偏清新、生活方式。 |
| `sunset-amber` | 日落 | `#c0582a` | `#b85428` | `#3d2c1e` | 日落 适合专题、品牌内容，气质偏叙事、温暖。 |

## Extra Palettes

| ID | Display | Accent | Render Accent | Text | Notes |
| --- | --- | --- | --- | --- | --- |
| `ink-minimal` | 水墨 | `#111111` | `#111111` | `#111111` | 水墨 适合知识、专题内容，气质偏黑白、克制。 |
| `lavender-dream` | 薰衣草 | `#6b4c9a` | `#6b4c9a` | `#3d3155` | 薰衣草 适合品牌、专题内容，气质偏柔和、浪漫。 |
| `coffee-house` | 咖啡 | `#6d4c41` | `#6d4c41` | `#3e2723` | 咖啡 适合专题、品牌内容，气质偏温暖、人文。 |
| `bauhaus-primary` | Bauhaus | `#004d9f` | `#004d9f` | `#1a1a1a` | Bauhaus 适合专题、品牌、产品内容，气质偏现代主义、实验。 |

## Minimal Matrix

| ID | Display | Accent | Render Accent | Text | Notes |
| --- | --- | --- | --- | --- | --- |
| `minimal-gold` | 简约 · 古铜金 | `#c8a062` | `#8f7246` | `#2c2c2c` | 简约 · 古铜金 适合知识、运营内容，气质偏克制、整洁、温润、沉稳。 |
| `minimal-green` | 简约 · 翡翠绿 | `#2bae85` | `#218666` | `#2c2c2c` | 简约 · 翡翠绿 适合知识、运营内容，气质偏克制、整洁、清新、自然。 |
| `minimal-blue` | 简约 · 宝石蓝 | `#4b6ef5` | `#496bef` | `#2c2c2c` | 简约 · 宝石蓝 适合知识、运营内容，气质偏克制、整洁、专业、科技。 |
| `minimal-orange` | 简约 · 暖阳橙 | `#f89a3a` | `#a76827` | `#2c2c2c` | 简约 · 暖阳橙 适合知识、运营内容，气质偏克制、整洁、明快、亲和。 |
| `minimal-red` | 简约 · 中国红 | `#f25c54` | `#ca4d46` | `#2c2c2c` | 简约 · 中国红 适合知识、运营内容，气质偏克制、整洁、强调、传播。 |
| `minimal-navy` | 简约 · 深海蓝 | `#1f4f8a` | `#1f4f8a` | `#2c2c2c` | 简约 · 深海蓝 适合知识、运营内容，气质偏克制、整洁、可信、理性。 |
| `minimal-gray` | 简约 · 石墨灰 | `#4e5969` | `#4e5969` | `#2c2c2c` | 简约 · 石墨灰 适合知识、运营内容，气质偏克制、整洁、中性。 |
| `minimal-sky` | 简约 · 天空蓝 | `#3a7fd5` | `#3777c8` | `#2c2c2c` | 简约 · 天空蓝 适合知识、运营内容，气质偏克制、整洁、通透、轻盈。 |

## Focus Matrix

| ID | Display | Accent | Render Accent | Text | Notes |
| --- | --- | --- | --- | --- | --- |
| `focus-gold` | 聚焦 · 古铜金 | `#c8a062` | `#8f7246` | `#2c2c2c` | 聚焦 · 古铜金 适合知识、品牌内容，气质偏聚焦、秩序、温润、沉稳。 |
| `focus-green` | 聚焦 · 翡翠绿 | `#2bae85` | `#218666` | `#2c2c2c` | 聚焦 · 翡翠绿 适合知识、品牌内容，气质偏聚焦、秩序、清新、自然。 |
| `focus-blue` | 聚焦 · 宝石蓝 | `#4b6ef5` | `#496bef` | `#2c2c2c` | 聚焦 · 宝石蓝 适合知识、品牌内容，气质偏聚焦、秩序、专业、科技。 |
| `focus-orange` | 聚焦 · 暖阳橙 | `#f89a3a` | `#a76827` | `#2c2c2c` | 聚焦 · 暖阳橙 适合知识、品牌内容，气质偏聚焦、秩序、明快、亲和。 |
| `focus-red` | 聚焦 · 中国红 | `#f25c54` | `#ca4d46` | `#2c2c2c` | 聚焦 · 中国红 适合知识、品牌内容，气质偏聚焦、秩序、强调、传播。 |
| `focus-navy` | 聚焦 · 深海蓝 | `#1f4f8a` | `#1f4f8a` | `#2c2c2c` | 聚焦 · 深海蓝 适合知识、品牌内容，气质偏聚焦、秩序、可信、理性。 |
| `focus-gray` | 聚焦 · 石墨灰 | `#4e5969` | `#4e5969` | `#2c2c2c` | 聚焦 · 石墨灰 适合知识、品牌内容，气质偏聚焦、秩序、克制、中性。 |
| `focus-sky` | 聚焦 · 天空蓝 | `#3a7fd5` | `#3777c8` | `#2c2c2c` | 聚焦 · 天空蓝 适合知识、品牌内容，气质偏聚焦、秩序、通透、轻盈。 |

## Elegant Matrix

| ID | Display | Accent | Render Accent | Text | Notes |
| --- | --- | --- | --- | --- | --- |
| `elegant-gold` | 精致 · 古铜金 | `#c8a062` | `#8f7246` | `#2c2c2c` | 精致 · 古铜金 适合品牌、运营内容，气质偏精致、雅致、温润、沉稳。 |
| `elegant-green` | 精致 · 翡翠绿 | `#2bae85` | `#218666` | `#2c2c2c` | 精致 · 翡翠绿 适合品牌、运营内容，气质偏精致、雅致、清新、自然。 |
| `elegant-blue` | 精致 · 宝石蓝 | `#4b6ef5` | `#496bef` | `#2c2c2c` | 精致 · 宝石蓝 适合品牌、运营内容，气质偏精致、雅致、专业、科技。 |
| `elegant-orange` | 精致 · 暖阳橙 | `#f89a3a` | `#a76827` | `#2c2c2c` | 精致 · 暖阳橙 适合品牌、运营内容，气质偏精致、雅致、明快、亲和。 |
| `elegant-red` | 精致 · 中国红 | `#f25c54` | `#ca4d46` | `#2c2c2c` | 精致 · 中国红 适合品牌、运营内容，气质偏精致、雅致、强调、传播。 |
| `elegant-navy` | 精致 · 深海蓝 | `#1f4f8a` | `#1f4f8a` | `#2c2c2c` | 精致 · 深海蓝 适合品牌、运营内容，气质偏精致、雅致、可信、理性。 |
| `elegant-gray` | 精致 · 石墨灰 | `#4e5969` | `#4e5969` | `#2c2c2c` | 精致 · 石墨灰 适合品牌、运营内容，气质偏精致、雅致、克制、中性。 |
| `elegant-sky` | 精致 · 天空蓝 | `#3a7fd5` | `#3777c8` | `#2c2c2c` | 精致 · 天空蓝 适合品牌、运营内容，气质偏精致、雅致、通透、轻盈。 |

## Bold Matrix

| ID | Display | Accent | Render Accent | Text | Notes |
| --- | --- | --- | --- | --- | --- |
| `bold-gold` | 醒目 · 古铜金 | `#c8a062` | `#8f7246` | `#2c2c2c` | 醒目 · 古铜金 适合专题、品牌、运营内容，气质偏醒目、宣传、温润、沉稳。 |
| `bold-green` | 醒目 · 翡翠绿 | `#2bae85` | `#218666` | `#2c2c2c` | 醒目 · 翡翠绿 适合专题、品牌、运营内容，气质偏醒目、宣传、清新、自然。 |
| `bold-blue` | 醒目 · 宝石蓝 | `#4b6ef5` | `#496bef` | `#2c2c2c` | 醒目 · 宝石蓝 适合专题、品牌、运营内容，气质偏醒目、宣传、专业、科技。 |
| `bold-orange` | 醒目 · 暖阳橙 | `#f89a3a` | `#a76827` | `#2c2c2c` | 醒目 · 暖阳橙 适合专题、品牌、运营内容，气质偏醒目、宣传、明快、亲和。 |
| `bold-red` | 醒目 · 中国红 | `#f25c54` | `#ca4d46` | `#2c2c2c` | 醒目 · 中国红 适合专题、品牌、运营内容，气质偏醒目、宣传、强调、传播。 |
| `bold-navy` | 醒目 · 深海蓝 | `#1f4f8a` | `#1f4f8a` | `#2c2c2c` | 醒目 · 深海蓝 适合专题、品牌、运营内容，气质偏醒目、宣传、可信、理性。 |
| `bold-gray` | 醒目 · 石墨灰 | `#4e5969` | `#4e5969` | `#2c2c2c` | 醒目 · 石墨灰 适合专题、品牌、运营内容，气质偏醒目、宣传、克制、中性。 |
| `bold-sky` | 醒目 · 天空蓝 | `#3a7fd5` | `#3777c8` | `#2c2c2c` | 醒目 · 天空蓝 适合专题、品牌、运营内容，气质偏醒目、宣传、通透、轻盈。 |

## Maintenance Checks

- Keep `docs/theme-palette-reference.json` at exactly 48 palettes unless the intended source set changes.
- Keep every palette ID unique and aligned with `src/converter/themes.ts`.
- Keep all palette color values in six-digit hex format.
- Revisit both source URLs when changing theme colors; do not infer palette values from theme names alone.
