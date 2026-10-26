/**
 * Audit execution — the six-step workspace of one audit plan (Preparation, Opening meeting,
 * Conduct, Team review, Closing meeting, Report) and the client portal's limited view.
 *
 * Real endpoints (CAB; :id = plan uuid or plan number):
 *   GET    /cab/audit-plans/:id/execution                          → AuditExecutionWorkspace (started: false before start)
 *   POST   /cab/audit-plans/:id/execution/start                    → workspace (checklists generated; idempotent)
 *   PATCH  /cab/audit-plans/:id/execution                          fields of the open steps → workspace
 *   POST   /cab/audit-plans/:id/execution/steps/:step/complete     → workspace | 422 { blockers }
 *   POST   /cab/audit-plans/:id/execution/steps/:step/reopen       → workspace
 *   POST   /cab/audit-plans/:id/execution/wrap-ups                 { date, notes } → workspace
 *   DELETE /cab/audit-plans/:id/execution/wrap-ups/:wrapUpId
 *   POST   /cab/audit-plans/:id/execution/checklists               { sourceRef, auditorName } → workspace
 *   PATCH  /cab/audit-plans/:id/execution/checklists/:checklistId  { auditorName } → workspace
 *   DELETE /cab/audit-plans/:id/execution/checklists/:checklistId
 *   PATCH  /cab/audit-plans/:id/execution/items/:itemId            → AuditChecklistItemResult
 *   POST   /cab/audit-plans/:id/execution/sync                     { operations } → { results, workspace }  (offline queue)
 *   POST   /cab/audit-plans/:id/execution/attendance               → workspace
 *   PATCH  /cab/audit-plans/:id/execution/attendance/:attendeeId   → workspace
 *   DELETE /cab/audit-plans/:id/execution/attendance/:attendeeId
 *   POST   /cab/audit-plans/:id/execution/time                     → workspace
 *   DELETE /cab/audit-plans/:id/execution/time/:entryId
 *   POST   /cab/audit-plans/:id/execution/files                    multipart "file" → ExecutionFile
 *   DELETE /cab/audit-plans/:id/execution/files/:fileId
 * Client portal:
 *   GET /portal/audits, GET /portal/audits/:planId
 * In the preview (demo mode) everything runs on the demo store (lib/api/demo/executionDemo.ts).
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import * as demo from '@/lib/api/demo/executionDemo'

export type ExecutionStepKey = 'preparation' | 'opening' | 'conduct' | 'teamReview' | 'closing' | 'report'
export const EXECUTION_STEPS: ExecutionStepKey[] = ['preparation', 'opening', 'conduct', 'teamReview', 'closing', 'report']

export type ChecklistResultKey = 'conforming' | 'observation' | 'ofi' | 'minorNc' | 'majorNc' | 'notAudited' | 'notApplicable'
export const CHECKLIST_RESULTS: ChecklistResultKey[] = ['conforming', 'observation', 'ofi', 'minorNc', 'majorNc', 'notAudited', 'notApplicable']
export const NC_RESULTS: ChecklistResultKey[] = ['minorNc', 'majorNc']

export type ClientPosition = 'agreed' | 'partiallyAgreed' | 'disagreed'
export type AttendeeParty = 'Client' | 'Audit team' | 'Observer'
export type SignatureKind = 'drawn' | 'typed' | 'uploaded'

export interface StepBlocker {
  code: string
  message: string
  count?: number
}

export interface ExecutionStep {
  key: ExecutionStepKey
  status: 'done' | 'current' | 'todo'
  completedAt: string | null
  blockers: StepBlocker[]
}

export interface ExecutionAgendaRow {
  id: string
  date: string
  startTime: string
  endTime: string
  activity: string
  auditors: string[]
}

export interface ExecutionPlanHeader {
  id: string
  planNumber: string
  stage: string
  status: string
  organizationId: string
  clientName: string
  standardName: string
  standardCodes: string[]
  startDate: string
  endDate: string
  timezone: string
  leadAuditor: string
  auditTeam: string[]
  siteName: string
  siteAddress: string
  remoteEnabled: boolean
  remotePlatform: string
  plannedDays: number
  sentAt: string | null
  clientConfirmedAt: string | null
  agenda: ExecutionAgendaRow[]
}

export interface ChecklistProgress {
  total: number
  answered: number
  mandatoryOpen: number
  conforming: number
  observation: number
  ofi: number
  minorNc: number
  majorNc: number
  notAudited: number
  notApplicable: number
}

export interface AuditChecklistItemResult {
  id: string
  code: string
  clause: string
  title: string
  titleAr: string
  requirement: string
  requirementAr: string
  guidance: string
  guidanceAr: string
  evidencePrompts: string[]
  evidencePromptsAr: string[]
  samplingHint: string
  samplingHintAr: string
  mandatory: boolean
  result: ChecklistResultKey | null
  notes: string
  documentsSampled: string[]
  interviewees: string[]
  auditorName: string
  auditedAt: string | null
  minutesSpent: number | null
  findingId: string | null
  findingCode: string | null
  updatedAt: string
}

export interface AuditChecklistInstance {
  id: string
  name: string
  nameAr: string
  standardCode: string
  standardLabel: string
  kind: 'STANDARD' | 'IMS' | 'STAGE1_READINESS' | 'CUSTOM'
  sourceType: 'library' | 'cab'
  sourceRef: string
  sourceVersion: string
  auditorName: string
  progress: ChecklistProgress
  items: AuditChecklistItemResult[]
}

export interface Attendee {
  id: string
  meeting: 'opening' | 'closing'
  name: string
  position: string
  party: AttendeeParty
  email: string
  remote: boolean
  signed: boolean
  signatureType: SignatureKind | null
  signature?: string | null
  signedAt: string | null
}

export interface TimeEntry {
  id: string
  auditorName: string
  date: string
  minutes: number
  activity: string
  remote: boolean
  createdAt: string
}

export interface TimeSummary {
  plannedDays: number
  actualMinutes: number
  actualDays: number
  remoteDays: number
  remoteSharePercent: number
  variancePercent: number
  status: 'notStarted' | 'within' | 'under' | 'over'
  byAuditor: Array<{ name: string; minutes: number; days: number; remoteDays: number }>
  entries: TimeEntry[]
  deviationNote: string
}

export interface ExecutionFile {
  id: string
  checklistItemId: string | null
  name: string
  url: string
  mimeType: string
  size: number
  caption: string
  uploadedBy: string
  takenAt: string | null
  createdAt: string
}

export interface ExecutionFinding {
  id: string
  code: string
  type: 'Nonconformity' | 'Observation' | 'Opportunity'
  classification: string
  requirementRef: string
  statement: string
  dueDate: string
  status: 'Draft' | 'Submitted'
  checklistItemId: string | null
  nonconformityId: string | null
  nonconformityCode: string | null
}

export interface WrapUp {
  id: string
  date: string
  notes: string
  byName: string
  createdAt: string
}

export interface AuditExecutionWorkspace {
  started: boolean
  id: string | null
  plan: ExecutionPlanHeader
  reportId: string | null
  reportStatus: 'draft' | 'finalized' | null
  reportReviewStatus: string | null
  currentStep: ExecutionStepKey
  steps: ExecutionStep[]
  preparation: { planSent: boolean; clientConfirmed: boolean; teamDeclared: boolean; documentsReviewed: boolean; notes: string }
  opening: { heldAt: string | null; agendaConfirmed: boolean; confidentialityConfirmed: boolean; ictRequired: boolean; ictTestDone: boolean; notes: string; attendance: Attendee[] }
  conduct: { progress: ChecklistProgress }
  teamReview: { wrapUps: WrapUp[]; gradingConsensus: boolean; notes: string }
  closing: {
    heldAt: string | null
    findingsPresented: boolean
    clientPosition: ClientPosition | null
    clientComments: string
    ncResponseDueDate: string
    notes: string
    attendance: Attendee[]
  }
  checklists: AuditChecklistInstance[]
  findings: ExecutionFinding[]
  time: TimeSummary
  files: ExecutionFile[]
  updatedAt: string | null
}

/** Fields of the open steps (PATCH /execution). */
export interface ExecutionUpdate {
  documentsReviewed?: boolean
  preparationNotes?: string
  openingHeldAt?: string | null
  agendaConfirmed?: boolean
  confidentialityConfirmed?: boolean
  ictTestDone?: boolean
  openingNotes?: string
  gradingConsensus?: boolean
  teamReviewNotes?: string
  closingHeldAt?: string | null
  findingsPresented?: boolean
  clientPosition?: ClientPosition | null
  clientComments?: string
  ncResponseDueDate?: string | null
  closingNotes?: string
  timeDeviationNote?: string
}

export interface ItemUpdate {
  result?: ChecklistResultKey | null
  notes?: string
  documentsSampled?: string[]
  interviewees?: string[]
  minutesSpent?: number | null
  auditorName?: string
  /** Time of the change on the device (offline edits are replayed later). */
  clientUpdatedAt?: string
}

export interface SyncOperation {
  opId: string
  type: 'item'
  itemId: string
  data: ItemUpdate
  at: string
}

export interface SyncResult {
  results: Array<{ opId: string; status: 'applied' | 'stale' | 'failed'; message?: string }>
  workspace: AuditExecutionWorkspace
}

export interface AttendeeInput {
  meeting: 'opening' | 'closing'
  name: string
  position?: string
  party: AttendeeParty
  email?: string
  remote?: boolean
  signatureType?: SignatureKind
  signature?: string
}

export interface TimeEntryInput {
  auditorName: string
  date: string
  minutes: number
  activity?: string
  remote?: boolean
}

/* ── Client portal types ───────────────────────────────────────────────── */

export interface ClientAuditSummary {
  planId: string
  planNumber: string
  stage: string
  standardName: string
  startDate: string
  endDate: string
  executionStarted: boolean
  currentStep: ExecutionStepKey | null
  openingDone: boolean
  closingDone: boolean
  findingsToAnswer: number
  reportId: string | null
  reportAcknowledged: boolean
}

export interface ClientAttendee {
  name: string
  position: string
  party: AttendeeParty
  remote: boolean
  signed: boolean
}

export interface ClientAuditView {
  plan: Pick<ExecutionPlanHeader, 'id' | 'planNumber' | 'stage' | 'clientName' | 'standardName' | 'startDate' | 'endDate' | 'leadAuditor' | 'auditTeam' | 'siteName' | 'remoteEnabled' | 'remotePlatform' | 'agenda'>
  executionStarted: boolean
  steps: Array<{ key: ExecutionStepKey; done: boolean }>
  opening: { done: boolean; heldAt: string | null; attendance: ClientAttendee[] }
  closing: { done: boolean; heldAt: string | null; clientPosition: ClientPosition | null; ncResponseDueDate: string; attendance: ClientAttendee[] }
  presentedFindings: Array<{ code: string; type: ExecutionFinding['type']; classification: string; requirementRef: string; statement: string }>
  findingsToAnswer: Array<{ id: string; code: string; classification: string; description: string; dueDate: string; status: string }>
  report: { id: string; issuedAt: string | null; version: number; acknowledged: boolean; acknowledgedAt: string | null } | null
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

const emptyProgress = (): ChecklistProgress => ({ total: 0, answered: 0, mandatoryOpen: 0, conforming: 0, observation: 0, ofi: 0, minorNc: 0, majorNc: 0, notAudited: 0, notApplicable: 0 })

/** Fills the blocks a not-started workspace leaves out, so pages can read them safely. */
export function normalizeWorkspace(ws: Partial<AuditExecutionWorkspace> & Pick<AuditExecutionWorkspace, 'plan' | 'started'>): AuditExecutionWorkspace {
  return {
    id: null,
    reportId: null,
    reportStatus: null,
    reportReviewStatus: null,
    currentStep: 'preparation',
    steps: [],
    updatedAt: null,
    ...ws,
    preparation: ws.preparation ?? { planSent: false, clientConfirmed: false, teamDeclared: false, documentsReviewed: false, notes: '' },
    opening: ws.opening ?? { heldAt: null, agendaConfirmed: false, confidentialityConfirmed: false, ictRequired: ws.plan.remoteEnabled, ictTestDone: false, notes: '', attendance: [] },
    conduct: ws.conduct ?? { progress: emptyProgress() },
    teamReview: ws.teamReview ?? { wrapUps: [], gradingConsensus: false, notes: '' },
    closing: ws.closing ?? { heldAt: null, findingsPresented: false, clientPosition: null, clientComments: '', ncResponseDueDate: '', notes: '', attendance: [] },
    checklists: ws.checklists ?? [],
    findings: ws.findings ?? [],
    time: ws.time ?? { plannedDays: ws.plan.plannedDays, actualMinutes: 0, actualDays: 0, remoteDays: 0, remoteSharePercent: 0, variancePercent: 0, status: 'notStarted', byAuditor: [], entries: [], deviationNote: '' },
    files: ws.files ?? [],
  }
}

const base = (planId: string) => `/cab/audit-plans/${encodeURIComponent(planId)}/execution`
const send = <T>(path: string, method: string, body?: unknown) =>
  authorizedRequest<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })
const ws = async (promise: Promise<AuditExecutionWorkspace>) => normalizeWorkspace(await promise)

/** Route of the execution workspace of a plan. */
export const executionPath = (planIdOrNumber: string) => `/cab/audit-execution/${encodeURIComponent(planIdOrNumber)}`

/* ── Data layer: CAB ───────────────────────────────────────────────────── */

export async function getExecution(planId: string): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(authorizedRequest<AuditExecutionWorkspace>(base(planId)))
  return normalizeWorkspace(await demo.getWorkspace(planId))
}

export async function startExecution(planId: string): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/start`, 'POST'))
  return normalizeWorkspace(await demo.start(planId))
}

export async function updateExecution(planId: string, body: ExecutionUpdate): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(base(planId), 'PATCH', body))
  return normalizeWorkspace(await demo.update(planId, body))
}

export async function completeStep(planId: string, step: ExecutionStepKey): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/steps/${step}/complete`, 'POST'))
  return normalizeWorkspace(await demo.completeStep(planId, step))
}

export async function reopenStep(planId: string, step: ExecutionStepKey): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/steps/${step}/reopen`, 'POST'))
  return normalizeWorkspace(await demo.reopenStep(planId, step))
}

export async function addWrapUp(planId: string, body: { date: string; notes: string }): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/wrap-ups`, 'POST', body))
  return normalizeWorkspace(await demo.addWrapUp(planId, body))
}

export async function deleteWrapUp(planId: string, wrapUpId: string): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/wrap-ups/${encodeURIComponent(wrapUpId)}`, 'DELETE'))
  return normalizeWorkspace(await demo.deleteWrapUp(planId, wrapUpId))
}

export async function addAuditChecklist(planId: string, body: { sourceRef: string; auditorName?: string }): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/checklists`, 'POST', body))
  return normalizeWorkspace(await demo.addChecklist(planId, body))
}

export async function assignChecklistAuditor(planId: string, checklistId: string, auditorName: string): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/checklists/${encodeURIComponent(checklistId)}`, 'PATCH', { auditorName }))
  return normalizeWorkspace(await demo.assignChecklist(planId, checklistId, auditorName))
}

export async function removeAuditChecklist(planId: string, checklistId: string): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/checklists/${encodeURIComponent(checklistId)}`, 'DELETE'))
  return normalizeWorkspace(await demo.removeChecklist(planId, checklistId))
}

export async function updateChecklistItem(planId: string, itemId: string, body: ItemUpdate): Promise<AuditChecklistItemResult> {
  if (!isDemoMode()) return send<AuditChecklistItemResult>(`${base(planId)}/items/${encodeURIComponent(itemId)}`, 'PATCH', body)
  return demo.updateItem(planId, itemId, body)
}

export async function syncExecution(planId: string, operations: SyncOperation[]): Promise<SyncResult> {
  if (!isDemoMode()) {
    const result = await send<SyncResult>(`${base(planId)}/sync`, 'POST', { operations })
    return { ...result, workspace: normalizeWorkspace(result.workspace) }
  }
  const result = await demo.sync(planId, operations)
  return { ...result, workspace: normalizeWorkspace(result.workspace) }
}

export async function addAttendee(planId: string, body: AttendeeInput): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/attendance`, 'POST', body))
  return normalizeWorkspace(await demo.addAttendee(planId, body))
}

export async function updateAttendee(planId: string, attendeeId: string, body: Partial<AttendeeInput> & { signature?: string | null }): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/attendance/${encodeURIComponent(attendeeId)}`, 'PATCH', body))
  return normalizeWorkspace(await demo.updateAttendee(planId, attendeeId, body))
}

export async function removeAttendee(planId: string, attendeeId: string): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/attendance/${encodeURIComponent(attendeeId)}`, 'DELETE'))
  return normalizeWorkspace(await demo.removeAttendee(planId, attendeeId))
}

export async function addTimeEntry(planId: string, body: TimeEntryInput): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/time`, 'POST', body))
  return normalizeWorkspace(await demo.addTimeEntry(planId, body))
}

export async function removeTimeEntry(planId: string, entryId: string): Promise<AuditExecutionWorkspace> {
  if (!isDemoMode()) return ws(send<AuditExecutionWorkspace>(`${base(planId)}/time/${encodeURIComponent(entryId)}`, 'DELETE'))
  return normalizeWorkspace(await demo.removeTimeEntry(planId, entryId))
}

/** Uploads a photo taken with the phone camera (or any image / PDF) for the audit, optionally for one checklist item. */
export async function uploadExecutionFile(planId: string, file: File, meta: { checklistItemId?: string; caption?: string; takenAt?: string } = {}): Promise<ExecutionFile> {
  if (!isDemoMode()) {
    const form = new FormData()
    form.append('file', file)
    if (meta.checklistItemId) form.append('checklistItemId', meta.checklistItemId)
    if (meta.caption) form.append('caption', meta.caption)
    if (meta.takenAt) form.append('takenAt', meta.takenAt)
    return authorizedRequest<ExecutionFile>(`${base(planId)}/files`, { method: 'POST', body: form })
  }
  return demo.uploadFile(planId, file, meta)
}

export async function removeExecutionFile(planId: string, fileId: string): Promise<void> {
  if (!isDemoMode()) {
    await send<{ id: string }>(`${base(planId)}/files/${encodeURIComponent(fileId)}`, 'DELETE')
    return
  }
  await demo.removeFile(planId, fileId)
}

/**
 * Called after a finding was saved from a checklist item. The API links the item itself (the
 * finding carries `checklistItemId`); the preview links it in its own store.
 */
export async function linkFindingToItem(planId: string, itemId: string, finding: Pick<ExecutionFinding, 'code' | 'type' | 'classification' | 'requirementRef' | 'statement' | 'dueDate' | 'status'>): Promise<void> {
  if (!isDemoMode()) return
  await demo.linkFinding(planId, itemId, finding)
}

/* ── Data layer: client portal ─────────────────────────────────────────── */

export async function listClientAudits(): Promise<ClientAuditSummary[]> {
  if (!isDemoMode()) return authorizedRequest<ClientAuditSummary[]>('/portal/audits')
  return demo.listClientAudits()
}

export async function getClientAudit(planId: string): Promise<ClientAuditView> {
  if (!isDemoMode()) return authorizedRequest<ClientAuditView>(`/portal/audits/${encodeURIComponent(planId)}`)
  return demo.getClientAudit(planId)
}
