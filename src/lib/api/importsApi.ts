/**
 * Excel import (data migration) API.
 *
 *   GET  /cab/imports/entities                          → ImportEntityInfo[]
 *   GET  /cab/imports/:entity/template?lang=en|ar       → .xlsx file (Content-Disposition)
 *        (&variant=sections: the one-plan sections template of the Build audit plan page)
 *   POST /cab/imports/:entity/preview                   → ImportPreview (multipart `file`, optional `context` JSON)
 *   POST /cab/imports/:importId/commit                  → ImportResult ({ mode, duplicates, sendWelcomeEmails })
 *   GET  /cab/imports?entity=                           → ImportHistoryItem[]
 *   GET  /cab/imports/:importId                         → ImportBatchDetail (preview with row outcomes + result)
 *   GET  /cab/imports/:importId/errors.xlsx?lang=       → .xlsx of the rows with issues
 *   GET  /cab/imports/migration-status                  → MigrationStatus
 *   GET  /cab/imports/incomplete?entity=&status=        → ImportIncompleteRecord[] (records to complete)
 *   POST /cab/imports/incomplete/:id/resolve            → ImportIncompleteRecord (dismissed)
 *
 * CAB_ADMIN only, gated by the `excel_import` feature; the server scopes everything to the CAB
 * in the JWT. In the preview (demo mode) the same endpoints run in the browser on the demo
 * store (lib/imports/demoImports.ts).
 */
import { ApiError } from '@/lib/api/client'
import { API_BASE_URL } from '@/lib/api/config'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { getAuthToken } from '@/lib/authStorage'
import { importDefinition, templateFileName, type ImportDefinition } from '@/lib/imports/entities'
import type {
  ImportBatchDetail,
  ImportCommitOptions,
  ImportContext,
  ImportDefinitionKey,
  ImportEntityInfo,
  ImportEntityKey,
  ImportHistoryItem,
  ImportIncompleteRecord,
  ImportPreview,
  ImportPreviewRow,
  ImportResult,
  MigrationStatus,
} from '@/lib/imports/types'

export type * from '@/lib/imports/types'

const BASE = '/cab/imports'
const enc = encodeURIComponent

/** Loads the demo implementation only when the preview needs it. */
const demo = () => import('@/lib/imports/demoImports')

async function fetchFile(path: string, fallbackName: string): Promise<{ blob: Blob; fileName: string }> {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  if (!response.ok) {
    let message = response.statusText || 'Download failed'
    let code: string | undefined
    try {
      const body = (await response.json()) as { message?: string; code?: string }
      message = body.message ?? message
      code = body.code
    } catch {
      // not JSON
    }
    throw new ApiError(message, response.status, undefined, code)
  }
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  return { blob: await response.blob(), fileName: match ? decodeURIComponent(match[1]) : fallbackName }
}

export async function listImportEntities(): Promise<ImportEntityInfo[]> {
  if (!isDemoMode()) return authorizedRequest<ImportEntityInfo[]>(`${BASE}/entities`)
  return (await demo()).demoListEntities()
}

/** The template of one definition (an entity, or the sections of one audit plan). */
export async function getImportTemplate(
  definitionKey: ImportDefinitionKey,
  lang: 'en' | 'ar',
  context: ImportContext = {},
): Promise<{ blob: Blob; fileName: string }> {
  const definition = importDefinition(definitionKey)
  const fileName = templateFileName(definitionKey)
  if (!isDemoMode()) {
    const qs = new URLSearchParams({ lang })
    if (definitionKey === 'audit_plan_sections' || context.auditPlanId) qs.set('variant', 'sections')
    return fetchFile(`${BASE}/${enc(definition.apiEntity)}/template?${qs.toString()}`, fileName)
  }
  return { blob: await (await demo()).demoTemplate(definitionKey, lang), fileName }
}

export async function previewImport(entity: ImportEntityKey, file: File, context: ImportContext = {}): Promise<ImportPreview> {
  if (!isDemoMode()) {
    const body = new FormData()
    body.append('file', file)
    if (Object.keys(context).length) body.append('context', JSON.stringify(context))
    return authorizedRequest<ImportPreview>(`${BASE}/${enc(entity)}/preview`, { method: 'POST', body })
  }
  return (await demo()).demoPreview(entity, file, context)
}

export async function commitImport(importId: string, options: ImportCommitOptions): Promise<ImportResult> {
  if (!isDemoMode()) {
    return authorizedRequest<ImportResult>(`${BASE}/${enc(importId)}/commit`, {
      method: 'POST',
      body: JSON.stringify({
        mode: options.mode,
        duplicates: options.duplicates ?? 'skip',
        ...(options.sendWelcomeEmails !== undefined ? { sendWelcomeEmails: options.sendWelcomeEmails } : {}),
      }),
    })
  }
  return (await demo()).demoCommit(importId, options)
}

export async function listImportHistory(entity?: ImportEntityKey): Promise<ImportHistoryItem[]> {
  if (!isDemoMode()) return authorizedRequest<ImportHistoryItem[]>(`${BASE}${entity ? `?entity=${enc(entity)}` : ''}`)
  return (await demo()).demoHistory(entity)
}

export async function getImportBatch(importId: string): Promise<ImportBatchDetail> {
  if (!isDemoMode()) return authorizedRequest<ImportBatchDetail>(`${BASE}/${enc(importId)}`)
  return (await demo()).demoBatch(importId)
}

/**
 * The uploaded rows that are not ready, with an Issues column, to fix and upload again.
 * `describe` writes the issues of a row in the user's language (used by the preview build).
 */
export async function getImportErrorsFile(
  importId: string,
  lang: 'en' | 'ar',
  definition: ImportDefinition,
  describe: (row: Pick<ImportPreviewRow, 'status' | 'errors' | 'warnings' | 'missing'>) => string,
): Promise<{ blob: Blob; fileName: string }> {
  const fileName = `iCASCO_${definition.key}_rows_to_fix.xlsx`
  if (!isDemoMode()) return fetchFile(`${BASE}/${enc(importId)}/errors.xlsx?lang=${lang}`, fileName)
  return { blob: await (await demo()).demoErrorsFile(importId, lang, describe), fileName }
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  if (!isDemoMode()) return authorizedRequest<MigrationStatus>(`${BASE}/migration-status`)
  return (await demo()).demoMigrationStatus()
}

/** Records created from partial rows that still miss fields (recomputed from the current data). */
export async function listIncompleteRecords(params: { entity?: ImportDefinitionKey; status?: 'open' | 'resolved' | 'all' } = {}): Promise<ImportIncompleteRecord[]> {
  if (!isDemoMode()) {
    const qs = new URLSearchParams()
    if (params.entity) qs.set('entity', params.entity)
    if (params.status) qs.set('status', params.status)
    const query = qs.toString()
    return authorizedRequest<ImportIncompleteRecord[]>(`${BASE}/incomplete${query ? `?${query}` : ''}`)
  }
  return (await demo()).demoIncomplete(params.entity, params.status)
}

/** Dismisses a record from the "records to complete" list. */
export async function resolveIncompleteRecord(id: string): Promise<ImportIncompleteRecord> {
  if (!isDemoMode()) return authorizedRequest<ImportIncompleteRecord>(`${BASE}/incomplete/${enc(id)}/resolve`, { method: 'POST' })
  return (await demo()).demoResolveIncomplete(id)
}

