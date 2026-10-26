function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function u16(value: number): Uint8Array {
  const buffer = new Uint8Array(2)
  buffer[0] = value & 0xff
  buffer[1] = (value >>> 8) & 0xff
  return buffer
}

function u32(value: number): Uint8Array {
  const buffer = new Uint8Array(4)
  buffer[0] = value & 0xff
  buffer[1] = (value >>> 8) & 0xff
  buffer[2] = (value >>> 16) & 0xff
  buffer[3] = (value >>> 24) & 0xff
  return buffer
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const output = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    output.set(part, offset)
    offset += part.length
  }
  return output
}

function zipStore(files: Array<{ name: string; content: string }>): Blob {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const crc = crc32(data)
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data,
    ])
    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ])
    locals.push(local)
    centrals.push(central)
    offset += local.length
  }

  const centralDirectory = concat(centrals)
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ])

  return new Blob([concat([...locals, centralDirectory, end]) as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function columnLetter(index: number): string {
  let remaining = index
  let letter = ''
  while (remaining >= 0) {
    letter = String.fromCharCode((remaining % 26) + 65) + letter
    remaining = Math.floor(remaining / 26) - 1
  }
  return letter
}

/** Cell style ids written into styles.xml (see STYLES_XML). */
export type XlsxCellStyle = 'default' | 'header' | 'example' | 'bold' | 'wrap' | 'issue'
const STYLE_INDEX: Record<XlsxCellStyle, number> = { default: 0, header: 1, example: 2, bold: 3, wrap: 4, issue: 5 }

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF7C7C7C"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><sz val="11"/><color rgb="FFB42318"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1236A3"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF1F4FA"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`

export type XlsxCell = string | number | null | undefined

/** One worksheet. Rows and columns are 0-based here; Excel references are built from them. */
export interface XlsxSheet {
  name: string
  rows: XlsxCell[][]
  /** Column widths in characters. */
  widths?: number[]
  /** 0-based row indexes written with `hidden="1"`. */
  hiddenRows?: number[]
  /** Style per 0-based row index (whole row). */
  rowStyles?: Record<number, XlsxCellStyle>
  /** Style per 0-based column index for every cell of that column (row styles win). */
  columnStyles?: Record<number, XlsxCellStyle>
  /** Rows kept on screen while scrolling. */
  freezeRows?: number
  rightToLeft?: boolean
  /** Dropdowns: `sqref` like "C4:C1003", `formula` like "Lists!$A$2:$A$20". */
  validations?: Array<{ sqref: string; formula: string }>
  /** Sheet tab hidden in Excel. */
  hidden?: boolean
}

export function columnRef(index: number): string {
  return columnLetter(index)
}

function cellXml(value: XlsxCell, ref: string, style: number): string {
  const s = style ? ` s="${style}"` : ''
  if (value === null || value === undefined || value === '') return style ? `<c r="${ref}"${s}/>` : ''
  if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"${s}><v>${value}</v></c>`
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(value))}</t></is></c>`
}

function sheetXml(sheet: XlsxSheet | string[][]): string {
  const spec: XlsxSheet = Array.isArray(sheet) ? { name: '', rows: sheet } : sheet
  const hidden = new Set(spec.hiddenRows ?? [])
  const sheetRows = spec.rows
    .map((row, rowIndex) => {
      const rowStyle = spec.rowStyles?.[rowIndex]
      const cells = row
        .map((value, columnIndex) => {
          const ref = `${columnLetter(columnIndex)}${rowIndex + 1}`
          const style = STYLE_INDEX[rowStyle ?? spec.columnStyles?.[columnIndex] ?? 'default']
          return cellXml(value, ref, style)
        })
        .join('')
      return `<row r="${rowIndex + 1}"${hidden.has(rowIndex) ? ' hidden="1"' : ''}>${cells}</row>`
    })
    .join('')
  const freeze = spec.freezeRows
    ? `<pane ySplit="${spec.freezeRows}" topLeftCell="A${spec.freezeRows + 1}" activePane="bottomLeft" state="frozen"/>`
    : ''
  const views = `<sheetViews><sheetView workbookViewId="0"${spec.rightToLeft ? ' rightToLeft="1"' : ''}>${freeze}</sheetView></sheetViews>`
  const cols = spec.widths?.length
    ? `<cols>${spec.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : ''
  const validations = spec.validations?.length
    ? `<dataValidations count="${spec.validations.length}">${spec.validations
        .map((v) => `<dataValidation type="list" allowBlank="1" showErrorMessage="0" sqref="${v.sqref}"><formula1>${xmlEscape(v.formula)}</formula1></dataValidation>`)
        .join('')}</dataValidations>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${views}${cols}<sheetData>${sheetRows}</sheetData>${validations}</worksheet>`
}

/** Builds an .xlsx workbook (stored zip, no compression) from plain rows. */
export function buildXlsxWorkbook(sheets: Array<XlsxSheet | { name: string; rows: string[][] }>): Blob {
  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets
    .map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join('')}
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets
      .map(
        (sheet, index) =>
          `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}"${'hidden' in sheet && sheet.hidden ? ' state="hidden"' : ''} r:id="rId${index + 1}"/>`,
      )
      .join('')}
  </sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join('')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'xl/styles.xml', content: STYLES_XML },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: sheetXml(sheet as XlsxSheet),
    })),
  ]
  return zipStore(files)
}

/** Saves a Blob under `filename` through a temporary link. */
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

export function downloadXlsxWorkbook(
  filename: string,
  sheets: Array<{ name: string; rows: string[][] }>,
): void {
  downloadBlob(buildXlsxWorkbook(sheets), filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}
