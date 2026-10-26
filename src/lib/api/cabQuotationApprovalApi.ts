/**
 * Quotation approval view — GET /cab/certification-applications/:id/quotation-approval → CabQuotationApproval.
 *
 * Read-only; the server builds it from the application's latest quotation (events, items,
 * totals and status history). Issue / accept / reject stay on /cab/quotations/:id/*.
 * In the preview (demo mode), and when no application is given, it is built from the shared
 * demo store.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { APPLICATIONS, client, fmtDate, money, person, standardLabel } from '@/lib/api/demo/dataset'
import { findApp, quotations } from '@/lib/api/demo/records'

export type QuotationApprovalStatus = 'inProgress' | 'approved' | 'rejected'

export interface QuotationApprovalLineItem {
  id: number
  description: string
  basis: string
  quantity: string
  rate: string
  amount: string
}

export interface CabQuotationApproval {
  applicationId: string
  client: string
  applicationType: string
  certificationBody: string
  standardScheme: string
  sitesCount: number
  requestedOnDate: string
  requestedOnTime: string
  assignedTo: { name: string; initials: string; role: string }

  quotationNo: string
  version: string
  preparedBy: string
  preparedOn: string
  validUntil: string
  validityDays: number
  currency: string
  totalExcludingTaxes: string
  taxesPercent: number
  taxesAmount: string
  totalIncludingTaxes: string

  auditScopeDescription: string
  includedInScope: string[]

  lineItems: QuotationApprovalLineItem[]
  subTotal: string
  discountLabel: string
  discountAmount: string
  breakdownTotalExcludingTaxes: string

  sites: Array<{ name: string; address: string }>

  approval: {
    reviewStatus: string
    reviewedBy: string
    reviewedOn: string
    comments: string
  }

  internalComments: Array<{
    author: string
    initials: string
    role: string
    date: string
    time: string
    text: string
  }>

  approvalHistory: Array<{
    author: string
    initials: string
    date: string
    time: string
    text: string
    tag: string
  }>
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Built from the application's quotation in the shared demo store, so the line
 * items, totals and sites match the quotation and offer screens
 * (lib/api/demo/records.ts).
 */
function build(applicationId?: string): CabQuotationApproval {
  const app = findApp(applicationId) ?? findApp('APP-0146')!
  const q = quotations().find((x) => x.applicationId === app.id) ?? quotations()[0]
  const c = client(app.organizationId)
  const reviewerP = person('emp-0006')
  const lead = person(APPLICATIONS.find((a) => a.id === app.id)?.leadAuditorId ?? 'emp-0001')
  const approver = person('emp-0005')
  const created = new Date(q.createdAt)
  const net = Number(q.totalAuditFee) + Number(q.travelExpenses) + Number(q.additionalItemsTotal)
  const fmt = (n: number | string) => money(Number(n))
  return {
    applicationId: app.orderNumber,
    client: c.name,
    applicationType: app.legalInfo?.requestType === 'RENEWAL' ? 'Recertification' : 'Initial Certification',
    certificationBody: 'CASCO',
    standardScheme: standardLabel(app.standard),
    sitesCount: app.branches?.length ?? 1,
    requestedOnDate: fmtDate(q.createdAt),
    requestedOnTime: created.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    assignedTo: { name: approver.name, initials: approver.initials, role: 'Certification Manager' },
    quotationNo: q.quotationNumber ?? q.id,
    version: '1.0',
    preparedBy: `${reviewerP.name} (Applications Reviewer)`,
    preparedOn: fmtDate(q.createdAt),
    validUntil: fmtDate(q.offerEndDate),
    validityDays: 30,
    currency: q.currency,
    totalExcludingTaxes: fmt(net),
    taxesPercent: Math.round(Number(q.taxRate) * 100),
    taxesAmount: fmt(q.taxAmount),
    totalIncludingTaxes: fmt(q.totalAmount),
    auditScopeDescription: app.declarationInfo?.certificateScopeEn ?? '',
    includedInScope: [
      `${standardLabel(app.standard)} certification coverage`,
      `${app.branches?.length ?? 1} site(s) included: ${(app.branches ?? []).map((b) => b.branchName).join(', ')}`,
      'On-site audit planning, execution and findings report',
      'Certification decision and certificate issuance',
      'Annual surveillance audits within the three-year cycle',
    ],
    lineItems: [
      ...q.events.map((e, i) => ({ id: i + 1, description: `${e.auditEventType.replace('_', ' ')} audit`, basis: 'Audit days', quantity: e.auditDays, rate: fmt(e.dailyRate), amount: fmt(e.auditFee) })),
      { id: q.events.length + 1, description: 'Travel & accommodation', basis: 'Estimate', quantity: '1', rate: fmt(q.travelExpenses), amount: fmt(q.travelExpenses) },
      ...q.additionalItems.map((x, i) => ({ id: q.events.length + 2 + i, description: x.name, basis: 'Lump sum', quantity: '1', rate: fmt(x.cost), amount: fmt(x.cost) })),
    ],
    subTotal: fmt(net),
    discountLabel: '0%',
    discountAmount: '0.00',
    breakdownTotalExcludingTaxes: fmt(net),
    sites: (app.branches ?? []).map((b) => ({ name: `${c.name} - ${b.branchName}`, address: b.address ?? '' })),
    approval: {
      reviewStatus: q.status === 'CREATED' ? 'Ready for Approval' : q.status === 'ISSUED' ? 'Issued to client' : q.status === 'ACCEPTED' ? 'Accepted by client' : q.status,
      reviewedBy: `${lead.name} / Lead Auditor`,
      reviewedOn: `${fmtDate(q.createdAt)} ${created.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
      comments: 'Audit time calculated per IAF MD 5 for the declared headcount and sites; daily rate per the CAB pricing configuration.',
    },
    internalComments: [
      { author: lead.name, initials: lead.initials, role: 'Lead Auditor', date: fmtDate(q.createdAt), time: '10:15', text: `Audit days confirmed for ${q.employeeCountUsed} employees in scope across ${app.branches?.length ?? 1} site(s).` },
      { author: reviewerP.name, initials: reviewerP.initials, role: 'Applications Reviewer', date: fmtDate(q.createdAt), time: '11:40', text: 'Scope and sites match the reviewed application. Ready for approval.' },
    ],
    approvalHistory: [
      { author: reviewerP.name, initials: reviewerP.initials, date: fmtDate(q.createdAt), time: '11:40', text: 'Quotation prepared and submitted for approval.', tag: 'Reviewed' },
      ...(q.status !== 'CREATED' ? [{ author: approver.name, initials: approver.initials, date: fmtDate(q.updatedAt), time: '09:30', text: 'Quotation approved and issued to the client.', tag: 'Approved' }] : []),
    ],
  }
}

export async function getCabQuotationApproval(applicationId?: string): Promise<CabQuotationApproval> {
  if (!isDemoMode() && applicationId) {
    return authorizedRequest<CabQuotationApproval>(
      `/cab/certification-applications/${encodeURIComponent(applicationId)}/quotation-approval`,
    )
  }
  await delay()
  return build(applicationId)
}
