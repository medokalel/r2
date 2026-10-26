import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { AppIcon, DownloadIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { getDaysInMonth, weekdayOf } from '@/components/ui/calendarUtils'
import { AuditCalendarFiltersBar } from '@/components/dashboard/cab/AuditCalendarFiltersBar'
import {
  STATUS_BORDER,
  STATUS_CELL_BG,
  STATUS_DOT,
  STATUS_KEYS,
  toIsoDate,
  todayIso,
  useAuditCalendarEntries,
  useAuditCalendarFilters,
  useMonthNavigation,
} from '@/components/dashboard/cab/auditCalendarShared'
import type { AuditCalendarEntry } from '@/lib/api/auditCalendarApi'
import { cn } from '@/lib/utils'

interface FullAuditCalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialYear: number
  initialMonth: number
}

interface MonthCell {
  date: Date
  iso: string
  inMonth: boolean
}

/** Full 7-day weeks covering the month, padded with adjacent-month days like a normal calendar grid. */
function getMonthMatrix(year: number, month: number): MonthCell[][] {
  const totalDays = getDaysInMonth(year, month)
  const firstWeekday = weekdayOf(year, month, 1)

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const prevTotal = getDaysInMonth(prevYear, prevMonth)

  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  const cells: MonthCell[] = []

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevTotal - i
    cells.push({ date: new Date(prevYear, prevMonth, day), iso: toIsoDate(prevYear, prevMonth, day), inMonth: false })
  }
  for (let day = 1; day <= totalDays; day++) {
    cells.push({ date: new Date(year, month, day), iso: toIsoDate(year, month, day), inMonth: true })
  }
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ date: new Date(nextYear, nextMonth, nextDay), iso: toIsoDate(nextYear, nextMonth, nextDay), inMonth: false })
    nextDay += 1
  }

  const weeks: MonthCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export function FullAuditCalendarModal({ open, onOpenChange, initialYear, initialMonth }: FullAuditCalendarModalProps) {
  const { t, i18n } = useTranslation()
  const entries = useAuditCalendarEntries(open)
  const { viewYear, viewMonth, goToPrevMonth, goToNextMonth } = useMonthNavigation(initialYear, initialMonth)
  const filters = useAuditCalendarFilters(entries)
  const { filteredEntries } = filters

  const weeks = useMemo(() => getMonthMatrix(viewYear, viewMonth), [viewYear, viewMonth])
  const today = todayIso()

  const entriesByDate = useMemo(() => {
    const map = new Map<string, AuditCalendarEntry[]>()
    for (const entry of filteredEntries) {
      const list = map.get(entry.date) ?? []
      list.push(entry)
      map.set(entry.date, list)
    }
    return map
  }, [filteredEntries])

  const weekdayLabels = useMemo(() => {
    // Monday-based, matching CalendarGrid/weekdayOf.
    const monday = new Date(2024, 0, 1) // a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toLocaleDateString(i18n.language, { weekday: 'long' })
    })
  }, [i18n.language])

  const monthRangeLabel = useMemo(() => {
    const lastCell = weeks[weeks.length - 1]?.[6]?.date ?? new Date(viewYear, viewMonth, 1)
    const startLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(i18n.language, { month: 'long' })
    const sameMonth = lastCell.getMonth() === viewMonth && lastCell.getFullYear() === viewYear
    if (sameMonth) {
      return new Date(viewYear, viewMonth, 1).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
    }
    const endLabel = lastCell.toLocaleDateString(i18n.language, { month: 'long' })
    return `${startLabel} - ${endLabel} ${lastCell.getFullYear()}`
  }, [weeks, viewYear, viewMonth, i18n.language])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(1280px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          <div className="flex shrink-0 items-start justify-between px-6 pt-6">
            <div>
              <Dialog.Title className="text-[28px] font-bold text-neutral-900">
                {t('cab.dashboard.auditCalendar.full.title')}
              </Dialog.Title>
              <p className="mt-1 text-body-sm text-neutral-600">
                {t('cab.dashboard.auditCalendar.full.subtitle')}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <AuditCalendarFiltersBar filters={filters} className="mt-5" />

            {/* Month nav + legend */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  aria-label={t('cab.dashboard.auditCalendar.previousMonth')}
                  className="flex size-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl-flip">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-body-lg font-bold capitalize text-neutral-900">{monthRangeLabel}</span>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  aria-label={t('cab.dashboard.auditCalendar.nextMonth')}
                  className="flex size-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl-flip">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {STATUS_KEYS.map((key) => (
                  <span key={key} className="flex items-center gap-1.5 text-body-sm text-neutral-700">
                    <span className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[key])} />
                    {t(`cab.dashboard.auditCalendar.status.${key}`)}
                  </span>
                ))}
              </div>
            </div>

            {/* Month grid */}
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-300">
              <div className="grid grid-cols-7 border-b border-neutral-300 bg-neutral-50">
                {weekdayLabels.map((label) => (
                  <div key={label} className="px-3 py-2 text-center text-body-sm font-semibold text-neutral-600">
                    {label}
                  </div>
                ))}
              </div>

              {weeks.map((week, weekIndex) => (
                <div
                  key={week[0].iso}
                  className={cn('grid grid-cols-7', weekIndex > 0 && 'border-t border-neutral-300')}
                >
                  {week.map((cell) => {
                    const dayEntries = entriesByDate.get(cell.iso) ?? []
                    const [primaryEntry, ...restEntries] = dayEntries
                    const isToday = cell.iso === today

                    return (
                      <div
                        key={cell.iso}
                        className={cn(
                          'min-h-[104px] border-e border-neutral-300 p-2 last:border-e-0',
                          !cell.inMonth && 'bg-neutral-50/60'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex size-6 items-center justify-center rounded-full text-body-sm',
                            isToday
                              ? 'bg-primary font-semibold text-white'
                              : cell.inMonth
                                ? 'text-neutral-800'
                                : 'text-neutral-400'
                          )}
                        >
                          {cell.date.getDate()}
                        </span>

                        {primaryEntry && (
                          <div className="mt-1.5 space-y-1">
                            <div
                              className={cn(
                                'rounded-sm border-s-2 px-2 py-1',
                                STATUS_BORDER[primaryEntry.status],
                                STATUS_CELL_BG[primaryEntry.status]
                              )}
                            >
                              <div className="flex items-center gap-1 text-caption text-neutral-600">
                                <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[primaryEntry.status])} />
                                {primaryEntry.timeRange}
                              </div>
                              <p className="truncate text-caption font-semibold text-neutral-900">
                                {primaryEntry.clientName}
                              </p>
                              <p className="truncate text-caption text-neutral-600">{primaryEntry.standard}</p>
                            </div>

                            {restEntries.length > 0 && (
                              <p className="text-caption font-medium text-primary">
                                {t('cab.dashboard.auditCalendar.full.moreCount', { count: restEntries.length })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-md bg-primary-25 px-4 py-3 text-body-sm text-neutral-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-primary">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="8" r="1" fill="currentColor" />
              </svg>
              {t('cab.dashboard.auditCalendar.timezoneNote')}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="secondary" className="h-11 gap-2 rounded-md px-5">
                {t('cab.dashboard.auditCalendar.exportCalendar')}
                <AppIcon icon={DownloadIcon} size={16} />
              </Button>
              <Dialog.Close asChild>
                <Button variant="primary" className="h-11 rounded-md px-5">
                  {t('common.close')}
                </Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}