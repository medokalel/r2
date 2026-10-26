/**
 * Nonconformity response — the corrective-action response workspace opened
 * from the register's "Open response" action.
 *
 * Real endpoints (`<base>` = /cab/nonconformities for CAB users, /nonconformities for audit clients):
 *   GET   <base>/:id/response · PATCH <base>/:id/response (draft) · POST <base>/:id/response/submit
 *   POST  <base>/:id/evidence (multipart "file") · DELETE <base>/:id/evidence/:evidenceId
 *   CAB only: POST /cab/nonconformities/:id/response/request-revision · POST /cab/nonconformities/:id/close
 * Submitting notifies the CAB; a revision request notifies the client; closing marks the
 * decision's matching finding Closed. In the preview (demo mode) the shared demo store is used.
 *
 * Vocabulary is deliberately shared with `cabNonconformitiesApi`: a response is
 * the editable face of a `NonconformityItem`, so classification/status unions
 * are imported rather than redeclared. Only the response-side concepts
 * (effectiveness review, evidence versions, reviewer outcome) live here.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { ApiError } from '@/lib/api/client'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { CLIENTS } from '@/lib/api/demo/dataset'
import { auditPlans, ncResponses, ncs, saveNcResponses, sessionClientId, setNcStatus } from '@/lib/api/demo/records'
import {
  getNonconformities,
  nonconformityBasePath,
  type NonconformityItem,
  type NonconformityStatus,
} from '@/lib/api/cabNonconformitiesApi'
import { notSet } from '@/lib/emptyValue'

export type EffectivenessResult = 'not_reviewed' | 'effective' | 'partially_effective' | 'not_effective'

export type ResponseTab = 'corrective_action' | 'activity' | 'related' | 'attachments'

export const RESPONSE_TABS: ResponseTab[] = [
  'corrective_action',
  'activity',
  'related',
  'attachments',
]

export const EFFECTIVENESS_RESULTS: EffectivenessResult[] = [
  'not_reviewed',
  'effective',
  'partially_effective',
  'not_effective',
]

/** Free-text limit shared by every response textarea and the reviewer comment. */
export const RESPONSE_TEXT_LIMIT = 1000

export const EVIDENCE_ACCEPT = '.pdf,.docx,.jpg,.jpeg,.png'
export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024

export interface EvidenceFile {
  id: string
  name: string
  version: number
  uploadedAt: string
  sizeLabel: string
  url?: string | null
}

export interface RelatedRecord {
  id: string
  label: string
  reference: string
  href?: string
}

export interface ResponseActivityEntry {
  id: string
  text: string
  by: string
  at: string
}

export interface NonconformityResponse {
  /** Register row this response belongs to — drives the header + status rail. */
  nonconformity: NonconformityItem
  applicationId: string
  originalFinding: string
  findingRaisedDate: string
  targetClosureDate: string
  daysOpen: number
  correction: string
  rootCause: string
  correctiveAction: string
  evidence: EvidenceFile[]
  responsiblePerson: string
  targetDate: string
  effectivenessReviewDate: string
  effectivenessResult: EffectivenessResult
  reviewerComments: string
  lastSavedAt: string | null
  lastSavedBy: string | null
  responsibleOptions: string[]
  related: RelatedRecord[]
  activity: ResponseActivityEntry[]
}

export interface ResponseDraftInput {
  correction: string
  rootCause: string
  correctiveAction: string
  responsiblePerson: string
  targetDate: string
  effectivenessReviewDate: string
  effectivenessResult: EffectivenessResult
  reviewerComments: string
}

export interface ResponseMutationResult {
  savedAt: string
  savedBy: string
  status: NonconformityStatus
}

function responsibleOptions(nonconformity: NonconformityItem): string[] {
  const c = CLIENTS.find((x) => x.code === nonconformity.clientId)
  return c ? c.contacts.map((x) => `${x.firstName} ${x.lastName}`) : [nonconformity.primaryContactName]
}

function currentUser(nonconformity: NonconformityItem): string {
  return sessionClientId() ? nonconformity.primaryContactName : 'CAB Admin'
}

function buildResponse(nonconformity: NonconformityItem): NonconformityResponse {
  const draft = ncResponses()[nonconformity.ncId]
  const plan = auditPlans().find((p) => p.planNumber === nonconformity.auditId)
  const applicationId = plan?.applicationNumber ?? notSet()
  const raised = new Date(nonconformity.raisedDateRaw)
  return {
    nonconformity,
    applicationId,
    originalFinding: nonconformity.description,
    findingRaisedDate: nonconformity.raisedDate,
    targetClosureDate: nonconformity.dueDate,
    daysOpen: Math.max(0, Math.round((Date.now() - raised.getTime()) / 86_400_000)),
    correction: draft?.correction ?? '',
    rootCause: draft?.rootCause ?? '',
    correctiveAction: draft?.correctiveAction ?? '',
    evidence: nonconformity.attachments.map((a, i) => ({ id: a.id, name: a.name, version: i + 1, uploadedAt: a.uploadedAt, sizeLabel: a.sizeLabel })),
    responsiblePerson: draft?.responsiblePerson ?? nonconformity.primaryContactName,
    targetDate: draft?.targetDate ?? nonconformity.dueDateRaw,
    effectivenessReviewDate: draft?.effectivenessReviewDate ?? '',
    effectivenessResult: draft?.effectivenessResult ?? 'not_reviewed',
    reviewerComments: draft?.reviewerComments ?? '',
    lastSavedAt: draft?.lastSavedAt ?? null,
    lastSavedBy: draft?.lastSavedBy ?? null,
    responsibleOptions: responsibleOptions(nonconformity),
    related: [
      { id: 'rel-1', label: 'Audit finding', reference: nonconformity.findingId },
      { id: 'rel-2', label: 'Audit plan', reference: nonconformity.auditId, href: plan ? `/cab/audit-planning/build/${plan.id}` : undefined },
      { id: 'rel-3', label: 'Application', reference: applicationId },
    ],
    activity: nonconformity.history.map((entry) => ({
      id: entry.id,
      text: entry.text,
      by: entry.by,
      at: entry.at,
    })),
  }
}

function timestamp(): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

const responsePath = (ncId: string) => `${nonconformityBasePath()}/${encodeURIComponent(ncId)}`
const cabPath = (ncId: string) => `/cab/nonconformities/${encodeURIComponent(ncId)}`
const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })

export async function getNonconformityResponse(ncId: string): Promise<NonconformityResponse | null> {
  if (!isDemoMode()) {
    try {
      return await authorizedRequest<NonconformityResponse>(`${responsePath(ncId)}/response`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }
  const register = await getNonconformities()
  const match = register.find((item) => item.id === ncId || item.ncId === ncId)
  return match ? buildResponse(match) : null
}

/**
 * Demo transports backed by the shared demo store: drafts persist per
 * nonconformity and status changes flow to the register, the decision gates
 * and the CAB notifications.
 */
function persist(ncId: string, draft: Partial<ResponseDraftInput>, by: string): string {
  const map = ncResponses()
  const item = ncs().find((x) => x.id === ncId || x.ncId === ncId)
  const key = item?.ncId ?? ncId
  const savedAt = timestamp()
  map[key] = { ...(map[key] ?? {}), ...draft, lastSavedAt: savedAt, lastSavedBy: by } as (typeof map)[string]
  saveNcResponses()
  return savedAt
}

function result(ncId: string, status: NonconformityStatus, historyText: string | null): ResponseMutationResult {
  const item = ncs().find((x) => x.id === ncId || x.ncId === ncId)
  const by = item ? currentUser(item) : 'CAB Admin'
  if (item && historyText) setNcStatus(item.ncId, status, historyText, by)
  return { savedAt: timestamp(), savedBy: by, status }
}

export async function saveResponseDraft(
  ncId: string,
  draft: ResponseDraftInput,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('saveResponseDraft: ncId is required')
  if (!isDemoMode()) return authorizedRequest<ResponseMutationResult>(`${responsePath(ncId)}/response`, send('PATCH', draft))
  const item = ncs().find((x) => x.id === ncId || x.ncId === ncId)
  persist(ncId, draft, item ? currentUser(item) : 'CAB Admin')
  const status: NonconformityStatus = draft.correction.trim() ? 'in_progress' : 'open'
  return result(ncId, status, item && item.status !== status && item.status !== 'submitted' ? 'Response draft saved' : null)
}

export async function submitResponse(
  ncId: string,
  draft: ResponseDraftInput,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('submitResponse: ncId is required')
  if (!draft.correctiveAction.trim()) {
    throw new Error('submitResponse: corrective action is required')
  }
  if (!isDemoMode()) return authorizedRequest<ResponseMutationResult>(`${responsePath(ncId)}/response/submit`, send('POST', draft))
  const item = ncs().find((x) => x.id === ncId || x.ncId === ncId)
  persist(ncId, draft, item ? currentUser(item) : 'CAB Admin')
  return result(ncId, 'submitted', 'Corrective action response submitted')
}

export async function requestRevision(
  ncId: string,
  comments: string,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('requestRevision: ncId is required')
  if (!isDemoMode()) return authorizedRequest<ResponseMutationResult>(`${cabPath(ncId)}/response/request-revision`, send('POST', { comments }))
  persist(ncId, { reviewerComments: comments }, 'CAB Admin')
  return result(ncId, 'in_progress', `Revision requested: ${comments || 'see reviewer comments'}`)
}

export async function closeAfterVerification(
  ncId: string,
  comments: string,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('closeAfterVerification: ncId is required')
  if (!isDemoMode()) return authorizedRequest<ResponseMutationResult>(`${cabPath(ncId)}/close`, send('POST', { comments }))
  persist(ncId, { reviewerComments: comments, effectivenessResult: 'effective' }, 'CAB Admin')
  return result(ncId, 'closed', 'Closed after verification')
}

function displayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

/**
 * Uploads one evidence file (PDF, DOCX, JPEG, PNG — max 10 MB). Versions follow the
 * file name. In the preview the file stays in the browser (a `blob:` URL the caller revokes).
 */
export async function uploadResponseEvidence(ncId: string, file: File, existing: EvidenceFile[]): Promise<EvidenceFile> {
  if (!isDemoMode()) {
    const form = new FormData()
    form.append('file', file)
    return authorizedRequest<EvidenceFile>(`${responsePath(ncId)}/evidence`, { method: 'POST', body: form })
  }
  return {
    id: `local-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    name: file.name,
    version: existing.filter((item) => item.name === file.name).length + 1,
    uploadedAt: displayDate(new Date()),
    sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    url: URL.createObjectURL(file),
  }
}

/** Deletes an uploaded evidence file (the preview only drops it locally). */
export async function deleteResponseEvidence(ncId: string, evidenceId: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest<null>(`${responsePath(ncId)}/evidence/${encodeURIComponent(evidenceId)}`, { method: 'DELETE' })
  }
}

/** Response is only submittable once every mandatory narrative + evidence exists. */
export function isResponseComplete(
  draft: ResponseDraftInput,
  evidence: EvidenceFile[],
): boolean {
  return Boolean(
    draft.correction.trim() &&
      draft.rootCause.trim() &&
      draft.correctiveAction.trim() &&
      draft.responsiblePerson &&
      draft.targetDate &&
      evidence.length > 0,
  )
}