import { readSheet } from 'read-excel-file/browser'
import { CAB_PROFESSIONAL_ROLES, type CabProfessionalRole } from '@/lib/api/cabEmployeesApi'
import { iafDigits, isCriticalIafCode } from '@/lib/criticalCodeExams'
import { downloadXlsxWorkbook } from '@/lib/xlsxDownload'

/**
 * Bulk personnel import from Excel: template, parsing and row validation.
 * Columns are matched by their English key, so a translated header still works
 * as long as the key stays at the start (e.g. "Full name (الاسم الكامل)").
 */

export const PERSONNEL_IMPORT_COLUMNS = [
  { key: 'Full name', ar: 'الاسم الكامل', required: true, example: 'Omar Hassan' },
  { key: 'Email', ar: 'البريد الإلكتروني', required: true, example: 'omar.hassan@example.com' },
  { key: 'Role', ar: 'الدور', required: true, example: 'Lead Auditor' },
  { key: 'Phone', ar: 'الهاتف (مع كود الدولة)', required: false, example: '+966 50 123 4567' },
  { key: 'Employment start date', ar: 'تاريخ بدء العمل (YYYY-MM-DD)', required: false, example: '2024-01-15' },
  { key: 'Standards', ar: 'المواصفات (مفصولة بفاصلة)', required: false, example: 'ISO 9001:2015, ISO 14001:2015' },
  { key: 'IAF codes', ar: 'رموز IAF (مفصولة بفاصلة)', required: false, example: '14, 29' },
] as const

type ColumnKey = (typeof PERSONNEL_IMPORT_COLUMNS)[number]['key']

export interface PersonnelImportRow {
  /** Row number in the sheet (header = 1). */
  line: number
  fullName: string
  email: string
  roleLabel: string
  role?: CabProfessionalRole
  phone?: string
  phoneCountryCode?: string
  employmentStartDate?: string // YYYY-MM-DD
  schemes: string[]
  iafCodes: string[] // two digits, non-critical only
  /** Critical codes found in the file; they need the exam, so they are not imported. */
  heldCriticalCodes: string[]
  errors: string[]
}

export function downloadPersonnelImportTemplate(): void {
  const header = PERSONNEL_IMPORT_COLUMNS.map((c) => `${c.key} | ${c.ar}`)
  const example = PERSONNEL_IMPORT_COLUMNS.map((c) => c.example)
  downloadXlsxWorkbook('iCASCO_Personnel_Import_Template.xlsx', [
    { name: 'Personnel', rows: [header, example] },
    { name: 'Roles', rows: [['Role (الدور)'], ...CAB_PROFESSIONAL_ROLES.map((r) => [r.label])] },
    {
      name: 'Instructions',
      rows: [
        ['One person per row. Keep the header row. Required: Full name, Email, Role.'],
        ['شخص واحد في كل صف. لا تحذف صف العناوين. الحقول المطلوبة: الاسم الكامل، البريد الإلكتروني، الدور.'],
        ['Role must match a value on the Roles sheet.'],
        ['يجب أن يطابق الدور إحدى القيم في ورقة Roles.'],
        ['IAF codes: two-digit codes separated by commas. Critical codes are not imported; the person adds them after passing the exam.'],
        ['رموز IAF: أرقام من خانتين مفصولة بفاصلة. الرموز الحرجة لا تُستورد، ويضيفها الشخص بعد اجتياز الاختبار.'],
      ],
    },
  ])
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

function toIsoDate(value: unknown): string | undefined | null {
  if (value === null || value === undefined || value === '') return undefined
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') {
    // Excel serial date (days since 1899-12-30)
    const ms = Math.round((value - 25569) * 86400000)
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  const text = String(value).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

function splitList(text: string): string[] {
  return text
    .split(/[,;،\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Parses the first sheet and validates every row. `existingEmails` are already in the register. */
export async function parsePersonnelImport(file: File, existingEmails: string[]): Promise<PersonnelImportRow[]> {
  const sheet = (await readSheet(file, 1)) as unknown[][]
  if (!sheet.length) return []

  const headers = sheet[0].map((h) => cellText(h).toLowerCase())
  const indexOf = (key: ColumnKey) => headers.findIndex((h) => h.startsWith(key.toLowerCase()))
  const col = Object.fromEntries(PERSONNEL_IMPORT_COLUMNS.map((c) => [c.key, indexOf(c.key)])) as Record<ColumnKey, number>
  const missing = PERSONNEL_IMPORT_COLUMNS.filter((c) => c.required && col[c.key] < 0).map((c) => c.key)
  if (missing.length) {
    throw new Error(`MISSING_COLUMNS:${missing.join(', ')}`)
  }

  const seen = new Set(existingEmails.map((e) => e.toLowerCase()))
  const rows: PersonnelImportRow[] = []

  sheet.slice(1).forEach((raw, i) => {
    const get = (key: ColumnKey) => (col[key] >= 0 ? raw[col[key]] : undefined)
    const values = PERSONNEL_IMPORT_COLUMNS.map((c) => cellText(get(c.key)))
    if (values.every((v) => !v)) return // skip blank lines

    const errors: string[] = []
    const fullName = cellText(get('Full name'))
    const email = cellText(get('Email')).toLowerCase()
    const roleLabel = cellText(get('Role'))
    const role = CAB_PROFESSIONAL_ROLES.find(
      (r) => r.label.toLowerCase() === roleLabel.toLowerCase() || r.value === roleLabel.toUpperCase().replace(/\s+/g, '_'),
    )?.value

    if (!fullName) errors.push('fullName')
    if (!email) errors.push('emailRequired')
    else if (!EMAIL_RE.test(email)) errors.push('emailInvalid')
    else if (seen.has(email)) errors.push('emailDuplicate')
    if (!roleLabel) errors.push('roleRequired')
    else if (!role) errors.push('roleUnknown')

    const phoneText = cellText(get('Phone'))
    let phone: string | undefined
    let phoneCountryCode: string | undefined
    if (phoneText) {
      const match = phoneText.replace(/[^\d+]/g, '').match(/^\+(\d{1,3})(\d{6,12})$/)
      if (match) {
        phoneCountryCode = `+${match[1]}`
        phone = match[2]
      } else {
        errors.push('phoneInvalid')
      }
    }

    const start = toIsoDate(get('Employment start date'))
    if (start === null) errors.push('dateInvalid')

    const codes = splitList(cellText(get('IAF codes'))).map(iafDigits)
    const badCodes = codes.filter((c) => !/^\d{2}$/.test(c) || Number(c) < 1 || Number(c) > 39)
    if (badCodes.length) errors.push('iafInvalid')
    const validCodes = Array.from(new Set(codes.filter((c) => !badCodes.includes(c))))

    if (email && !errors.includes('emailInvalid')) seen.add(email)

    rows.push({
      line: i + 2,
      fullName,
      email,
      roleLabel,
      role,
      phone,
      phoneCountryCode,
      employmentStartDate: start ?? undefined,
      schemes: splitList(cellText(get('Standards'))),
      iafCodes: validCodes.filter((c) => !isCriticalIafCode(c)),
      heldCriticalCodes: validCodes.filter((c) => isCriticalIafCode(c)),
      errors,
    })
  })

  return rows
}
