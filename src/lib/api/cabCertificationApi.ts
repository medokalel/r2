/**
 * Certification cycles API (ISO/IEC 17021-1 three-year cycles).
 *
 *   GET  /cab/certification-cycles?searchQuery&country&lifecycleStatus&dueWithinDays → CertificationCycle[]
 *   GET  /cab/certification-cycles/:id                       → CertificationCycleDetail (uuid or CYC-0001)
 *   POST /cab/certification-cycles/:id/schedule-next-event   → ScheduleCycleEventResult
 *   GET  /cab/certification-cycles/certificate-candidates    → issued certificates without a cycle
 *   POST /cab/certification-cycles                           → CertificationCycleDetail (manual cycle)
 *   POST /cab/certification-cycles/:id/requests              → CycleRequest (scope / site change, transfer)
 *   PATCH /cab/certification-cycles/:id/requests/:requestId  → CycleRequest (approve / reject / complete)
 * Certificate actions (suspend, reinstate, withdraw, reissue, extend) use cabCertificatesApi.
 *
 * The server opens a cycle when a certificate is issued (a recertification opens the next
 * one); its status follows the certificate and its events follow the client's audit plans.
 * Scheduling the next event drafts its audit plan. In the preview (demo mode) cycles live
 * in the shared demo store. CSV export stays client-side.
 */
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { saveAuditPlan, type AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { isDemoMode, loadState, saveState } from '@/lib/api/demo/demoStore'
import { auditPlans, certificates, cycleListItem, cycles, saveCycles, scopeToSession } from '@/lib/api/demo/records'
import { APPLICATIONS, CLIENTS } from '@/lib/api/demo/dataset'
import { getCertificateHistory, type CertificateHistory, type CertificateStatus } from '@/lib/api/cabCertificatesApi'

export type CertificationLifecycleStatus = 'active' | 'upcoming' | 'suspended' | 'expired'
export type CertificationStageStatus = 'completed' | 'upcoming' | 'pending'

export interface CertificationCycleStage {
  id: string
  label: string
  date: string
  status: CertificationStageStatus
}

export interface CertificationUpcomingActivity {
  id: string
  date: string
  activity: string
  type: 'Audit' | 'Task'
  status: 'Planned' | 'Open' | 'Done'
}

export interface CertificationCycle {
  id: string
  cycleId: string
  applicationId: string
  clientId: string
  /** Client organization id (opens the application submission flow for this client). */
  organizationId?: string
  clientName: string
  primaryContactName: string
  primaryContactEmail: string
  country: string
  certificateStandard: string
  certificateStandardLabel: string
  lifecycleStatus: CertificationLifecycleStatus
  lifecycleStatusLabel: string
  cycleStartDate: string
  cycleEndDate: string
  nextSurveillanceDue: string
  nextSurveillanceDueInDays: number
  stages: CertificationCycleStage[]
  upcomingActivities: CertificationUpcomingActivity[]
}

/** Cycle event lifecycle — drives the dot/badge styling on the manage page. */
export type CycleEventStatus = 'next' | 'planned' | 'completed'

export interface CertificationCycleEvent {
  id: string
  /** i18n key suffix under `cab.manageCycle.eventTypes.*` (e.g. `surveillance`). */
  type: string
  typeLabel: string
  windowStart: string
  windowEnd: string
  status: CycleEventStatus
  statusLabel: string
  /** Audit plan that covers this event (e.g. `AUD-0007`), when one is drafted. */
  auditPlanNumber?: string | null
}

export interface CertificationCycleNextEvent extends CertificationCycleEvent {
  /** Negative when the target window has already passed. */
  dueInDays: number
  responsibleCoordinator: string
  scheduled: boolean
  schedulingStatusLabel: string
}

export interface CertificationActiveCertificate {
  certificateNumber: string
  standard: string
  standardLabel: string
  status: CertificationLifecycleStatus
  statusLabel: string
  validFrom: string
  validUntil: string
}

export interface CertificationCycleRecord {
  id: string
  title: string
  date: string
  status: string
}

/** One collapsible row in the "More details" section. */
export interface CertificationCycleRecordGroup {
  /** i18n key suffix under `cab.manageCycle.records.*`. */
  id: string
  count: number
  /** Shown as the trailing pill; falls back to a "no records" pill when 0. */
  highlightCount?: number
  records: CertificationCycleRecord[]
}

export type CycleRequestType = 'scopeChange' | 'siteChange' | 'transfer'
export type CycleRequestStatus = 'open' | 'approved' | 'rejected' | 'completed'

/** Scope change, site change or transfer request logged against the cycle. */
export interface CycleRequest {
  id: string
  code: string
  type: CycleRequestType
  status: CycleRequestStatus
  statusLabel: string
  title: string
  details: string
  metadata: Record<string, string>
  requestedBy: string
  requestedAt: string
  decidedBy: string | null
  decidedAt: string | null
  decisionNote: string | null
}

export interface CycleAudit {
  id: string
  planNumber: string
  stage: string
  status: string
  startDate: string
  leadAuditor: string
  reportId: string | null
  reportNumber: string | null
  reportStatus: string | null
  findingsCount: number
  nonconformityCount: number
  openNonconformityCount: number
}

export interface CycleFinding {
  id: string
  code: string
  type: string
  classification: string | null
  clause: string
  statement: string
  auditNumber: string
  reportId: string
  nonconformityId: string | null
  nonconformityCode: string | null
  status: string
}

export interface CycleDocument {
  id: string
  kind: 'certificate' | 'auditPlan' | 'auditReport' | 'decision'
  title: string
  date: string
  status: string
  /** In-app route that opens the record. */
  link: string
}

export interface CycleHistoryEntry {
  id: string
  date: string
  title: string
  detail: string
  by: string
}

export interface CertificationCycleDetail extends CertificationCycle {
  cycleRangeLabel: string
  cycleStatusLabel: string
  initialCertificationDate: string
  certificationExpiryDate: string
  primaryContactPhone: string
  certificate: CertificationActiveCertificate
  nextEvent: CertificationCycleNextEvent | null
  upcomingEvents: CertificationCycleEvent[]
  recordGroups: CertificationCycleRecordGroup[]
  /* Manage-page tabs (detail endpoint). */
  origin?: 'automatic' | 'manual'
  notes?: string
  certificateId?: string
  certificateStatus?: CertificateStatus
  certificateScope?: string
  certificateHistory?: CertificateHistory
  audits?: CycleAudit[]
  findings?: CycleFinding[]
  sites?: Array<{ id: string; name: string; address: string; employeesInScope: number }>
  requests?: CycleRequest[]
  documents?: CycleDocument[]
  relatedApplications?: Array<{ id: string; applicationNumber: string; status: string; standards: string[]; submittedAt: string; linkedToCycle: boolean }>
  history?: CycleHistoryEntry[]
}

export interface CertificationCycleFilterParams {
  searchQuery?: string
  dueWithinDays?: number
  country?: string
  lifecycleStatus?: string
}

/** Optional dates of the plan drafted for the next event (`YYYY-MM-DD`). */
export interface ScheduleCycleEventPayload {
  proposedStartDate?: string
  proposedEndDate?: string
}

export interface ScheduleCycleEventResult {
  cycle: CertificationCycleDetail
  auditPlan: { id: string; planNumber: string; stage: AuditPlan['stage']; status: AuditPlan['status'] }
  /** Build-plan page of the drafted plan. */
  link: string
}

const cyclePath = (cycleId: string) => `/cab/certification-cycles/${encodeURIComponent(cycleId)}`

// Demo mode: cycles live in the shared demo store and are opened when a certificate is
// issued; their audits come from the audit plan store (lib/api/demo/records.ts).
const all = () => cycles()
const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))
const findDemoCycle = (cycleId: string) => {
  const needle = cycleId.trim().toLowerCase()
  return all().find((item) => item.id.toLowerCase() === needle || item.cycleId.toLowerCase() === needle)
}

export async function getCertificationCycles(
  filters: CertificationCycleFilterParams = {},
): Promise<CertificationCycle[]> {
  if (!isDemoMode()) {
    const query = new URLSearchParams()
    if (filters.searchQuery?.trim()) query.set('searchQuery', filters.searchQuery.trim())
    if (filters.country && filters.country !== 'all') query.set('country', filters.country)
    if (filters.lifecycleStatus && filters.lifecycleStatus !== 'all') query.set('lifecycleStatus', filters.lifecycleStatus)
    if (filters.dueWithinDays !== undefined) query.set('dueWithinDays', String(filters.dueWithinDays))
    const qs = query.toString()
    return authorizedRequest<CertificationCycle[]>(`/cab/certification-cycles${qs ? `?${qs}` : ''}`)
  }
  await wait()
  const query = filters.searchQuery?.trim().toLowerCase()

  return scopeToSession(all(), (c) => c.clientId).map(cycleListItem).filter((cycle) => {
    if (query) {
      const haystack = `${cycle.clientName} ${cycle.clientId} ${cycle.certificateStandard}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    if (filters.country && filters.country !== 'all' && cycle.country !== filters.country) {
      return false
    }
    if (
      filters.lifecycleStatus &&
      filters.lifecycleStatus !== 'all' &&
      cycle.lifecycleStatus !== filters.lifecycleStatus
    ) {
      return false
    }
    if (filters.dueWithinDays !== undefined && cycle.nextSurveillanceDueInDays > filters.dueWithinDays) {
      return false
    }
    return true
  })
}

/**
 * Loads one cycle for the manage page. Accepts either the internal id
 * (`cyc-0001`) or the human-facing cycle id (`CYC-0001`) so links from the
 * register and from external notifications both resolve.
 */
export async function getCertificationCycleDetail(
  cycleId: string,
): Promise<CertificationCycleDetail | null> {
  if (!isDemoMode()) return authorizedRequest<CertificationCycleDetail>(cyclePath(cycleId))
  await wait()
  const detail = findDemoCycle(cycleId)
  return detail ? withDemoExtras(JSON.parse(JSON.stringify(detail)) as CertificationCycleDetail) : null
}

/* ───────────── Preview: tab data built from the shared demo store ───────────── */

const DEMO_REQUESTS_KEY = 'cycleRequests'
const demoRequests = () => loadState<Record<string, CycleRequest[]>>(DEMO_REQUESTS_KEY, () => ({}))
const REQUEST_STATUS_LABEL: Record<CycleRequestStatus, string> = { open: 'Open', approved: 'Approved', rejected: 'Rejected', completed: 'Completed' }
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

async function withDemoExtras(detail: CertificationCycleDetail): Promise<CertificationCycleDetail> {
  const client = CLIENTS.find((c) => c.code === detail.clientId || c.id === detail.clientId)
  const cert = certificates().find((c) => c.certificateNumber === detail.certificate.certificateNumber)
  const history = cert ? await getCertificateHistory(cert.id).catch(() => undefined) : undefined
  const plans = auditPlans().filter((p) => p.clientCode === detail.clientId || (client && p.clientCode === client.code))
  const requests = demoRequests()[detail.id] ?? []
  const apps = APPLICATIONS.filter((a) => client && a.clientId === client.id)
  const byType = (type: CycleRequestType) => requests.filter((r) => r.type === type)
  const records = (list: CycleRequest[]) => list.map((r) => ({ id: r.id, title: `${r.code} · ${r.title}`, date: fmt(r.requestedAt), status: r.statusLabel }))
  return {
    ...detail,
    origin: detail.origin ?? 'automatic',
    notes: detail.notes ?? '',
    certificateId: cert?.id,
    certificateStatus: cert?.status,
    certificateScope: cert?.scope ?? '',
    certificateHistory: history,
    audits: plans.map((p) => ({
      id: p.id,
      planNumber: p.planNumber,
      stage: p.stage,
      status: p.status,
      startDate: p.proposedStartDate,
      leadAuditor: p.leadAuditor,
      reportId: p.reportId ?? null,
      reportNumber: p.reportId ? p.planNumber : null,
      reportStatus: p.reportStatus ?? null,
      findingsCount: 0,
      nonconformityCount: 0,
      openNonconformityCount: 0,
    })),
    findings: detail.findings ?? [],
    sites: (client?.sites ?? []).map((site) => ({ id: site.id, name: site.name, address: site.address, employeesInScope: 0 })),
    requests,
    documents: [
      ...(cert ? [{ id: cert.id, kind: 'certificate' as const, title: `${cert.certificateNumber} · ${cert.standard}`, date: cert.issuedAt.slice(0, 10), status: cert.status, link: '/cab/certificates' }] : []),
      ...plans.map((p) => ({ id: p.id, kind: 'auditPlan' as const, title: `${p.planNumber} · ${p.stage}`, date: p.proposedStartDate, status: p.status, link: `/cab/audit-planning/build/${p.planNumber}` })),
    ],
    relatedApplications: apps.map((a) => ({
      id: a.id,
      applicationNumber: a.orderNumber,
      status: a.status,
      standards: [a.standard],
      submittedAt: (a.submittedAt ?? a.createdAt).slice(0, 10),
      linkedToCycle: a.orderNumber === detail.applicationId,
    })),
    history: [
      ...(history?.events ?? []).map((e) => ({ id: e.id, date: e.at, title: `${e.type} (${e.certificateNumber})`, detail: e.reason, by: e.by })),
      ...requests.map((r) => ({ id: r.id, date: r.requestedAt, title: `${r.code} · ${r.title}`, detail: r.details, by: r.requestedBy })),
    ].sort((a, b) => b.date.localeCompare(a.date)),
    recordGroups: detail.recordGroups.map((g) =>
      g.id === 'scopeChanges'
        ? { ...g, count: byType('scopeChange').length, records: records(byType('scopeChange')) }
        : g.id === 'siteChanges'
          ? { ...g, count: byType('siteChange').length, records: records(byType('siteChange')) }
          : g.id === 'transfers'
            ? { ...g, count: byType('transfer').length, records: records(byType('transfer')) }
            : g,
    ),
  }
}

/* ───────────── Manual cycles and the request log ───────────── */

export interface CycleCertificateCandidate {
  id: string
  certificateNumber: string
  clientName: string
  standard: string
  status: CertificateStatus
  issueDate: string
  expiryDate: string
}

export interface CreateCertificationCyclePayload {
  /** An issued / suspended certificate without a cycle … */
  certificateId?: string
  /** … or a certificate migrated from another system (created ISSUED with the cycle). */
  certificate?: {
    organizationId: string
    standard: string
    scope: string
    certificateNumber: string
    issueDate: string
    effectiveDate?: string
    expiryDate: string
  }
  type: 'initial' | 'recertification'
  initialCertificationDate?: string
  notes?: string
}

export interface CreateCycleRequestPayload {
  type: CycleRequestType
  title: string
  details?: string
  metadata?: Record<string, string>
}

/** Issued certificates of the CAB that have no cycle yet. */
export async function listCycleCertificateCandidates(): Promise<CycleCertificateCandidate[]> {
  if (!isDemoMode()) return authorizedRequest<CycleCertificateCandidate[]>('/cab/certification-cycles/certificate-candidates')
  await wait()
  const withCycle = new Set(all().map((c) => c.certificate.certificateNumber))
  return certificates()
    .filter((c) => (c.status === 'ISSUED' || c.status === 'SUSPENDED') && !withCycle.has(c.certificateNumber))
    .map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      clientName: c.clientName,
      standard: c.standard,
      status: c.status,
      issueDate: c.issuedAt.slice(0, 10),
      expiryDate: c.validUntil?.slice(0, 10) ?? '',
    }))
}

/** Registers a cycle by hand (existing certificate or migrated data). */
export async function createCertificationCycle(payload: CreateCertificationCyclePayload): Promise<CertificationCycleDetail> {
  if (!isDemoMode()) {
    return authorizedRequest<CertificationCycleDetail>('/cab/certification-cycles', { method: 'POST', body: JSON.stringify(payload) })
  }
  await wait()
  const source = payload.certificateId ? certificates().find((c) => c.id === payload.certificateId) : null
  if (payload.certificateId && !source) throw new Error('Certificate not found.')
  const client = source ? CLIENTS.find((c) => c.id === source.clientId) : CLIENTS.find((c) => c.id === payload.certificate?.organizationId)
  const template = all()[0]
  if (!template) throw new Error('No certification cycle template in the preview data.')
  const number = String(all().length + 1).padStart(4, '0')
  const issue = source ? source.issuedAt.slice(0, 10) : payload.certificate?.issueDate ?? ''
  const expiry = source ? source.validUntil?.slice(0, 10) ?? '' : payload.certificate?.expiryDate ?? ''
  const created: CertificationCycleDetail = {
    ...JSON.parse(JSON.stringify(template)),
    id: `cyc-${number}`,
    cycleId: `CYC-${number}`,
    clientId: client?.code ?? '',
    organizationId: client?.id,
    clientName: client?.name ?? source?.clientName ?? '',
    country: client?.country ?? '',
    certificateStandard: source?.standard ?? payload.certificate?.standard ?? '',
    certificateStandardLabel: source?.standard ?? payload.certificate?.standard ?? '',
    lifecycleStatus: 'active',
    lifecycleStatusLabel: 'Active',
    cycleStartDate: fmt(issue),
    cycleEndDate: fmt(expiry),
    initialCertificationDate: fmt(payload.initialCertificationDate ?? issue),
    certificationExpiryDate: fmt(expiry),
    certificate: {
      certificateNumber: source?.certificateNumber ?? payload.certificate?.certificateNumber ?? '',
      standard: source?.standard ?? payload.certificate?.standard ?? '',
      standardLabel: source?.standard ?? payload.certificate?.standard ?? '',
      status: 'active',
      statusLabel: 'Active',
      validFrom: fmt(issue),
      validUntil: fmt(expiry),
    },
    origin: 'manual',
    notes: payload.notes ?? '',
  }
  all().unshift(created)
  saveCycles()
  return withDemoExtras(created)
}

/** Logs a scope change, site change or transfer request against the cycle. */
export async function createCycleRequest(cycleId: string, payload: CreateCycleRequestPayload): Promise<CycleRequest> {
  if (!isDemoMode()) {
    return authorizedRequest<CycleRequest>(`${cyclePath(cycleId)}/requests`, { method: 'POST', body: JSON.stringify(payload) })
  }
  await wait()
  const cycle = findDemoCycle(cycleId)
  if (!cycle) throw new Error('Certification cycle not found.')
  const state = demoRequests()
  const count = Object.values(state).reduce((sum, list) => sum + list.length, 0) + 1
  const request: CycleRequest = {
    id: `cr-${Date.now()}`,
    code: `CR-${String(count).padStart(4, '0')}`,
    type: payload.type,
    status: 'open',
    statusLabel: REQUEST_STATUS_LABEL.open,
    title: payload.title,
    details: payload.details ?? '',
    metadata: payload.metadata ?? {},
    requestedBy: 'CAB Admin',
    requestedAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
  }
  state[cycle.id] = [request, ...(state[cycle.id] ?? [])]
  saveState(DEMO_REQUESTS_KEY, state)
  return request
}

/** Approves, rejects or completes a request (open → approved | rejected; approved → completed | rejected). */
export async function decideCycleRequest(
  cycleId: string,
  requestId: string,
  status: Exclude<CycleRequestStatus, 'open'>,
  decisionNote?: string,
): Promise<CycleRequest> {
  if (!isDemoMode()) {
    return authorizedRequest<CycleRequest>(`${cyclePath(cycleId)}/requests/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(decisionNote ? { decisionNote } : {}) }),
    })
  }
  await wait()
  const cycle = findDemoCycle(cycleId)
  const list = cycle ? demoRequests()[cycle.id] ?? [] : []
  const request = list.find((r) => r.id === requestId)
  if (!cycle || !request) throw new Error('Request not found.')
  const allowed = request.status === 'open' ? ['approved', 'rejected'] : request.status === 'approved' ? ['completed', 'rejected'] : []
  if (!allowed.includes(status)) throw new Error(`A ${request.status} request cannot become ${status}.`)
  Object.assign(request, { status, statusLabel: REQUEST_STATUS_LABEL[status], decidedBy: 'CAB Admin', decidedAt: new Date().toISOString(), decisionNote: decisionNote ?? null })
  saveState(DEMO_REQUESTS_KEY, demoRequests())
  return { ...request }
}

const isoDay = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10)

/**
 * Drafts the audit plan of the cycle's next event (Surveillance 1 / 2 or Recertification).
 * Fails when the next event already has a plan or the cycle is closed.
 */
export async function scheduleNextCycleEvent(
  cycleId: string,
  payload: ScheduleCycleEventPayload = {},
): Promise<ScheduleCycleEventResult> {
  if (!isDemoMode()) {
    return authorizedRequest<ScheduleCycleEventResult>(`${cyclePath(cycleId)}/schedule-next-event`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
  await wait()
  const cycle = findDemoCycle(cycleId)
  if (!cycle) throw new Error('Certification cycle not found.')
  const next = cycle.nextEvent
  if (!next || cycle.lifecycleStatus === 'expired') throw new Error('No further audits can be scheduled for this cycle.')
  if (next.scheduled) throw new Error('The next audit of this cycle is already scheduled.')

  const upcomingStage = cycle.stages.find((stage) => stage.status === 'upcoming')?.id
  const stage: AuditPlan['stage'] =
    next.type === 'recertification' ? 'Recertification' : upcomingStage === 'surveillance-2' ? 'Surveillance 2' : 'Surveillance 1'
  const start = payload.proposedStartDate ?? isoDay(21)
  const plan = await saveAuditPlan({
    clientName: cycle.clientName,
    clientCode: cycle.clientId,
    country: cycle.country,
    stage,
    applicationNumber: cycle.applicationId,
    standardName: `${cycle.certificateStandardLabel} (${cycle.certificate.standard})`,
    primaryContactName: cycle.primaryContactName,
    primaryContactEmail: cycle.primaryContactEmail,
    primaryContactPhone: cycle.primaryContactPhone,
    proposedStartDate: start,
    proposedEndDate: payload.proposedEndDate ?? start,
    durationDays: 1,
    reviewedDurationDays: 1,
    status: 'Draft',
  })

  cycle.nextEvent = { ...next, scheduled: true, schedulingStatusLabel: 'Scheduled', auditPlanNumber: plan.planNumber }
  saveCycles()
  return {
    cycle: JSON.parse(JSON.stringify(cycle)) as CertificationCycleDetail,
    auditPlan: { id: plan.id, planNumber: plan.planNumber, stage: plan.stage, status: plan.status },
    link: `/cab/audit-planning/build/${plan.planNumber}`,
  }
}

export function certificationCyclesToCsv(cycles: CertificationCycle[]): string {
  const header = ['Cycle ID', 'Client', 'Standard', 'Country', 'Status', 'Next surveillance due']
  const rows = cycles.map((cycle) => [
    cycle.cycleId,
    cycle.clientName,
    cycle.certificateStandard,
    cycle.country,
    cycle.lifecycleStatusLabel,
    cycle.nextSurveillanceDue,
  ])
  return [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}