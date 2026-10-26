import { authorizedRequest } from '@/lib/api/authorizedClient'
import { uiLocale } from '@/lib/format/dates'

export type PeriodicVisitProcedure = 'PERIODIC' | 'PERIODIC_AND_EXPANDING'

export interface PeriodicVisit {
  id: string
  certificateNumber: string
  specificationName: string
  economicSectors: string[]
  visitingDate: string
  procedure: PeriodicVisitProcedure
  /** Audit plan this visit mirrors (set when the CAB sent the plan). */
  auditPlanId?: string | null
  /** When the client confirmed the visit; null while it awaits confirmation. */
  confirmedAt?: string | null
  createdAt: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ListPeriodicVisitsParams {
  page?: number
  limit?: number
  search?: string
  procedure?: PeriodicVisitProcedure
  specification?: string
}

export function listPeriodicVisits(
  params: ListPeriodicVisitsParams = {}
): Promise<PaginatedResult<PeriodicVisit>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.procedure) query.set('procedure', params.procedure)
  if (params.specification?.trim()) query.set('specification', params.specification.trim())

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return authorizedRequest<PaginatedResult<PeriodicVisit>>(`/billing/periodic-visits${suffix}`)
}

/**
 * POST /billing/periodic-visits/:id/confirm — the client confirms a visit sent by the CAB
 * (only visits with an `auditPlanId`). The CAB is notified (`audit_plan_pending_approval`).
 */
export function confirmPeriodicVisit(id: string): Promise<PeriodicVisit> {
  return authorizedRequest<PeriodicVisit>(`/billing/periodic-visits/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
  })
}

export function formatVisitDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(uiLocale(), {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

const RED_SECTOR_CODES = new Set(['07', '14', '12'])

export function sectorBadgeVariant(code: string): 'red' | 'green' {
  return RED_SECTOR_CODES.has(code) ? 'red' : 'green'
}
