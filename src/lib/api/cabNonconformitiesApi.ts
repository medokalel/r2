import { authorizedRequest } from '@/lib/api/authorizedClient'
import { ApiError } from '@/lib/api/client'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { ncs, scopeToSession } from '@/lib/api/demo/records'
import { isAuditClientSession } from '@/lib/authStorage'

/**
 * Nonconformities — the corrective action register.
 *
 * Real endpoints (the register is raised when an audit report is finalized):
 *   CAB users     GET /cab/nonconformities?search&country&status&startDate&endDate · GET /cab/nonconformities/:id
 *   audit clients GET /nonconformities?…  · GET /nonconformities/:id   (their own register only)
 * In the preview (demo mode) the register lives in the shared demo store.
 *
 * Classification values intentionally mirror `SCHEME_RULES.classifications`
 * in `cabAuditReportingApi` so a finding raised in the audit workspace and the
 * nonconformity it becomes here stay on the same vocabulary.
 */

export type NonconformityClassification = 'critical' | 'major' | 'minor' | 'observation'

export type NonconformityStatus = 'open' | 'in_progress' | 'submitted' | 'closed' | 'overdue'

export type CorrectiveActionStage = 'correction' | 'root_cause' | 'corrective_action' | 'verification'

export type CorrectiveActionStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'

export interface CorrectiveAction {
  id: string
  stage: CorrectiveActionStage
  stageLabel: string
  description: string
  ownerName: string
  dueDate: string
  status: CorrectiveActionStatus
  statusLabel: string
}

export interface NonconformityAttachment {
  id: string
  name: string
  sizeLabel: string
  uploadedBy: string
  uploadedAt: string
}

export interface NonconformityHistoryEntry {
  id: string
  text: string
  by: string
  at: string
}

export interface NonconformityItem {
  id: string
  ncId: string
  findingId: string
  auditId: string
  clientName: string
  clientId: string
  country: string
  classification: NonconformityClassification
  classificationLabel: string
  description: string
  raisedDate: string
  raisedDateRaw: string
  dueDate: string
  dueDateRaw: string
  overdue: boolean
  ownerName: string
  status: NonconformityStatus
  statusLabel: string
  primaryContactName: string
  primaryContactEmail: string
  actions: CorrectiveAction[]
  attachments: NonconformityAttachment[]
  history: NonconformityHistoryEntry[]
}

export interface NonconformityFilterParams {
  searchQuery?: string
  startDate?: string
  endDate?: string
  country?: string
  status?: string
}

/** Stable field keys shared by CAB + client portal. Do not rename without migration. */
export const NONCONFORMITY_FIELD_KEYS = {
  classification: 'nonconformity.classification',
  description: 'nonconformity.description',
  dueDate: 'nonconformity.dueDate',
  owner: 'nonconformity.owner',
  status: 'nonconformity.status',
} as const

export const NONCONFORMITY_CLASSIFICATIONS: NonconformityClassification[] = [
  'critical',
  'major',
  'minor',
  'observation',
]

export const NONCONFORMITY_STATUSES: NonconformityStatus[] = [
  'open',
  'in_progress',
  'submitted',
  'closed',
  'overdue',
]

// Demo mode: the register lives in the shared demo store; findings come from the
// audits in the audit plan store and feed the decision gates (lib/api/demo/records.ts).
const register = () => ncs()

/** API base of the signed-in user: the CAB register, or the audit client's own register. */
export function nonconformityBasePath(): string {
  return isAuditClientSession() ? '/nonconformities' : '/cab/nonconformities'
}

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function getNonconformities(
  params?: NonconformityFilterParams,
): Promise<NonconformityItem[]> {
  if (!isDemoMode()) {
    const qs = new URLSearchParams()
    if (params?.searchQuery?.trim()) qs.set('search', params.searchQuery.trim())
    if (params?.country && params.country !== 'all') qs.set('country', params.country)
    if (params?.status && params.status !== 'all') qs.set('status', params.status)
    if (params?.startDate) qs.set('startDate', params.startDate)
    if (params?.endDate) qs.set('endDate', params.endDate)
    const query = qs.toString()
    return authorizedRequest<NonconformityItem[]>(`${nonconformityBasePath()}${query ? `?${query}` : ''}`)
  }
  await wait()
  let list = clone(scopeToSession(register(), (item) => item.clientId))

  if (params?.searchQuery) {
    const query = params.searchQuery.toLowerCase().trim()
    list = list.filter((item) =>
      [item.ncId, item.findingId, item.clientName, item.clientId].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }
  if (params?.country && params.country !== 'all') {
    list = list.filter((item) => item.country === params.country)
  }
  if (params?.status && params.status !== 'all') {
    list = list.filter((item) => item.status === params.status)
  }
  if (params?.startDate) {
    list = list.filter((item) => item.raisedDateRaw >= params.startDate!)
  }
  if (params?.endDate) {
    list = list.filter((item) => item.raisedDateRaw <= params.endDate!)
  }

  return list
}

export async function getNonconformityById(id: string): Promise<NonconformityItem | null> {
  if (!isDemoMode()) {
    try {
      return await authorizedRequest<NonconformityItem>(`${nonconformityBasePath()}/${encodeURIComponent(id)}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }
  await wait()
  const match = register().find(
    (item) => item.id === id || item.ncId.toLowerCase() === id.toLowerCase(),
  )
  return match ? clone(match) : null
}

/**
 * Countries present in the register — keeps the filter aligned with the data.
 * Pass the loaded rows; without them the demo register is used (empty outside the preview).
 */
export function getNonconformityCountries(items?: NonconformityItem[]): string[] {
  const rows = items ?? (isDemoMode() ? register() : [])
  return Array.from(new Set(rows.map((item) => item.country).filter(Boolean)))
}