/**
 * CAB invoice register API.
 *
 * CAB:    GET /cab/invoices, POST /cab/invoices (manual draft), GET /cab/invoices/:id, PATCH /cab/invoices/:id (draft),
 *         PATCH /cab/invoices/:id/tax, POST /cab/invoices/:id/issue,
 *         POST /cab/invoices/:id/payments, POST /cab/invoices/:id/credit-notes
 * Client: GET /billing/cab-invoices, GET /billing/cab-invoices/:id (issued invoices only)
 *
 * The register page is shared by CAB staff and the client portal (/portal/invoices); the
 * signed-in session decides which endpoints are called. The server raises the 50% advance
 * draft when a quotation is accepted, notifies the client when an invoice is issued
 * (`invoice_due`), and payments become the client's wallet history.
 *
 * Errors keep the demo's codes: the server message starts with the code
 * (e.g. "INVOICE_IMMUTABLE: …"), which is rethrown as `new Error('INVOICE_IMMUTABLE')`
 * so the pages can show their translated text. In the preview (demo mode) invoices live in the
 * shared demo store (lib/api/demo/records.ts).
 */
import { ApiError } from '@/lib/api/client'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { createManualInvoiceRecord, invoices, onInvoiceIssued, onInvoicePaymentRecorded, saveInvoices, scopeToSession } from '@/lib/api/demo/records'
import { isAuditClientSession } from '@/lib/authStorage'

export type CabInvoiceStatus = 'Unpaid' | 'Paid' | 'Partially paid' | 'Draft' | 'Issued'

export interface CabCreditNote {
  id: string
  creditNoteNumber: string
  /** Stable link to the original invoice — never detached. */
  linkedInvoiceId: string
  linkedInvoiceNumber: string
  amount: number
  currency: string
  reason: string
  createdOn: string
}
export interface CabInvoiceItem {
  id: string
  invoiceNumber: string
  clientName: string
  clientCode: string
  country: string
  issuedDate: string
  dueDate: string
  currency: string
  amount: number
  paidAmount: number
  balance: number
  status: CabInvoiceStatus
  /** CAB-client relationship scope — never cross-tenant sharing. */
  organizationId: string
  siteId: string
  contactId: string
  documentIds: string[]
  relatedOrder: string
  orderStatus: string
  relatedApplication: string
  poReference?: string
  primaryContact: string
  contactEmail: string
  billingAddress: {
    name: string
    line1: string
    cityArea: string
    country: string
  }
  taxRate?: {
    id: string
    label: string
    percentage: number
  }
  items: Array<{
    id: string
    name: string
    description: string
    qty: number
    unitPrice: number
    amount: number
  }>
  installments: Array<{
    id: string
    dueDate: string
    amount: number
    status: 'Pending' | 'Paid'
  }>
  attachments: Array<{
    id: string
    name: string
    type: string
    size: string
    uploadedOn: string
  }>
  payments: Array<{
    id: string
    amount: number
    date: string
    method: string
    reference: string
    note?: string
  }>
}

export interface CabInvoiceFilterParams {
  searchQuery?: string
  startDate?: string
  endDate?: string
  country?: string
  paymentStatus?: string
}

// Invoices live in the shared demo store: raised from accepted quotations,
// paid from the client portal, and listed per client there (lib/api/demo/records.ts).
const store = () => invoices()

const ERROR_CODES = [
  'INVOICE_NOT_FOUND', 'INVOICE_IMMUTABLE', 'INVOICE_SETTLED', 'INVOICE_NOT_ISSUED', 'AMOUNT_EXCEEDS_BALANCE',
  'BILLING_REQUIRED', 'TAX_REQUIRED', 'CLIENT_NOT_FOUND', 'CURRENCY_NOT_ALLOWED', 'ITEMS_REQUIRED', 'CREDIT_NOTE_REQUIRES_ISSUED', 'CREDIT_EXCEEDS_BALANCE',
]

/** Turns "CODE: message" API errors into `Error('CODE')`, the shape the pages already handle. */
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await authorizedRequest<T>(path, init)
  } catch (err) {
    if (err instanceof ApiError) {
      const code = ERROR_CODES.find((c) => err.message.startsWith(c))
      if (code) throw new Error(code, { cause: err })
    }
    throw err
  }
}

const invoicePath = (id: string, suffix = '') => `/cab/invoices/${encodeURIComponent(id)}${suffix}`

function invoiceQuery(params?: CabInvoiceFilterParams): string {
  const qs = new URLSearchParams()
  const add = (key: string, value?: string) => {
    if (value && value !== 'all') qs.set(key, value)
  }
  add('search', params?.searchQuery?.trim())
  add('country', params?.country)
  add('paymentStatus', params?.paymentStatus)
  add('startDate', params?.startDate)
  add('endDate', params?.endDate)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export function getCabInvoices(params?: CabInvoiceFilterParams): Promise<CabInvoiceItem[]> {
  if (!isDemoMode()) {
    const base = isAuditClientSession() ? '/billing/cab-invoices' : '/cab/invoices'
    return call<CabInvoiceItem[]>(`${base}${invoiceQuery(params)}`)
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = scopeToSession([...store()], (inv) => inv.organizationId)
      // Like GET /billing/cab-invoices, clients only see issued invoices (no drafts).
      if (isAuditClientSession()) results = results.filter((inv) => inv.status !== 'Draft')
      if (params?.searchQuery) {
        const q = params.searchQuery.toLowerCase().trim()
        results = results.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.clientName.toLowerCase().includes(q) ||
            inv.clientCode.toLowerCase().includes(q)
        )
      }
      if (params?.country && params.country !== 'all') {
        results = results.filter((inv) => inv.country.toLowerCase() === params.country?.toLowerCase())
      }
      if (params?.paymentStatus && params.paymentStatus !== 'all') {
        results = results.filter((inv) => inv.status.toLowerCase() === params.paymentStatus?.toLowerCase())
      }
      resolve(results)
    }, 180)
  })
}

export interface CreateCabInvoiceInput {
  clientId: string
  currency: string
  poReference?: string
}

/** Opens a manual draft invoice for one of the CAB's audit clients; its lines come from the fee catalog. */
export function createCabInvoice(input: CreateCabInvoiceInput): Promise<CabInvoiceItem> {
  if (!isDemoMode()) {
    const body: Record<string, unknown> = { clientId: input.clientId, currency: input.currency }
    if (input.poReference?.trim()) body.poReference = input.poReference.trim()
    return call<CabInvoiceItem>('/cab/invoices', { method: 'POST', body: JSON.stringify(body) })
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const inv = createManualInvoiceRecord(input.clientId, input.currency, input.poReference?.trim())
      if (inv) resolve(inv)
      else reject(new Error('CLIENT_NOT_FOUND'))
    }, 180)
  })
}

export async function getCabInvoiceById(id: string): Promise<CabInvoiceItem | null> {
  if (!isDemoMode()) {
    const path = isAuditClientSession() ? `/billing/cab-invoices/${encodeURIComponent(id)}` : invoicePath(id)
    try {
      return await call<CabInvoiceItem>(path)
    } catch (err) {
      if (err instanceof Error && err.message === 'INVOICE_NOT_FOUND') return null
      throw err
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      // Clients only reach their own issued invoices (as GET /billing/cab-invoices/:id).
      const visible = isAuditClientSession()
        ? scopeToSession([...store()], (i) => i.organizationId).filter((i) => i.status !== 'Draft')
        : store()
      const inv = visible.find(
        (i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase()
      )
      resolve(inv || null)
    }, 150)
  })
}

export function recordPayment(
  invoiceId: string,
  payment: { amount: number; date: string; method: string; reference: string; note?: string }
): Promise<CabInvoiceItem | null> {
  if (!isDemoMode()) {
    return call<CabInvoiceItem>(invoicePath(invoiceId, '/payments'), { method: 'POST', body: JSON.stringify(payment) })
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = store().findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx === -1) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      const inv = store()[idx]
      // Finalized invoices stay immutable — payments only allocate against the balance.
      if (inv.status === 'Issued' || inv.status === 'Paid') {
        if (inv.balance <= 0) {
          reject(new Error('INVOICE_SETTLED'))
          return
        }
      }
      if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
        reject(new Error('INVALID_AMOUNT'))
        return
      }
      if (payment.amount - inv.balance > 0.009) {
        reject(new Error('AMOUNT_EXCEEDS_BALANCE'))
        return
      }
      if (!payment.date || !payment.method) {
        reject(new Error('PAYMENT_DETAILS_REQUIRED'))
        return
      }
      {
        const current = store()[idx]
        const newPaid = current.paidAmount + payment.amount
        const newBalance = Math.max(0, current.amount - newPaid)
        const newStatus: CabInvoiceStatus =
          newBalance === 0 ? 'Paid' : newPaid > 0 ? 'Partially paid' : 'Unpaid'

        const updated: CabInvoiceItem = {
          ...current,
          paidAmount: newPaid,
          balance: newBalance,
          status: newStatus,
          payments: [
            ...current.payments,
            {
              id: `pay-${Date.now()}`,
              ...payment,
            },
          ],
        }
        store()[idx] = updated
        saveInvoices()
        onInvoicePaymentRecorded(updated, payment.amount)
        resolve(updated)
      }
    }, 200)
  })
}

export function updateInvoiceTax(
  invoiceId: string,
  taxRate: { id: string; label: string; percentage: number }
): Promise<CabInvoiceItem | null> {
  if (!isDemoMode()) {
    return call<CabInvoiceItem>(invoicePath(invoiceId, '/tax'), { method: 'PATCH', body: JSON.stringify(taxRate) })
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = store().findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx === -1) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      const inv = store()[idx]
      // Finalized invoices are immutable — tax cannot change after issue.
      if (inv.status === 'Issued' || inv.status === 'Paid' || inv.status === 'Partially paid') {
        reject(new Error('INVOICE_IMMUTABLE'))
        return
      }
      if (idx !== -1) {
        store()[idx].taxRate = taxRate
        saveInvoices()
        resolve(store()[idx])
      } else {
        resolve(null)
      }
    }, 150)
  })
}

/** Draft save permits incomplete later-stage data (billing/tax may be missing). */
export function saveInvoiceDraft(
  invoiceId: string,
  patch: Partial<CabInvoiceItem>
): Promise<CabInvoiceItem | null> {
  if (!isDemoMode()) {
    // Only the editable draft fields are sent; ids, status and amounts are the server's.
    const body: Record<string, unknown> = {}
    if (patch.poReference !== undefined) body.poReference = patch.poReference
    if (patch.primaryContact !== undefined) body.primaryContact = patch.primaryContact
    if (patch.contactEmail !== undefined) body.contactEmail = patch.contactEmail
    if (patch.billingAddress) body.billingAddress = patch.billingAddress
    if (patch.items) body.items = patch.items.map(({ name, description, qty, unitPrice }) => ({ name, description, qty, unitPrice }))
    if (patch.installments) body.installments = patch.installments
    return call<CabInvoiceItem>(invoicePath(invoiceId), { method: 'PATCH', body: JSON.stringify(body) })
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = store().findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx === -1) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      const current = store()[idx]
      if (current.status !== 'Draft' && current.status !== 'Unpaid') {
        reject(new Error('INVOICE_IMMUTABLE'))
        return
      }
      const updated: CabInvoiceItem = {
        ...current,
        ...patch,
        id: current.id,
        invoiceNumber: current.invoiceNumber,
        // Tenant scope is stable within the CAB-client relationship.
        organizationId: current.organizationId,
        siteId: current.siteId,
        contactId: current.contactId,
        documentIds: current.documentIds,
        status: 'Draft',
        paidAmount: current.paidAmount,
        balance: current.balance,
        payments: current.payments,
      }
      store()[idx] = updated
      saveInvoices()
      resolve(updated)
    }, 150)
  })
}

export interface InvoiceIssueGate {
  ok: boolean
  missingBilling: boolean
  missingTax: boolean
}

/** Issuing requires billing + applicable tax configuration. */
export function getInvoiceIssueGate(invoice: CabInvoiceItem): InvoiceIssueGate {
  const billing = invoice.billingAddress
  const missingBilling = !billing || !billing.name?.trim() || !billing.line1?.trim() || !billing.country?.trim()
  const missingTax = !invoice.taxRate
  return { ok: !missingBilling && !missingTax, missingBilling, missingTax }
}

/** Issue a draft invoice — the finalized invoice becomes immutable. */
export function issueInvoice(invoiceId: string): Promise<CabInvoiceItem | null> {
  if (!isDemoMode()) return call<CabInvoiceItem>(invoicePath(invoiceId, '/issue'), { method: 'POST' })
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = store().findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx === -1) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      const current = store()[idx]
      if (current.status !== 'Draft' && current.status !== 'Unpaid') {
        reject(new Error('INVOICE_IMMUTABLE'))
        return
      }
      const gate = getInvoiceIssueGate(current)
      if (!gate.ok) {
        reject(new Error(gate.missingBilling ? 'BILLING_REQUIRED' : 'TAX_REQUIRED'))
        return
      }
      const updated: CabInvoiceItem = { ...current, status: current.paidAmount > 0 ? current.status : 'Issued' }
      // Draft with no payments moves to Issued (still immutable for header/tax/items).
      if (current.status === 'Draft' && current.paidAmount <= 0) {
        updated.status = 'Issued'
        updated.balance = updated.amount
      }
      store()[idx] = updated
      saveInvoices()
      onInvoiceIssued(updated)
      resolve(updated)
    }, 180)
  })
}

let cabCreditNotesStore: CabCreditNote[] = []

/** Credit note stays linked to the original — issued invoices are never deleted. */
export function createCreditNote(
  invoiceId: string,
  input: { amount: number; reason: string }
): Promise<CabCreditNote> {
  if (!isDemoMode()) {
    return call<CabCreditNote>(invoicePath(invoiceId, '/credit-notes'), { method: 'POST', body: JSON.stringify(input) })
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const inv = store().find(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (!inv) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      if (inv.status === 'Draft') {
        reject(new Error('CREDIT_NOTE_REQUIRES_ISSUED'))
        return
      }
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        reject(new Error('INVALID_AMOUNT'))
        return
      }
      if (!input.reason?.trim()) {
        reject(new Error('REASON_REQUIRED'))
        return
      }
      const note: CabCreditNote = {
        id: `cn-${Date.now()}`,
        creditNoteNumber: `CN-${inv.invoiceNumber.replace(/^INV-/, '')}-${String(cabCreditNotesStore.length + 1).padStart(2, '0')}`,
        linkedInvoiceId: inv.id,
        linkedInvoiceNumber: inv.invoiceNumber,
        amount: input.amount,
        currency: inv.currency,
        reason: input.reason.trim(),
        createdOn: new Date().toISOString(),
      }
      cabCreditNotesStore = [...cabCreditNotesStore, note]
      resolve(note)
    }, 180)
  })
}
