/**
 * CAB Audit Reporting — the audit reporting workspace of one audit (evidence
 * tasks, findings, auditor recommendation, finalization) and its domain rules.
 *
 * Real endpoints (all under the CAB, scoped to the signed-in CAB):
 *   GET   /cab/audit-reports?search&status&auditPlanId
 *   GET   /cab/audit-reports/:reportId
 *   PATCH /cab/audit-reports/:reportId                       (recommendation)
 *   POST  /cab/audit-reports/:reportId/evidence
 *   POST  /cab/audit-reports/:reportId/findings              (draft, or `submit: true`)
 *   POST  /cab/audit-reports/:reportId/finalize               raises the nonconformities and opens the decision
 *   POST  /cab/audit-reports/:reportId/reopen                 next draft version
 * In the preview (demo mode) one illustrative workspace lives in the shared demo store.
 *
 * Tenant rule: same org / site / contact / document IDs within each
 * CAB-client relationship; never cross-tenant sharing.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode, loadState, saveState, clone, wait } from '@/lib/api/demo/demoStore'
import { notSet } from '@/lib/emptyValue'

export interface TenantScope {
  cabId: string
  clientCode: string
  organizationId: string
  siteId: string
  contactId: string
  documentIds: string[]
}

export const DEMO_SCOPE: TenantScope = {
  cabId: 'CAB-010',
  clientCode: 'CL-0001',
  organizationId: 'ORG-001 · Al Noor Food Industries',
  siteId: 'SITE-001 · Riyadh (Main)',
  contactId: 'CTC-011 · Sara Ali · Client contact',
  documentIds: ['DOC-101 HACCP plan', 'DOC-102 Temp records Mar'],
}

/** Stable field keys — must stay stable across CAB + portal. */
export const FIELD_KEYS = {
  findingType: 'finding.type',
  classification: 'finding.classification',
  requirementRef: 'finding.requirementRef',
  evidenceLink: 'finding.evidenceLink',
  statement: 'finding.statement',
  objectiveEvidence: 'finding.objectiveEvidence',
  dueDate: 'finding.dueDate',
  process: 'finding.process',
  contact: 'finding.responsibleContact',
} as const

export interface SchemeClassificationOption {
  value: string
  label: string
  dueRule: string
}

/**
 * Classification + due dates come from configured scheme rules.
 * No universal major/minor deadline is applied automatically.
 */
export const SCHEME_RULES = {
  scheme: 'FSMS Scheme (configured)',
  version: 'Scheme rules v3.2',
  classifications: [
    { value: 'critical', label: 'Critical (per scheme rules)', dueRule: 'Due per scheme rules (configured)' },
    { value: 'major', label: 'Major (per scheme rules)', dueRule: 'Due per scheme rules (configured)' },
    { value: 'minor', label: 'Minor (per scheme rules)', dueRule: 'Due per scheme rules (configured)' },
    { value: 'observation', label: 'Observation (per scheme rules)', dueRule: 'Due per scheme rules (configured)' },
  ] as SchemeClassificationOption[],
  note: 'Classification and due dates follow the configured scheme rules for this audit. No universal major/minor deadline applies.',
}

/** Display label of a classification value ('' when unclassified). */
export function classificationLabel(value: string): string {
  return SCHEME_RULES.classifications.find((c) => c.value === value)?.label ?? ''
}

/* ── Workspace types (response contract of /cab/audit-reports) ─────────── */

export type AuditFindingType = 'Nonconformity' | 'Observation' | 'Opportunity'
export type AuditFindingClassification = '' | 'critical' | 'major' | 'minor' | 'observation'
export type AuditEvidenceStatus = 'Open' | 'Submitted' | 'Verified' | 'Closed'

export interface AuditEvidenceTask {
  id: string
  /** Reference shown to users, e.g. "EV-0101". */
  code: string
  description: string
  auditRef: string
  requirementRef: string
  /** YYYY-MM-DD or '' */
  dueDate: string
  status: AuditEvidenceStatus
}

export interface AuditFinding {
  id: string
  /** Reference shown to users, e.g. "F-0024". */
  code: string
  type: AuditFindingType
  classification: AuditFindingClassification
  requirementRef: string
  statement: string
  objectiveEvidence: string
  linkedEvidence: string[]
  /** YYYY-MM-DD or '' */
  dueDate: string
  process: string
  responsibleContact: string
  comments: string
  status: 'Draft' | 'Submitted'
  /** The register entry raised when the report was finalized. */
  nonconformityId: string | null
  nonconformityCode: string | null
}

export interface AuditTeamMember {
  id: string | null
  name: string
  role: string | null
}

export interface AuditAgendaRow {
  time: string
  session: string
  clauses: string
  auditor: string
  status: string
}

export interface AuditReport {
  id: string
  auditPlanId: string
  auditNumber: string
  stage: string
  standard: string
  scope: string
  applicationId: string | null
  clientId: string
  clientName: string
  siteName: string
  contactName: string
  documentRefs: string[]
  auditTeam: AuditTeamMember[]
  leadAuditorName: string
  agenda: AuditAgendaRow[]
  recommendation: string
  version: number
  status: 'draft' | 'finalized'
  frozen: boolean
  finalizedAt: string | null
  finalizedBy: string | null
  evidence: AuditEvidenceTask[]
  findings: AuditFinding[]
  /** Certification decision opened by a Stage 2 / recertification report. */
  decisionId: string | null
  createdAt: string
  updatedAt: string
}

export interface AuditReportSummary {
  id: string
  auditPlanId: string
  auditNumber: string
  stage: string
  clientId: string
  clientName: string
  status: 'draft' | 'finalized'
  version: number
  findingsTotal: number
  updatedAt: string
}

export interface EvidenceTaskInput {
  description: string
  requirementRef: string
  auditRef?: string
  dueDate?: string
}

export interface FindingInput {
  type: AuditFindingType
  classification: AuditFindingClassification
  requirementRef: string
  statement: string
  objectiveEvidence: string
  linkedEvidence: string[]
  dueDate: string
  process: string
  responsibleContact: string
  comments: string
  /** true submits the finding (gates enforced); false keeps a draft. */
  submit: boolean
  /** Audit checklist item the finding is raised from (audit execution); the API links the two. */
  checklistItemId?: string
}

/** CAB-client scope printed in the workspace banner. */
export interface WorkspaceScope {
  org: string
  site: string
  contact: string
  docs: string
}

/** Banner scope of a report (organization, site, client contact, documents). */
export function reportScope(report: AuditReport | null): WorkspaceScope {
  if (!report) return { org: notSet(), site: notSet(), contact: notSet(), docs: notSet() }
  return {
    org: report.clientName || notSet(),
    site: report.siteName || notSet(),
    contact: report.contactName || notSet(),
    docs: report.documentRefs.join(' · ') || notSet(),
  }
}

/* ── Domain rules ──────────────────────────────────────────────────────── */

export interface SubmissionGate {
  id: string
  label: string
  hint: string
  passed: boolean
}

export function validateFindingForSubmit(input: {
  findingType: string
  classification: string
  requirementRef: string
  evidenceText: string
  evidenceLinks: string[]
  statement: string
}): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!input.findingType) errors.push('Finding type is required on submission.')
  if (!input.classification) errors.push('Classification (scheme rules) is required on submission.')
  if (!input.requirementRef.trim()) errors.push('Requirement reference is required on submission.')
  if (!input.statement.trim()) errors.push('Finding statement is required on submission.')
  if (!input.evidenceText.trim() && input.evidenceLinks.length === 0)
    errors.push('Objective evidence linked to the audit and requirement is required; generic claims are not accepted.')
  return { ok: errors.length === 0, errors }
}

export function buildReportGates(ctx: {
  evidenceLinked: number
  findingsClassified: number
  findingsTotal: number
  recommendation: string
  frozen: boolean
}): SubmissionGate[] {
  return [
    {
      id: 'evidence',
      label: 'Evidence linked to audit + requirement',
      hint: `${ctx.evidenceLinked} task(s) linked · generic claims blocked`,
      passed: ctx.evidenceLinked > 0,
    },
    {
      id: 'classification',
      label: 'Findings classified per scheme rules',
      hint: `${ctx.findingsClassified}/${ctx.findingsTotal} classified · ${SCHEME_RULES.version}`,
      passed: ctx.findingsTotal > 0 && ctx.findingsClassified === ctx.findingsTotal,
    },
    {
      id: 'recommendation',
      label: 'Auditor recommendation recorded',
      hint: 'Recommendation ≠ certification decision',
      passed: ctx.recommendation.trim().length > 10,
    },
    {
      id: 'review',
      label: 'Technical review handoff ready',
      hint: ctx.frozen ? 'Version frozen · ready for separate handoff' : 'Finalize freezes version first',
      passed: ctx.frozen,
    },
  ]
}

export function toCsv(rows: Array<Record<string, string>>, headers: string[]): string {
  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h] ?? '')).join(','))].join('\n')
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ── Demo workspace (preview only) ─────────────────────────────────────── */

const DEMO_KEY = 'auditReport.workspace'

function seedDemoReport(): AuditReport {
  const finding = (f: Partial<AuditFinding> & Pick<AuditFinding, 'id' | 'type' | 'requirementRef' | 'statement'>): AuditFinding => ({
    code: f.id,
    classification: '',
    objectiveEvidence: '',
    linkedEvidence: [],
    dueDate: '',
    process: '',
    responsibleContact: '',
    comments: '',
    status: 'Draft',
    nonconformityId: null,
    nonconformityCode: null,
    ...f,
  })
  const evidence = (id: string, description: string, auditRef: string, requirementRef: string, dueDate: string, status: AuditEvidenceStatus): AuditEvidenceTask => ({
    id, code: id, description, auditRef, requirementRef, dueDate, status,
  })
  return {
    id: 'demo-audit-report',
    auditPlanId: 'plan-0024',
    auditNumber: 'AUD-0024',
    stage: 'Stage 1',
    standard: 'ISO 22000',
    scope: '',
    applicationId: null,
    clientId: 'CL-0001',
    clientName: 'Al Noor Food Industries',
    siteName: 'SITE-001 · Riyadh (Main)',
    contactName: 'CTC-011 · Sara Ali · Client contact',
    documentRefs: ['DOC-101 HACCP plan', 'DOC-102 Temp records Mar'],
    auditTeam: [],
    leadAuditorName: '',
    agenda: [
      { time: '09:00 to 09:30', session: 'Opening meeting', clauses: notSet(), auditor: 'Lead Auditor', status: 'Completed' },
      { time: '09:30 to 10:30', session: 'Management system overview', clauses: 'Clauses 4.1, 4.2', auditor: 'Lead Auditor', status: 'Completed' },
      { time: '11:00 to 12:30', session: 'HACCP plan', clauses: 'Clause 8.5', auditor: 'Auditor 2', status: 'In progress' },
      { time: '13:30 to 15:00', session: 'Operational control (production)', clauses: 'Clause 8.6', auditor: 'Auditor 2', status: 'Not started' },
    ],
    recommendation: '',
    version: 1,
    status: 'draft',
    frozen: false,
    finalizedAt: null,
    finalizedBy: null,
    evidence: [
      evidence('EV-0101', 'Provide documented HACCP plan', 'AUD-0024 · HACCP', 'Clause 8.5', '2025-03-12', 'Open'),
      evidence('EV-0102', 'Latest internal audit report', 'AUD-0024 · Internal audit', 'Clause 9.2', '2025-03-12', 'Submitted'),
      evidence('EV-0103', 'Calibration records (last 12 months)', 'AUD-0024 · Monitoring', 'Clause 7.1.5', '2025-03-13', 'Open'),
      evidence('EV-0104', 'Allergen control procedure', 'AUD-0024 · Operational control', 'Clause 8.2', '2025-03-13', 'Verified'),
    ],
    findings: [
      finding({ id: 'NC-0024', type: 'Nonconformity', requirementRef: 'ISO 9001:2015, Clause 8.5.1', statement: 'Storage-area temperature records for March are incomplete (1 to 10 March only).', linkedEvidence: ['EV-0103'], dueDate: '2025-04-12' }),
      finding({ id: 'OBS-0011', type: 'Observation', classification: 'observation', requirementRef: 'ISO 9001:2015, Clause 7.2', statement: 'Training matrix does not list two new operators.', linkedEvidence: ['EV-0102'], status: 'Submitted', dueDate: '2025-04-20' }),
    ],
    decisionId: null,
    createdAt: '2025-03-10T08:00:00Z',
    updatedAt: '2025-03-10T08:00:00Z',
  }
}

const demoReport = () => loadState<AuditReport>(DEMO_KEY, seedDemoReport)

function updateDemo(fn: (report: AuditReport) => void): AuditReport {
  const report = demoReport()
  fn(report)
  report.updatedAt = new Date().toISOString()
  saveState(DEMO_KEY, report)
  return clone(report)
}

const post = (body?: unknown): RequestInit => ({ method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
const reportPath = (reportId: string) => `/cab/audit-reports/${encodeURIComponent(reportId)}`

/* ── Data layer ────────────────────────────────────────────────────────── */

export async function listAuditReports(params: { search?: string; status?: 'draft' | 'finalized'; auditPlanId?: string } = {}): Promise<AuditReportSummary[]> {
  if (!isDemoMode()) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => { if (value) qs.set(key, value) })
    const query = qs.toString()
    return authorizedRequest<AuditReportSummary[]>(`/cab/audit-reports${query ? `?${query}` : ''}`)
  }
  await wait()
  const r = demoReport()
  return [{ id: r.id, auditPlanId: r.auditPlanId, auditNumber: r.auditNumber, stage: r.stage, clientId: r.clientId, clientName: r.clientName, status: r.status, version: r.version, findingsTotal: r.findings.length, updatedAt: r.updatedAt }]
}

/**
 * The workspace to show. Without an id, opens the most recently updated draft
 * report (or the latest report). Returns null when the CAB has no report yet.
 */
export async function getAuditReport(reportId?: string | null): Promise<AuditReport | null> {
  if (!isDemoMode()) {
    let id = reportId
    if (!id) {
      const list = await listAuditReports()
      id = (list.find((r) => r.status === 'draft') ?? list[0])?.id
    }
    return id ? authorizedRequest<AuditReport>(reportPath(id)) : null
  }
  await wait()
  return clone(demoReport())
}

/** Saves the auditor recommendation of a draft report. */
export async function saveAuditRecommendation(reportId: string, recommendation: string): Promise<AuditReport> {
  if (!isDemoMode()) {
    return authorizedRequest<AuditReport>(reportPath(reportId), { method: 'PATCH', body: JSON.stringify({ recommendation }) })
  }
  await wait(120)
  return updateDemo((r) => { r.recommendation = recommendation })
}

export async function addEvidenceTask(reportId: string, input: EvidenceTaskInput): Promise<AuditReport> {
  if (!isDemoMode()) return authorizedRequest<AuditReport>(`${reportPath(reportId)}/evidence`, post(input))
  await wait()
  return updateDemo((r) => {
    const code = `EV-0${Math.floor(100 + Math.random() * 800)}`
    r.evidence.push({ id: code, code, description: input.description, auditRef: input.auditRef || `${r.auditNumber} · Draft area`, requirementRef: input.requirementRef, dueDate: input.dueDate ?? '', status: 'Open' })
  })
}

export async function createFinding(reportId: string, input: FindingInput): Promise<AuditReport> {
  if (!isDemoMode()) return authorizedRequest<AuditReport>(`${reportPath(reportId)}/findings`, post(input))
  await wait()
  return updateDemo((r) => {
    const code = `${input.type === 'Nonconformity' ? 'NC' : input.type === 'Observation' ? 'OBS' : 'OFI'}-0${Math.floor(100 + Math.random() * 800)}`
    const { submit, checklistItemId, ...fields } = input
    void checklistItemId // linked by the execution store in the preview (executionApi.linkFindingToItem)
    r.findings.push({ ...fields, id: code, code, status: submit ? 'Submitted' : 'Draft', nonconformityId: null, nonconformityCode: null })
  })
}

/** Freezes the version. The server raises the nonconformities and opens the certification decision. */
export async function finalizeAuditReport(reportId: string): Promise<AuditReport> {
  if (!isDemoMode()) return authorizedRequest<AuditReport>(`${reportPath(reportId)}/finalize`, post())
  await wait()
  return updateDemo((r) => {
    r.status = 'finalized'
    r.frozen = true
    r.version += 1
    r.finalizedAt = new Date().toISOString()
  })
}

/** Opens the next draft version of a finalized report. */
export async function reopenAuditReport(reportId: string): Promise<AuditReport> {
  if (!isDemoMode()) return authorizedRequest<AuditReport>(`${reportPath(reportId)}/reopen`, post())
  await wait()
  return updateDemo((r) => {
    r.status = 'draft'
    r.frozen = false
    r.finalizedAt = null
  })
}
