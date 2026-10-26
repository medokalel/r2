/**
 * Preview (demo mode) implementation of the audit execution workspace and the stage reports.
 * Same rules as the API (backend src/modules/audit-execution, audit-reports/stage-report.service.js):
 * checklist generation per stage and standards, step gates, plan status moves, report review / issue.
 *
 * Seeded examples (first use): AUD-0266 (Stage 1) executed through the closing meeting with a
 * Stage 1 report waiting for technical review; AUD-0251 (Stage 2, the portal client) with an issued
 * report the client can acknowledge. AUD-0264 is left to start live.
 */

import { ApiError } from '@/lib/api/client'
import { clone, loadState, saveState, wait } from '@/lib/api/demo/demoStore'
import { auditPlans, notify, saveAuditPlans, scopeToSession } from '@/lib/api/demo/records'
import { CLIENTS, DEMO_CAB } from '@/lib/api/demo/dataset'
import { checklistByRef, checklistSourceFor, type ChecklistItemData, type ChecklistTemplate } from '@/lib/api/checklistsApi'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import type {
  Attendee,
  AttendeeInput,
  AuditChecklistInstance,
  AuditChecklistItemResult,
  AuditExecutionWorkspace,
  ChecklistProgress,
  ChecklistResultKey,
  ClientAuditSummary,
  ClientAuditView,
  ExecutionFile,
  ExecutionFinding,
  ExecutionPlanHeader,
  ExecutionStep,
  ExecutionStepKey,
  ExecutionUpdate,
  ItemUpdate,
  StepBlocker,
  SyncOperation,
  SyncResult,
  TimeEntry,
  TimeEntryInput,
  TimeSummary,
  WrapUp,
} from '@/lib/api/executionApi'
import type { ClientReportSummary, NarrativeSection, ReportReviewStatus, StageReport, StageReportType, StageReportUpdate } from '@/lib/api/stageReportApi'

/* ── Store ─────────────────────────────────────────────────────────────── */

type CompletedSteps = Partial<Record<Exclude<ExecutionStepKey, 'report'>, string>>

interface DemoExecution {
  id: string
  planId: string
  completed: CompletedSteps
  documentsReviewed: boolean
  preparationNotes: string
  openingHeldAt: string | null
  agendaConfirmed: boolean
  confidentialityConfirmed: boolean
  ictTestDone: boolean
  openingNotes: string
  wrapUps: WrapUp[]
  gradingConsensus: boolean
  teamReviewNotes: string
  closingHeldAt: string | null
  findingsPresented: boolean
  clientPosition: AuditExecutionWorkspace['closing']['clientPosition']
  clientComments: string
  ncResponseDueDate: string
  closingNotes: string
  timeDeviationNote: string
  checklists: AuditChecklistInstance[]
  attendance: Attendee[]
  timeEntries: TimeEntry[]
  files: ExecutionFile[]
  findings: ExecutionFinding[]
  reportId: string | null
  updatedAt: string
}

interface DemoReport {
  id: string
  planId: string
  auditNumber: string
  version: number
  status: 'draft' | 'finalized'
  reportType: StageReportType | null
  narrative: Partial<Record<NarrativeSection, string>>
  recommendation: string
  recommendationOutcome: string | null
  reviewStatus: ReportReviewStatus
  review: StageReport['review']
  updatedAt: string
}

interface DemoState {
  seeded: boolean
  executions: Record<string, DemoExecution>
  reports: Record<string, DemoReport>
}

const KEY = 'execution.demo'
const state = () => loadState<DemoState>(KEY, () => ({ seeded: false, executions: {}, reports: {} }))
const save = () => saveState(KEY, state())
const now = () => new Date().toISOString()
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.round(Math.random() * 1e6).toString(36)}`

const REVIEWER = 'Layla Ibrahim'
const STEP_KEYS: ExecutionStepKey[] = ['preparation', 'opening', 'conduct', 'teamReview', 'closing', 'report']
const NC: ChecklistResultKey[] = ['minorNc', 'majorNc']
const MINUTES_PER_DAY = 480

const fail = (message: string, status = 409, code?: string, details?: Record<string, unknown>): never => {
  throw new ApiError(message, status, undefined, code, details)
}

/* ── Plans ─────────────────────────────────────────────────────────────── */

const findPlan = (idOrNumber: string): AuditPlan => {
  const plan = auditPlans().find((p) => p.id === idOrNumber || p.planNumber === idOrNumber)
  return plan ?? fail('Audit plan not found.', 404)
}

const setPlanStatus = (planId: string, status: AuditPlan['status'], reportId?: string | null) => {
  const list = auditPlans()
  const plan = list.find((p) => p.id === planId)
  if (!plan) return
  plan.status = status
  if (reportId !== undefined) {
    plan.reportId = reportId
    plan.reportStatus = reportId ? 'Draft' : null
  }
  plan.updatedAt = now()
  saveAuditPlans(list)
}

const planSent = (plan: AuditPlan) => plan.status !== 'Draft'

const STAGE_KEY: Record<string, string> = {
  'Stage 1': 'stage1', 'Stage 2': 'stage2', 'Surveillance 1': 'surveillance', 'Surveillance 2': 'surveillance', Recertification: 'recertification', 'Special Audit': 'special', Planning: 'stage1',
}

const STANDARD_PATTERNS: Array<[string, RegExp]> = [
  ['ISO_9001', /(?<![\d-])9001(?!\d)/], ['ISO_14001', /(?<!\d)14001(?!\d)/], ['ISO_45001', /(?<!\d)45001(?!\d)/], ['ISO_22000', /(?<!\d)22000(?!\d)|FSSC/i],
  ['ISO_27001', /(?<!\d)27001(?!\d)/], ['ISO_50001', /(?<!\d)50001(?!\d)/], ['ISO_22301', /(?<!\d)22301(?!\d)/], ['ISO_13485', /(?<!\d)13485(?!\d)/],
  ['ISO_37001', /(?<!\d)37001(?!\d)/], ['ISO_20000_1', /(?<!\d)20000(?!\d)/], ['ISO_39001', /(?<!\d)39001(?!\d)/], ['ISO_41001', /(?<!\d)41001(?!\d)/], ['ISO_21001', /(?<!\d)21001(?!\d)/],
]
const standardCodesOf = (plan: AuditPlan) => STANDARD_PATTERNS.filter(([, re]) => re.test(plan.standardName)).map(([code]) => code)

const header = (plan: AuditPlan): ExecutionPlanHeader => ({
  id: plan.id,
  planNumber: plan.planNumber,
  stage: plan.stage,
  status: plan.status,
  organizationId: plan.organizationId ?? plan.clientCode,
  clientName: plan.clientName,
  standardName: plan.standardName,
  standardCodes: standardCodesOf(plan),
  startDate: plan.proposedStartDate,
  endDate: plan.proposedEndDate,
  timezone: plan.timezone,
  leadAuditor: plan.leadAuditor,
  auditTeam: plan.auditTeam,
  siteName: plan.siteAllocation?.siteName || plan.siteName,
  siteAddress: plan.siteAllocation?.siteAddress || plan.siteAddress,
  remoteEnabled: plan.remoteActivities?.enabled ?? false,
  remotePlatform: plan.remoteActivities?.platform ?? '',
  plannedDays: plan.reviewedDurationDays,
  sentAt: plan.sentAt ?? (planSent(plan) ? plan.updatedAt : null),
  clientConfirmedAt: plan.clientConfirmedAt ?? null,
  agenda: plan.agendaActivities.map((a) => ({ id: a.id, date: a.date, startTime: a.startTime, endTime: a.endTime, activity: a.activity, auditors: a.auditors })),
})

/* ── Checklists ────────────────────────────────────────────────────────── */

const toAuditItem = (item: ChecklistItemData, index: number): AuditChecklistItemResult => ({
  id: uid(`aci${index}`),
  code: item.code,
  clause: item.clause,
  title: item.title,
  titleAr: item.titleAr,
  requirement: item.requirement,
  requirementAr: item.requirementAr,
  guidance: item.guidance,
  guidanceAr: item.guidanceAr,
  evidencePrompts: item.evidencePrompts,
  evidencePromptsAr: item.evidencePromptsAr,
  samplingHint: item.samplingHint,
  samplingHintAr: item.samplingHintAr,
  mandatory: item.mandatory,
  result: null,
  notes: '',
  documentsSampled: [],
  interviewees: [],
  auditorName: '',
  auditedAt: null,
  minutesSpent: null,
  findingId: null,
  findingCode: null,
  updatedAt: now(),
})

export function progressOf(items: AuditChecklistItemResult[]): ChecklistProgress {
  const p: ChecklistProgress = { total: items.length, answered: 0, mandatoryOpen: 0, conforming: 0, observation: 0, ofi: 0, minorNc: 0, majorNc: 0, notAudited: 0, notApplicable: 0 }
  for (const i of items) {
    if (i.result) {
      p.answered += 1
      p[i.result] += 1
    } else if (i.mandatory) p.mandatoryOpen += 1
  }
  return p
}

const itemsFor = (items: ChecklistItemData[], stageKey: string, opts: { onlyCommon?: boolean; skipCommon?: boolean; fssc: boolean }) =>
  items.filter(
    (i) =>
      (!i.stages.length || (i.stages as string[]).includes(stageKey)) &&
      (!opts.onlyCommon || i.common) &&
      (!opts.skipCommon || !i.common) &&
      (opts.fssc || !i.clause.startsWith('FSSC')),
  )

const instance = (source: ChecklistTemplate, items: ChecklistItemData[], auditorName: string, suffix?: { en: string; ar: string }): AuditChecklistInstance => {
  const auditItems = items.map(toAuditItem)
  return {
    id: uid('acl'),
    name: suffix ? `${source.name} ${suffix.en}` : source.name,
    nameAr: suffix && source.nameAr ? `${source.nameAr} ${suffix.ar}` : source.nameAr,
    standardCode: source.standardCode,
    standardLabel: source.standardLabel,
    kind: source.kind,
    sourceType: source.source,
    sourceRef: source.key ?? source.id ?? '',
    sourceVersion: source.version,
    auditorName,
    progress: progressOf(auditItems),
    items: auditItems,
  }
}

async function generateChecklists(plan: AuditPlan): Promise<AuditChecklistInstance[]> {
  const stageKey = STAGE_KEY[plan.stage] ?? 'stage2'
  const codes = standardCodesOf(plan)
  const fssc = /FSSC/i.test(plan.standardName)
  const out: AuditChecklistInstance[] = []
  if (stageKey === 'stage1') {
    const s1 = await checklistSourceFor('STAGE1')
    if (s1) out.push(instance(s1, itemsFor(s1.items ?? [], stageKey, { fssc }), plan.leadAuditor))
  }
  const integrated = codes.length >= 2
  if (integrated) {
    const ims = await checklistSourceFor('IMS')
    if (ims) out.push(instance(ims, itemsFor(ims.items ?? [], stageKey, { fssc }), plan.leadAuditor))
  }
  for (const code of codes) {
    const source = await checklistSourceFor(code)
    if (!source) continue
    const lib = source.source === 'library'
    const items = itemsFor(source.items ?? [], stageKey, { skipCommon: integrated && lib, fssc })
    if (items.length) out.push(instance(source, items, plan.leadAuditor, integrated && lib ? { en: '(specific requirements)', ar: '(المتطلبات الخاصة)' } : undefined))
  }
  return out
}

/* ── Workspace ─────────────────────────────────────────────────────────── */

const blocker = (code: string, message: string, count?: number): StepBlocker => ({ code, message, ...(count !== undefined ? { count } : {}) })

export function summarizeTime(entries: TimeEntry[], plannedDays: number, deviationNote = ''): TimeSummary {
  const actualMinutes = entries.reduce((n, e) => n + e.minutes, 0)
  const round = (m: number) => Math.round((m / MINUTES_PER_DAY) * 100) / 100
  const actualDays = round(actualMinutes)
  const remoteMinutes = entries.filter((e) => e.remote).reduce((n, e) => n + e.minutes, 0)
  const byName = new Map<string, { name: string; minutes: number; remote: number }>()
  for (const e of entries) {
    const row = byName.get(e.auditorName) ?? { name: e.auditorName, minutes: 0, remote: 0 }
    row.minutes += e.minutes
    if (e.remote) row.remote += e.minutes
    byName.set(e.auditorName, row)
  }
  let status: TimeSummary['status'] = 'notStarted'
  if (actualMinutes) status = plannedDays > 0 && actualDays < plannedDays * 0.95 ? 'under' : plannedDays > 0 && actualDays > plannedDays * 1.05 ? 'over' : 'within'
  return {
    plannedDays,
    actualMinutes,
    actualDays,
    remoteDays: round(remoteMinutes),
    remoteSharePercent: actualMinutes ? Math.round((remoteMinutes / actualMinutes) * 100) : 0,
    variancePercent: plannedDays > 0 && actualMinutes ? Math.round(((actualDays - plannedDays) / plannedDays) * 100) : 0,
    status,
    byAuditor: [...byName.values()].map((r) => ({ name: r.name, minutes: r.minutes, days: round(r.minutes), remoteDays: round(r.remote) })),
    entries,
    deviationNote,
  }
}

function blockersOf(plan: AuditPlan, ex: DemoExecution, report: DemoReport | null, time: TimeSummary): Record<ExecutionStepKey, StepBlocker[]> {
  const items = ex.checklists.flatMap((c) => c.items)
  const opening = ex.attendance.filter((a) => a.meeting === 'opening')
  const closing = ex.attendance.filter((a) => a.meeting === 'closing')
  const mandatoryOpen = items.filter((i) => i.mandatory && !i.result).length
  const ncWithout = items.filter((i) => i.result && NC.includes(i.result) && !i.findingId).length
  const drafts = ex.findings.filter((f) => f.status !== 'Submitted').length
  const b: Record<ExecutionStepKey, StepBlocker[]> = { preparation: [], opening: [], conduct: [], teamReview: [], closing: [], report: [] }
  if (!planSent(plan)) b.preparation.push(blocker('planNotSent', 'Send the audit plan to the client first.'))
  if (!plan.teamDeclarations?.availabilityConfirmed || !plan.teamDeclarations?.noConflictsDeclared) b.preparation.push(blocker('teamNotDeclared', 'The audit team must confirm availability and declare no conflicts on the audit plan.'))
  if (!ex.documentsReviewed) b.preparation.push(blocker('documentsNotReviewed', 'Confirm that the client documents were reviewed.'))
  if (!ex.checklists.length) b.preparation.push(blocker('noChecklists', 'Add at least one checklist.'))
  else if (ex.checklists.some((c) => !c.auditorName)) b.preparation.push(blocker('checklistsUnassigned', 'Assign an auditor to every checklist.'))
  if (!ex.agendaConfirmed) b.opening.push(blocker('agendaNotConfirmed', 'Confirm the agenda with the client.'))
  if (!ex.confidentialityConfirmed) b.opening.push(blocker('confidentialityNotConfirmed', 'Confirm the confidentiality statement.'))
  if (plan.remoteActivities?.enabled && !ex.ictTestDone) b.opening.push(blocker('ictTestMissing', 'Record the ICT test for the remote activities (IAF MD 4).'))
  if (!opening.some((a) => a.party === 'Client' && a.signed)) b.opening.push(blocker('noClientSignature', 'At least one client attendee must sign the attendance.'))
  if (!opening.some((a) => a.party === 'Audit team')) b.opening.push(blocker('noTeamAttendee', 'Add the audit team to the attendance.'))
  if (mandatoryOpen) b.conduct.push(blocker('mandatoryItemsOpen', `${mandatoryOpen} mandatory checklist item(s) have no result.`, mandatoryOpen))
  if (ncWithout) b.conduct.push(blocker('ncWithoutFinding', `${ncWithout} nonconforming item(s) have no finding yet.`, ncWithout))
  if (!ex.wrapUps.length) b.teamReview.push(blocker('noWrapUp', 'Record at least one team wrap-up.'))
  if (!ex.gradingConsensus) b.teamReview.push(blocker('noConsensus', 'Confirm the team agreed the grading of the findings.'))
  if (drafts) b.teamReview.push(blocker('findingsNotSubmitted', `${drafts} finding(s) are still drafts.`, drafts))
  if (!ex.findingsPresented) b.closing.push(blocker('findingsNotPresented', 'Confirm the findings were presented to the client.'))
  if (!ex.clientPosition) b.closing.push(blocker('noClientPosition', 'Record whether the client agrees with the findings.'))
  if (!closing.some((a) => a.party === 'Client' && a.signed)) b.closing.push(blocker('noClosingSignature', 'At least one client attendee must sign the closing meeting attendance.'))
  if (ex.findings.some((f) => f.type === 'Nonconformity') && !ex.ncResponseDueDate) b.closing.push(blocker('ncDueDateMissing', 'Set the date by which the client must answer the nonconformities.'))
  if (!time.actualMinutes) b.closing.push(blocker('noTimeRecorded', 'Record the time spent by the audit team.'))
  else if (time.status === 'under' && !ex.timeDeviationNote.trim()) b.closing.push(blocker('timeDeviationUnjustified', 'The time spent is below the planned audit time: record the justification (IAF MD 5).'))
  if (!report) b.report.push(blocker('noReport', 'The audit report opens with the opening meeting.'))
  else if (report.reviewStatus !== 'issued' && report.reviewStatus !== 'acknowledged') b.report.push(blocker('reportNotIssued', 'Review, approve and issue the stage report.'))
  return b
}

function buildWorkspace(plan: AuditPlan, ex: DemoExecution | undefined): AuditExecutionWorkspace {
  const h = header(plan)
  const report = ex?.reportId ? state().reports[ex.reportId] ?? null : null
  if (!ex) {
    return {
      started: false,
      id: null,
      plan: h,
      reportId: null,
      reportStatus: null,
      reportReviewStatus: null,
      currentStep: 'preparation',
      steps: STEP_KEYS.map((key, i) => ({ key, status: i === 0 ? 'current' : 'todo', completedAt: null, blockers: [] })),
      updatedAt: null,
    } as unknown as AuditExecutionWorkspace
  }
  for (const c of ex.checklists) c.progress = progressOf(c.items)
  const time = summarizeTime(ex.timeEntries, plan.reviewedDurationDays, ex.timeDeviationNote)
  const blockers = blockersOf(plan, ex, report, time)
  const reportDone = report?.reviewStatus === 'issued' || report?.reviewStatus === 'acknowledged'
  const done = (key: ExecutionStepKey) => (key === 'report' ? reportDone : Boolean(ex.completed[key]))
  const firstOpen = STEP_KEYS.find((key) => !done(key)) ?? 'report'
  const steps: ExecutionStep[] = STEP_KEYS.map((key) => ({
    key,
    status: done(key) ? 'done' : key === firstOpen ? 'current' : 'todo',
    completedAt: key === 'report' ? null : ex.completed[key] ?? null,
    blockers: done(key) ? [] : blockers[key],
  }))
  return {
    started: true,
    id: ex.id,
    plan: h,
    reportId: ex.reportId,
    reportStatus: report?.status ?? null,
    reportReviewStatus: report?.reviewStatus ?? null,
    currentStep: firstOpen,
    steps,
    preparation: { planSent: planSent(plan), clientConfirmed: Boolean(plan.clientConfirmedAt) || plan.status !== 'Draft', teamDeclared: Boolean(plan.teamDeclarations?.availabilityConfirmed && plan.teamDeclarations?.noConflictsDeclared), documentsReviewed: ex.documentsReviewed, notes: ex.preparationNotes },
    opening: { heldAt: ex.openingHeldAt, agendaConfirmed: ex.agendaConfirmed, confidentialityConfirmed: ex.confidentialityConfirmed, ictRequired: Boolean(plan.remoteActivities?.enabled), ictTestDone: ex.ictTestDone, notes: ex.openingNotes, attendance: ex.attendance.filter((a) => a.meeting === 'opening') },
    conduct: { progress: progressOf(ex.checklists.flatMap((c) => c.items)) },
    teamReview: { wrapUps: ex.wrapUps, gradingConsensus: ex.gradingConsensus, notes: ex.teamReviewNotes },
    closing: { heldAt: ex.closingHeldAt, findingsPresented: ex.findingsPresented, clientPosition: ex.clientPosition, clientComments: ex.clientComments, ncResponseDueDate: ex.ncResponseDueDate, notes: ex.closingNotes, attendance: ex.attendance.filter((a) => a.meeting === 'closing') },
    checklists: ex.checklists,
    findings: ex.findings,
    time,
    files: ex.files,
    updatedAt: ex.updatedAt,
  }
}

const execOf = (planId: string) => state().executions[planId]
const started = (planIdOrNumber: string) => {
  const plan = findPlan(planIdOrNumber)
  const ex = execOf(plan.id)
  if (!ex) fail('Start the audit execution first.', 409, 'EXECUTION_NOT_STARTED')
  return { plan, ex: ex as DemoExecution }
}
const commit = (plan: AuditPlan, ex: DemoExecution) => {
  ex.updatedAt = now()
  state().executions[plan.id] = ex
  save()
  return clone(buildWorkspace(findPlan(plan.id), ex))
}
const assertOpen = (ex: DemoExecution, step: Exclude<ExecutionStepKey, 'report'>) => {
  if (ex.completed[step]) fail('This step is completed. Reopen it to change its data.', 409, 'STEP_COMPLETED')
}

const FIELD_STEP: Record<keyof ExecutionUpdate, Exclude<ExecutionStepKey, 'report'>> = {
  documentsReviewed: 'preparation', preparationNotes: 'preparation',
  openingHeldAt: 'opening', agendaConfirmed: 'opening', confidentialityConfirmed: 'opening', ictTestDone: 'opening', openingNotes: 'opening',
  gradingConsensus: 'teamReview', teamReviewNotes: 'teamReview',
  closingHeldAt: 'closing', findingsPresented: 'closing', clientPosition: 'closing', clientComments: 'closing', ncResponseDueDate: 'closing', closingNotes: 'closing', timeDeviationNote: 'closing',
}

const emptyExecution = (planId: string): DemoExecution => ({
  id: uid('exe'), planId, completed: {}, documentsReviewed: false, preparationNotes: '', openingHeldAt: null, agendaConfirmed: false,
  confidentialityConfirmed: false, ictTestDone: false, openingNotes: '', wrapUps: [], gradingConsensus: false, teamReviewNotes: '',
  closingHeldAt: null, findingsPresented: false, clientPosition: null, clientComments: '', ncResponseDueDate: '', closingNotes: '',
  timeDeviationNote: '', checklists: [], attendance: [], timeEntries: [], files: [], findings: [], reportId: null, updatedAt: now(),
})

const newReport = (plan: AuditPlan): DemoReport => ({
  id: `demo-sr-${plan.planNumber.toLowerCase()}`,
  planId: plan.id,
  auditNumber: plan.planNumber,
  version: 1,
  status: 'draft',
  reportType: null,
  narrative: {},
  recommendation: '',
  recommendationOutcome: null,
  reviewStatus: 'notSubmitted',
  review: { submittedAt: null, submittedBy: null, reviewerName: null, reviewedAt: null, comments: '', issuedAt: null, issuedBy: null, issuedVersion: null, acknowledgedAt: null, acknowledgedBy: null, acknowledgementNote: '', events: [] },
  updatedAt: now(),
})

/* ── Seed ──────────────────────────────────────────────────────────────── */

const SIGNATURE_STUB = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

function answerAll(ex: DemoExecution, auditor: string, at: string) {
  for (const c of ex.checklists) {
    c.auditorName = auditor
    for (const i of c.items) {
      i.result = 'conforming'
      i.notes = 'Verified by interview and record review.'
      i.auditorName = auditor
      i.auditedAt = at
    }
  }
}

function raise(ex: DemoExecution, item: AuditChecklistItemResult, finding: Omit<ExecutionFinding, 'id' | 'checklistItemId' | 'nonconformityId' | 'nonconformityCode'>) {
  const f: ExecutionFinding = { ...finding, id: uid('fnd'), checklistItemId: item.id, nonconformityId: null, nonconformityCode: null }
  item.findingId = f.id
  item.findingCode = f.code
  ex.findings.push(f)
}

async function seedExecution(planId: string, opts: { reportStatus: ReportReviewStatus; planStatus: AuditPlan['status'] }) {
  const plan = auditPlans().find((p) => p.id === planId)
  if (!plan) return
  const ex = emptyExecution(plan.id)
  ex.checklists = await generateChecklists(plan)
  const start = `${plan.proposedStartDate}T08:00:00.000Z`
  const end = `${plan.proposedEndDate}T15:00:00.000Z`
  answerAll(ex, plan.leadAuditor, start)
  const items = ex.checklists.flatMap((c) => c.items)
  const ncItem = items.find((i) => i.clause.includes('9.3.1.2 a')) ?? items.find((i) => i.clause === '8.5.4') ?? items[1]
  const obsItem = items.find((i) => i.clause === '7.5') ?? items[2]
  ncItem.result = 'minorNc'
  ncItem.notes = 'The documented scope leaves out the second site that the application lists.'
  ncItem.documentsSampled = ['Management system manual rev 3, section 1']
  ncItem.interviewees = ['Quality manager']
  raise(ex, ncItem, { code: `F-${plan.planNumber.slice(4)}1`, type: 'Nonconformity', classification: 'minor', requirementRef: `${ex.checklists[0]?.standardLabel ?? plan.standardName}, Clause ${ncItem.clause}`, statement: 'The documented scope does not cover all sites in the application.', dueDate: plan.proposedEndDate, status: 'Submitted' })
  obsItem.result = 'observation'
  obsItem.notes = 'Two procedures still show the previous logo and revision block.'
  raise(ex, obsItem, { code: `F-${plan.planNumber.slice(4)}2`, type: 'Observation', classification: 'observation', requirementRef: `Clause ${obsItem.clause}`, statement: 'Document templates are not fully aligned after the last revision.', dueDate: '', status: 'Submitted' })
  ex.documentsReviewed = true
  ex.preparationNotes = 'Manual, procedures and internal audit report reviewed before the audit.'
  ex.agendaConfirmed = true
  ex.confidentialityConfirmed = true
  ex.ictTestDone = true
  ex.openingHeldAt = start
  const client = plan.primaryContactName || 'Client representative'
  ex.attendance = [
    { id: uid('att'), meeting: 'opening', name: client, position: 'Quality Manager', party: 'Client', email: plan.primaryContactEmail, remote: false, signed: true, signatureType: 'typed', signature: SIGNATURE_STUB, signedAt: start },
    { id: uid('att'), meeting: 'opening', name: plan.leadAuditor, position: 'Lead Auditor', party: 'Audit team', email: '', remote: false, signed: true, signatureType: 'drawn', signature: SIGNATURE_STUB, signedAt: start },
    { id: uid('att'), meeting: 'closing', name: client, position: 'Quality Manager', party: 'Client', email: plan.primaryContactEmail, remote: false, signed: true, signatureType: 'typed', signature: SIGNATURE_STUB, signedAt: end },
  ]
  ex.wrapUps = [{ id: uid('wu'), date: plan.proposedStartDate, notes: 'Scope coverage gap confirmed; grading agreed as minor.', byName: plan.leadAuditor, createdAt: end }]
  ex.gradingConsensus = true
  ex.findingsPresented = true
  ex.clientPosition = 'agreed'
  ex.ncResponseDueDate = plan.proposedEndDate
  ex.closingHeldAt = end
  const minutes = Math.round(plan.reviewedDurationDays * MINUTES_PER_DAY)
  ex.timeEntries = [
    { id: uid('te'), auditorName: plan.leadAuditor, date: plan.proposedStartDate, minutes: Math.round(minutes * 0.6), activity: 'On-site audit', remote: false, createdAt: end },
    { id: uid('te'), auditorName: plan.auditTeam[1] ?? plan.leadAuditor, date: plan.proposedStartDate, minutes: minutes - Math.round(minutes * 0.6), activity: 'Remote document review', remote: true, createdAt: end },
  ]
  for (const step of ['preparation', 'opening', 'conduct', 'teamReview', 'closing'] as const) ex.completed[step] = end
  const report = newReport(plan)
  report.narrative = {
    objectives: plan.auditObjectives,
    criteria: `${plan.standardName}; the client's management system documentation; applicable legal requirements.`,
    deviations: 'No deviation from the audit plan.',
    significantIssues: 'One minor nonconformity on the documented scope.',
    effectiveness: 'The management system is implemented and maintained in the areas sampled.',
    objectivesAchieved: 'The audit objectives were achieved.',
    unresolvedIssues: 'None.',
    stage1Readiness: 'Ready for Stage 2 once the scope covers every site.',
    stage1Concerns: 'Scope statement omits the second site (Clause 4.3).',
    internalAuditReliance: 'The internal audit programme covered all clauses and can be relied on for sampling.',
    managementReviewReliance: 'The last management review addressed every required input.',
  }
  report.recommendation = plan.stage === 'Stage 1' ? 'Proceed to Stage 2 after the scope statement is corrected.' : 'Recommend certification once the minor nonconformity is closed.'
  report.recommendationOutcome = plan.stage === 'Stage 1' ? 'proceedWithConcerns' : 'grant'
  report.reviewStatus = opts.reportStatus
  report.review.submittedAt = end
  report.review.submittedBy = plan.leadAuditor
  report.review.events.push({ id: uid('ev'), action: 'SUBMITTED', byName: plan.leadAuditor, comment: '', version: 1, createdAt: end })
  if (opts.reportStatus === 'issued') {
    report.status = 'finalized'
    Object.assign(report.review, { reviewerName: REVIEWER, reviewedAt: end, comments: 'Content complete.', issuedAt: end, issuedBy: REVIEWER, issuedVersion: 1 })
    report.review.events.push({ id: uid('ev'), action: 'APPROVED', byName: REVIEWER, comment: 'Content complete.', version: 1, createdAt: end })
    report.review.events.push({ id: uid('ev'), action: 'ISSUED', byName: REVIEWER, comment: '', version: 1, createdAt: end })
  }
  ex.reportId = report.id
  const s = state()
  s.executions[plan.id] = ex
  s.reports[report.id] = report
  setPlanStatus(plan.id, opts.planStatus, report.id)
}

/**
 * Al Noor (the client with an active certification agreement in the preview) is extending its
 * certification to ISO 9001: a Stage 1 plan is added once, cloned from its ISO 22000 audit.
 */
function ensureExtensionPlan(): string | null {
  const list = auditPlans()
  const existing = list.find((p) => p.id === 'plan-0275')
  if (existing) return existing.id
  const base = list.find((p) => p.id === 'plan-0251')
  if (!base) return null
  const plan: AuditPlan = {
    ...clone(base),
    id: 'plan-0275',
    planNumber: 'AUD-0275',
    stage: 'Stage 1',
    standardName: 'Quality Management System (ISO 9001:2015)',
    reviewedDurationCode: 'DUR-0275',
    reviewedDurationDays: 1.5,
    totalEffortHours: 12,
    proposedStartDate: '2026-10-19',
    proposedEndDate: '2026-10-20',
    durationDays: 2,
    status: 'Planned',
    auditObjectives: 'Evaluate documented information, site conditions and readiness for the Stage 2 audit.',
    remoteActivities: { enabled: true, activities: ['Document review'], platform: 'Microsoft Teams', notes: '' },
    reportId: null,
    reportStatus: null,
    agendaActivities: base.agendaActivities.slice(0, 4).map((a, i) => ({ ...a, id: `act-0275-${i}`, date: i < 2 ? '2026-10-19' : '2026-10-20' })),
    createdAt: '2026-09-28T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
  }
  list.unshift(plan)
  saveAuditPlans(list)
  return plan.id
}

async function ensureSeed() {
  if (state().seeded) return
  state().seeded = true
  const extension = ensureExtensionPlan()
  if (extension) await seedExecution(extension, { reportStatus: 'inReview', planStatus: 'Under review' })
  await seedExecution('plan-0251', { reportStatus: 'issued', planStatus: 'Completed' })
  save()
}

/* ── Public: CAB workspace ─────────────────────────────────────────────── */

export async function getWorkspace(planId: string): Promise<AuditExecutionWorkspace> {
  await ensureSeed()
  await wait(80)
  const plan = findPlan(planId)
  return clone(buildWorkspace(plan, execOf(plan.id)))
}

export async function start(planId: string): Promise<AuditExecutionWorkspace> {
  await ensureSeed()
  await wait()
  const plan = findPlan(planId)
  const existing = execOf(plan.id)
  if (existing) return clone(buildWorkspace(plan, existing))
  if (plan.status === 'Completed') fail('A completed audit plan cannot be executed again.')
  if (plan.stage === 'Planning') fail('A planning visit has no audit execution.', 422)
  const ex = emptyExecution(plan.id)
  ex.checklists = await generateChecklists(plan)
  return commit(plan, ex)
}

export async function update(planId: string, body: ExecutionUpdate): Promise<AuditExecutionWorkspace> {
  await wait(120)
  const { plan, ex } = started(planId)
  for (const key of Object.keys(body) as Array<keyof ExecutionUpdate>) assertOpen(ex, FIELD_STEP[key])
  Object.assign(ex, Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v ?? (k === 'clientPosition' ? null : '')])))
  return commit(plan, ex)
}

export async function completeStep(planId: string, step: ExecutionStepKey): Promise<AuditExecutionWorkspace> {
  await wait()
  if (step === 'report') fail('The report step completes when the stage report is issued.', 422)
  const { plan, ex } = started(planId)
  const key = step as Exclude<ExecutionStepKey, 'report'>
  if (ex.completed[key]) fail('This step is already completed.', 409, 'STEP_COMPLETED')
  const index = STEP_KEYS.indexOf(step)
  const previous = STEP_KEYS.slice(0, index).find((k) => k !== 'report' && !ex.completed[k as Exclude<ExecutionStepKey, 'report'>])
  if (previous) fail('Complete the previous steps first.', 422, 'PREVIOUS_STEP_OPEN', { blockers: [blocker('previousStepOpen', `Complete the ${previous} step first.`)] })
  const report = ex.reportId ? state().reports[ex.reportId] ?? null : null
  const open = blockersOf(plan, ex, report, summarizeTime(ex.timeEntries, plan.reviewedDurationDays))[step]
  if (open.length) fail(`Step cannot be completed: ${open.map((x) => x.message).join(' ')}`, 422, 'STEP_GATES_OPEN', { blockers: open })
  const at = now()
  ex.completed[key] = at
  if (step === 'opening') {
    ex.openingHeldAt ??= at
    if (!ex.reportId) {
      const r = newReport(plan)
      state().reports[r.id] = r
      ex.reportId = r.id
    }
    setPlanStatus(plan.id, plan.status === 'Planned' || plan.status === 'Rescheduled' ? 'In progress' : plan.status, ex.reportId)
  }
  if (step === 'closing') {
    ex.closingHeldAt ??= at
    if (plan.status === 'In progress') setPlanStatus(plan.id, 'Under review')
  }
  return commit(plan, ex)
}

export async function reopenStep(planId: string, step: ExecutionStepKey): Promise<AuditExecutionWorkspace> {
  await wait()
  if (step === 'report') fail('Reopen the stage report from the report page.', 422)
  const { plan, ex } = started(planId)
  const key = step as Exclude<ExecutionStepKey, 'report'>
  if (!ex.completed[key]) fail('This step is not completed.')
  const next = STEP_KEYS[STEP_KEYS.indexOf(step) + 1]
  if (next !== 'report' && ex.completed[next as Exclude<ExecutionStepKey, 'report'>]) fail('Reopen the later steps first.')
  delete ex.completed[key]
  return commit(plan, ex)
}

export async function addWrapUp(planId: string, body: { date: string; notes: string }): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  assertOpen(ex, 'teamReview')
  ex.wrapUps.push({ id: uid('wu'), date: body.date, notes: body.notes, byName: plan.leadAuditor, createdAt: now() })
  return commit(plan, ex)
}

export async function deleteWrapUp(planId: string, wrapUpId: string): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  assertOpen(ex, 'teamReview')
  ex.wrapUps = ex.wrapUps.filter((w) => w.id !== wrapUpId)
  return commit(plan, ex)
}

export async function addChecklist(planId: string, body: { sourceRef: string; auditorName?: string }): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  if (ex.completed.closing) fail('Checklist results are locked after the closing meeting.', 409, 'STEP_COMPLETED')
  const source = await checklistByRef(body.sourceRef)
  const stageKey = STAGE_KEY[plan.stage] ?? 'stage2'
  let items = itemsFor(source.items ?? [], stageKey, { fssc: /FSSC/i.test(plan.standardName) })
  if (!items.length) items = source.items ?? []
  ex.checklists.push(instance(source, items, body.auditorName || plan.leadAuditor))
  return commit(plan, ex)
}

export async function assignChecklist(planId: string, checklistId: string, auditorName: string): Promise<AuditExecutionWorkspace> {
  await wait(100)
  const { plan, ex } = started(planId)
  const c = ex.checklists.find((x) => x.id === checklistId) ?? fail('Checklist not found.', 404)
  c.auditorName = auditorName
  return commit(plan, ex)
}

export async function removeChecklist(planId: string, checklistId: string): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  const c = ex.checklists.find((x) => x.id === checklistId) ?? fail('Checklist not found.', 404)
  if (c.items.some((i) => i.result || i.findingId)) fail('This checklist already has results and cannot be removed.')
  ex.checklists = ex.checklists.filter((x) => x.id !== checklistId)
  return commit(plan, ex)
}

function applyItem(plan: AuditPlan, item: AuditChecklistItemResult, body: ItemUpdate, owner: string) {
  if (body.result !== undefined) {
    item.result = body.result
    item.auditedAt = body.result ? now() : null
    if (body.auditorName === undefined && body.result) item.auditorName = owner || plan.leadAuditor
  }
  if (body.notes !== undefined) item.notes = body.notes
  if (body.documentsSampled !== undefined) item.documentsSampled = body.documentsSampled
  if (body.interviewees !== undefined) item.interviewees = body.interviewees
  if (body.minutesSpent !== undefined) item.minutesSpent = body.minutesSpent
  if (body.auditorName !== undefined) item.auditorName = body.auditorName
  item.updatedAt = body.clientUpdatedAt ?? now()
}

const findItem = (ex: DemoExecution, itemId: string) => {
  for (const c of ex.checklists) {
    const item = c.items.find((i) => i.id === itemId)
    if (item) return { checklist: c, item }
  }
  return fail('Checklist item not found.', 404)
}

export async function updateItem(planId: string, itemId: string, body: ItemUpdate): Promise<AuditChecklistItemResult> {
  await wait(90)
  const { plan, ex } = started(planId)
  if (ex.completed.closing) fail('Checklist results are locked after the closing meeting. Reopen the closing meeting to change them.', 409, 'STEP_COMPLETED')
  const { checklist, item } = findItem(ex, itemId)
  if (body.clientUpdatedAt && item.updatedAt > body.clientUpdatedAt) fail('A newer change of this item is already saved.', 409, 'STALE_CHANGE')
  applyItem(plan, item, body, checklist.auditorName)
  commit(plan, ex)
  return clone(item)
}

export async function sync(planId: string, operations: SyncOperation[]): Promise<SyncResult> {
  await wait()
  const { plan, ex } = started(planId)
  const results: SyncResult['results'] = []
  for (const op of operations) {
    try {
      if (ex.completed.closing) fail('Checklist results are locked after the closing meeting.')
      const { checklist, item } = findItem(ex, op.itemId)
      if (item.updatedAt > op.at) {
        results.push({ opId: op.opId, status: 'stale' })
        continue
      }
      applyItem(plan, item, { ...op.data, clientUpdatedAt: op.at }, checklist.auditorName)
      results.push({ opId: op.opId, status: 'applied' })
    } catch (err) {
      results.push({ opId: op.opId, status: 'failed', message: err instanceof Error ? err.message : 'Failed' })
    }
  }
  return { results, workspace: commit(plan, ex) }
}

export async function addAttendee(planId: string, body: AttendeeInput): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  assertOpen(ex, body.meeting)
  ex.attendance.push({
    id: uid('att'), meeting: body.meeting, name: body.name, position: body.position ?? '', party: body.party, email: body.email ?? '', remote: Boolean(body.remote),
    signed: Boolean(body.signature), signatureType: body.signature ? body.signatureType ?? 'drawn' : null, signature: body.signature ?? null, signedAt: body.signature ? now() : null,
  })
  return commit(plan, ex)
}

export async function updateAttendee(planId: string, attendeeId: string, body: Partial<AttendeeInput> & { signature?: string | null }): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  const a = ex.attendance.find((x) => x.id === attendeeId) ?? fail('Attendee not found.', 404)
  assertOpen(ex, a.meeting)
  if (body.name !== undefined) a.name = body.name
  if (body.position !== undefined) a.position = body.position
  if (body.party !== undefined) a.party = body.party
  if (body.remote !== undefined) a.remote = body.remote
  if (body.signature !== undefined) {
    a.signature = body.signature
    a.signed = Boolean(body.signature)
    a.signatureType = body.signature ? body.signatureType ?? 'drawn' : null
    a.signedAt = body.signature ? now() : null
  }
  return commit(plan, ex)
}

export async function removeAttendee(planId: string, attendeeId: string): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  const a = ex.attendance.find((x) => x.id === attendeeId) ?? fail('Attendee not found.', 404)
  assertOpen(ex, a.meeting)
  ex.attendance = ex.attendance.filter((x) => x.id !== attendeeId)
  return commit(plan, ex)
}

export async function addTimeEntry(planId: string, body: TimeEntryInput): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  assertOpen(ex, 'closing')
  ex.timeEntries.push({ id: uid('te'), auditorName: body.auditorName, date: body.date, minutes: body.minutes, activity: body.activity ?? '', remote: Boolean(body.remote), createdAt: now() })
  return commit(plan, ex)
}

export async function removeTimeEntry(planId: string, entryId: string): Promise<AuditExecutionWorkspace> {
  await wait()
  const { plan, ex } = started(planId)
  assertOpen(ex, 'closing')
  ex.timeEntries = ex.timeEntries.filter((e) => e.id !== entryId)
  return commit(plan, ex)
}

/** Photos are shrunk to 640 px before they are kept in the browser store. */
function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, 640 / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => resolve('')
      img.src = String(reader.result)
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

export async function uploadFile(planId: string, file: File, meta: { checklistItemId?: string; caption?: string; takenAt?: string }): Promise<ExecutionFile> {
  const { plan, ex } = started(planId)
  if (meta.checklistItemId) findItem(ex, meta.checklistItemId)
  const url = await shrinkImage(file)
  const saved: ExecutionFile = {
    id: uid('file'), checklistItemId: meta.checklistItemId ?? null, name: file.name, url, mimeType: file.type, size: file.size,
    caption: meta.caption ?? '', uploadedBy: plan.leadAuditor, takenAt: meta.takenAt ?? null, createdAt: now(),
  }
  ex.files.push(saved)
  commit(plan, ex)
  return clone(saved)
}

export async function removeFile(planId: string, fileId: string): Promise<void> {
  await wait()
  const { plan, ex } = started(planId)
  ex.files = ex.files.filter((f) => f.id !== fileId)
  commit(plan, ex)
}

export async function linkFinding(planId: string, itemId: string, finding: Pick<ExecutionFinding, 'code' | 'type' | 'classification' | 'requirementRef' | 'statement' | 'dueDate' | 'status'>): Promise<void> {
  const { plan, ex } = started(planId)
  const { item } = findItem(ex, itemId)
  raise(ex, item, finding)
  commit(plan, ex)
}

/* ── Public: client portal ─────────────────────────────────────────────── */

const clientPlans = () => scopeToSession(auditPlans(), (p) => p.clientCode).filter((p) => p.status !== 'Draft' && p.stage !== 'Planning')

export async function listClientAudits(): Promise<ClientAuditSummary[]> {
  await ensureSeed()
  await wait(80)
  return clientPlans().map((p) => {
    const ex = execOf(p.id)
    const ws = buildWorkspace(p, ex)
    const report = ex?.reportId ? state().reports[ex.reportId] : null
    const issued = report && (report.reviewStatus === 'issued' || report.reviewStatus === 'acknowledged')
    return {
      planId: p.id,
      planNumber: p.planNumber,
      stage: p.stage,
      standardName: p.standardName,
      startDate: p.proposedStartDate,
      endDate: p.proposedEndDate,
      executionStarted: Boolean(ex),
      currentStep: ex ? ws.currentStep : null,
      openingDone: Boolean(ex?.completed.opening),
      closingDone: Boolean(ex?.completed.closing),
      findingsToAnswer: issued ? (ex?.findings ?? []).filter((f) => f.type === 'Nonconformity').length : 0,
      reportId: issued ? report.id : null,
      reportAcknowledged: report?.reviewStatus === 'acknowledged',
    }
  })
}

export async function getClientAudit(planId: string): Promise<ClientAuditView> {
  await ensureSeed()
  await wait(80)
  const plan = clientPlans().find((p) => p.id === planId || p.planNumber === planId) ?? fail('Audit not found.', 404)
  const ex = execOf(plan.id)
  const h = header(plan)
  const report = ex?.reportId ? state().reports[ex.reportId] : null
  const issued = Boolean(report && (report.reviewStatus === 'issued' || report.reviewStatus === 'acknowledged'))
  const attendee = (a: Attendee) => ({ name: a.name, position: a.position, party: a.party, remote: a.remote, signed: a.signed })
  return {
    plan: { id: h.id, planNumber: h.planNumber, stage: h.stage, clientName: h.clientName, standardName: h.standardName, startDate: h.startDate, endDate: h.endDate, leadAuditor: h.leadAuditor, auditTeam: h.auditTeam, siteName: h.siteName, remoteEnabled: h.remoteEnabled, remotePlatform: h.remotePlatform, agenda: h.agenda },
    executionStarted: Boolean(ex),
    steps: STEP_KEYS.map((key) => ({ key, done: key === 'report' ? issued : Boolean(ex?.completed[key as Exclude<ExecutionStepKey, 'report'>]) })),
    opening: { done: Boolean(ex?.completed.opening), heldAt: ex?.openingHeldAt ?? null, attendance: (ex?.attendance ?? []).filter((a) => a.meeting === 'opening').map(attendee) },
    closing: { done: Boolean(ex?.completed.closing), heldAt: ex?.closingHeldAt ?? null, clientPosition: ex?.clientPosition ?? null, ncResponseDueDate: ex?.ncResponseDueDate ?? '', attendance: (ex?.attendance ?? []).filter((a) => a.meeting === 'closing').map(attendee) },
    presentedFindings: ex?.completed.closing ? ex.findings.filter((f) => f.status === 'Submitted').map((f) => ({ code: f.code, type: f.type, classification: f.classification, requirementRef: f.requirementRef, statement: f.statement })) : [],
    findingsToAnswer: issued ? (ex?.findings ?? []).filter((f) => f.type === 'Nonconformity').map((f) => ({ id: f.id, code: f.code.replace(/^F-/, 'NC-'), classification: f.classification, description: `${f.requirementRef}: ${f.statement}`, dueDate: ex?.ncResponseDueDate ?? f.dueDate, status: 'OPEN' })) : [],
    report: issued && report ? { id: report.id, issuedAt: report.review.issuedAt, version: report.review.issuedVersion ?? report.version, acknowledged: report.reviewStatus === 'acknowledged', acknowledgedAt: report.review.acknowledgedAt } : null,
  }
}

/* ── Stage reports ─────────────────────────────────────────────────────── */

const TYPE_OF_STAGE: Record<string, StageReportType> = {
  'Stage 1': 'stage1', 'Stage 2': 'stage2', 'Surveillance 1': 'surveillance', 'Surveillance 2': 'surveillance', Recertification: 'recertification', 'Special Audit': 'special',
}
const OUTCOMES: Record<StageReportType, string[]> = {
  stage1: ['proceedStage2', 'proceedWithConcerns', 'notReady'],
  stage2: ['grant', 'refer'],
  surveillance: ['continue', 'refer'],
  recertification: ['recertify', 'refer'],
  special: ['continue', 'refer'],
  transfer: ['acceptTransfer', 'refer'],
}
const COMMON: NarrativeSection[] = ['objectives', 'criteria', 'deviations', 'significantIssues', 'effectiveness', 'objectivesAchieved', 'unresolvedIssues']
const SECTIONS: Record<StageReportType, NarrativeSection[]> = {
  stage1: [...COMMON, 'stage1Readiness', 'stage1Concerns'],
  stage2: [...COMMON, 'internalAuditReliance', 'managementReviewReliance'],
  surveillance: [...COMMON, 'changes', 'complaints', 'internalAuditReliance', 'managementReviewReliance', 'marksUse'],
  recertification: [...COMMON, 'changes', 'complaints', 'internalAuditReliance', 'managementReviewReliance', 'marksUse'],
  special: [...COMMON, 'marksUse'],
  transfer: ['objectives', 'criteria', 'transferReview', 'unresolvedIssues'],
}
const REQUIRED: NarrativeSection[] = ['objectives', 'effectiveness', 'objectivesAchieved', 'stage1Readiness', 'transferReview']

const findReport = (reportId: string) => state().reports[reportId] ?? fail('Audit report not found.', 404)

function reportDto(report: DemoReport, forClient = false): StageReport {
  const plan = findPlan(report.planId)
  const ex = execOf(plan.id)
  const type = report.reportType ?? TYPE_OF_STAGE[plan.stage] ?? 'stage2'
  const items = ex ? ex.checklists.flatMap((c) => c.items) : []
  const progress = progressOf(items)
  const time = summarizeTime(ex?.timeEntries ?? [], plan.reviewedDurationDays, ex?.timeDeviationNote ?? '')
  const row = (f: ExecutionFinding) => ({ id: f.id, code: f.code, classification: f.classification, requirementRef: f.requirementRef, statement: f.statement, objectiveEvidence: '', dueDate: f.dueDate, nonconformityCode: report.status === 'finalized' && f.type === 'Nonconformity' ? f.code.replace(/^F-/, 'NC-') : null })
  const submitted = (ex?.findings ?? []).filter((f) => f.status === 'Submitted')
  const ncs = submitted.filter((f) => f.type === 'Nonconformity')
  const client = CLIENTS.find((c) => c.code === plan.clientCode)
  const rep = ex?.attendance.find((a) => a.meeting === 'opening' && a.party === 'Client')
  const suggestions: Partial<Record<NarrativeSection, string>> = forClient
    ? {}
    : {
        objectives: plan.auditObjectives,
        criteria: `${plan.standardName}; the client's management system documentation; applicable legal and contractual requirements.`,
        deviations: time.status === 'under' ? `Audit time delivered: ${time.actualDays} of ${time.plannedDays} planned days. ${ex?.timeDeviationNote ?? ''}`.trim() : 'No deviation from the audit plan.',
        significantIssues: ncs.length ? `${ncs.filter((f) => f.classification !== 'minor').length} major and ${ncs.filter((f) => f.classification === 'minor').length} minor nonconformities were raised.` : 'No significant issues affecting the audit programme were identified.',
        effectiveness: items.length ? `${progress.answered} of ${progress.total} checklist requirements were audited; ${progress.conforming} were found conforming.` : '',
        objectivesAchieved: items.length && progress.answered === progress.total ? 'The audit objectives were achieved.' : '',
        unresolvedIssues: ex?.clientPosition && ex.clientPosition !== 'agreed' ? 'The client did not agree with all findings at the closing meeting.' : 'None.',
        stage1Readiness: type === 'stage1' ? (ncs.length ? 'Ready for Stage 2 once the concerns listed are addressed.' : 'The client is ready for the Stage 2 audit.') : '',
        stage1Concerns: type === 'stage1' ? submitted.map((f) => `${f.requirementRef}: ${f.statement}`).join('\n') : '',
      }
  return clone({
    id: report.id,
    auditPlanId: plan.id,
    auditNumber: report.auditNumber,
    planNumber: plan.planNumber,
    version: report.version,
    status: report.status,
    reportType: type,
    stage: plan.stage,
    reviewStatus: report.reviewStatus,
    editable: !forClient && (report.reviewStatus === 'notSubmitted' || report.reviewStatus === 'changesRequested'),
    header: {
      cab: { name: DEMO_CAB.name, legalName: DEMO_CAB.legalName, address: DEMO_CAB.address, accreditation: 'SAAC, ISO/IEC 17021-1', logoUrl: null },
      client: { name: plan.clientName, address: client?.address ?? '', representative: rep ? [rep.name, rep.position].filter(Boolean).join(', ') : plan.primaryContactName, logoUrl: null },
      auditType: plan.stage,
      standard: plan.standardName,
      scope: plan.scopeSummary,
      sites: [plan.siteName, plan.siteAddress].filter(Boolean).join(', '),
      startDate: plan.proposedStartDate,
      endDate: plan.proposedEndDate,
      remote: { enabled: Boolean(plan.remoteActivities?.enabled), platform: plan.remoteActivities?.platform ?? '', activities: plan.remoteActivities?.activities ?? [], sharePercent: time.remoteSharePercent },
      leadAuditor: plan.leadAuditor,
      team: [plan.leadAuditor, ...plan.auditTeam.filter((n) => n !== plan.leadAuditor)].map((name, i) => ({ name, role: i === 0 ? 'Lead Auditor' : 'Auditor' })),
      plannedDays: plan.reviewedDurationDays,
      actualDays: time.actualDays,
    },
    auto: {
      checklists: {
        total: progress.total,
        answered: progress.answered,
        byResult: { conforming: progress.conforming, observation: progress.observation, ofi: progress.ofi, minorNc: progress.minorNc, majorNc: progress.majorNc, notAudited: progress.notAudited, notApplicable: progress.notApplicable },
        perChecklist: (ex?.checklists ?? []).map((c) => ({ name: c.name, total: c.items.length, answered: c.items.filter((i) => i.result).length, nonconforming: c.items.filter((i) => i.result && NC.includes(i.result)).length })),
      },
      findings: {
        majors: ncs.filter((f) => f.classification === 'major' || f.classification === 'critical').map(row),
        minors: ncs.filter((f) => f.classification === 'minor').map(row),
        observations: submitted.filter((f) => f.type === 'Observation').map(row),
        opportunities: submitted.filter((f) => f.type === 'Opportunity').map(row),
        drafts: (ex?.findings.length ?? 0) - submitted.length,
      },
      time: { plannedDays: time.plannedDays, actualDays: time.actualDays, remoteSharePercent: time.remoteSharePercent, status: time.status },
    },
    sections: SECTIONS[type],
    requiredSections: SECTIONS[type].filter((s) => REQUIRED.includes(s)),
    narrative: Object.fromEntries(SECTIONS[type].map((s) => [s, report.narrative[s] ?? ''])),
    suggestions,
    recommendation: report.recommendation,
    recommendationOutcome: report.recommendationOutcome,
    outcomes: OUTCOMES[type],
    review: forClient ? { ...report.review, comments: '', events: [] } : report.review,
    decisionId: null,
    updatedAt: report.updatedAt,
  })
}

const saveReport = (report: DemoReport) => {
  report.updatedAt = now()
  state().reports[report.id] = report
  save()
  return reportDto(report)
}
const event = (report: DemoReport, action: StageReport['review']['events'][number]['action'], byName: string, comment = '') =>
  report.review.events.push({ id: uid('ev'), action, byName, comment, version: report.version, createdAt: now() })

export async function getStageReport(reportId: string): Promise<StageReport> {
  await ensureSeed()
  await wait(80)
  return reportDto(findReport(reportId))
}

export async function updateStageReport(reportId: string, body: StageReportUpdate): Promise<StageReport> {
  await wait(120)
  const report = findReport(reportId)
  if (report.reviewStatus !== 'notSubmitted' && report.reviewStatus !== 'changesRequested') fail('The report is in review or issued and cannot be edited.', 409, 'REPORT_LOCKED')
  const plan = findPlan(report.planId)
  const type = body.reportType ?? report.reportType ?? TYPE_OF_STAGE[plan.stage] ?? 'stage2'
  if (body.reportType) report.reportType = body.reportType
  if (body.narrative) report.narrative = { ...report.narrative, ...body.narrative }
  if (body.recommendation !== undefined) report.recommendation = body.recommendation
  if (body.recommendationOutcome !== undefined) {
    if (body.recommendationOutcome && !OUTCOMES[type].includes(body.recommendationOutcome)) fail('This outcome does not apply to this report type.', 422)
    report.recommendationOutcome = body.recommendationOutcome || null
  } else if (report.recommendationOutcome && !OUTCOMES[type].includes(report.recommendationOutcome)) report.recommendationOutcome = null
  return saveReport(report)
}

export async function submitStageReport(reportId: string): Promise<StageReport> {
  await wait()
  const report = findReport(reportId)
  if (report.reviewStatus !== 'notSubmitted' && report.reviewStatus !== 'changesRequested') fail('The report is already in review or issued.')
  const dto = reportDto(report)
  const missing = dto.requiredSections.filter((s) => !(report.narrative[s] ?? '').trim())
  const blockers: Array<StepBlocker & { sections?: string[] }> = []
  if (missing.length) blockers.push({ code: 'sectionsMissing', message: `Complete the report sections: ${missing.join(', ')}.`, sections: missing })
  if (report.recommendation.trim().length <= 10) blockers.push(blocker('recommendationMissing', 'Record the auditor recommendation.'))
  if (!report.recommendationOutcome) blockers.push(blocker('outcomeMissing', 'Choose the recommended outcome.'))
  if (dto.auto.findings.drafts) blockers.push(blocker('findingsDraft', 'Every finding must be submitted.'))
  if (blockers.length) fail(`Submission blocked: ${blockers.map((b) => b.message).join(' ')}`, 422, 'REPORT_GATES_OPEN', { blockers })
  const plan = findPlan(report.planId)
  report.reviewStatus = 'inReview'
  Object.assign(report.review, { submittedAt: now(), submittedBy: plan.leadAuditor, reviewerName: null, reviewedAt: null })
  event(report, 'SUBMITTED', plan.leadAuditor)
  return saveReport(report)
}

export async function reviewStageReport(reportId: string, body: { decision: 'approve' | 'return'; comments?: string }): Promise<StageReport> {
  await wait()
  const report = findReport(reportId)
  if (report.reviewStatus !== 'inReview') fail('The report is not waiting for technical review.')
  if (body.decision === 'return' && !body.comments?.trim()) fail('Explain what must change before returning the report.', 422)
  report.reviewStatus = body.decision === 'approve' ? 'approved' : 'changesRequested'
  Object.assign(report.review, { reviewerName: REVIEWER, reviewedAt: now(), comments: body.comments ?? '' })
  event(report, body.decision === 'approve' ? 'APPROVED' : 'RETURNED', REVIEWER, body.comments ?? '')
  return saveReport(report)
}

export async function issueStageReport(reportId: string): Promise<StageReport> {
  await wait()
  const report = findReport(reportId)
  if (report.reviewStatus !== 'approved') fail('Only an approved report can be issued.')
  const plan = findPlan(report.planId)
  report.status = 'finalized'
  report.reviewStatus = 'issued'
  Object.assign(report.review, { issuedAt: now(), issuedBy: REVIEWER, issuedVersion: report.version })
  event(report, 'ISSUED', REVIEWER)
  const client = CLIENTS.find((c) => c.code === plan.clientCode)
  notify('client', 'audit_report_issued', { ref: report.auditNumber, stage: plan.stage }, `/portal/audit-reports/${report.id}`, client?.id)
  setPlanStatus(plan.id, plan.status, report.id)
  return saveReport(report)
}

export async function listClientReports(): Promise<ClientReportSummary[]> {
  await ensureSeed()
  await wait(80)
  const ids = new Set(clientPlans().map((p) => p.id))
  return Object.values(state().reports)
    .filter((r) => ids.has(r.planId) && (r.reviewStatus === 'issued' || r.reviewStatus === 'acknowledged'))
    .map((r) => {
      const plan = findPlan(r.planId)
      return { id: r.id, auditNumber: r.auditNumber, auditPlanId: plan.id, stage: plan.stage, reportType: r.reportType ?? TYPE_OF_STAGE[plan.stage] ?? 'stage2', standard: plan.standardName, issuedAt: r.review.issuedAt, version: r.review.issuedVersion ?? r.version, acknowledged: r.reviewStatus === 'acknowledged' }
    })
}

const issuedForClient = (reportId: string) => {
  const report = state().reports[reportId]
  const visible = report && clientPlans().some((p) => p.id === report.planId) && (report.reviewStatus === 'issued' || report.reviewStatus === 'acknowledged')
  return visible ? report : fail('Audit report not found.', 404)
}

export async function getClientReport(reportId: string): Promise<StageReport> {
  await ensureSeed()
  await wait(80)
  return reportDto(issuedForClient(reportId), true)
}

export async function acknowledgeReport(reportId: string, body: { name?: string; note?: string }): Promise<StageReport> {
  await wait()
  const report = issuedForClient(reportId)
  if (report.reviewStatus === 'acknowledged') fail('This report is already acknowledged.')
  const plan = findPlan(report.planId)
  report.reviewStatus = 'acknowledged'
  Object.assign(report.review, { acknowledgedAt: now(), acknowledgedBy: body.name || plan.primaryContactName, acknowledgementNote: body.note ?? '' })
  event(report, 'ACKNOWLEDGED', body.name || plan.primaryContactName, body.note ?? '')
  notify('cab', 'audit_report_acknowledged', { ref: report.auditNumber, client: plan.clientName }, `/cab/audit-reporting/report/${report.id}`)
  saveReport(report)
  return reportDto(report, true)
}
