# Theme Palette Reference

This file documents the 48 runtime themes exposed by `wxp themes`. Runtime support comes from `src/converter/themes.ts`; this document and `docs/theme-palette-reference.json` keep the same theme IDs, palette colors, and selection notes for AI and script callers.

The canonical data file is `docs/theme-palette-reference.json`.

## Usage

- Use the theme IDs directly with `--theme`.
- Use `wxp themes` when an AI caller needs machine-readable selection metadata: collection, best fit, density, contrast, and accent color.
- Keep palette IDs stable so notes, screenshots, and future experiments can refer to the same design direction.
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

| ID | Accent | Notes |
| --- | --- | --- |
| `default` | `#07c160` | Stable green baseline for operations and knowledge articles. |
| `bytedance` | `#1d4ed8` | Product-blue direction with efficient contrast. |
| `apple` | `#5b6ee1` | Polished indigo direction for brand and product writing. |
| `sports` | `#f97316` | Energetic orange direction for activity, event, and release content. |
| `chinese` | `#9a3412` | Warm traditional direction for culture and seasonal topics. |
| `cyber` | `#8b5cf6` | Experimental neon direction for visual and technology campaigns. |

## Classic Palettes

| ID | Accent | Notes |
| --- | --- | --- |
| `wechat-native` | `#07c160` | Conservative green direction for familiar public-account reading. |
| `nyt-classic` | `#111827` | Serious newsprint direction for reports, essays, and opinion pieces. |

## Modern Palettes

| ID | Accent | Notes |
| --- | --- | --- |
| `github-readme` | `#0969da` | Developer-blue direction for technical guides and API notes. |
| `sspai-red` | `#d71920` | Sharp media-red direction for product and creator content. |
| `mint-fresh` | `#10b981` | Soft mint direction for lifestyle and light operations content. |
| `sunset-amber` | `#d97706` | Warm amber direction for narrative and travel-style articles. |

## Extra Palettes

| ID | Accent | Notes |
| --- | --- | --- |
| `ink-minimal` | `#111827` | Black-and-white direction for text-heavy writing. |
| `lavender-dream` | `#8b5cf6` | Soft purple direction for brand, mood, and inspiration writing. |
| `coffee-house` | `#7c4a2d` | Warm brown direction for interviews and human-centered columns. |
| `bauhaus-primary` | `#e63946` | Graphic primary-color direction for campaigns and launches. |

## Template Palette Matrix

All template families use the same color keys:

| Color | Accent |
| --- | --- |
| `gold` | `#b8872f` |
| `green` | `#188a5b` |
| `blue` | `#2563eb` |
| `orange` | `#c86442` |
| `red` | `#d33f49` |
| `navy` | `#243b63` |
| `gray` | `#64748b` |
| `sky` | `#0ea5e9` |

### Minimal

Low-friction palettes for clean, repeatable output:

`minimal-gold`, `minimal-green`, `minimal-blue`, `minimal-orange`, `minimal-red`, `minimal-navy`, `minimal-gray`, `minimal-sky`.

### Focus

Centered palettes for rhythm-first reading:

`focus-gold`, `focus-green`, `focus-blue`, `focus-orange`, `focus-red`, `focus-navy`, `focus-gray`, `focus-sky`.

### Elegant

Layered editorial palettes for brand-led or aesthetic articles:

`elegant-gold`, `elegant-green`, `elegant-blue`, `elegant-orange`, `elegant-red`, `elegant-navy`, `elegant-gray`, `elegant-sky`.

### Bold

High-impact palettes for stronger visual emphasis:

`bold-gold`, `bold-green`, `bold-blue`, `bold-orange`, `bold-red`, `bold-navy`, `bold-gray`, `bold-sky`.

## Maintenance Checks

When editing this reference:

- Keep `docs/theme-palette-reference.json` at exactly 48 palettes unless the intended source set changes.
- Keep every palette ID unique.
- Keep all color values in six-digit hex format.
- Keep this reference focused on the 48 runtime themes and their selection notes.
