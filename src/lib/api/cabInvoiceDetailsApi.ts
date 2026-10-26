/**
 * Invoice details page actions that the register API does not cover.
 * Real endpoints:
 *   PATCH  /cab/invoices/:id { poReference, currency }               (drafts only)
 *   POST   /cab/invoices/:id/billing-address/from-client             (drafts only)
 *   POST   /cab/invoices/:id/attachments  multipart field "file"     (PDF, images, Word, Excel ≤ 10 MB)
 *   DELETE /cab/invoices/:id/attachments/:attachmentId
 * Each returns the updated `CabInvoiceItem`. Attachments carry a download `url`.
 * Errors are rethrown as `Error(code)` (INVOICE_IMMUTABLE, CLIENT_ADDRESS_MISSING,
 * ATTACHMENT_TOO_LARGE, ATTACHMENT_LIMIT, ATTACHMENT_NOT_FOUND, INVOICE_NOT_FOUND).
 * In the preview (demo mode) the demo store invoice is changed and files are kept as data URLs.
 */
import { ApiError } from '@/lib/api/client'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import type { CabInvoiceItem } from '@/lib/api/cabInvoiceRegisterApi'
import { clientRecord, invoices, saveInvoices } from '@/lib/api/demo/records'
import { isDemoMode } from '@/lib/api/demo/demoStore'

export type InvoiceAttachment = CabInvoiceItem['attachments'][number] & { url?: string; mimeType?: string }

export const INVOICE_CURRENCIES = ['SAR', 'USD', 'EGP', 'EUR', 'GBP', 'AED'] as const
export const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
/** The preview keeps files in localStorage, so it accepts smaller ones. */
export const DEMO_ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024
const ATTACHMENT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const ERROR_CODES = ['INVOICE_IMMUTABLE', 'CLIENT_ADDRESS_MISSING', 'ATTACHMENT_TOO_LARGE', 'ATTACHMENT_LIMIT', 'ATTACHMENT_NOT_FOUND', 'INVOICE_NOT_FOUND']

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await authorizedRequest<T>(path, init)
  } catch (err) {
    if (err instanceof ApiError) {
      const code = ERROR_CODES.find((c) => err.message.startsWith(c))
      if (code) throw new Error(code, { cause: err })
      if (err.status === 400 && /file type/i.test(err.message)) throw new Error('ATTACHMENT_TYPE', { cause: err })
    }
    throw err
  }
}

const path = (id: string, suffix = '') => `/cab/invoices/${encodeURIComponent(id)}${suffix}`

/** Mutate the demo invoice and return a copy. */
function demoUpdate(id: string, fn: (inv: CabInvoiceItem) => CabInvoiceItem): CabInvoiceItem {
  const list = invoices()
  const idx = list.findIndex((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase())
  if (idx === -1) throw new Error('INVOICE_NOT_FOUND')
  list[idx] = fn(list[idx])
  saveInvoices()
  return { ...list[idx] }
}

const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export async function saveInvoiceHeader(invoice: CabInvoiceItem, patch: { poReference?: string; currency?: string }): Promise<CabInvoiceItem> {
  if (!isDemoMode()) return call<CabInvoiceItem>(path(invoice.id), { method: 'PATCH', body: JSON.stringify(patch) })
  await wait()
  return demoUpdate(invoice.id, (inv) => {
    if (inv.status !== 'Draft') throw new Error('INVOICE_IMMUTABLE')
    return { ...inv, ...(patch.poReference !== undefined ? { poReference: patch.poReference } : {}), ...(patch.currency ? { currency: patch.currency } : {}) }
  })
}

export async function applyClientAddress(invoice: CabInvoiceItem): Promise<CabInvoiceItem> {
  if (!isDemoMode()) return call<CabInvoiceItem>(path(invoice.id, '/billing-address/from-client'), { method: 'POST' })
  await wait()
  return demoUpdate(invoice.id, (inv) => {
    if (inv.status !== 'Draft') throw new Error('INVOICE_IMMUTABLE')
    const c = clientRecord(inv.organizationId)
    if (!c?.address) throw new Error('CLIENT_ADDRESS_MISSING')
    return { ...inv, clientName: c.name, country: c.country, billingAddress: { name: c.name, line1: c.address, cityArea: c.city, country: c.country } }
  })
}

const sizeLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
const kindOf = (mime: string) =>
  mime === 'application/pdf' ? 'PDF' : mime.startsWith('image/') ? 'Image' : /sheet|excel/.test(mime) ? 'Spreadsheet' : 'Document'

/** Client-side check with the same rules as the server. Returns an error code or null. */
export function checkAttachment(file: File): 'ATTACHMENT_TYPE' | 'ATTACHMENT_TOO_LARGE' | null {
  if (!ATTACHMENT_MIMES.includes(file.type)) return 'ATTACHMENT_TYPE'
  if (file.size > (isDemoMode() ? DEMO_ATTACHMENT_MAX_BYTES : ATTACHMENT_MAX_BYTES)) return 'ATTACHMENT_TOO_LARGE'
  return null
}

export async function uploadInvoiceAttachment(invoice: CabInvoiceItem, file: File): Promise<CabInvoiceItem> {
  const problem = checkAttachment(file)
  if (problem) throw new Error(problem)
  if (!isDemoMode()) {
    const form = new FormData()
    form.append('file', file)
    return call<CabInvoiceItem>(path(invoice.id, '/attachments'), { method: 'POST', body: form })
  }
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })
  const attachment: InvoiceAttachment = {
    id: `att-${Date.now()}`,
    name: file.name,
    type: kindOf(file.type),
    size: sizeLabel(file.size),
    uploadedOn: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    url,
    mimeType: file.type,
  }
  return demoUpdate(invoice.id, (inv) => {
    if (inv.attachments.length >= 20) throw new Error('ATTACHMENT_LIMIT')
    return { ...inv, attachments: [...inv.attachments, attachment] }
  })
}

export async function removeInvoiceAttachment(invoice: CabInvoiceItem, attachmentId: string): Promise<CabInvoiceItem> {
  if (!isDemoMode()) return call<CabInvoiceItem>(path(invoice.id, `/attachments/${encodeURIComponent(attachmentId)}`), { method: 'DELETE' })
  await wait()
  return demoUpdate(invoice.id, (inv) => {
    if (!inv.attachments.some((a) => a.id === attachmentId)) throw new Error('ATTACHMENT_NOT_FOUND')
    return { ...inv, attachments: inv.attachments.filter((a) => a.id !== attachmentId) }
  })
}

/** Opens / saves an attachment (server URL or preview data URL). */
export function downloadAttachment(attachment: InvoiceAttachment): boolean {
  if (!attachment.url) return false
  const a = document.createElement('a')
  a.href = attachment.url
  a.download = attachment.name
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  return true
}
