import { ROUTES } from '@/lib/routes'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { apps, auditPlans, certificates, decisions, invoices } from '@/lib/api/demo/records'

/**
 * CAB Dashboard data layer.
 *
 * Real endpoints (read models over the CAB's registers; cabId from the JWT):
 *   GET /cab/dashboard/stats                    → CabDashboardStats (with insights)
 *   GET /cab/dashboard/applications-by-stage    → ApplicationsByStageEntry[]
 *   GET /cab/dashboard/audits-overview          → AuditsOverviewEntry[]
 *   GET /cab/dashboard/certification-decisions  → CertificationDecisionEntry[]
 *   GET /cab/dashboard/work-queue               → WorkQueueItem[]
 *   GET /cab/dashboard/activity                 → CabActivityItem[]
 *
 * In the preview (demo mode) the same figures are computed from the shared
 * demo store below.
 */

export type CabDashboardStatKey =
  | 'newApplications'
  | 'pendingReviews'
  | 'upcomingAudits'
  | 'technicalReviewsPending'
  | 'decisionsPending'
  | 'certificatesToIssue'
  | 'outstandingPayments'
  | 'freelancerPayablesEgp'

/**
 * "Where it stands" line under each card, computed from the same records the
 * card counts (e.g. the oldest waiting application, the next audit date).
 * `key` is an i18n key under cab.dashboard.insights; `params` fill it.
 */
export interface CabDashboardStatInsight {
  key: string
  params?: Record<string, string | number>
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
}

export interface CabDashboardStats {
  newApplications: number
  pendingReviews: number
  upcomingAudits: number
  technicalReviewsPending: number
  decisionsPending: number
  certificatesToIssue: number
  outstandingPayments: number
  outstandingPaymentsEgp: number
  /** Displayed as the card's main value (with an "EGP" unit) instead of a plain count. */
  freelancerPayablesEgp: number
  insights: Record<CabDashboardStatKey, CabDashboardStatInsight>
}

export interface ApplicationsByStageEntry {
  stageKey: string
  count: number
  color: string
  /** Module that holds the applications at this stage. */
  href: string
}

export interface AuditsOverviewEntry {
  stageKey: string
  stage1: number
  stage2: number
}

export interface CertificationDecisionEntry {
  decisionKey: string
  count: number
  color: string
  href: string
}

export type WorkQueuePriority = 'high' | 'medium' | 'low'

export interface WorkQueueItem {
  id: string
  titleKey: string
  clientName: string
  priority: WorkQueuePriority
  dueDate: string
  /** Opens the record the task is about. */
  href: string
  /** Data value (e.g. audit stage) shown after the client; translated in the UI. */
  tag?: string
}

export type CabActivityType = 'certificateIssued' | 'auditCompleted' | 'infoRequested' | 'reviewAssigned' | 'paymentReceived'

export interface CabActivityItem {
  id: string
  type: CabActivityType
  titleKey: string
  entityName: string
  actorName?: string
  occurredAt: string
  href: string
  /** Extra interpolation values for the title. */
  params?: Record<string, string>
}

/*
 * Demo mode: every figure below is computed from the shared demo store, so the
 * cards, charts and work queue agree with the registers they link to
 * (lib/api/demo/records.ts). The backend computes the same from the real tables.
 */

const SAR_TO_EGP = 13.2

function delay<T>(value: () => T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value()), ms))
}

const STAGE_GROUP: Record<string, string> = {
  received: 'applicationReceipt',
  review: 'applicationReview',
  informationRequired: 'informationRequired',
  technicalFeasibility: 'technicalFeasibility',
  quotation: 'quotation',
  offer: 'contractSigning',
  auditPlanning: 'auditReview',
  auditReporting: 'auditReview',
  decision: 'decisionCertification',
}

const STAGE_COLORS: Record<string, string> = {
  applicationReceipt: '#e74d3c',
  applicationReview: '#ee8377',
  informationRequired: '#D4A017',
  technicalFeasibility: '#3B99CC',
  quotation: '#26A65B',
  contractSigning: '#1c7d44',
  decisionCertification: '#bdbdbd',
  auditReview: '#1236a3',
}

export const STAGE_HREF: Record<string, string> = {
  applicationReceipt: '/cab/applications/receipt',
  applicationReview: ROUTES.cabApplicationReviewQueue,
  informationRequired: ROUTES.cabApplicationInformationRequired,
  technicalFeasibility: ROUTES.cabApplicationTechnicalFeasibility,
  quotation: ROUTES.cabApplicationQuotation,
  contractSigning: ROUTES.cabOffers,
  auditReview: ROUTES.cabAuditPlanning,
  decisionCertification: ROUTES.cabDecisions,
}

/** Which module each dashboard card opens. */
export const STAT_HREF: Record<CabDashboardStatKey, string> = {
  newApplications: '/cab/applications/receipt',
  pendingReviews: ROUTES.cabApplicationReviewQueue,
  upcomingAudits: ROUTES.cabAuditPlanning,
  technicalReviewsPending: ROUTES.cabApplicationTechnicalFeasibility,
  decisionsPending: ROUTES.cabDecisions,
  certificatesToIssue: ROUTES.cabCertificates,
  outstandingPayments: ROUTES.cabInvoices,
  freelancerPayablesEgp: ROUTES.cabCompetence,
}

const DAY = 86_400_000
const todayIso = () => new Date().toISOString().slice(0, 10)
const daysSince = (iso?: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY)) : 0)
const FREELANCER_DAY_RATE_EGP = 4200
const FREELANCER_DAYS_PER_AUDIT = 2.5
const FREELANCERS = ['Youssef Kamal']

function computeStats(): CabDashboardStats {
  const list = apps()
  const plans = auditPlans()
  const inv = invoices()
  const decs = decisions()
  const certs = certificates()
  const today = todayIso()
  const outstanding = inv.filter((i) => i.balance > 0 && i.status !== 'Draft')
  const overdue = outstanding.filter((i) => i.dueDate && i.dueDate < today)
  const toEgp = (i: { currency: string; balance: number }) => (i.currency === 'EGP' ? i.balance : i.balance * SAR_TO_EGP)

  const submitted = list.filter((a) => a.status === 'SUBMITTED')
  const underReview = list.filter((a) => a.status === 'UNDER_REVIEW' && a.stage !== 'informationRequired')
  const awaitingInfo = list.filter((a) => a.stage === 'informationRequired')
  const upcoming = plans
    .filter((p) => (p.status === 'Planned' || p.status === 'Draft') && p.proposedStartDate >= today)
    .sort((a, b) => a.proposedStartDate.localeCompare(b.proposedStartDate))
  const feasibility = list.filter((a) => a.stage === 'technicalFeasibility')
  const techBeforeDecision = decs.filter((d) => !d.technicalReviewCompleted && !d.reviewStatus.startsWith('decided'))
  const readyToDecide = decs.filter((d) => d.reviewStatus === 'ready_for_decision')
  const awaitingTech = decs.filter((d) => d.reviewStatus === 'awaiting_technical_review')
  const draftCerts = certs.filter((c) => c.status === 'DRAFT')
  const freelancerAudits = plans.filter((p) => p.status === 'Completed' && p.auditTeam.some((m) => FREELANCERS.includes(m)))
  const oldestSubmitted = [...submitted].sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''))[0]
  const nextAudit = upcoming[0]

  return {
    newApplications: submitted.length,
    pendingReviews: submitted.length + underReview.length + awaitingInfo.length,
    upcomingAudits: upcoming.length,
    technicalReviewsPending: feasibility.length + techBeforeDecision.length,
    decisionsPending: readyToDecide.length + awaitingTech.length,
    certificatesToIssue: draftCerts.length,
    outstandingPayments: outstanding.length,
    outstandingPaymentsEgp: Math.round(outstanding.reduce((sum, i) => sum + toEgp(i), 0)),
    freelancerPayablesEgp: Math.round(freelancerAudits.length * FREELANCER_DAYS_PER_AUDIT * FREELANCER_DAY_RATE_EGP),
    insights: {
      newApplications: oldestSubmitted
        ? { key: 'oldestWaiting', params: { count: daysSince(oldestSubmitted.submittedAt), days: daysSince(oldestSubmitted.submittedAt), client: oldestSubmitted.organization.name }, tone: daysSince(oldestSubmitted.submittedAt) > 5 ? 'warning' : 'neutral' }
        : { key: 'nothingWaiting', tone: 'success' },
      pendingReviews: { key: 'reviewSplit', params: { received: submitted.length, review: underReview.length, info: awaitingInfo.length } },
      upcomingAudits: nextAudit
        ? { key: 'nextAudit', params: { client: nextAudit.clientName, date: nextAudit.proposedStartDate, days: Math.ceil((new Date(nextAudit.proposedStartDate).getTime() - Date.now()) / DAY) } }
        : { key: 'noAuditsPlanned', tone: 'warning' },
      technicalReviewsPending: { key: 'techSplit', params: { feasibility: feasibility.length, decision: techBeforeDecision.length } },
      decisionsPending: { key: 'decisionSplit', params: { ready: readyToDecide.length, tech: awaitingTech.length }, tone: readyToDecide.length ? 'warning' : 'neutral' },
      certificatesToIssue: draftCerts[0]
        ? { key: 'certDraftFor', params: { client: draftCerts[0].clientName, standard: draftCerts[0].standard } }
        : { key: 'allIssued', tone: 'success' },
      outstandingPayments: overdue.length
        ? { key: 'overdueAmount', params: { overdue: overdue.length, amount: Math.round(outstanding.reduce((sum, i) => sum + toEgp(i), 0)).toLocaleString('en-US') }, tone: 'danger' }
        : { key: 'outstandingAmount', params: { amount: Math.round(outstanding.reduce((sum, i) => sum + toEgp(i), 0)).toLocaleString('en-US') } },
      freelancerPayablesEgp: { key: 'freelancerBasis', params: { count: freelancerAudits.length, audits: freelancerAudits.length, days: freelancerAudits.length * FREELANCER_DAYS_PER_AUDIT, rate: FREELANCER_DAY_RATE_EGP.toLocaleString('en-US') } },
    },
  }
}

export function getCabDashboardStats(): Promise<CabDashboardStats> {
  if (!isDemoMode()) return authorizedRequest<CabDashboardStats>('/cab/dashboard/stats')
  return delay(computeStats)
}

export function getApplicationsByStage(): Promise<ApplicationsByStageEntry[]> {
  if (!isDemoMode()) return authorizedRequest<ApplicationsByStageEntry[]>('/cab/dashboard/applications-by-stage')
  return delay(() => {
    const counts = new Map<string, number>()
    for (const app of apps()) {
      const key = STAGE_GROUP[app.stage]
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Object.keys(STAGE_COLORS).map((stageKey) => ({ stageKey, count: counts.get(stageKey) ?? 0, color: STAGE_COLORS[stageKey], href: STAGE_HREF[stageKey] }))
  })
}

export function getAuditsOverview(): Promise<AuditsOverviewEntry[]> {
  if (!isDemoMode()) return authorizedRequest<AuditsOverviewEntry[]>('/cab/dashboard/audits-overview')
  return delay(() => {
    const plans = auditPlans()
    const bucket = (status: string) => {
      const rows = plans.filter((p) =>
        status === 'planned' ? p.status === 'Planned' || p.status === 'Draft' || p.status === 'Rescheduled'
          : status === 'inProgress' ? p.status === 'In progress'
            : status === 'completed' ? p.status === 'Completed'
              : p.status === 'Under review')
      return { stageKey: status, stage1: rows.filter((p) => p.stage === 'Stage 1').length, stage2: rows.filter((p) => p.stage !== 'Stage 1').length }
    }
    return ['planned', 'inProgress', 'completed', 'reportFinalization'].map(bucket)
  })
}

export function getCertificationDecisions(): Promise<CertificationDecisionEntry[]> {
  if (!isDemoMode()) return authorizedRequest<CertificationDecisionEntry[]>('/cab/dashboard/certification-decisions')
  return delay(() => {
    const certs = certificates()
    const decs = decisions()
    const status = (st: string) => decs.filter((d) => d.reviewStatus === st).length
    return [
      { decisionKey: 'granted', count: status('decided_granted'), color: '#26A65B', href: ROUTES.cabCertificates },
      { decisionKey: 'awaitingDecision', count: status('ready_for_decision') + status('awaiting_technical_review'), color: '#1236a3', href: ROUTES.cabDecisions },
      { decisionKey: 'deferred', count: status('decided_deferred'), color: '#D4A017', href: ROUTES.cabDecisions },
      { decisionKey: 'refused', count: status('decided_refused'), color: '#e74d3c', href: ROUTES.cabDecisions },
      { decisionKey: 'suspended', count: certs.filter((c) => c.status === 'SUSPENDED').length, color: '#ee8377', href: ROUTES.cabCertificates },
      { decisionKey: 'withdrawn', count: certs.filter((c) => c.status === 'WITHDRAWN').length, color: '#bdbdbd', href: ROUTES.cabCertificates },
    ]
  })
}

export function getWorkQueue(): Promise<WorkQueueItem[]> {
  if (!isDemoMode()) return authorizedRequest<WorkQueueItem[]>('/cab/dashboard/work-queue')
  return delay(() => {
    const items: WorkQueueItem[] = []
    const inDays = (n: number, from = Date.now()) => new Date(from + n * DAY).toISOString().slice(0, 10)
    const byStage = (stage: string) => apps().filter((a) => a.stage === stage)
    byStage('informationRequired').forEach((a) => items.push({ id: `wq-ir-${a.orderNumber}`, titleKey: 'cab.dashboard.workQueue.items.informationRequiredFollowUp', clientName: `${a.organization.name} · ${a.orderNumber}`, priority: 'high', dueDate: inDays(1), href: `/cab/applications/${a.id}/information-required` }))
    byStage('technicalFeasibility').forEach((a) => items.push({ id: `wq-tf-${a.orderNumber}`, titleKey: 'cab.dashboard.workQueue.items.technicalReview', clientName: `${a.organization.name} · ${a.standard}`, priority: 'high', dueDate: inDays(2), href: `/cab/applications/${a.id}/technical-feasibility` }))
    auditPlans().filter((p) => p.status === 'Under review').forEach((p) => items.push({ id: `wq-report-${p.id}`, titleKey: 'cab.dashboard.workQueue.items.auditReportReview', clientName: p.clientName, tag: p.stage, priority: 'high', dueDate: inDays(3), href: ROUTES.cabAuditReporting }))
    decisions().filter((d) => d.reviewStatus === 'ready_for_decision').forEach((d) => items.push({ id: `wq-dec-${d.id}`, titleKey: 'cab.dashboard.workQueue.items.certificationDecision', clientName: `${d.clientName} · ${d.scheme}`, priority: 'high', dueDate: d.dueDateRaw?.slice(0, 10) || inDays(5), href: ROUTES.cabDecisionDetails.replace(':decisionId', d.id) }))
    auditPlans().filter((p) => p.status === 'Draft').forEach((p) => items.push({ id: `wq-team-${p.id}`, titleKey: 'cab.dashboard.workQueue.items.auditTeamProposalReview', clientName: p.clientName, priority: 'medium', dueDate: inDays(-14, new Date(p.proposedStartDate).getTime()), href: ROUTES.cabBuildAuditPlan.replace(':planId', p.id) }))
    byStage('offer').concat(byStage('quotation')).forEach((a) => items.push({ id: `wq-contract-${a.orderNumber}`, titleKey: 'cab.dashboard.workQueue.items.contractReviewApproval', clientName: `${a.organization.name} · ${a.orderNumber}`, priority: 'medium', dueDate: inDays(4), href: `/cab/applications/${a.id}/quotation` }))
    certificates().filter((c) => c.status === 'DRAFT').forEach((c) => items.push({ id: `wq-cert-${c.id}`, titleKey: 'cab.dashboard.workQueue.items.issueCertificate', clientName: `${c.clientName} · ${c.standard}`, priority: 'medium', dueDate: inDays(5), href: ROUTES.cabPrepareCertificate.replace(':certificateId', c.id) }))
    const rank = { high: 0, medium: 1, low: 2 }
    return items.sort((a, b) => rank[a.priority] - rank[b.priority] || a.dueDate.localeCompare(b.dueDate))
  })
}

export function getCabRecentActivity(): Promise<CabActivityItem[]> {
  if (!isDemoMode()) return authorizedRequest<CabActivityItem[]>('/cab/dashboard/activity')
  return delay(() => {
    const items: CabActivityItem[] = []
    const atNoon = (date: string) => (date.length === 10 ? `${date}T09:00:00Z` : date)
    certificates()
      .filter((c) => c.status === 'ISSUED' && c.issuedAt)
      .forEach((c) => items.push({ id: `ra-cert-${c.id}`, type: 'certificateIssued', titleKey: 'cab.dashboard.recentActivity.items.certificateIssued', entityName: `${c.clientName} (${c.standard})`, actorName: c.certificateNumber, occurredAt: atNoon(c.issuedAt), href: ROUTES.cabCertificates }))
    auditPlans()
      .filter((p) => (p.status === 'Under review' || p.status === 'Completed') && p.proposedEndDate <= todayIso())
      .forEach((p) => items.push({ id: `ra-audit-${p.id}`, type: 'auditCompleted', titleKey: 'cab.dashboard.recentActivity.items.auditStageCompleted', entityName: p.clientName, actorName: p.leadAuditor, occurredAt: atNoon(p.proposedEndDate), href: ROUTES.cabAuditReporting, params: { stage: p.stage } }))
    apps()
      .filter((a) => a.stage === 'informationRequired')
      .forEach((a) => items.push({ id: `ra-ir-${a.id}`, type: 'infoRequested', titleKey: 'cab.dashboard.recentActivity.items.infoRequested', entityName: a.organization.name, actorName: a.orderNumber, occurredAt: a.updatedAt ?? a.submittedAt ?? new Date().toISOString(), href: `/cab/applications/${a.id}/information-required` }))
    decisions()
      .filter((d) => d.reviewStatus === 'awaiting_technical_review' || d.reviewStatus === 'ready_for_decision')
      .forEach((d) => items.push({ id: `ra-dec-${d.id}`, type: 'reviewAssigned', titleKey: 'cab.dashboard.recentActivity.items.decisionAssigned', entityName: d.clientName, actorName: d.decisionMakerName, occurredAt: d.receivedDateRaw || new Date().toISOString(), href: ROUTES.cabDecisionDetails.replace(':decisionId', d.id) }))
    invoices().forEach((i) =>
      i.payments.forEach((pay, n) => items.push({ id: `ra-pay-${i.id}-${n}`, type: 'paymentReceived', titleKey: 'cab.dashboard.recentActivity.items.paymentReceived', entityName: i.clientName, actorName: i.invoiceNumber, occurredAt: atNoon(pay.date), href: ROUTES.cabInvoiceDetails.replace(':invoiceId', i.id) }))
    )
    return items
      .filter((i) => !Number.isNaN(new Date(i.occurredAt).getTime()) && new Date(i.occurredAt).getTime() <= Date.now())
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  })
}
