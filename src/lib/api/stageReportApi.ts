/**
 * Stage reports (ISO/IEC 17021-1 9.4.8) built on the audit reporting workspace: auto-filled content,
 * editable narrative, technical review → approval → issue to the client → client acknowledgement.
 *
 * Real endpoints:
 *   GET   /cab/audit-reports/:reportId/stage-report      → StageReport
 *   PATCH /cab/audit-reports/:reportId/stage-report      { reportType?, narrative?, recommendation?, recommendationOutcome? }
 *   POST  /cab/audit-reports/:reportId/submit-review     → StageReport | 422 { blockers }
 *   POST  /cab/audit-reports/:reportId/review            { decision: approve | return, comments }
 *   POST  /cab/audit-reports/:reportId/issue             finalizes a draft version, notifies the client
 *   GET   /portal/audit-reports, GET /portal/audit-reports/:reportId, POST /portal/audit-reports/:reportId/acknowledge
 * In the preview (demo mode) reports live in the demo store next to the executions (lib/api/demo/executionDemo.ts).
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import * as demo from '@/lib/api/demo/executionDemo'

export type StageReportType = 'stage1' | 'stage2' | 'surveillance' | 'recertification' | 'special' | 'transfer'
export const STAGE_REPORT_TYPES: StageReportType[] = ['stage1', 'stage2', 'surveillance', 'recertification', 'special', 'transfer']
export type ReportReviewStatus = 'notSubmitted' | 'inReview' | 'changesRequested' | 'approved' | 'issued' | 'acknowledged'

export type NarrativeSection =
  | 'objectives' | 'criteria' | 'deviations' | 'significantIssues' | 'effectiveness' | 'objectivesAchieved' | 'unresolvedIssues'
  | 'internalAuditReliance' | 'managementReviewReliance' | 'marksUse' | 'stage1Readiness' | 'stage1Concerns' | 'transferReview'
  | 'changes' | 'complaints'

export interface StageReportFinding {
  id: string
  code: string
  classification: string
  requirementRef: string
  statement: string
  objectiveEvidence: string
  dueDate: string
  nonconformityCode: string | null
}

export interface StageReportEvent {
  id: string
  action: 'SUBMITTED' | 'RETURNED' | 'APPROVED' | 'ISSUED' | 'ACKNOWLEDGED' | 'REOPENED'
  byName: string
  comment: string
  version: number
  createdAt: string
}

export interface StageReport {
  id: string
  auditPlanId: string
  auditNumber: string
  planNumber: string
  version: number
  status: 'draft' | 'finalized'
  reportType: StageReportType
  stage: string
  reviewStatus: ReportReviewStatus
  editable: boolean
  header: {
    cab: { name: string; legalName: string; address: string; accreditation: string; logoUrl: string | null }
    client: { name: string; address: string; representative: string; logoUrl: string | null }
    auditType: string
    standard: string
    scope: string
    sites: string
    startDate: string
    endDate: string
    remote: { enabled: boolean; platform: string; activities: string[]; sharePercent: number }
    leadAuditor: string
    team: Array<{ name: string; role: string }>
    plannedDays: number
    actualDays: number
  }
  auto: {
    checklists: {
      total: number
      answered: number
      byResult: Record<string, number>
      perChecklist: Array<{ name: string; total: number; answered: number; nonconforming: number }>
    }
    findings: { majors: StageReportFinding[]; minors: StageReportFinding[]; observations: StageReportFinding[]; opportunities: StageReportFinding[]; drafts: number }
    time: { plannedDays: number; actualDays: number; remoteSharePercent: number; status: string }
  }
  sections: NarrativeSection[]
  requiredSections: NarrativeSection[]
  narrative: Partial<Record<NarrativeSection, string>>
  suggestions: Partial<Record<NarrativeSection, string>>
  recommendation: string
  recommendationOutcome: string | null
  outcomes: string[]
  review: {
    submittedAt: string | null
    submittedBy: string | null
    reviewerName: string | null
    reviewedAt: string | null
    comments: string
    issuedAt: string | null
    issuedBy: string | null
    issuedVersion: number | null
    acknowledgedAt: string | null
    acknowledgedBy: string | null
    acknowledgementNote: string
    events: StageReportEvent[]
  }
  decisionId: string | null
  updatedAt: string
}

export interface StageReportUpdate {
  reportType?: StageReportType
  narrative?: Partial<Record<NarrativeSection, string>>
  recommendation?: string
  recommendationOutcome?: string | null
}

export interface ClientReportSummary {
  id: string
  auditNumber: string
  auditPlanId: string
  stage: string
  reportType: StageReportType
  standard: string
  issuedAt: string | null
  version: number
  acknowledged: boolean
}

const path = (reportId: string) => `/cab/audit-reports/${encodeURIComponent(reportId)}`
const post = <T>(url: string, body?: unknown) => authorizedRequest<T>(url, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

/** Route of the stage report page. */
export const stageReportPath = (reportId: string) => `/cab/audit-reporting/report/${encodeURIComponent(reportId)}`
/** Client portal route of an issued report. */
export const portalReportPath = (reportId: string) => `/portal/audit-reports/${encodeURIComponent(reportId)}`

export async function getStageReport(reportId: string): Promise<StageReport> {
  if (!isDemoMode()) return authorizedRequest<StageReport>(`${path(reportId)}/stage-report`)
  return demo.getStageReport(reportId)
}

export async function updateStageReport(reportId: string, body: StageReportUpdate): Promise<StageReport> {
  if (!isDemoMode()) return authorizedRequest<StageReport>(`${path(reportId)}/stage-report`, { method: 'PATCH', body: JSON.stringify(body) })
  return demo.updateStageReport(reportId, body)
}

export async function submitStageReport(reportId: string): Promise<StageReport> {
  if (!isDemoMode()) return post<StageReport>(`${path(reportId)}/submit-review`)
  return demo.submitStageReport(reportId)
}

export async function reviewStageReport(reportId: string, body: { decision: 'approve' | 'return'; comments?: string }): Promise<StageReport> {
  if (!isDemoMode()) return post<StageReport>(`${path(reportId)}/review`, body)
  return demo.reviewStageReport(reportId, body)
}

export async function issueStageReport(reportId: string): Promise<StageReport> {
  if (!isDemoMode()) return post<StageReport>(`${path(reportId)}/issue`)
  return demo.issueStageReport(reportId)
}

export async function listClientReports(): Promise<ClientReportSummary[]> {
  if (!isDemoMode()) return authorizedRequest<ClientReportSummary[]>('/portal/audit-reports')
  return demo.listClientReports()
}

export async function getClientReport(reportId: string): Promise<StageReport> {
  if (!isDemoMode()) return authorizedRequest<StageReport>(`/portal/audit-reports/${encodeURIComponent(reportId)}`)
  return demo.getClientReport(reportId)
}

export async function acknowledgeReport(reportId: string, body: { name?: string; note?: string }): Promise<StageReport> {
  if (!isDemoMode()) return post<StageReport>(`/portal/audit-reports/${encodeURIComponent(reportId)}/acknowledge`, body)
  return demo.acknowledgeReport(reportId, body)
}
