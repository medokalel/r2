import { authorizedRequest } from '@/lib/api/authorizedClient'
import { uiLocale } from '@/lib/format/dates'

export type InvoiceStatus = 'PAYMENT_MADE' | 'PENDING' | 'OVERDUE'
export type InvoiceCurrency = 'SAR' | 'USD' | 'EGP' | 'EUR' | 'GBP' | 'AED'

export interface Invoice {
  id: string
  commercialRegisterNumber: string
  username: string
  email: string
  orderNumber: string
  orderStatus: string
  invoiceType: string
  paymentNumber: string
  paymentDate: string
  totalAmount: number
  currency: InvoiceCurrency
  status: InvoiceStatus
  createdAt: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ListInvoicesParams {
  page?: number
  limit?: number
  search?: string
  currency?: InvoiceCurrency
  status?: InvoiceStatus
}

export function listInvoices(params: ListInvoicesParams = {}): Promise<PaginatedResult<Invoice>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.currency) query.set('currency', params.currency)
  if (params.status) query.set('status', params.status)

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return authorizedRequest<PaginatedResult<Invoice>>(`/billing/invoices${suffix}`)
}

export function formatInvoiceDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(uiLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatInvoiceAmount(amount: number): string {
  return amount.toLocaleString('en-US')
}

export function currencySymbol(currency: InvoiceCurrency): string {
  const symbols: Record<InvoiceCurrency, string> = {
    SAR: '﷼',
    USD: '$',
    EGP: 'EGP',
    EUR: '€',
    GBP: '£',
    AED: 'AED',
  }
  return symbols[currency]
}
