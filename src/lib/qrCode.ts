/**
 * Minimal QR Code encoder (ISO/IEC 18004) — byte mode, error correction level M, versions 1–40,
 * automatic mask choice. Used to render the ZATCA e-invoice QR (base64 TLV payload) without a
 * third-party dependency. Algorithm after Project Nayuki's reference implementation (MIT).
 *
 *   const qr = encodeQr('AQ1DQVNDTy…')   // { size, modules: boolean[][] }
 *   qrSvgPath(qr)                         // SVG path data of the dark modules (1 unit per module)
 */

export interface QrMatrix {
  size: number
  /** modules[y][x] — true = dark */
  modules: boolean[][]
}

// Error correction level M
const ECC_CODEWORDS_PER_BLOCK = [
  -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28,
]
const NUM_ERROR_CORRECTION_BLOCKS = [
  -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40,
  43, 45, 47, 49,
]
const FORMAT_BITS_M = 0

const getBit = (x: number, i: number) => ((x >>> i) & 1) !== 0

function numRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2
    result -= (25 * numAlign - 10) * numAlign - 55
    if (ver >= 7) result -= 36
  }
  return result
}

const numDataCodewords = (ver: number) =>
  Math.floor(numRawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[ver] * NUM_ERROR_CORRECTION_BLOCKS[ver]

// ── Reed–Solomon over GF(2^8), polynomial 0x11D ──────────────────────────────

function gfMultiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

function rsDivisor(degree: number): number[] {
  const result: number[] = new Array(degree - 1).fill(0)
  result.push(1)
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j], root)
      if (j + 1 < result.length) result[j] ^= result[j + 1]
    }
    root = gfMultiply(root, 0x02)
  }
  return result
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0)
  for (const b of data) {
    const factor = b ^ (result.shift() as number)
    result.push(0)
    divisor.forEach((coef, i) => {
      result[i] ^= gfMultiply(coef, factor)
    })
  }
  return result
}

function addEccAndInterleave(data: number[], ver: number): number[] {
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ver]
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ver]
  const rawCodewords = Math.floor(numRawDataModules(ver) / 8)
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks)
  const shortBlockLen = Math.floor(rawCodewords / numBlocks)
  const divisor = rsDivisor(blockEccLen)
  const blocks: number[][] = []
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1))
    k += dat.length
    const ecc = rsRemainder(dat, divisor)
    if (i < numShortBlocks) dat.push(0)
    blocks.push(dat.concat(ecc))
  }
  const result: number[] = []
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i])
    })
  }
  return result
}

// ── Matrix ───────────────────────────────────────────────────────────────────

class Builder {
  readonly version: number
  readonly size: number
  readonly modules: boolean[][]
  readonly isFunction: boolean[][]

  constructor(version: number) {
    this.version = version
    this.size = version * 4 + 17
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false))
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false))
  }

  set(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark
    this.isFunction[y][x] = true
  }

  alignmentPositions(): number[] {
    if (this.version === 1) return []
    const numAlign = Math.floor(this.version / 7) + 2
    const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2
    const result = [6]
    for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos)
    return result
  }

  drawFunctionPatterns() {
    for (let i = 0; i < this.size; i++) {
      this.set(6, i, i % 2 === 0)
      this.set(i, 6, i % 2 === 0)
    }
    this.drawFinder(3, 3)
    this.drawFinder(this.size - 4, 3)
    this.drawFinder(3, this.size - 4)
    const pos = this.alignmentPositions()
    const last = pos.length - 1
    pos.forEach((px, i) =>
      pos.forEach((py, j) => {
        if (!((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0))) this.drawAlignment(px, py)
      }),
    )
    this.drawFormatBits(0)
    this.drawVersion()
  }

  drawFinder(x: number, y: number) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        const xx = x + dx
        const yy = y + dy
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.set(xx, yy, dist !== 2 && dist !== 4)
      }
    }
  }

  drawAlignment(x: number, y: number) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }

  drawFormatBits(mask: number) {
    const data = (FORMAT_BITS_M << 3) | mask
    let rem = data
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const bits = ((data << 10) | rem) ^ 0x5412
    for (let i = 0; i <= 5; i++) this.set(8, i, getBit(bits, i))
    this.set(8, 7, getBit(bits, 6))
    this.set(8, 8, getBit(bits, 7))
    this.set(7, 8, getBit(bits, 8))
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, getBit(bits, i))
    for (let i = 0; i < 8; i++) this.set(this.size - 1 - i, 8, getBit(bits, i))
    for (let i = 8; i < 15; i++) this.set(8, this.size - 15 + i, getBit(bits, i))
    this.set(8, this.size - 8, true)
  }

  drawVersion() {
    if (this.version < 7) return
    let rem = this.version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (this.version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const bit = getBit(bits, i)
      const a = this.size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      this.set(a, b, bit)
      this.set(b, a, bit)
    }
  }

  drawCodewords(data: number[]) {
    let i = 0
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j
          const upward = ((right + 1) & 2) === 0
          const y = upward ? this.size - 1 - vert : vert
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7))
            i++
          }
        }
      }
    }
  }

  applyMask(mask: number) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break
          case 1: invert = y % 2 === 0; break
          case 2: invert = x % 3 === 0; break
          case 3: invert = (x + y) % 3 === 0; break
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break
          default: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
        }
        if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x]
      }
    }
  }

  /** Penalty rules N1 (runs), N2 (2×2 blocks), N3 (finder-like patterns), N4 (dark/light balance). */
  penalty(): number {
    const { size, modules } = this
    let result = 0

    const addHistory = (runLength: number, history: number[]) => {
      if (history[0] === 0) runLength += size // light border before the first run
      history.pop()
      history.unshift(runLength)
    }
    const countPatterns = (history: number[]) => {
      const n = history[1]
      const core = n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n
      return (core && history[0] >= n * 4 && history[6] >= n ? 1 : 0) + (core && history[6] >= n * 4 && history[0] >= n ? 1 : 0)
    }
    const scoreLine = (get: (i: number) => boolean) => {
      let score = 0
      let runColor = false
      let run = 0
      const history = [0, 0, 0, 0, 0, 0, 0]
      for (let i = 0; i < size; i++) {
        if (get(i) === runColor) {
          run++
          if (run === 5) score += 3
          else if (run > 5) score++
        } else {
          addHistory(run, history)
          if (!runColor) score += countPatterns(history) * 40
          runColor = get(i)
          run = 1
        }
      }
      if (runColor) {
        addHistory(run, history)
        run = 0
      }
      addHistory(run + size, history) // light border after the last run
      return score + countPatterns(history) * 40
    }

    for (let y = 0; y < size; y++) result += scoreLine((x) => modules[y][x])
    for (let x = 0; x < size; x++) result += scoreLine((y) => modules[y][x])
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x]
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) result += 3
      }
    }
    const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
    const total = size * size
    result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10
    return result
  }
}

/** Encode text (UTF-8, byte mode) into a QR matrix with error correction level M. */
export function encodeQr(text: string): QrMatrix {
  const bytes = Array.from(new TextEncoder().encode(text))
  let version = 1
  for (; version <= 40; version++) {
    const countBits = version <= 9 ? 8 : 16
    if (4 + countBits + bytes.length * 8 <= numDataCodewords(version) * 8) break
  }
  if (version > 40) throw new Error('Data too long for a QR code')

  const bits: number[] = []
  const append = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  append(0x4, 4)
  append(bytes.length, version <= 9 ? 8 : 16)
  bytes.forEach((b) => append(b, 8))
  const capacity = numDataCodewords(version) * 8
  append(0, Math.min(4, capacity - bits.length))
  append(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) append(pad, 8)

  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0))
  const codewords = addEccAndInterleave(data, version)

  let best: Builder | null = null
  let bestPenalty = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const b = new Builder(version)
    b.drawFunctionPatterns()
    b.drawCodewords(codewords)
    b.applyMask(mask)
    b.drawFormatBits(mask)
    const p = b.penalty()
    if (p < bestPenalty) {
      best = b
      bestPenalty = p
    }
  }
  const chosen = best as Builder
  return { size: chosen.size, modules: chosen.modules }
}

/** SVG path data ("M x y h1 v1 h-1 z …") of the dark modules, offset by a quiet zone. */
export function qrSvgPath(qr: QrMatrix, border = 4): string {
  const parts: string[] = []
  qr.modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) parts.push(`M${x + border} ${y + border}h1v1h-1z`)
    }),
  )
  return parts.join('')
}
