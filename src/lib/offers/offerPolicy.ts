import { notSet } from '@/lib/emptyValue'
// Offers policy — single source of truth for gates, keys, tax basis, scoping.
// All values here are illustrative design examples, not regulatory tables.
export const OFFER_FIELD_KEYS = {
  clientId: 'client_id',
  applicationId: 'application_id',
  currency: 'currency',
  validUntil: 'valid_until',
  paymentTerms: 'payment_terms',
  feeDescription: 'fee_description',
  feeAmount: 'fee_amount',
  travelCosts: 'travel_costs',
  discount: 'discount',
  taxBasisId: 'tax_basis_id',
  approvalRoute: 'approval_route',
  recipientContactId: 'recipient_contact_id',
} as const

export type OfferStage = 'draft' | 'pending_approval' | 'approved' | 'issued' | 'void'

export interface TaxBasis {
  id: string
  jurisdiction: string
  label: string
  // percentage is null when the jurisdiction has no configured rate —
  // the UI must never invent a rate in that case.
  percentage: number | null
  source: 'configured' | 'unconfigured'
}

// Configured jurisdiction bases only. No invented rates.
export const TAX_BASES: TaxBasis[] = [
  { id: 'sa-vat-configured', jurisdiction: 'Saudi Arabia', label: 'VAT (configured jurisdiction rate)', percentage: 15, source: 'configured' },
  { id: 'ae-vat-configured', jurisdiction: 'United Arab Emirates', label: 'VAT (configured jurisdiction rate)', percentage: 5, source: 'configured' },
  { id: 'eg-vat-configured', jurisdiction: 'Egypt', label: 'VAT (configured jurisdiction rate)', percentage: 14, source: 'configured' },
  { id: 'no-tax', jurisdiction: notSet(), label: 'No tax (explicit 0% basis)', percentage: 0, source: 'configured' },
  { id: 'unconfigured', jurisdiction: notSet(), label: 'No tax basis configured', percentage: null, source: 'unconfigured' },
]

export function quoteArithmetic(fees: Array<{ amount: number }>, discount: number) {
  const linesTotal = fees.reduce((a, f) => a + (Number(f.amount) || 0), 0)
  const beforeTax = Math.max(0, linesTotal - (Number(discount) || 0))
  return { linesTotal, beforeTax }
}

export function taxForBasis(basisId: string, beforeTax: number) {
  const basis = TAX_BASES.find((t) => t.id === basisId) ?? TAX_BASES[4]
  if (basis.percentage == null) return { basis, taxAmount: null as number | null, total: null as number | null }
  const taxAmount = (beforeTax * basis.percentage) / 100
  return { basis, taxAmount, total: beforeTax + taxAmount }
}

// Draft may save incomplete later-stage data; submission/issue require gates.
export function validateForStage(input: {
  applicationStatus: string
  feesCount: number
  validUntil: string
  taxBasisId: string
  approvalRoute: string
  recipientContactId: string
}, stage: 'draft' | 'submit' | 'issue'): Record<string, string> {
  if (stage === 'draft') return {}
  const errs: Record<string, string> = {}
  if (input.applicationStatus !== 'accepted') errs.application = 'Only an accepted application can produce a ready-to-send offer.'
  if (input.feesCount < 1) errs.fees = 'At least one fee line is required.'
  if (!input.validUntil) errs.validUntil = 'Valid-until date is required.'
  if (stage === 'issue') {
    const basis = TAX_BASES.find((t) => t.id === input.taxBasisId)
    if (!basis || basis.source !== 'configured') errs.taxBasis = 'Select an explicit tax basis from the configured jurisdiction.'
    if (!input.approvalRoute) errs.approvalRoute = 'Approval route is required.'
    if (!input.recipientContactId) errs.recipient = 'Recipient confirmation is required before sending.'
  }
  return errs
}

// Tenant isolation: same org/site/contact/document IDs within one CAB-client
// relationship; never share across tenants.
export function sameTenantScope(a: { cabId: string; clientId: string }, b: { cabId: string; clientId: string }) {
  return a.cabId === b.cabId && a.clientId === b.clientId
}
