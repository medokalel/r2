import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DateRange } from '@/components/ui'
import { getAuditCalendarEntries, type AuditCalendarEntry, type AuditCalendarStatus } from '@/lib/api/auditCalendarApi'

/** Today's date (YYYY-MM-DD) in the viewer's local time zone — the day the calendars open on. */
export function todayIso(): string {
  const now = new Date()
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate())
}

export const STATUS_KEYS: AuditCalendarStatus[] = [
  'planned',
  'inProgress',
  'completed',
  'cancelled',
  'reportFinalization',
  'postponed',
]

export const STATUS_DOT: Record<AuditCalendarStatus, string> = {
  planned: 'bg-primary',
  inProgress: 'bg-success-600',
  completed: 'bg-purple-600',
  reportFinalization: 'bg-warning-500',
  cancelled: 'bg-error-600',
  postponed: 'bg-neutral-700',
}

export const STATUS_BORDER: Record<AuditCalendarStatus, string> = {
  planned: 'border-s-primary',
  inProgress: 'border-s-success-600',
  completed: 'border-s-purple-600',
  reportFinalization: 'border-s-warning-500',
  cancelled: 'border-s-error-600',
  postponed: 'border-s-neutral-700',
}

export const STATUS_BADGE: Record<AuditCalendarStatus, string> = {
  planned: 'bg-primary-50 text-primary',
  inProgress: 'bg-success-100 text-success-600',
  completed: 'bg-purple-50 text-purple-600',
  reportFinalization: 'bg-warning-50 text-warning-700',
  cancelled: 'bg-error-100 text-error-600',
  postponed: 'bg-neutral-50 text-neutral-600',
}

/** Soft tint for month-grid entry cards — same hue as STATUS_DOT, low opacity. */
export const STATUS_CELL_BG: Record<AuditCalendarStatus, string> = {
  planned: 'bg-primary/10',
  inProgress: 'bg-success-600/10',
  completed: 'bg-purple-600/10',
  reportFinalization: 'bg-warning-500/10',
  cancelled: 'bg-error-600/10',
  postponed: 'bg-neutral-700/10',
}

export function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const EMPTY_DATE_RANGE: DateRange = { from: null, to: null }

/** Month back/forward navigation shared by the mini calendar and the full month grid. */
export function useMonthNavigation(initialYear: number, initialMonth: number) {
  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }
  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  return { viewYear, viewMonth, setViewYear, setViewMonth, goToPrevMonth, goToNextMonth }
}

/** Loads audit calendar entries (every audit day of the CAB's plans) while a modal is open. */
export function useAuditCalendarEntries(open: boolean) {
  const [entries, setEntries] = useState<AuditCalendarEntry[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getAuditCalendarEntries()
      .then((data) => {
        if (!cancelled) setEntries(data)
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })
    return () => {
      cancelled = true
    }
  }, [open])

  return entries
}

/** Filter state + derived options/results shared by the mini and full calendar views. */
export function useAuditCalendarFilters(entries: AuditCalendarEntry[]) {
  const { t } = useTranslation()
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_DATE_RANGE)
  const [auditTypeFilter, setAuditTypeFilter] = useState('')
  const [standardFilter, setStandardFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [auditorFilter, setAuditorFilter] = useState('')

  const auditTypeOptions = useMemo(() => Array.from(new Set(entries.map((e) => e.auditType))).sort(), [entries])
  const standardOptions = useMemo(() => Array.from(new Set(entries.map((e) => e.standard))).sort(), [entries])
  const auditorOptions = useMemo(() => Array.from(new Set(entries.flatMap((e) => e.auditTeam))).sort(), [entries])
  const statusFilterOptions = STATUS_KEYS.map((key) => ({
    value: key,
    label: t(`cab.dashboard.auditCalendar.status.${key}`),
  }))

  const hasActiveFilters =
    Boolean(dateRange.from) ||
    Boolean(auditTypeFilter) ||
    Boolean(standardFilter) ||
    Boolean(statusFilter) ||
    Boolean(auditorFilter)

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (dateRange.from) {
        const entryDate = parseIsoDate(entry.date)
        const rangeEnd = dateRange.to ?? dateRange.from
        if (entryDate < dateRange.from || entryDate > rangeEnd) return false
      }
      if (auditTypeFilter && entry.auditType !== auditTypeFilter) return false
      if (standardFilter && entry.standard !== standardFilter) return false
      if (statusFilter && entry.status !== statusFilter) return false
      if (auditorFilter && !entry.auditTeam.includes(auditorFilter)) return false
      return true
    })
  }, [entries, dateRange, auditTypeFilter, standardFilter, statusFilter, auditorFilter])

  function reset() {
    setDateRange(EMPTY_DATE_RANGE)
    setAuditTypeFilter('')
    setStandardFilter('')
    setStatusFilter('')
    setAuditorFilter('')
  }

  return {
    dateRange,
    setDateRange,
    auditTypeFilter,
    setAuditTypeFilter,
    standardFilter,
    setStandardFilter,
    statusFilter,
    setStatusFilter,
    auditorFilter,
    setAuditorFilter,
    auditTypeOptions,
    standardOptions,
    auditorOptions,
    statusFilterOptions,
    hasActiveFilters,
    filteredEntries,
    reset,
  }
}

export type AuditCalendarFiltersState = ReturnType<typeof useAuditCalendarFilters>