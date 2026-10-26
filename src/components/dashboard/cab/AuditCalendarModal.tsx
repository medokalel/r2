import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { AppIcon, CalendarIcon, DownloadIcon, FileTextIcon, MoreIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { AvatarStack } from '@/components/ui'
import { CalendarGrid } from '@/components/ui/CalendarGrid'
import { AuditCalendarFiltersBar } from '@/components/dashboard/cab/AuditCalendarFiltersBar'
import { FullAuditCalendarModal } from '@/components/dashboard/cab/FullAuditCalendarModal'
import {
  STATUS_BADGE,
  STATUS_BORDER,
  STATUS_DOT,
  STATUS_KEYS,
  toIsoDate,
  todayIso,
  useAuditCalendarEntries,
  useAuditCalendarFilters,
  useMonthNavigation,
} from '@/components/dashboard/cab/auditCalendarShared'
import { cn } from '@/lib/utils'

interface AuditCalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditCalendarModal({ open, onOpenChange }: AuditCalendarModalProps) {
  const { t, i18n } = useTranslation()
  const entries = useAuditCalendarEntries(open)
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [isFullCalendarOpen, setIsFullCalendarOpen] = useState(false)

  const { viewYear, viewMonth, goToPrevMonth, goToNextMonth } = useMonthNavigation(Number(selectedDate.slice(0, 4)), Number(selectedDate.slice(5, 7)) - 1)
  const filters = useAuditCalendarFilters(entries)
  const { filteredEntries } = filters

  const datesWithAudits = useMemo(() => new Set(filteredEntries.map((e) => e.date)), [filteredEntries])
  const entriesForSelectedDate = filteredEntries.filter((e) => e.date === selectedDate)

  const selectedDateLabel = new Date(selectedDate).toLocaleDateString(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  function handleViewFullCalendar() {
    onOpenChange(false)
    setIsFullCalendarOpen(true)
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(960px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
          >
            <div className="flex shrink-0 items-start justify-between px-6 pt-6">
              <div>
                <Dialog.Title className="text-[28px] font-bold text-neutral-900">
                  {t('cab.dashboard.auditCalendar.title')}
                </Dialog.Title>
                <p className="mt-1 text-body-sm text-neutral-600">
                  {t('cab.dashboard.auditCalendar.subtitle')}
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

              <div className="mt-5 flex flex-col gap-5 lg:flex-row">
                {/* Mini calendar */}
                <div className="w-full shrink-0 lg:w-[340px]">
                  <div className="rounded-lg border border-neutral-300 p-4">
                    <CalendarGrid
                      viewYear={viewYear}
                      viewMonth={viewMonth}
                      onPrevMonth={goToPrevMonth}
                      onNextMonth={goToNextMonth}
                      onDayClick={(date) => setSelectedDate(toIsoDate(date.getFullYear(), date.getMonth(), date.getDate()))}
                      isDaySelected={(date) =>
                        toIsoDate(date.getFullYear(), date.getMonth(), date.getDate()) === selectedDate
                      }
                      renderDayIndicator={(date) =>
                        datesWithAudits.has(toIsoDate(date.getFullYear(), date.getMonth(), date.getDate())) ? (
                          <span className="absolute bottom-1 size-1 rounded-full bg-primary" aria-hidden />
                        ) : null
                      }
                      size="sm"
                    />

                    <div className="mt-4 flex gap-3">
                      <Dialog.Close asChild>
                        <Button variant="tertiary" className="h-10 flex-1 rounded-md">
                          {t('common.cancel')}
                        </Button>
                      </Dialog.Close>
                      <Button variant="primary" className="h-10 flex-1 rounded-md">
                        {t('cab.dashboard.auditCalendar.chooseDate')}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-body-sm font-semibold text-neutral-900">
                      {t('cab.dashboard.auditCalendar.statusLegendTitle')}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {STATUS_KEYS.map((key) => (
                        <span key={key} className="flex items-center gap-2 text-body-sm text-neutral-700">
                          <span className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT[key])} />
                          {t(`cab.dashboard.auditCalendar.status.${key}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected day's audits */}
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-body font-semibold text-primary">{selectedDateLabel}</p>
                    <span className="flex items-center gap-1.5 text-body-sm text-neutral-600">
                      {t('cab.dashboard.auditCalendar.auditsCount', { count: entriesForSelectedDate.length })}
                      <AppIcon icon={CalendarIcon} size={16} />
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {entriesForSelectedDate.length === 0 ? (
                      <p className="rounded-md border border-dashed border-neutral-300 py-10 text-center text-body-sm text-neutral-600">
                        {t('cab.dashboard.auditCalendar.noAudits')}
                      </p>
                    ) : (
                      entriesForSelectedDate.map((entry) => (
                        <div
                          key={entry.id}
                          className={cn(
                            'flex items-start gap-3 rounded-md border border-neutral-100 bg-white p-3 border-s-4',
                            STATUS_BORDER[entry.status]
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-md',
                              STATUS_BADGE[entry.status]
                            )}
                          >
                            <AppIcon icon={FileTextIcon} size={16} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-body font-bold text-neutral-900">{entry.clientName}</p>
                            <span className="mt-1 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-0.5 text-caption font-medium text-primary">
                              {entry.standard}
                            </span>
                            <p className="mt-1 text-caption text-neutral-600">{entry.auditType}</p>
                          </div>

                          <div className="hidden shrink-0 flex-col items-start gap-1 sm:flex">
                            <span className="text-caption text-neutral-500">
                              {t('cab.dashboard.auditCalendar.auditTeam')}
                            </span>
                            <AvatarStack items={entry.auditTeam} max={2} />
                          </div>

                          <div className="hidden shrink-0 flex-col items-start gap-1 md:flex">
                            <span className="text-caption text-neutral-500">
                              {t('cab.dashboard.auditCalendar.time')}
                            </span>
                            <span className="text-body-sm text-neutral-800">{entry.timeRange}</span>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-caption text-neutral-500">
                              {t('cab.dashboard.auditCalendar.status.label')}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-caption font-medium',
                                STATUS_BADGE[entry.status]
                              )}
                            >
                              {t(`cab.dashboard.auditCalendar.status.${entry.status}`)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="shrink-0 text-neutral-500 hover:text-neutral-800"
                            aria-label={t('common.actions')}
                          >
                            <AppIcon icon={MoreIcon} size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
                <Button variant="primary" className="h-11 rounded-md px-5" onClick={handleViewFullCalendar}>
                  {t('cab.dashboard.auditCalendar.viewFullCalendar')}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <FullAuditCalendarModal
        open={isFullCalendarOpen}
        onOpenChange={setIsFullCalendarOpen}
        initialYear={viewYear}
        initialMonth={viewMonth}
      />
    </>
  )
}