import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getDaysInMonth, weekdayOf } from '@/components/ui/calendarUtils'

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const SIZE_STYLES = {
  sm: { cell: 'size-9', text: 'text-body-sm', gap: 'gap-y-1' },
  md: { cell: 'size-10', text: 'text-body-sm', gap: '' },
} as const

interface CalendarGridProps {
  viewYear: number
  viewMonth: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick: (date: Date) => void
  /** Whether a given day (in the current month) is the selected date. */
  isDaySelected?: (date: Date) => boolean
  /** Whether a given day (in the current month) is "today". */
  isToday?: (date: Date) => boolean
  /** Extra content rendered inside a day button (e.g. an event dot). */
  renderDayIndicator?: (date: Date) => ReactNode
  /** Extra classes appended to a day's button (e.g. range-selection shading). Additive — never overrides the base selected/today styling. */
  dayClassName?: (date: Date) => string | undefined
  /** Cell/text sizing — 'md' (default, used by the DatePicker popover) or 'sm' (used by the inline audit calendar). */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Shared month grid: header with prev/next navigation + day-of-week labels +
 * day cells (leading/trailing days from adjacent months shown faded).
 * Used by both `DatePicker` (inside its popover) and `AuditCalendarModal`
 * (rendered inline) so both stay visually identical and only need one place
 * to change when the calendar design changes.
 */
export function CalendarGrid({
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  isDaySelected,
  isToday,
  renderDayIndicator,
  dayClassName,
  size = 'md',
  className,
}: CalendarGridProps) {
  const { t, i18n } = useTranslation()
  const { cell, text, gap } = SIZE_STYLES[size]

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
  })

  const totalDays = getDaysInMonth(viewYear, viewMonth)
  const firstWeekday = weekdayOf(viewYear, viewMonth, 1)
  const prevTotal = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1)
  const leadDays = Array.from({ length: firstWeekday }, (_, i) => prevTotal - firstWeekday + 1 + i)
  const currDays = Array.from({ length: totalDays }, (_, i) => i + 1)
  const total = leadDays.length + currDays.length
  const trailDays = Array.from({ length: (7 - (total % 7)) % 7 }, (_, i) => i + 1)

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex size-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100"
          aria-label={t('common.previousMonth')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl-flip">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-body font-semibold capitalize text-neutral-900">{monthLabel}</span>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex size-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100"
          aria-label={t('common.nextMonth')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl-flip">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className={cn('mb-1 grid grid-cols-7', gap)}>
        {DAY_LABELS.map((d) => (
          <span key={d} className="py-1 text-center text-caption font-semibold text-neutral-500">
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className={cn('grid grid-cols-7', gap)}>
        {leadDays.map((d) => (
          <span key={`lead-${d}`} className={cn('flex items-center justify-center text-neutral-400', cell, text)}>
            {d}
          </span>
        ))}
        {currDays.map((d) => {
          const date = new Date(viewYear, viewMonth, d)
          const selected = isDaySelected?.(date) ?? false
          const today = isToday?.(date) ?? false

          return (
            <button
              key={d}
              type="button"
              onClick={() => onDayClick(date)}
              className={cn(
                'relative mx-auto flex items-center justify-center rounded-full transition-colors',
                cell,
                dayClassName?.(date),
                text,
                selected
                  ? 'bg-primary font-semibold text-white'
                  : today
                    ? 'border-2 border-primary bg-primary/10 font-semibold text-primary hover:bg-primary/15'
                    : 'bg-primary/5 text-neutral-800 hover:bg-primary/10'
              )}
            >
              {d}
              {renderDayIndicator?.(date)}
            </button>
          )
        })}
        {trailDays.map((d) => (
          <span key={`trail-${d}`} className={cn('flex items-center justify-center text-neutral-400', cell, text)}>
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}