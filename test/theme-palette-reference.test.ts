import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const palettePath = resolve(root, "docs/theme-palette-reference.json")

const namedPaletteIds = [
  "default",
  "bytedance",
  "apple",
  "sports",
  "chinese",
  "cyber",
  "wechat-native",
  "nyt-classic",
  "github-readme",
  "sspai-red",
  "mint-fresh",
  "sunset-amber",
  "ink-minimal",
  "lavender-dream",
  "coffee-house",
  "bauhaus-primary",
]

const matrixFamilies = ["minimal", "focus", "elegant", "bold"]
const matrixColors = ["gold", "green", "blue", "orange", "red", "navy", "gray", "sky"]

const expectedPaletteIds = [
  ...namedPaletteIds,
  ...matrixFamilies.flatMap(family => matrixColors.map(color => `${family}-${color}`)),
]

const colorFields = [
  "accent",
  "background",
  "surface",
  "text",
  "muted",
  "border",
  "codeBackground",
]

interface PaletteReference {
  version: number
  usage: string
  palettes: Array<Record<string, string>>
}

function readPaletteReference(): PaletteReference {
  return JSON.parse(readFileSync(palettePath, "utf8")) as PaletteReference
}

describe("theme palette reference", () => {
  it("keeps a local-only catalog of exactly 48 palettes", () => {
    const reference = readPaletteReference()

    expect(reference.version).toBe(1)
    expect(reference.usage).toBe("local-reference-only")
    expect(reference.palettes).toHaveLength(48)

    const actualIds = reference.palettes.map(palette => palette.id)
    expect(new Set(actualIds).size).toBe(actualIds.length)
    expect(actualIds).toEqual(expectedPaletteIds)
  })

  it("keeps every palette color in six-digit hex format", () => {
    const reference = readPaletteReference()

    for (const palette of reference.palettes) {
      for (const field of colorFields) {
        expect(palette[field], `${palette.id}.${field}`).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    }
  })

  it("keeps each template family complete", () => {
    const reference = readPaletteReference()
    const ids = new Set(reference.palettes.map(palette => palette.id))

    for (const family of matrixFamilies) {
      for (const color of matrixColors) {
        expect(ids.has(`${family}-${color}`)).toBe(true)
      }
    }
  })
})
