import { getCabProfile } from '@/lib/api/cabApi'
import { getCabCertificationApplication } from '@/lib/api/cabCertificationApplicationApi'
import { listCabApplications } from '@/lib/api/cabApplicationRegisterApi'
import { listSectionReviews, REVIEW_SECTIONS, type ReviewSectionKey, type SectionStatus } from '@/lib/api/cabApplicationReviewApi'
import { getQuotation, listPricingConfigs, listQuotations, type Quotation } from '@/lib/api/cabQuotationApi'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode, loadState, saveState, wait } from '@/lib/api/demo/demoStore'
import { findApp, notify as demoNotify, quotations as demoQuotations } from '@/lib/api/demo/records'
import { notSet } from '@/lib/emptyValue'

export function isQuotationReviewComplete(
  status: string,
  sections: Partial<Record<ReviewSectionKey, SectionStatus>>,
): boolean {
  return (status === 'UNDER_REVIEW' || status === 'APPROVED' || status === 'SUBMITTED' || status.startsWith('QUOTATION_'))
    && REVIEW_SECTIONS.every((key) => sections[key] === 'complete' || sections[key] === 'notApplicable')
}

export async function listQuotationApplications() {
  const applications = (await listCabApplications()).filter(
    (application) => application.status !== 'DRAFT' && application.status !== 'REJECTED',
  )
  // ponytail: one review read per candidate; use a server-side filter if the register grows large.
  const reviews = await Promise.all(applications.map((application) => listSectionReviews(application.id)))
  return applications.filter((application, index) => isQuotationReviewComplete(application.status, reviews[index]))
}

export async function getCabApplicationQuotation(applicationId: string) {
  const [application, sections, { cab }, configs, quotations] = await Promise.all([
    getCabCertificationApplication(applicationId),
    listSectionReviews(applicationId),
    getCabProfile(),
    listPricingConfigs(),
    listQuotations({ applicationId, limit: 100 }),
  ])
  // The newest quotation that is not cancelled is the live one; a cancelled one allows creating a new quotation.
  const live = [...quotations.items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((item) => item.status !== 'CANCELLED') ?? null
  // Lists omit the calculation breakdown, so the live quotation is read in full.
  const quotation = live ? await getQuotation(live.id) : null
  const active = configs.filter((config) => config.isActive)
  const globals = active.filter((config) => config.standardId === null)
  return {
    application,
    cab,
    reviewComplete: isQuotationReviewComplete(application.status, sections),
    // The default currency's rate prefills new quotations (CAB Profile → Pricing).
    pricing: globals.find((config) => config.isDefault) ?? globals[0] ?? null,
    pricingConfigs: active,
    quotation,
  }
}

export type CabApplicationQuotation = Awaited<ReturnType<typeof getCabApplicationQuotation>>

/* ───────────── Internal approval (submit → approve → issue) ─────────────
 *   GET  /cab/quotation-approvals?approval=pending|approved|draft|all → QuotationApprovalQueueItem[]
 *   GET  /cab/quotations/:id/approval                                → QuotationApproval
 *   POST /cab/quotations/:id/submit-approval | approve | return-to-draft
 * Approval must come from a different CAB user than the preparer, or the CAB administrator;
 * issuing (POST /cab/quotations/:id/issue) needs an approved quotation. In the preview the
 * approval state is kept in the demo store (key `quotationApprovals`).
 */

export type QuotationApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED'

export interface QuotationApproval {
  quotationId: string
  applicationId: string
  applicationNumber: string | null
  status: Quotation['status']
  approvalStatus: QuotationApprovalStatus
  preparedBy: { id: string; name: string } | null
  submittedAt: string | null
  submittedBy: { id: string; name: string } | null
  approvedAt: string | null
  approvedBy: { id: string; name: string } | null
  note: string | null
  canSubmit: boolean
  canApprove: boolean
  canReturn: boolean
  canIssue: boolean
  approveBlockedReason: 'separationOfDuties' | null
  issueBlockedReason: 'notOpen' | 'blockedPolicies' | 'approvalRequired' | null
}

export interface QuotationApprovalQueueItem extends QuotationApproval {
  clientName: string
  standardCodes: string[]
  currency: string
  totalAmount: string
  offerEndDate: string | null
  createdAt: string
}

export type ApprovalQueueFilter = 'pending' | 'approved' | 'draft' | 'all'

type DemoApprovalState = Record<string, Pick<QuotationApproval, 'approvalStatus' | 'submittedAt' | 'approvedAt' | 'note'>>

const DEMO_APPROVALS_KEY = 'quotationApprovals'
const demoApprovals = () => loadState<DemoApprovalState>(DEMO_APPROVALS_KEY, () => ({}))
const OPEN: ReadonlyArray<Quotation['status']> = ['CREATED', 'DRAFT']
const DEMO_ADMIN = { id: 'demo-admin', name: 'CAB Admin' }

function demoApproval(q: Quotation): QuotationApproval {
  const open = OPEN.includes(q.status)
  const stored = demoApprovals()[q.id] ?? {
    approvalStatus: open ? 'PENDING' : 'APPROVED',
    submittedAt: q.createdAt,
    approvedAt: open ? null : q.updatedAt,
    note: null,
  }
  const app = findApp(q.applicationId)
  return {
    quotationId: q.id,
    applicationId: q.applicationId,
    applicationNumber: app?.orderNumber ?? null,
    status: q.status,
    ...stored,
    preparedBy: DEMO_ADMIN,
    submittedBy: stored.submittedAt ? DEMO_ADMIN : null,
    approvedBy: stored.approvedAt ? DEMO_ADMIN : null,
    canSubmit: open && stored.approvalStatus === 'DRAFT',
    // The preview signs in as the CAB administrator, who may approve their own work.
    canApprove: open && stored.approvalStatus === 'PENDING',
    canReturn: open && stored.approvalStatus !== 'DRAFT',
    canIssue: open,
    approveBlockedReason: null,
    issueBlockedReason: open ? null : 'notOpen',
  }
}

function demoUpdate(quotationId: string, patch: Partial<DemoApprovalState[string]>): QuotationApproval {
  const q = demoQuotations().find((item) => item.id === quotationId)
  if (!q) throw new Error('Quotation not found.')
  const current = demoApproval(q)
  const state = demoApprovals()
  state[quotationId] = {
    approvalStatus: patch.approvalStatus ?? current.approvalStatus,
    submittedAt: patch.submittedAt !== undefined ? patch.submittedAt : current.submittedAt,
    approvedAt: patch.approvedAt !== undefined ? patch.approvedAt : current.approvedAt,
    note: patch.note !== undefined ? patch.note : current.note,
  }
  saveState(DEMO_APPROVALS_KEY, state)
  return demoApproval(q)
}

const approvalPath = (quotationId: string, action = 'approval') => `/cab/quotations/${encodeURIComponent(quotationId)}/${action}`
const postNote = (note?: string | null) => ({ method: 'POST', body: JSON.stringify({ note: note?.trim() || null }) })

export async function getQuotationApproval(quotationId: string): Promise<QuotationApproval> {
  if (!isDemoMode()) return authorizedRequest<QuotationApproval>(approvalPath(quotationId))
  await wait(120)
  const q = demoQuotations().find((item) => item.id === quotationId)
  if (!q) throw new Error('Quotation not found.')
  return demoApproval(q)
}

export async function submitQuotationForApproval(quotationId: string, note?: string): Promise<QuotationApproval> {
  if (!isDemoMode()) return authorizedRequest<QuotationApproval>(approvalPath(quotationId, 'submit-approval'), postNote(note))
  await wait(150)
  const result = demoUpdate(quotationId, { approvalStatus: 'PENDING', submittedAt: new Date().toISOString(), approvedAt: null, note: note || null })
  demoNotify('cab', 'quotation_pending_approval', { ref: result.applicationNumber ?? quotationId, discount: '0%' }, `/cab/applications/${result.applicationId}/quotation`)
  return result
}

export async function approveQuotation(quotationId: string, note?: string): Promise<QuotationApproval> {
  if (!isDemoMode()) return authorizedRequest<QuotationApproval>(approvalPath(quotationId, 'approve'), postNote(note))
  await wait(150)
  return demoUpdate(quotationId, { approvalStatus: 'APPROVED', approvedAt: new Date().toISOString(), ...(note ? { note } : {}) })
}

export async function returnQuotationToDraft(quotationId: string, note: string): Promise<QuotationApproval> {
  if (!isDemoMode()) return authorizedRequest<QuotationApproval>(approvalPath(quotationId, 'return-to-draft'), postNote(note))
  await wait(150)
  return demoUpdate(quotationId, { approvalStatus: 'DRAFT', approvedAt: null, note })
}

/** The approval queue (open quotations), oldest submission first. */
export async function listQuotationApprovalQueue(filter: ApprovalQueueFilter = 'pending'): Promise<QuotationApprovalQueueItem[]> {
  if (!isDemoMode()) return authorizedRequest<QuotationApprovalQueueItem[]>(`/cab/quotation-approvals?approval=${filter}`)
  await wait(150)
  const wanted = { pending: 'PENDING', approved: 'APPROVED', draft: 'DRAFT', all: null }[filter]
  return demoQuotations()
    .filter((q) => OPEN.includes(q.status))
    .map((q) => {
      const app = findApp(q.applicationId)
      return {
        ...demoApproval(q),
        clientName: app?.organization.name ?? notSet(),
        standardCodes: q.standardCodesUsed,
        currency: q.currency,
        totalAmount: q.totalAmount,
        offerEndDate: q.offerEndDate,
        createdAt: q.createdAt,
      }
    })
    .filter((item) => !wanted || item.approvalStatus === wanted)
    .sort((a, b) => (a.submittedAt ?? a.createdAt).localeCompare(b.submittedAt ?? b.createdAt))
}
