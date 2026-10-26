/**
 * CAB-branded A4 document on top of SimplePdf: coloured header band with the CAB logo and
 * name, titled sections, label/value grids, tables and a footer on every page. Right-to-left
 * documents (Arabic) mirror the layout.
 */

import { getCabProfile } from '@/lib/api/cabApi'
import { SimplePdf, downloadBlob, loadImageAsJpeg, printBlob, wrapText } from '@/lib/pdf/simplePdf'
import { notSet } from '@/lib/emptyValue'

export interface Branding {
  name: string
  color: string
  address: string
  website: string
  logo: { data: Uint8Array; width: number; height: number } | null
}

const DEFAULT_COLOR = '#1236a3'
const MARGIN = 40
const FOOTER_SPACE = 48

/** CAB name, colour, address and logo from the CAB profile (generic iCASCO branding when unavailable). */
export async function loadCabBranding(fallbackName = 'iCASCO'): Promise<Branding> {
  try {
    const { cab } = await getCabProfile()
    const logo = cab.logoUrl ? await loadImageAsJpeg(cab.logoUrl) : null
    return {
      name: cab.tradingBrandName || cab.legalEntityName || fallbackName,
      color: /^#[0-9a-f]{6}$/i.test(cab.primaryColor ?? '') ? (cab.primaryColor as string) : DEFAULT_COLOR,
      address: [cab.mainOfficeAddress, cab.city, cab.country].filter(Boolean).join(', '),
      website: cab.website ?? '',
      logo,
    }
  } catch {
    return { name: fallbackName, color: DEFAULT_COLOR, address: '', website: '', logo: null }
  }
}

export interface TableColumnSpec {
  header: string
  /** Share of the content width (the shares are normalised). */
  width: number
  align?: 'start' | 'end'
}

export class BrandedDocument {
  private pdf: SimplePdf
  private y = 0
  private readonly rtl: boolean
  private readonly contentWidth: number
  private readonly branding: Branding
  private readonly options: { title: string; rtl?: boolean; footerNote?: string }

  constructor(branding: Branding, options: { title: string; rtl?: boolean; footerNote?: string }) {
    this.branding = branding
    this.options = options
    this.pdf = new SimplePdf(options.title)
    this.rtl = Boolean(options.rtl)
    this.contentWidth = this.pdf.width - MARGIN * 2
  }

  /** x of a box of width w that starts `offset` from the start margin (mirrored in RTL). */
  private x(offset: number, w = 0): number {
    return this.rtl ? this.pdf.width - MARGIN - offset - w : MARGIN + offset
  }

  /**
   * Text inside a box that starts `offset` points from the start margin and is `width` wide;
   * `align: 'end'` puts it against the box's end edge. Mirrored for right-to-left documents.
   */
  private textAt(
    value: string,
    offset: number,
    y: number,
    opts: { size?: number; bold?: boolean; color?: string; width?: number; align?: 'start' | 'end'; background?: string } = {},
  ) {
    const width = opts.width ?? 0
    const boxLeft = this.x(offset, width)
    const boxRight = boxLeft + width
    const atEnd = opts.align === 'end'
    const anchorRight = this.rtl ? !atEnd : atEnd
    this.pdf.text(value, anchorRight ? boxRight : boxLeft, y, {
      size: opts.size,
      bold: opts.bold,
      color: opts.color,
      background: opts.background,
      align: anchorRight ? 'right' : 'left',
    })
  }

  private ensure(space: number) {
    if (this.y + space <= this.pdf.height - FOOTER_SPACE) return
    this.pdf.addPage()
    this.pageBand()
  }

  /** Thin brand band on continuation pages. */
  private pageBand() {
    this.pdf.rect(0, 0, this.pdf.width, 6, this.branding.color)
    this.y = MARGIN
  }

  /** Header band: logo, CAB name / address, document title and reference. */
  header(title: string, reference: string, subtitle?: string) {
    const bandHeight = 96
    this.pdf.rect(0, 0, this.pdf.width, bandHeight, this.branding.color)
    let offset = 0
    if (this.branding.logo) {
      const h = 44
      const w = Math.min(120, (this.branding.logo.width / this.branding.logo.height) * h)
      this.pdf.rect(this.x(0, w + 12), 22, w + 12, h + 12, '#ffffff')
      this.pdf.image(this.branding.logo, this.x(6, w), 28, w, h)
      offset = w + 24
    }
    this.textAt(this.branding.name, offset, 44, { size: 15, bold: true, color: '#ffffff', background: this.branding.color })
    if (this.branding.address) this.textAt(this.branding.address, offset, 62, { size: 8.5, color: '#e8edfc', background: this.branding.color })
    if (this.branding.website) this.textAt(this.branding.website, offset, 75, { size: 8.5, color: '#e8edfc', background: this.branding.color })
    this.textAt(title, 0, 50, { size: 17, bold: true, color: '#ffffff', width: this.contentWidth, align: 'end', background: this.branding.color })
    this.textAt(reference, 0, 68, { size: 10, color: '#e8edfc', width: this.contentWidth, align: 'end', background: this.branding.color })
    this.y = bandHeight + 28
    if (subtitle) {
      this.y = this.paragraphAt(subtitle, 9.5, '#666666') + 4
    }
  }

  private paragraphAt(value: string, size: number, color: string): number {
    for (const line of wrapText(value, size, this.contentWidth)) {
      this.ensure(size * 1.5)
      this.textAt(line, 0, this.y, { size, color })
      this.y += size * 1.5
    }
    return this.y
  }

  section(title: string) {
    this.ensure(40)
    this.y += 8
    this.textAt(title, 0, this.y, { size: 12, bold: true, color: this.branding.color })
    this.y += 8
    this.pdf.line(MARGIN, this.y, this.pdf.width - MARGIN, this.y, '#d9dfef', 1)
    this.y += 16
  }

  /** Label / value pairs in two columns. */
  fields(rows: Array<[label: string, value: string]>) {
    const columnWidth = (this.contentWidth - 20) / 2
    for (let i = 0; i < rows.length; i += 2) {
      const pair = rows.slice(i, i + 2)
      const heights = pair.map(([, value]) => wrapText(value || notSet(), 10, columnWidth).length)
      const lines = Math.max(...heights)
      this.ensure(16 + lines * 14)
      pair.forEach(([label, value], col) => {
        const offset = col * (columnWidth + 20)
        this.textAt(label, offset, this.y, { size: 8.5, color: '#666666' })
        wrapText(value || notSet(), 10, columnWidth).forEach((line, n) => this.textAt(line, offset, this.y + 14 + n * 14, { size: 10, bold: true }))
      })
      this.y += 18 + lines * 14
    }
  }

  paragraph(value: string) {
    this.paragraphAt(value, 10, '#1a1a1a')
    this.y += 4
  }

  /** Table with a coloured header row; long cells wrap. */
  table(columns: TableColumnSpec[], rows: string[][]) {
    const total = columns.reduce((sum, c) => sum + c.width, 0)
    const widths = columns.map((c) => (c.width / total) * this.contentWidth)
    const offsets = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0))
    const drawHeader = () => {
      this.ensure(30)
      this.pdf.rect(MARGIN, this.y - 13, this.contentWidth, 22, this.branding.color)
      columns.forEach((c, i) =>
        this.textAt(c.header, offsets[i] + 6, this.y + 2, { size: 9, bold: true, color: '#ffffff', width: widths[i] - 12, align: c.align, background: this.branding.color }),
      )
      this.y += 22
    }
    drawHeader()
    rows.forEach((row, r) => {
      const cellLines = row.map((cell, i) => wrapText(cell || notSet(), 9.5, widths[i] - 12))
      const height = Math.max(...cellLines.map((l) => l.length)) * 13 + 8
      if (this.y + height > this.pdf.height - FOOTER_SPACE) {
        this.pdf.addPage()
        this.pageBand()
        drawHeader()
      }
      const zebra = r % 2 === 1 ? '#f7f8fa' : '#ffffff'
      if (r % 2 === 1) this.pdf.rect(MARGIN, this.y - 11, this.contentWidth, height, zebra)
      cellLines.forEach((lines, i) =>
        lines.forEach((line, n) =>
          this.textAt(line, offsets[i] + 6, this.y + 2 + n * 13, { size: 9.5, width: widths[i] - 12, align: columns[i].align, background: zebra }),
        ),
      )
      this.y += height
    })
    this.y += 6
  }

  /** Starts a new page (thin brand band at the top), e.g. for an appendix or audit-trail page. */
  pageBreak() {
    this.pdf.addPage()
    this.pageBand()
  }

  /** A signature: the image (JPEG, optional) above a signature line, then one caption line per entry. */
  signature(image: { data: Uint8Array; width: number; height: number } | null, lines: string[]) {
    const height = 56
    const lineWidth = 220
    this.ensure(height + 24 + lines.length * 13)
    if (image) {
      const width = Math.min(lineWidth, (image.width / image.height) * height)
      this.pdf.image(image, this.x(0, width), this.y, width, height)
    }
    this.y += height + 4
    const left = this.x(0, lineWidth)
    this.pdf.line(left, this.y, left + lineWidth, this.y, '#999999', 0.75)
    this.y += 14
    for (const line of lines) {
      this.textAt(line, 0, this.y, { size: 9, color: '#444444' })
      this.y += 13
    }
    this.y += 10
  }

  /** Right-aligned (end-aligned) totals block. */
  totals(rows: Array<[label: string, value: string, emphasis?: boolean]>) {
    const width = 240
    for (const [label, value, emphasis] of rows) {
      this.ensure(22)
      if (emphasis) this.pdf.rect(this.x(this.contentWidth - width, width), this.y - 13, width, 22, '#e8edfc')
      const bg = emphasis ? '#e8edfc' : '#ffffff'
      this.textAt(label, this.contentWidth - width + 8, this.y + 2, { size: 10, bold: emphasis, color: '#444444', background: bg })
      this.textAt(value, this.contentWidth - width, this.y + 2, { size: 10, bold: true, width: width - 8, align: 'end', background: bg })
      this.y += 22
    }
    this.y += 6
  }

  /** Adds the footer (CAB name, note, "page n / N") to every page and returns the PDF. */
  private finish(pageLabel: (page: number, total: number) => string): SimplePdf {
    const total = this.pdf.pageCount
    const note = this.options.footerNote ?? ''
    for (let page = 0; page < total; page += 1) {
      this.pdf.selectPage(page)
      const line = [this.branding.name, note, pageLabel(page + 1, total)].filter(Boolean).join('  ·  ')
      this.pdf.line(MARGIN, this.pdf.height - 36, this.pdf.width - MARGIN, this.pdf.height - 36, '#ECECEC', 0.75)
      this.pdf.text(line, this.rtl ? this.pdf.width - MARGIN : MARGIN, this.pdf.height - 22, { size: 8, color: '#888888', align: this.rtl ? 'right' : 'left' })
    }
    return this.pdf
  }

  save(filename: string, pageLabel: (page: number, total: number) => string) {
    downloadBlob(this.finish(pageLabel).toBlob(), filename)
  }

  print(filename: string, pageLabel: (page: number, total: number) => string) {
    printBlob(this.finish(pageLabel).toBlob(), filename)
  }

  toBlob(pageLabel: (page: number, total: number) => string): Blob {
    return this.finish(pageLabel).toBlob()
  }
}
