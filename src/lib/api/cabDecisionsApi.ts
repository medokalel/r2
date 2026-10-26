/**
 * Certification decisions — the decision queue and the decision record.
 *
 * Real endpoints (CAB only; gates are re-checked by the server):
 *   GET   /cab/decisions?search&country&status&startDate&endDate
 *   GET   /cab/decisions/:id
 *   PATCH /cab/decisions/:id/draft
 *   POST  /cab/decisions/:id/technical-review
 *   POST  /cab/decisions/:id/record        grant prepares the certificate draft and notifies the CAB
 *   POST  /cab/decisions/:id/correction    controlled correction version
 * A 409 from the server (immutable record) is raised with `code: 'CONFLICT_IMMUTABLE'`.
 * In the preview (demo mode) decisions live in the shared demo store.
 */
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { ApiError } from '@/lib/api/client'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { decisions, onDecisionGranted, saveDecisions, scopeToSession } from '@/lib/api/demo/records'
export type DecisionReviewStatus = 'awaiting_technical_review' | 'ready_for_decision' | 'decided_granted' | 'decided_deferred' | 'decided_refused'
export type DecisionOutcome = 'grant' | 'defer' | 'refuse'
export interface DecisionQueueItem {
  id: string; decisionId: string; applicationId: string
  clientName: string; clientId: string; scheme: string
  country: string; receivedDate: string; receivedDateRaw: string
  dueDate: string; dueDateRaw: string
  reviewStatus: DecisionReviewStatus; reviewStatusLabel: string
  decisionMakerName: string; decisionMakerId: string
}
export interface EvidenceDoc {
  id: string; name: string
  docType: 'audit_report' | 'technical_review' | 'audit_findings' | 'client_submission' | 'other'
  docTypeLabel: string; version: string; date: string
  status: 'Final' | 'Open' | 'Partial'
}
export interface DecisionFinding {
  id: string; requirement: string; description: string
  severity: 'Major' | 'Minor'; status: 'Open' | 'Closed' | 'Accepted'
}
export interface DecisionMakerOption {
  id: string; name: string; authorized: boolean
  independentFromAudit: boolean; roles: string[]
}
export interface DecisionRecord {
  outcome: DecisionOutcome | null; rationale: string
  decisionMakerId: string; decisionDate: string; confirmedScope: string
  version: number; recordedAt: string | null
  recordedBy: string | null; immutable: boolean
}
export interface DecisionDetail extends DecisionQueueItem {
  clientCountry: string; primaryContactName: string
  primaryContactEmail: string; primaryContactPhone: string
  applicationScheme: string; currentStage: string; currentStageDetail: string
  proposedScope: string; evidence: EvidenceDoc[]; findings: DecisionFinding[]
  recommendationBy: string; recommendationDate: string; recommendationText: string
  technicalReviewCompleted: boolean; record: DecisionRecord
  decisionMakers: DecisionMakerOption[]
  activity: Array<{ id: string; text: string; by: string; at: string }>
}
/** Stable field keys shared by CAB + portal. Do not rename without migration. */
export const DECISION_FIELD_KEYS = {
  outcome: 'decision.outcome',
  rationale: 'decision.rationale',
  decisionMaker: 'decision.decisionMaker',
  decisionDate: 'decision.decisionDate',
  confirmedScope: 'decision.confirmedScope',
} as const
export const DECISION_OUTCOME_OPTIONS: Array<{ value: DecisionOutcome; label: string }> = [
  { value: 'grant', label: 'Grant' },
  { value: 'defer', label: 'Defer' },
  { value: 'refuse', label: 'Refuse' },
]
export interface DecisionFilterParams {
  searchQuery?: string; startDate?: string; endDate?: string
  country?: string; status?: string
}
// Demo mode: decisions live in the shared demo store; their findings follow the
// nonconformity register and a grant prepares the certificate draft
// (lib/api/demo/records.ts).
const all = () => decisions()
const find = (id: string) =>
  all().find((d) => d.id === id || d.decisionId.toLowerCase() === id.toLowerCase())
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms))

const decisionPath = (id: string) => `/cab/decisions/${encodeURIComponent(id)}`

/** Real request; a 409 (recorded outcome is immutable) carries `code: 'CONFLICT_IMMUTABLE'` like the demo errors. */
async function decisionRequest(path: string, init: RequestInit): Promise<DecisionDetail> {
  try {
    return await authorizedRequest<DecisionDetail>(path, init)
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const conflict = new Error(err.message) as Error & { code?: string }
      conflict.code = 'CONFLICT_IMMUTABLE'
      throw conflict
    }
    throw err
  }
}
export interface GateResult {
  technicalReviewCompleted: boolean; findingsClosed: boolean
  makerAuthorized: boolean; makerIndependent: boolean
  scopeOk: boolean; rationaleOk: boolean; dateOk: boolean
  canRecord: boolean; canGrant: boolean; blockers: string[]
}
export interface DraftInput {
  outcome: DecisionOutcome | null; rationale: string
  decisionMakerId: string; decisionDate: string; confirmedScope: string
}
/** Certification-decision gates — distinct from application acceptance. */
export function evaluateGates(d: DecisionDetail, draft: DraftInput): GateResult {
  const open = d.findings.filter((f) => f.status === 'Open')
  const maker = d.decisionMakers.find((m) => m.id === draft.decisionMakerId) ?? null
  const blockers: string[] = []
  if (!d.technicalReviewCompleted) blockers.push('Technical review is not complete.')
  if (open.length > 0) blockers.push('There are unresolved findings. All findings must be closed or accepted before a decision can be recorded.')
  if (!maker) blockers.push('Select an authorized decision-maker.')
  else {
    if (!maker.authorized) blockers.push('Selected user is not authorized as decision-maker.')
    if (!maker.independentFromAudit) blockers.push('Decision-maker must be independent from the audit team.')
  }
  if (!draft.rationale.trim()) blockers.push('Rationale is required.')
  if (!draft.confirmedScope.trim()) blockers.push('Confirmed scope is required.')
  if (!draft.decisionDate) blockers.push('Decision date is required.')
  if (!draft.outcome) blockers.push('Outcome is required.')
  return {
    technicalReviewCompleted: d.technicalReviewCompleted,
    findingsClosed: open.length === 0,
    makerAuthorized: Boolean(maker?.authorized),
    makerIndependent: Boolean(maker?.independentFromAudit),
    scopeOk: draft.confirmedScope.trim().length > 0,
    rationaleOk: draft.rationale.trim().length > 0,
    dateOk: draft.decisionDate.length > 0,
    canRecord: blockers.length === 0,
    canGrant: blockers.length === 0 && draft.outcome === 'grant',
    blockers,
  }
}
export async function getDecisionQueue(p?: DecisionFilterParams): Promise<DecisionQueueItem[]> {
  if (!isDemoMode()) {
    const qs = new URLSearchParams()
    if (p?.searchQuery?.trim()) qs.set('search', p.searchQuery.trim())
    if (p?.country && p.country !== 'all') qs.set('country', p.country)
    if (p?.status && p.status !== 'all') qs.set('status', p.status)
    if (p?.startDate) qs.set('startDate', p.startDate)
    if (p?.endDate) qs.set('endDate', p.endDate)
    const query = qs.toString()
    return authorizedRequest<DecisionQueueItem[]>(`/cab/decisions${query ? `?${query}` : ''}`)
  }
  await wait()
  let list: DecisionQueueItem[] = scopeToSession(all(), (d) => d.clientId).map((d) => ({
    id: d.id, decisionId: d.decisionId, applicationId: d.applicationId, clientName: d.clientName, clientId: d.clientId, scheme: d.scheme,
    country: d.country, receivedDate: d.receivedDate, receivedDateRaw: d.receivedDateRaw, dueDate: d.dueDate, dueDateRaw: d.dueDateRaw,
    reviewStatus: d.reviewStatus, reviewStatusLabel: d.reviewStatusLabel, decisionMakerName: d.decisionMakerName, decisionMakerId: d.decisionMakerId,
  }))
  if (p?.searchQuery) {
    const q = p.searchQuery.toLowerCase().trim()
    list = list.filter((d) => d.decisionId.toLowerCase().includes(q) || d.applicationId.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q) || d.clientId.toLowerCase().includes(q))
  }
  if (p?.country && p.country !== 'all') list = list.filter((d) => d.country === p.country)
  if (p?.status && p.status !== 'all') list = list.filter((d) => d.reviewStatus === p.status)
  if (p?.startDate) list = list.filter((d) => d.receivedDateRaw >= p.startDate!)
  if (p?.endDate) list = list.filter((d) => d.receivedDateRaw <= p.endDate!)
  return list
}
export async function getDecisionById(id: string): Promise<DecisionDetail | null> {
  if (!isDemoMode()) {
    try {
      return await authorizedRequest<DecisionDetail>(decisionPath(id))
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }
  await wait()
  const found = find(id)
  return found ? (JSON.parse(JSON.stringify(found)) as DecisionDetail) : null
}
/** Draft save permits incomplete later-stage data; never validates gates. */
export async function saveDecisionDraft(id: string, draft: Partial<DecisionRecord>): Promise<DecisionDetail> {
  if (!isDemoMode()) {
    const { outcome, rationale, decisionMakerId, decisionDate, confirmedScope, version } = draft
    return decisionRequest(`${decisionPath(id)}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ outcome, rationale, decisionMakerId, decisionDate, confirmedScope, version }),
    })
  }
  await wait(300)
  const current = find(id)
  if (!current) throw new Error('Decision not found')
  if (current.record.immutable) {
    const e = new Error('Recorded outcome is immutable. Open a controlled correction version instead.') as Error & { code?: string }
    e.code = 'CONFLICT_IMMUTABLE'
    throw e
  }
  if (draft.rationale === '__fail__') throw new Error('Save failed. Your values were preserved. Try again.')
  current.record = { ...current.record, ...draft, immutable: false }
  saveDecisions()
  return JSON.parse(JSON.stringify(current)) as DecisionDetail
}
/** Submission requires configured gates; no automated grant based on payment. */
export async function recordDecision(id: string, draft: DraftInput & { outcome: DecisionOutcome }): Promise<DecisionDetail> {
  if (!isDemoMode()) {
    const { outcome, rationale, decisionMakerId, decisionDate, confirmedScope } = draft
    return decisionRequest(`${decisionPath(id)}/record`, {
      method: 'POST',
      body: JSON.stringify({ outcome, rationale, decisionMakerId, decisionDate, confirmedScope }),
    })
  }
  await wait(350)
  const cur = find(id)
  if (!cur) throw new Error('Decision not found')
  if (cur.record.immutable) {
    const e = new Error('Already recorded. Corrections require a controlled version.') as Error & { code?: string }
    e.code = 'CONFLICT_IMMUTABLE'
    throw e
  }
  const g = evaluateGates(cur, draft)
  if (!g.canRecord) throw new Error(g.blockers[0] ?? 'Gates not satisfied')
  const maker = cur.decisionMakers.find((m) => m.id === draft.decisionMakerId)
  const outcomeLabel = draft.outcome === 'grant' ? 'Granted' : draft.outcome === 'defer' ? 'Deferred' : 'Refused'
  const stamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const next: DecisionDetail = {
    ...cur,
    reviewStatus: draft.outcome === 'grant' ? 'decided_granted' : draft.outcome === 'defer' ? 'ready_for_decision' : 'decided_refused',
    reviewStatusLabel: outcomeLabel,
    record: { outcome: draft.outcome, rationale: draft.rationale, decisionMakerId: draft.decisionMakerId, decisionDate: draft.decisionDate, confirmedScope: draft.confirmedScope, version: cur.record.version, recordedAt: stamp, recordedBy: maker?.name ?? '', immutable: true },
    activity: [...cur.activity, { id: `a-${Date.now()}`, text: `Decision recorded: ${outcomeLabel}`, by: maker?.name ?? '', at: stamp }],
  }
  Object.assign(cur, next)
  saveDecisions()
  if (draft.outcome === 'grant') onDecisionGranted(cur)
  return JSON.parse(JSON.stringify(next)) as DecisionDetail
}
/** Controlled correction version of an immutable recorded outcome. */
export async function openCorrectionVersion(id: string): Promise<DecisionDetail> {
  if (!isDemoMode()) return decisionRequest(`${decisionPath(id)}/correction`, { method: 'POST' })
  await wait(250)
  const cur = find(id)
  if (!cur) throw new Error('Decision not found')
  const next: DecisionDetail = { ...cur, reviewStatus: 'ready_for_decision', reviewStatusLabel: 'Correction v' + (cur.record.version + 1), record: { ...cur.record, version: cur.record.version + 1, immutable: false, recordedAt: null, recordedBy: null } }
  Object.assign(cur, next)
  saveDecisions()
  return JSON.parse(JSON.stringify(next)) as DecisionDetail
}
/** Completes the technical review (the reviewer must be independent of the audit team). */
export async function completeTechnicalReview(id: string): Promise<DecisionDetail> {
  if (!isDemoMode()) return decisionRequest(`${decisionPath(id)}/technical-review`, { method: 'POST' })
  await wait(250)
  const cur = find(id)
  if (!cur) throw new Error('Decision not found')
  const stamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  Object.assign(cur, {
    technicalReviewCompleted: true,
    reviewStatus: 'ready_for_decision',
    reviewStatusLabel: 'Ready for decision',
    currentStageDetail: 'Technical review completed',
    evidence: cur.evidence.map((e) => (e.docType === 'technical_review' ? { ...e, status: 'Final' } : e)),
    activity: [...cur.activity, { id: `a-${Date.now()}`, text: 'Technical review completed', by: 'CAB Admin', at: stamp }],
  } satisfies Partial<DecisionDetail>)
  saveDecisions()
  return JSON.parse(JSON.stringify(cur)) as DecisionDetail
}

/** Exports apply current filters to ALL authorized matching records (not just page). */
export function decisionsToCsv(rows: DecisionQueueItem[]): string {
  const h = 'Decision ID,Application ID,Client,Client ID,Scheme,Country,Review status,Decision maker,Due date'
  const lines = rows.map((r) => [r.decisionId, r.applicationId, '"' + r.clientName + '"', r.clientId, r.scheme, r.country, '"' + r.reviewStatusLabel + '"', '"' + r.decisionMakerName + '"', r.dueDate].join(','))
  return [h, ...lines].join('\n')
}
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
