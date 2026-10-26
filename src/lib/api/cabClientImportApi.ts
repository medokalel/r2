import { apiRequestWithAuth } from '@/lib/api/client'
import { getAuthToken } from '@/lib/authStorage'

function requireToken(): string {
  const token = getAuthToken()
  if (!token) throw new Error('Authentication required')
  return token
}

/** Column keys accepted by POST /cab-clients — keep headers identical for import parsers. */
export const AUDIT_CLIENT_IMPORT_COLUMNS = [
  { key: 'email', required: true },
  { key: 'organizationName', required: true },
  { key: 'administrationName', required: true },
  { key: 'facilityOwnerManager', required: true },
  { key: 'activity', required: true },
  { key: 'legalCapacity', required: true },
  { key: 'city', required: true },
  { key: 'phone', required: true },
  { key: 'authorizationLetterUrl', required: false },
] as const

export type AuditClientImportColumnKey = (typeof AUDIT_CLIENT_IMPORT_COLUMNS)[number]['key']

export interface CabClientImportRow {
  rowNumber: number
  valid: boolean
  errors: string[]
  values: Record<string, string>
  branchCount: number
}

export interface CabClientImportPreview {
  importId: string
  totalRows: number
  validRows: number
  invalidRows: number
  rows: CabClientImportRow[]
}

export interface CabClientImportConfirmResult {
  created: number
  failed: number
  message: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function textValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

function pick<T>(record: Record<string, unknown>, keys: string[]): T | undefined {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key] as T
  }
  return undefined
}

function errorList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => textValue(item)).filter(Boolean)
  if (typeof value === 'string') return value ? [value] : []
  const record = asRecord(value)
  if (!record) return []
  const nested = pick<unknown>(record, ['message', 'error', 'detail'])
  return nested ? errorList(nested) : []
}

function rowValues(record: Record<string, unknown>): Record<string, string> {
  const nested = asRecord(pick(record, ['data', 'values', 'record', 'client', 'fields']))
  const source = nested ?? record
  const values: Record<string, string> = {}
  for (const column of AUDIT_CLIENT_IMPORT_COLUMNS) {
    values[column.key] = textValue(source[column.key])
  }
  return values
}

export function normalizeClientImportPreview(payload: unknown): CabClientImportPreview {
  const root = asRecord(payload) ?? {}
  const summary = asRecord(pick(root, ['summary'])) ?? {}
  const nested = asRecord(pick(root, ['session', 'import', 'preview', 'meta', 'data']))
  const importId = textValue(
    pick(root, ['importId', 'previewId', 'jobId', 'batchId', 'sessionId']) ??
      (nested ? pick(nested, ['importId', 'previewId', 'jobId', 'batchId', 'sessionId']) : undefined),
  )
  const rawRows = asArray(pick(root, ['rows', 'items', 'records', 'clients', 'preview', 'results']))
  const rows: CabClientImportRow[] = rawRows.map((item, index) => {
    const record = asRecord(item) ?? {}
    const errors = errorList(pick(record, ['errors', 'error', 'issues', 'messages']))
    const status = textValue(pick(record, ['status', 'state', 'result'])).toLowerCase()
    const validFlag = pick<unknown>(record, ['valid', 'isValid', 'ok', 'success'])
    const valid =
      typeof validFlag === 'boolean'
        ? validFlag
        : errors.length === 0 && status !== 'invalid' && status !== 'error' && status !== 'failed'
    return {
      rowNumber: Number(pick(record, ['rowNumber', 'row', 'index', 'line']) ?? index + 2) || index + 2,
      valid,
      errors,
      values: rowValues(record),
      branchCount: Number(pick(record, ['branchCount', 'branches']) ?? 0) || 0,
    }
  })

  const validRows =
    Number(pick(root, ['validRows', 'validCount', 'accepted']) ?? pick(summary, ['validClients'])) ||
    rows.filter((row) => row.valid).length
  const invalidRows =
    Number(pick(root, ['invalidRows', 'invalidCount', 'rejected']) ?? pick(summary, ['invalidClients'])) ||
    rows.filter((row) => !row.valid).length

  if (rows.length === 0) {
    const errors = asArray(pick(root, ['errors']))
    for (const item of errors) {
      const record = asRecord(item)
      if (!record) continue
      rows.push({
        rowNumber: Number(pick(record, ['rowNumber', 'row']) ?? rows.length + 2) || rows.length + 2,
        valid: false,
        errors: errorList(pick(record, ['message', 'errors', 'error'])),
        values: rowValues(record),
        branchCount: 0,
      })
    }
  }

  return {
    importId,
    totalRows:
      Number(pick(root, ['totalRows', 'total', 'count']) ?? pick(summary, ['totalClients'])) ||
      rows.length,
    validRows,
    invalidRows,
    rows,
  }
}

export function normalizeClientImportConfirm(payload: unknown): CabClientImportConfirmResult {
  const root = asRecord(payload) ?? {}
  const created = Number(
    pick(root, ['created', 'createdCount', 'imported', 'successCount', 'registered']) ?? 0,
  )
  const failed = Number(pick(root, ['failed', 'failedCount', 'errorCount']) ?? 0)
  return {
    created,
    failed,
    message: textValue(pick(root, ['message', 'detail'])) || '',
  }
}

export function downloadAuditClientImportTemplate(): void {
  const link = document.createElement('a')
  link.href = '/templates/Bulk_Audit_Client_Import_Template_v4.xlsx'
  link.download = 'Bulk_Audit_Client_Import_Template_v4.xlsx'
  link.click()
}

export function previewCabClientImport(file: File): Promise<CabClientImportPreview> {
  const body = new FormData()
  body.append('file', file)
  return apiRequestWithAuth<unknown>('/cab-clients/import/preview', requireToken(), {
    method: 'POST',
    body,
  }).then((payload) => normalizeClientImportPreview(payload))
}

export function confirmCabClientImport(importId: string): Promise<CabClientImportConfirmResult> {
  return apiRequestWithAuth<unknown>(
    `/cab-clients/import/confirm/${encodeURIComponent(importId)}`,
    requireToken(),
    { method: 'POST' },
  ).then(normalizeClientImportConfirm)
}
