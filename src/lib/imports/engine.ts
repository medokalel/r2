/**
 * Import rules, shared by the preview (in-browser) and documented for the backend: normalises
 * every cell, decides each row's status and computes completeness. Pure functions, no I/O
 * (unit tested in tests/imports.test.mjs).
 *
 *   invalid   a required (identity) field is missing or cannot be read, or a reference
 *             (client, person, certificate) is unknown: the record cannot be created
 *   duplicate the natural key matches an existing record: update or skip
 *   partial   creatable, but a "needed later" field is missing: created and flagged
 *   ready     nothing needed is missing
 *
 * Completeness = filled weight / total weight, where required fields count double. A value
 * that cannot be read in an optional column is dropped with a warning (it counts as empty).
 */
import type { ImportDefinition } from '@/lib/imports/entities'
import type {
  ImportAllowedValue,
  ImportColumn,
  ImportListSource,
  ImportPreview,
  ImportPreviewRow,
  ImportRowIssue,
  ImportRowStatus,
} from '@/lib/imports/types'

export interface RawImportRow {
  rowNumber: number
  raw: Record<string, unknown>
}

export interface ImportEngineContext {
  /** Allowed values per list source (countries, standards, roles …). */
  lists: Partial<Record<ImportListSource, ImportAllowedValue[]>>
  /** Natural key (see naturalKeyOf) → id of the existing record. */
  existing: Map<string, string>
  /** Normalised client legal name, Arabic name, code or CR number → organization id. */
  clients?: Map<string, string>
  /** Normalised e-mail or full name → employee id. */
  personnel?: Map<string, string>
  /** Lowercased certificate number → certificate id. */
  certificates?: Map<string, string>
  /** Plan certificate cap: active certificates now and the limit (null = unlimited). */
  certificateLimit?: { active: number; limit: number | null }
  /** IAF codes that need the critical-code exam (personnel). */
  isCriticalIafCode?: (code: string) => boolean
}

export const ISSUE_MESSAGES: Record<string, string> = {
  REQUIRED: 'Required value is missing.',
  TOO_LONG: 'The value is too long.',
  INVALID_EMAIL: 'Not a valid email address.',
  INVALID_PHONE: 'Use the phone number with its country code, e.g. +966 50 123 4567.',
  INVALID_DATE: 'Use a date in the form YYYY-MM-DD.',
  INVALID_TIME: 'Use a time in the form HH:MM.',
  INVALID_NUMBER: 'Not a valid number.',
  NEGATIVE_NUMBER: 'The number cannot be negative.',
  INVALID_VALUE: 'The value is not one of the allowed values.',
  INVALID_COUNTRY: 'Unknown country: use the ISO code (SA, EG …) or the country name.',
  INVALID_BOOLEAN: 'Use yes or no.',
  CLIENT_NOT_FOUND: 'No client with this name or code in the Audit Client Register.',
  INVALID_DATE_RANGE: 'The dates are not in order.',
  INVALID_TIME_RANGE: 'The end time must be after the start time.',
  PERSON_NOT_IN_REGISTER: 'Not found in the competence register; kept as written.',
  PERSON_NOT_FOUND: 'No person with this email in the competence register.',
  CERTIFICATE_NOT_FOUND: 'No certificate with this number. Import the certificate first.',
  DUPLICATE_IN_FILE: 'The same record appears earlier in this file.',
  DUPLICATE_EXISTING: 'A record with the same key already exists.',
  PLAN_CERTIFICATE_LIMIT: 'Your plan certificate limit is reached: this certificate cannot be added.',
  CRITICAL_CODE_NEEDS_EXAM: 'Critical IAF codes are not imported: the person adds them after passing the exam.',
  UNKNOWN_ITEM: 'Some values are not in the list.',
}

const issue = (field: string, code: string, extra?: string): ImportRowIssue => ({
  field,
  code,
  message: extra ? `${ISSUE_MESSAGES[code] ?? code} (${extra})` : ISSUE_MESSAGES[code] ?? code,
})

const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

/** Cell text as the user typed it (dates as YYYY-MM-DD). */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10)
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return String(value).trim()
}

function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2958465) return null
  const date = new Date(Math.round((serial - 25569) * 86400000))
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function validIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const date = new Date(`${text}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text
}

export function parseDate(value: unknown): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10)
  if (typeof value === 'number') return excelSerialToIso(value)
  const text = cellText(value)
  if (validIsoDate(text)) return text
  // Also accept D/M/YYYY and D-M-YYYY (day first, as written in Saudi Arabia and Egypt).
  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
    return validIsoDate(iso) ? iso : null
  }
  if (/^\d+(\.\d+)?$/.test(text)) return excelSerialToIso(Number(text))
  return null
}

export function parseTime(value: unknown): string | null {
  if (typeof value === 'number' && value >= 0 && value < 1) {
    const minutes = Math.round(value * 24 * 60)
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  }
  if (value instanceof Date) return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`
  const match = cellText(value).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  return h < 24 && m < 60 ? `${String(h).padStart(2, '0')}:${match[2]}` : null
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const text = cellText(value).replace(/[\s,٬]/g, '').replace('٫', '.')
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null
  return Number(text)
}

/** "+966 50 123-4567" → "+966501234567"; null when it does not look like an international number. */
export function parsePhone(value: unknown): string | null {
  const text = cellText(value).replace(/[\s().-]/g, '')
  const withPlus = text.startsWith('00') ? `+${text.slice(2)}` : text
  return /^\+\d{7,15}$/.test(withPlus) ? withPlus : null
}

export function splitList(value: unknown): string[] {
  return cellText(value)
    .split(/[,;،\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function matchAllowed(text: string, allowed: ImportAllowedValue[]): string | null {
  const key = norm(text)
  const found = allowed.find((a) => norm(a.value) === key || norm(a.labelEn) === key || norm(a.labelAr) === key)
  return found ? found.value : null
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  const key = norm(cellText(value))
  if (['yes', 'y', 'true', '1', 'نعم'].includes(key)) return true
  if (['no', 'n', 'false', '0', 'لا'].includes(key)) return false
  return null
}

function allowedFor(column: ImportColumn, ctx: ImportEngineContext): ImportAllowedValue[] | undefined {
  return column.allowed ?? (column.listSource ? ctx.lists[column.listSource] : undefined)
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

/** Normalises one cell. `error` set means the value could not be read (value then undefined). */
export function normaliseCell(column: ImportColumn, raw: unknown, ctx: ImportEngineContext): { value?: unknown; error?: string } {
  const text = cellText(raw)
  if (!text) return {}
  switch (column.type) {
    case 'text':
    case 'longtext':
      if (column.max && text.length > column.max) return { error: 'TOO_LONG' }
      return { value: text }
    case 'email': {
      const email = text.toLowerCase()
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { value: email } : { error: 'INVALID_EMAIL' }
    }
    case 'phone': {
      const phone = parsePhone(raw)
      return phone ? { value: phone } : { error: 'INVALID_PHONE' }
    }
    case 'date': {
      const date = parseDate(raw)
      return date ? { value: date } : { error: 'INVALID_DATE' }
    }
    case 'time': {
      const time = parseTime(raw)
      return time ? { value: time } : { error: 'INVALID_TIME' }
    }
    case 'number':
    case 'integer':
    case 'money': {
      const n = parseNumber(raw)
      if (n === null || (column.type === 'integer' && !Number.isInteger(n))) return { error: 'INVALID_NUMBER' }
      if (n < 0) return { error: 'NEGATIVE_NUMBER' }
      return { value: column.type === 'money' ? Math.round(n * 100) / 100 : n }
    }
    case 'boolean': {
      const b = parseBoolean(raw)
      return b === null ? { error: 'INVALID_BOOLEAN' } : { value: b }
    }
    case 'country': {
      const list = ctx.lists.countries ?? []
      const code = text.length === 2 ? list.find((c) => c.value === text.toUpperCase())?.value : matchAllowed(text, list)
      return code ? { value: code } : { error: 'INVALID_COUNTRY' }
    }
    case 'enum': {
      const allowed = allowedFor(column, ctx)
      if (!allowed?.length) return { value: text }
      const value = matchAllowed(text, allowed)
      return value ? { value } : { error: 'INVALID_VALUE' }
    }
    case 'list': {
      const items = splitList(raw)
      const allowed = allowedFor(column, ctx)
      if (column.freeList || !allowed?.length) return { value: Array.from(new Set(items)) }
      const values: string[] = []
      for (const item of items) {
        const match = matchAllowed(item, allowed)
        if (!match) return { error: 'UNKNOWN_ITEM' }
        if (!values.includes(match)) values.push(match)
      }
      return { value: values }
    }
    default:
      return { value: text }
  }
}

function conditionMet(cond: { field: string; in: string[] } | undefined, values: Record<string, unknown>): boolean {
  if (!cond) return false
  const v = values[cond.field]
  return typeof v === 'string' && cond.in.includes(v)
}

export function isRequired(column: ImportColumn, values: Record<string, unknown>): boolean {
  return Boolean(column.required) || conditionMet(column.requiredIf, values)
}

export function isNeededLater(column: ImportColumn, values: Record<string, unknown>): boolean {
  return Boolean(column.later) || conditionMet(column.laterIf, values)
}

/** Natural key of a row: the key columns, lowercased and joined (empty when a part is missing). */
export function naturalKeyOf(definition: ImportDefinition, values: Record<string, unknown>): string {
  if (!definition.naturalKey.length) return ''
  const parts = definition.naturalKey.map((k) => {
    const value = values[k]
    return isEmpty(value) ? '' : norm(String(value))
  })
  return parts.some((p) => !p) ? '' : parts.join('|')
}

/** Weighted completeness of one row: required fields count 2, needed-later fields 1, optional ones 0. */
export function rowCompleteness(definition: ImportDefinition, values: Record<string, unknown>): { filled: number; total: number; percent: number } {
  let filled = 0
  let total = 0
  for (const column of definition.columns) {
    const weight = isRequired(column, values) ? 2 : isNeededLater(column, values) ? 1 : 0
    if (!weight) continue
    total += weight
    if (!isEmpty(values[column.key])) filled += weight
  }
  return { filled, total, percent: total ? Math.round((filled / total) * 100) : 100 }
}

const today = () => new Date().toISOString().slice(0, 10)

/** Entity rules that need the CAB's data (references, plan limits, dates in order). */
function entityChecks(definition: ImportDefinition, values: Record<string, unknown>, ctx: ImportEngineContext, errors: ImportRowIssue[], warnings: ImportRowIssue[]) {
  const usesClient = definition.columns.some((c) => c.key === 'client' && c.required)
  if (usesClient && typeof values.client === 'string' && ctx.clients) {
    const id = ctx.clients.get(norm(values.client))
    if (id) values.organizationId = id
    else errors.push(issue('client', 'CLIENT_NOT_FOUND'))
  }
  const dateOrder = (from: string, to: string, field: string) => {
    if (typeof values[from] === 'string' && typeof values[to] === 'string' && (values[to] as string) < (values[from] as string)) errors.push(issue(field, 'INVALID_DATE_RANGE'))
  }
  switch (definition.key) {
    case 'trainings': {
      const person = values.person
      if (typeof person === 'string' && ctx.personnel) {
        const id = ctx.personnel.get(norm(person))
        if (id) values.employeeId = id
        else errors.push(issue('person', 'PERSON_NOT_FOUND'))
      }
      break
    }
    case 'certification_cycles': {
      const number = values.certificateNumber
      if (typeof number === 'string' && ctx.certificates) {
        const id = ctx.certificates.get(norm(number))
        if (id) values.certificateId = id
        else errors.push(issue('certificateNumber', 'CERTIFICATE_NOT_FOUND'))
      }
      break
    }
    case 'personnel': {
      const codes = Array.isArray(values.iafCodes) ? (values.iafCodes as string[]) : []
      const critical = ctx.isCriticalIafCode ? codes.filter((c) => ctx.isCriticalIafCode!(c)) : []
      if (critical.length) {
        values.iafCodes = codes.filter((c) => !critical.includes(c))
        values.heldCriticalCodes = critical
        warnings.push(issue('iafCodes', 'CRITICAL_CODE_NEEDS_EXAM', critical.join(', ')))
      }
      break
    }
    case 'audit_plans':
      dateOrder('startDate', 'endDate', 'endDate')
      if (ctx.lists.personnel?.length && typeof values.leadAuditor === 'string' && !matchAllowed(values.leadAuditor, ctx.lists.personnel)) {
        warnings.push(issue('leadAuditor', 'PERSON_NOT_IN_REGISTER'))
      }
      break
    case 'audit_plan_sections':
      if (values.section === 'agenda' && typeof values.startTime === 'string' && typeof values.endTime === 'string' && values.endTime <= values.startTime) {
        errors.push(issue('endTime', 'INVALID_TIME_RANGE'))
      }
      break
    case 'certificates':
      dateOrder('issueDate', 'expiryDate', 'expiryDate')
      break
    case 'invoices':
      dateOrder('issueDate', 'dueDate', 'dueDate')
      break
    default:
      break
  }
}

/** Evaluates every row of a parsed file. `recognised` are the template columns found in the file. */
export function evaluateImport(
  definition: ImportDefinition,
  rows: RawImportRow[],
  ctx: ImportEngineContext,
  recognised: string[],
): Omit<ImportPreview, 'importId' | 'fileName' | 'templateVersion'> {
  const seen = new Set<string>()
  const evaluated: ImportPreviewRow[] = []
  let certificateSlots =
    ctx.certificateLimit && ctx.certificateLimit.limit != null ? Math.max(0, ctx.certificateLimit.limit - ctx.certificateLimit.active) : Infinity
  let filledAll = 0
  let totalAll = 0

  for (const { rowNumber, raw } of rows) {
    const values: Record<string, unknown> = {}
    const errors: ImportRowIssue[] = []
    const warnings: ImportRowIssue[] = []
    const unreadable = new Set<string>()

    for (const column of definition.columns) {
      const result = normaliseCell(column, raw[column.key], ctx)
      if (result.error) {
        unreadable.add(column.key)
        ;(column.required ? errors : warnings).push(issue(column.key, result.error))
      } else if (result.value !== undefined) {
        values[column.key] = result.value
      }
    }
    // Conditional requirements depend on normalised values (e.g. the plan section), so check them after.
    for (const column of definition.columns) {
      if (!column.required && unreadable.has(column.key) && isRequired(column, values)) {
        const index = warnings.findIndex((w) => w.field === column.key)
        if (index >= 0) errors.push(...warnings.splice(index, 1))
      }
    }

    const missing: string[] = []
    for (const column of definition.columns) {
      const empty = isEmpty(values[column.key])
      if (!empty) continue
      if (isRequired(column, values)) {
        missing.push(column.key)
        if (!unreadable.has(column.key)) errors.push(issue(column.key, 'REQUIRED'))
      } else if (isNeededLater(column, values)) {
        missing.push(column.key)
      }
    }

    entityChecks(definition, values, ctx, errors, warnings)
    // A later field dropped by an entity rule (e.g. expiry before issue) is now missing.
    for (const column of definition.columns) {
      if (isNeededLater(column, values) && isEmpty(values[column.key]) && !missing.includes(column.key)) missing.push(column.key)
    }

    const key = naturalKeyOf(definition, values)
    let status: ImportRowStatus
    let matchedExistingId: string | null = null
    if (errors.length) {
      status = 'invalid'
    } else if (key && seen.has(key) && !definition.repeatedKeyIsLine) {
      errors.push(issue(definition.naturalKey[0], 'DUPLICATE_IN_FILE'))
      status = 'invalid'
    } else if (key && ctx.existing.has(key)) {
      matchedExistingId = ctx.existing.get(key) ?? null
      warnings.push(issue(definition.naturalKey[0], 'DUPLICATE_EXISTING'))
      status = 'duplicate'
    } else {
      const laterMissing = missing.filter((field) => {
        const column = definition.columns.find((c) => c.key === field)
        return column ? !isRequired(column, values) : false
      })
      status = laterMissing.length ? 'partial' : 'ready'
    }

    if (definition.key === 'certificates' && (status === 'ready' || status === 'partial')) {
      // Issued (or suspended) certificates that have not expired count towards the cap.
      const counts = (values.status === 'ISSUED' || values.status === 'SUSPENDED') && typeof values.expiryDate === 'string' && values.expiryDate >= today()
      if (counts) {
        if (certificateSlots <= 0) {
          errors.push(issue('certificateNumber', 'PLAN_CERTIFICATE_LIMIT'))
          status = 'invalid'
        } else certificateSlots -= 1
      }
    }
    if (key && status !== 'invalid') seen.add(key)

    const completeness = rowCompleteness(definition, values)
    filledAll += completeness.filled
    totalAll += completeness.total
    evaluated.push({ rowNumber, status, completeness: completeness.percent, values, missing, errors, warnings, matchedExistingId })
  }

  const count = (s: ImportRowStatus) => evaluated.filter((r) => r.status === s).length
  return {
    entity: definition.apiEntity,
    totals: { rows: evaluated.length, ready: count('ready'), partial: count('partial'), invalid: count('invalid'), duplicates: count('duplicate') },
    completeness: totalAll ? Math.round((filledAll / totalAll) * 100) : 0,
    columnsRecognised: recognised,
    columnsMissing: definition.columns.filter((c) => !recognised.includes(c.key)).map((c) => c.key),
    rows: evaluated,
  }
}

/** Rows a commit imports for a mode (duplicates only when updating). */
export function rowsToCommit(rows: ImportPreviewRow[], mode: 'complete_only' | 'include_partial', updateExisting = false): ImportPreviewRow[] {
  return rows.filter(
    (row) => row.status === 'ready' || (mode === 'include_partial' && row.status === 'partial') || (updateExisting && row.status === 'duplicate'),
  )
}
