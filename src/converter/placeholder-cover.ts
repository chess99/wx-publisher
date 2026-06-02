import { deflateSync } from "node:zlib"

/**
 * 内置封面图占位图
 * 900×383 PNG，当用户未提供封面图时使用
 */
export const PLACEHOLDER_COVER_FILENAME = "wx-publisher-placeholder-cover.png"

let placeholderCoverBase64: string | undefined

export function getPlaceholderCoverBase64(): string {
  placeholderCoverBase64 ??= createPlaceholderCoverBase64()
  return placeholderCoverBase64
}

function createPlaceholderCoverBase64(): string {
  const width = 900
  const height = 383
  const raw = Buffer.alloc((width * 3 + 1) * height)
  let offset = 0

  for (let y = 0; y < height; y++) {
    raw[offset++] = 0
    for (let x = 0; x < width; x++) {
      const t = x / (width - 1)
      const v = y / (height - 1)
      raw[offset++] = Math.round(248 - 12 * t - 5 * v)
      raw[offset++] = Math.round(252 - 10 * t - 6 * v)
      raw[offset++] = Math.round(249 - 13 * t - 8 * v)
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]).toString("base64")
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii")
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value
  for (let bit = 0; bit < 8; bit++) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }
  return crc >>> 0
})
