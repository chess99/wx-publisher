import type { AdvancedModule } from "./parser.js"

export interface AdvancedImages {
  externalImages: string[]
  localImages: string[]
}

const IMAGE_FIELD_NAMES = new Set([
  "image",
  "left_image",
  "right_image",
  "cover",
  "avatar",
])

export function collectAdvancedModuleImages(modules: AdvancedModule[]): AdvancedImages {
  const external = new Set<string>()
  const local = new Set<string>()

  for (const module of modules) {
    for (const [key, value] of Object.entries(module.fields)) {
      if (IMAGE_FIELD_NAMES.has(key) || key.endsWith("_image")) {
        addImage(value, external, local)
      }
    }

    for (const row of module.rows) {
      for (const cell of row) addImageFromText(cell, external, local)
    }

    addImageFromText(module.body, external, local)
  }

  return {
    externalImages: [...external],
    localImages: [...local],
  }
}

function addImageFromText(text: string, external: Set<string>, local: Set<string>): void {
  for (const match of text.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    addImage(match[1], external, local)
  }
}

function addImage(value: string, external: Set<string>, local: Set<string>): void {
  const url = value.trim()
  if (!url) return
  if (/^https?:\/\//.test(url)) {
    external.add(url)
  } else if (!url.startsWith("data:") && !url.startsWith("blob:") && !url.startsWith("//")) {
    local.add(url)
  }
}
