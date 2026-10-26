/**
 * Minimal PDF writer (A4, no dependency) for the documents the CAB downloads: offers,
 * application receipts, cycle summaries.
 *
 *   const pdf = new SimplePdf()
 *   pdf.rect(0, 0, pdf.width, 90, '#1236a3')
 *   pdf.text('Offer OF-0145', 40, 50, { size: 18, bold: true, color: '#ffffff', background: '#1236a3' })
 *   downloadBlob(pdf.toBlob(), 'OF-0145.pdf')
 *
 * Coordinates are in points from the TOP-left corner of the page.
 * Latin text is written with the built-in Helvetica fonts (WinAnsi encoding). Text with any
 * other character (Arabic, …) is drawn by the browser on a canvas — so shaping and
 * right-to-left order are correct — and embedded as a JPEG image.
 */

type Rgb = [number, number, number]

export interface TextOptions {
  size?: number
  bold?: boolean
  color?: string
  /** 'left' (x = start), 'right' (x = end), 'center' (x = middle). */
  align?: 'left' | 'right' | 'center'
  /** Background under rasterized (non-Latin) text; defaults to white. */
  background?: string
}

interface PdfImage {
  name: string
  data: Uint8Array
  width: number
  height: number
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const RASTER_SCALE = 3

/** Unicode → WinAnsi (cp1252) code for the characters outside Latin-1 that cp1252 has. */
const WIN_ANSI_EXTRA: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91,
  0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98,
  0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
}

function winAnsiCode(char: string): number | null {
  const code = char.codePointAt(0) ?? 0
  if (code === 0x0a || code === 0x09) return 0x20
  if (code >= 0x20 && code <= 0x7e) return code
  if (code >= 0xa0 && code <= 0xff) return code
  return WIN_ANSI_EXTRA[code] ?? null
}

/** True when every character can be written with the built-in fonts. */
export function isWinAnsi(text: string): boolean {
  for (const char of text) if (winAnsiCode(char) === null) return false
  return true
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6)
  const value = Number.parseInt(full, 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

const rgb = (hex: string) => hexToRgb(hex).map((v) => v.toFixed(3)).join(' ')
const num = (value: number) => (Math.round(value * 100) / 100).toString()

function pdfString(text: string): string {
  let out = '('
  for (const char of text) {
    const code = winAnsiCode(char) ?? 0x3f
    if (code === 0x28 || code === 0x29 || code === 0x5c) out += `\\${String.fromCharCode(code)}`
    else if (code < 0x20 || code > 0x7e) out += `\\${code.toString(8).padStart(3, '0')}`
    else out += String.fromCharCode(code)
  }
  return `${out})`
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

let measureContext: CanvasRenderingContext2D | null = null
function context2d(): CanvasRenderingContext2D | null {
  if (measureContext) return measureContext
  if (typeof document === 'undefined') return null
  measureContext = document.createElement('canvas').getContext('2d')
  return measureContext
}

const cssFont = (size: number, bold: boolean, rtl: boolean) =>
  `${bold ? '700' : '400'} ${size}px ${rtl ? "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif" : 'Helvetica, Arial, sans-serif'}`

const RTL_CHARS = /[֐-ࣿיִ-﷿ﹰ-ﻼ]/

/** Width of a string in points (Arial metrics = Helvetica metrics). */
export function measureText(text: string, size: number, bold = false): number {
  const ctx = context2d()
  if (!ctx) return text.length * size * 0.5
  ctx.font = cssFont(size, bold, RTL_CHARS.test(text))
  return ctx.measureText(text).width
}

/** Splits text into lines that fit `maxWidth` (explicit line breaks are kept). */
export function wrapText(text: string, size: number, maxWidth: number, bold = false): string[] {
  const lines: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (line && measureText(candidate, size, bold) > maxWidth) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    lines.push(line)
  }
  return lines
}

export class SimplePdf {
  readonly width = PAGE_WIDTH
  readonly height = PAGE_HEIGHT
  private pages: string[][] = [[]]
  private current = 0
  private images: PdfImage[] = []
  private title: string

  constructor(title = 'Document') {
    this.title = title
  }

  get pageCount(): number {
    return this.pages.length
  }

  private get ops(): string[] {
    return this.pages[this.current]
  }

  /** Starts a new page; drawing continues on it. */
  addPage(): void {
    this.pages.push([])
    this.current = this.pages.length - 1
  }

  /** Draws on an earlier page (0-based), e.g. to add footers once the page count is known. */
  selectPage(index: number): void {
    this.current = Math.min(Math.max(0, index), this.pages.length - 1)
  }

  rect(x: number, y: number, w: number, h: number, fill: string): void {
    this.ops.push(`${rgb(fill)} rg ${num(x)} ${num(this.height - y - h)} ${num(w)} ${num(h)} re f`)
  }

  line(x1: number, y1: number, x2: number, y2: number, color = '#ECECEC', width = 0.75): void {
    this.ops.push(`${rgb(color)} RG ${num(width)} w ${num(x1)} ${num(this.height - y1)} m ${num(x2)} ${num(this.height - y2)} l S`)
  }

  /** Draws one line of text; `y` is the baseline. Returns the drawn width. */
  text(value: string, x: number, y: number, options: TextOptions = {}): number {
    const text = value.replace(/\s+/g, ' ').trim()
    if (!text) return 0
    const size = options.size ?? 10
    const bold = options.bold ?? false
    const width = measureText(text, size, bold)
    const left = options.align === 'right' ? x - width : options.align === 'center' ? x - width / 2 : x
    if (isWinAnsi(text)) {
      this.ops.push(
        `BT /${bold ? 'F2' : 'F1'} ${num(size)} Tf ${rgb(options.color ?? '#1a1a1a')} rg ${num(left)} ${num(this.height - y)} Td ${pdfString(text)} Tj ET`
      )
      return width
    }
    this.rasterText(text, left, y, size, bold, options.color ?? '#1a1a1a', options.background ?? '#ffffff', width)
    return width
  }

  /** Wrapped paragraph; returns the y of the line after the last one. */
  paragraph(value: string, x: number, y: number, maxWidth: number, options: TextOptions & { lineHeight?: number } = {}): number {
    const size = options.size ?? 10
    const lineHeight = options.lineHeight ?? size * 1.45
    let cursor = y
    for (const line of wrapText(value, size, maxWidth, options.bold)) {
      this.text(line, x, cursor, options)
      cursor += lineHeight
    }
    return cursor
  }

  /** Embeds a JPEG (bytes + pixel size) scaled to the box (top-left at x, y). */
  image(jpeg: { data: Uint8Array; width: number; height: number }, x: number, y: number, w: number, h: number): void {
    const name = `Im${this.images.length + 1}`
    this.images.push({ name, data: jpeg.data, width: jpeg.width, height: jpeg.height })
    this.ops.push(`q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(this.height - y - h)} cm /${name} Do Q`)
  }

  private rasterText(text: string, left: number, baseline: number, size: number, bold: boolean, color: string, background: string, width: number): void {
    if (typeof document === 'undefined') return
    const canvas = document.createElement('canvas')
    const height = size * 1.6
    canvas.width = Math.max(1, Math.ceil((width + 2) * RASTER_SCALE))
    canvas.height = Math.ceil(height * RASTER_SCALE)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(RASTER_SCALE, RASTER_SCALE)
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width + 2, height)
    const rtl = RTL_CHARS.test(text)
    ctx.direction = rtl ? 'rtl' : 'ltr'
    ctx.textAlign = rtl ? 'right' : 'left'
    ctx.font = cssFont(size, bold, rtl)
    ctx.fillStyle = color
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(text, rtl ? width + 1 : 1, size * 1.15)
    const data = base64ToBytes(canvas.toDataURL('image/jpeg', 0.92).split(',')[1] ?? '')
    this.image({ data, width: canvas.width, height: canvas.height }, left - 1, baseline - size * 1.15, width + 2, height)
  }

  /** Serialises the document. */
  toBytes(): Uint8Array {
    const encoder = (text: string) => {
      const bytes = new Uint8Array(text.length)
      for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff
      return bytes
    }
    const chunks: Uint8Array[] = []
    const offsets: number[] = []
    let length = 0
    const push = (chunk: Uint8Array | string) => {
      const bytes = typeof chunk === 'string' ? encoder(chunk) : chunk
      chunks.push(bytes)
      length += bytes.length
    }
    const object = (id: number, body: string | Array<string | Uint8Array>) => {
      offsets[id] = length
      push(`${id} 0 obj\n`)
      for (const part of Array.isArray(body) ? body : [body]) push(part)
      push('\nendobj\n')
    }

    // 1 catalog, 2 pages, 3 Helvetica, 4 Helvetica-Bold, 5 info, then images, then page/content pairs.
    const imageIds = this.images.map((_, i) => 6 + i)
    const firstPageId = 6 + this.images.length
    const pageIds = this.pages.map((_, i) => firstPageId + i * 2)

    push('%PDF-1.4\n%âãÏÓ\n')
    object(1, '<< /Type /Catalog /Pages 2 0 R >>')
    object(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`)
    object(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
    object(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
    object(5, `<< /Title ${pdfString(this.title)} /Producer (iCASCO) >>`)
    this.images.forEach((image, i) => {
      object(imageIds[i], [
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n`,
        image.data,
        '\nendstream',
      ])
    })
    const xobjects = this.images.length ? `/XObject << ${this.images.map((im, i) => `/${im.name} ${imageIds[i]} 0 R`).join(' ')} >>` : ''
    this.pages.forEach((ops, i) => {
      const content = ops.join('\n')
      object(
        pageIds[i],
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(this.width)} ${num(this.height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xobjects} >> /Contents ${pageIds[i] + 1} 0 R >>`
      )
      object(pageIds[i] + 1, [`<< /Length ${encoder(content).length} >>\nstream\n`, content, '\nendstream'])
    })

    const xrefOffset = length
    const count = firstPageId + this.pages.length * 2
    let xref = `xref\n0 ${count}\n0000000000 65535 f \n`
    for (let id = 1; id < count; id += 1) xref += `${String(offsets[id] ?? 0).padStart(10, '0')} 00000 n \n`
    push(xref)
    push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

    const out = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
      out.set(chunk, offset)
      offset += chunk.length
    }
    return out
  }

  toBlob(): Blob {
    return new Blob([this.toBytes() as BlobPart], { type: 'application/pdf' })
  }
}

/**
 * Loads an image URL into a JPEG for `SimplePdf.image` (white background, longest side
 * ≤ maxPixels). Resolves null when the image cannot be read (missing, or blocked by CORS).
 */
export function loadImageAsJpeg(url: string, maxPixels = 600): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!url || typeof document === 'undefined') {
      resolve(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const ratio = Math.min(1, maxPixels / Math.max(img.naturalWidth, img.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve({ data: base64ToBytes(canvas.toDataURL('image/jpeg', 0.9).split(',')[1] ?? ''), width: canvas.width, height: canvas.height })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Saves a blob as a file. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Opens a PDF blob in a new tab and starts printing it (falls back to download when blocked). */
export function printBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    downloadBlob(blob, filename)
    URL.revokeObjectURL(url)
    return
  }
  win.addEventListener('load', () => {
    try {
      win.print()
    } catch {
      // The viewer prints from its own toolbar.
    }
  })
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
