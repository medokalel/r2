/**
 * Import templates as Excel files, and reading them back.
 *
 * Template layout (the backend writes the same with `xlsx`):
 *   Data          row 1  human headers in EN and AR, required columns marked `*`
 *                 row 2  technical keys (hidden) plus `__template:<entity>:<version>`
 *                 row 3  one example row (styled, ignored on import while unchanged)
 *                 row 4+ the CAB's records; dropdowns come from the Lists sheet
 *   Instructions  what the template is for, required vs optional, formats, allowed values (EN + AR)
 *   Lists         allowed values per column (countries, standards, statuses …)
 *
 * Reading accepts .xlsx (read-excel-file, already a dependency) and .csv. Columns are found by the
 * technical key row, or by their EN/AR header text when that row is missing, so they can be
 * re-ordered freely.
 */
import { buildXlsxWorkbook, columnRef, type XlsxCell, type XlsxSheet } from '@/lib/xlsxDownload'
import { IMPORT_TEMPLATE_VERSION, type ImportDefinition } from '@/lib/imports/entities'
import { cellText, type RawImportRow } from '@/lib/imports/engine'
import type { ImportAllowedValue, ImportColumn, ImportListSource, ImportPreviewRow } from '@/lib/imports/types'

export const DATA_SHEET = 'Data'
export const TEMPLATE_MARKER = '__template:'
export const ISSUES_KEY = '__issues'
const DATA_ROWS = 1000

type Lang = 'en' | 'ar'

const TYPE_HINT: Record<string, { en: string; ar: string }> = {
  date: { en: 'Date YYYY-MM-DD', ar: 'تاريخ بصيغة YYYY-MM-DD' },
  time: { en: 'Time HH:MM', ar: 'وقت بصيغة HH:MM' },
  phone: { en: 'Phone with country code, e.g. +966 50 123 4567', ar: 'هاتف مع رمز الدولة، مثل +966 50 123 4567' },
  email: { en: 'Email address', ar: 'بريد إلكتروني' },
  country: { en: 'ISO code (SA, EG) or country name', ar: 'رمز الدولة (SA، EG) أو اسمها' },
  number: { en: 'Number', ar: 'رقم' },
  integer: { en: 'Whole number', ar: 'عدد صحيح' },
  money: { en: 'Amount, no currency sign', ar: 'مبلغ دون رمز العملة' },
  boolean: { en: 'yes or no', ar: 'نعم أو لا' },
  list: { en: 'Several values separated by commas', ar: 'عدة قيم مفصولة بفواصل' },
  enum: { en: 'One value from the Lists sheet', ar: 'قيمة واحدة من ورقة Lists' },
  text: { en: 'Text', ar: 'نص' },
  longtext: { en: 'Text', ar: 'نص' },
}

export function headerLabel(column: ImportColumn, lang: Lang): string {
  const star = column.required ? ' *' : ''
  // Same header as the API template: "Legal name * / الاسم القانوني *".
  return lang === 'ar' ? `${column.labelAr}${star} / ${column.labelEn}${star}` : `${column.labelEn}${star} / ${column.labelAr}${star}`
}

function allowedValues(column: ImportColumn, lists: Partial<Record<ImportListSource, ImportAllowedValue[]>>): ImportAllowedValue[] {
  return column.allowed ?? (column.listSource ? lists[column.listSource] ?? [] : [])
}

/** The three sheets of a template, ready for buildXlsxWorkbook. */
export function templateSheets(
  definition: ImportDefinition,
  lang: Lang,
  lists: Partial<Record<ImportListSource, ImportAllowedValue[]>>,
): XlsxSheet[] {
  const columns = definition.columns
  const header = columns.map((c) => headerLabel(c, lang))
  const keys: XlsxCell[] = [...columns.map((c) => c.key), `${TEMPLATE_MARKER}${definition.key}:${IMPORT_TEMPLATE_VERSION}`]
  const example = columns.map((c) => c.example)

  // Lists sheet: one column per column that has allowed values.
  const listColumns = columns.filter((c) => allowedValues(c, lists).length > 0)
  const longest = Math.max(0, ...listColumns.map((c) => allowedValues(c, lists).length))
  const listRows: XlsxCell[][] = [listColumns.map((c) => headerLabel({ ...c, required: false }, lang))]
  for (let i = 0; i < longest; i += 1) listRows.push(listColumns.map((c) => allowedValues(c, lists)[i]?.value ?? ''))
  const labelRows: XlsxCell[][] = listColumns.length
    ? [[lang === 'ar' ? 'القيمة / الوصف' : 'Value / meaning'], ...listColumns.flatMap((c) => allowedValues(c, lists).slice(0, 60).map((a) => [`${c.key}: ${a.value} = ${lang === 'ar' ? a.labelAr : a.labelEn}`]))]
    : []

  const validations = columns
    .map((column, index) => {
      const listIndex = listColumns.indexOf(column)
      const count = allowedValues(column, lists).length
      // Multi-value columns cannot use a dropdown (one value per cell in Excel lists).
      if (listIndex < 0 || column.type === 'list' || !count) return null
      const letter = columnRef(listIndex)
      return { sqref: `${columnRef(index)}3:${columnRef(index)}${DATA_ROWS + 3}`, formula: `Lists!$${letter}$2:$${letter}$${count + 1}` }
    })
    .filter((x): x is { sqref: string; formula: string } => Boolean(x))

  const required = columns.filter((c) => c.required)
  const later = columns.filter((c) => c.later || c.laterIf)
  const names = (cols: ImportColumn[], l: Lang) => cols.map((c) => (l === 'ar' ? c.labelAr : c.labelEn)).join(', ') || (l === 'ar' ? 'لا يوجد' : 'None')
  const intro: Record<Lang, XlsxCell[][]> = {
    en: [
      [`iCASCO import template: ${definition.labelEn}`],
      [definition.descriptionEn],
      ['How to fill it: one record per row on the Data sheet, starting under the example row. Do not change the header rows; columns may be moved.'],
      [`Required (marked *): ${names(required, 'en')}. Rows without them are not imported.`],
      [`Needed later: ${names(later, 'en')}. Rows without them are imported and listed as records to complete.`],
      ['Formats: dates YYYY-MM-DD, phone numbers with the country code, countries as ISO code or name, yes or no for flags, several values separated by commas.'],
      ['Allowed values are on the Lists sheet; cells with a dropdown only accept those values.'],
    ],
    ar: [
      [`قالب الاستيراد في iCASCO: ${definition.labelAr}`],
      [definition.descriptionAr],
      ['طريقة التعبئة: سجل واحد في كل صف في ورقة Data بدءاً من الصف الذي يلي صف المثال. لا تغيّر صفوف العناوين، ويمكن نقل الأعمدة.'],
      [`الحقول المطلوبة (عليها *): ${names(required, 'ar')}. لا تُستورد الصفوف التي تخلو منها.`],
      [`حقول تُستكمل لاحقاً: ${names(later, 'ar')}. تُستورد الصفوف التي تخلو منها وتظهر في قائمة السجلات المطلوب استكمالها.`],
      ['الصيغ: التاريخ YYYY-MM-DD، والهاتف مع رمز الدولة، والدولة برمزها أو اسمها، ونعم أو لا للخيارات، والقيم المتعددة مفصولة بفواصل.'],
      ['القيم المسموح بها في ورقة Lists، والخلايا ذات القائمة المنسدلة لا تقبل غيرها.'],
    ],
  }
  const order: Lang[] = lang === 'ar' ? ['ar', 'en'] : ['en', 'ar']
  const columnRows: XlsxCell[][] = columns.map((c) => {
    const hint = TYPE_HINT[c.type] ?? TYPE_HINT.text
    const need = c.required || c.requiredIf ? (lang === 'ar' ? 'مطلوب' : 'Required') : c.later || c.laterIf ? (lang === 'ar' ? 'يُستكمل لاحقاً' : 'Needed later') : lang === 'ar' ? 'اختياري' : 'Optional'
    return [
      lang === 'ar' ? c.labelAr : c.labelEn,
      c.key,
      need,
      lang === 'ar' ? hint.ar : hint.en,
      (lang === 'ar' ? c.hintAr : c.hintEn) ?? '',
    ]
  })
  const instructions: XlsxCell[][] = [
    ['templateVersion', IMPORT_TEMPLATE_VERSION, 'entity', definition.key],
    [],
    ...order.flatMap((l) => [...intro[l], []]),
    lang === 'ar' ? ['العمود', 'المفتاح', 'الإلزام', 'الصيغة', 'ملاحظة'] : ['Column', 'Key', 'Need', 'Format', 'Note'],
    ...columnRows,
  ]
  const headerRowIndex = 2 + order.length * (intro.en.length + 1)

  return [
    {
      name: DATA_SHEET,
      rows: [header, keys, example],
      hiddenRows: [1],
      rowStyles: { 0: 'header', 2: 'example' },
      widths: columns.map((c) => Math.min(48, Math.max(16, headerLabel(c, lang).length * 0.9))),
      freezeRows: 3,
      rightToLeft: lang === 'ar',
      validations,
    },
    {
      name: 'Instructions',
      rows: instructions,
      rowStyles: { 0: 'bold', 2: 'bold', [2 + intro.en.length + 1]: 'bold', [headerRowIndex]: 'header' },
      widths: [44, 22, 16, 36, 60],
      rightToLeft: lang === 'ar',
    },
    {
      name: 'Lists',
      rows: listRows.length > 1 || listColumns.length ? [...listRows, [], ...labelRows] : [[lang === 'ar' ? 'لا توجد قوائم لهذا القالب' : 'No lists for this template']],
      rowStyles: { 0: 'header' },
      widths: listColumns.map(() => 28),
      rightToLeft: lang === 'ar',
    },
  ]
}

export function buildTemplateBlob(definition: ImportDefinition, lang: Lang, lists: Partial<Record<ImportListSource, ImportAllowedValue[]>>): Blob {
  return buildXlsxWorkbook(templateSheets(definition, lang, lists))
}

/** "Download rows with issues": the rows to fix with an Issues column; re-upload it as is. */
export function buildErrorsBlob(
  definition: ImportDefinition,
  rows: Array<Pick<ImportPreviewRow, 'rowNumber' | 'status' | 'errors' | 'warnings' | 'missing'> & { raw: Record<string, unknown> }>,
  lang: Lang,
  describe: (row: Pick<ImportPreviewRow, 'status' | 'errors' | 'warnings' | 'missing'>) => string,
): Blob {
  const columns = definition.columns
  const issuesLabel = lang === 'ar' ? 'الملاحظات / Issues' : 'Issues / الملاحظات'
  const rowLabel = lang === 'ar' ? 'الصف في الملف الأصلي / Row' : 'Original row / الصف'
  const header: XlsxCell[] = [...columns.map((c) => headerLabel(c, lang)), issuesLabel, rowLabel]
  const keys: XlsxCell[] = [...columns.map((c) => c.key), ISSUES_KEY, '__row', `${TEMPLATE_MARKER}${definition.key}:${IMPORT_TEMPLATE_VERSION}`]
  const body = rows.map((row) => [...columns.map((c) => cellText(row.raw[c.key])), describe(row), row.rowNumber])
  return buildXlsxWorkbook([
    {
      name: DATA_SHEET,
      rows: [header, keys, ...body],
      hiddenRows: [1],
      rowStyles: { 0: 'header' },
      columnStyles: { [columns.length]: 'issue' },
      widths: [...columns.map(() => 20), 60, 12],
      freezeRows: 2,
      rightToLeft: lang === 'ar',
    },
  ])
}

/* ── Reading ─────────────────────────────────────────────────────────── */

export interface ParsedImportFile {
  rows: RawImportRow[]
  recognised: string[]
  templateVersion: string | null
  templateEntity: string | null
}

const clean = (value: string) =>
  value
    .replace(/\*/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

/** Column index per technical key, from the key row or from the header labels. */
function locateColumns(definition: ImportDefinition, grid: unknown[][]): { map: Map<string, number>; dataStart: number; templateVersion: string | null; templateEntity: string | null } {
  const keys = new Set(definition.columns.map((c) => c.key))
  for (let r = 0; r < Math.min(grid.length, 6); r += 1) {
    const cells = grid[r].map((cell) => cellText(cell))
    const hits = cells.filter((c) => keys.has(c)).length
    if (hits >= Math.min(2, keys.size)) {
      const map = new Map<string, number>()
      cells.forEach((cell, index) => {
        if (keys.has(cell) && !map.has(cell)) map.set(cell, index)
      })
      const marker = cells.find((c) => c.startsWith(TEMPLATE_MARKER))
      const [, entity = null, version = null] = marker ? marker.slice(TEMPLATE_MARKER.length).match(/^([^:]+):(.+)$/) ?? [] : []
      return { map, dataStart: r + 1, templateVersion: version, templateEntity: entity }
    }
  }
  // No key row: match the visible header text (EN or AR part, with or without *).
  for (let r = 0; r < Math.min(grid.length, 6); r += 1) {
    const cells = grid[r].map((cell) => clean(cellText(cell)))
    const map = new Map<string, number>()
    for (const column of definition.columns) {
      const names = [column.key, column.labelEn, column.labelAr].map(clean)
      const index = cells.findIndex((cell) => names.includes(cell) || cell.split('/').map((part) => part.trim()).some((part) => names.includes(part)))
      if (index >= 0) map.set(column.key, index)
    }
    if (map.size >= Math.min(2, definition.columns.length)) return { map, dataStart: r + 1, templateVersion: null, templateEntity: null }
  }
  return { map: new Map(), dataStart: 1, templateVersion: null, templateEntity: null }
}

/** Grid (rows of cells) → raw rows keyed by technical key, skipping blanks and the untouched example row. */
export function gridToRows(definition: ImportDefinition, grid: unknown[][]): ParsedImportFile {
  const { map, dataStart, templateVersion, templateEntity } = locateColumns(definition, grid)
  const rows: RawImportRow[] = []
  const exampleKey = definition.columns.map((c) => c.example).join('\u0001')
  grid.slice(dataStart).forEach((cells, offset) => {
    const raw: Record<string, unknown> = {}
    let any = false
    for (const [key, index] of map) {
      const value = cells[index]
      if (cellText(value)) any = true
      raw[key] = value
    }
    if (!any) return
    const asText = definition.columns.map((c) => cellText(raw[c.key])).join('\u0001')
    if (offset === 0 && asText === exampleKey) return
    rows.push({ rowNumber: dataStart + offset + 1, raw })
  })
  return { rows, recognised: [...map.keys()], templateVersion, templateEntity }
}

/** RFC 4180 CSV with `,` or `;` (Excel in Arabic locales), BOM tolerated. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '')
  const firstLine = source.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export const IMPORT_ACCEPT = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv'
export const IMPORT_MAX_BYTES = 10 * 1024 * 1024

export type ImportFileErrorCode = 'FILE_TOO_LARGE' | 'FILE_TYPE' | 'FILE_UNREADABLE' | 'NO_COLUMNS' | 'WRONG_TEMPLATE' | 'XLS_NOT_SUPPORTED'

export class ImportFileError extends Error {
  readonly code: ImportFileErrorCode
  constructor(code: ImportFileErrorCode) {
    super(code)
    this.name = 'ImportFileError'
    this.code = code
  }
}

/** Reads an uploaded file in the browser (preview only; the real API parses it server side). */
export async function readImportFile(definition: ImportDefinition, file: File): Promise<ParsedImportFile> {
  if (file.size > IMPORT_MAX_BYTES) throw new ImportFileError('FILE_TOO_LARGE')
  const name = file.name.toLowerCase()
  let grid: unknown[][]
  if (name.endsWith('.csv')) {
    grid = parseCsv(await file.text())
  } else if (name.endsWith('.xlsx')) {
    try {
      const { default: readXlsxFile } = await import('read-excel-file/browser')
      const sheets = await readXlsxFile(file)
      const data = sheets.find((s) => s.sheet === DATA_SHEET) ?? sheets[0]
      grid = (data?.data ?? []) as unknown[][]
    } catch {
      throw new ImportFileError('FILE_UNREADABLE')
    }
  } else if (name.endsWith('.xls')) {
    // The old binary format is read by the server; the preview asks for .xlsx or .csv.
    throw new ImportFileError('XLS_NOT_SUPPORTED')
  } else {
    throw new ImportFileError('FILE_TYPE')
  }
  const parsed = gridToRows(definition, grid)
  if (parsed.templateEntity && parsed.templateEntity !== definition.key) throw new ImportFileError('WRONG_TEMPLATE')
  if (!parsed.recognised.length) throw new ImportFileError('NO_COLUMNS')
  return parsed
}
