import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { CalendarIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { fieldInputClassName, fieldHeightClassName } from '@/components/ui/fieldStyles'
import { formatDisplayDate } from '@/components/ui/datePicker/displayDate'
import { CalendarGrid } from '@/components/ui/CalendarGrid'

export interface DateRange {
  from: Date | null
  to: Date | null
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

function isBetween(date: Date, from: Date, to: Date) {
  const t = date.getTime()
  return t > Math.min(from.getTime(), to.getTime()) && t < Math.max(from.getTime(), to.getTime())
}

/**
 * Single-field "from - to" range picker. No range-capable component existed
 * yet, so this is new — but it's built entirely on the shared `CalendarGrid`
 * (same one `DatePicker` uses) so the popover stays visually identical to
 * every other date field in the app.
 */
export function DateRangePicker({ value, onChange, placeholder, className, disabled }: DateRangePickerProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const displayPlaceholder = placeholder ?? (isRTL ? 'يوم/شهر/سنة - يوم/شهر/سنة' : 'DD/MM/YYYY - DD/MM/YYYY')

  const today = new Date()
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const [viewYear, setViewYear] = useState((value.from ?? today).getFullYear())
  const [viewMonth, setViewMonth] = useState((value.from ?? today).getMonth())
  const ref = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const insideTrigger = ref.current?.contains(target)
      const insidePopover = popoverRef.current?.contains(target)
      if (!insideTrigger && !insidePopover) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    function reposition() {
      const rect = ref.current?.getBoundingClientRect()
      if (rect) setTriggerRect(rect)
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(date: Date) {
    const { from, to } = value

    // Start a new range whenever there's no in-progress selection, or the
    // previous range was already complete.
    if (!from || (from && to)) {
      onChange({ from: date, to: null })
      return
    }

    // Completing the range — normalize so `from` is always the earlier date.
    if (date.getTime() < from.getTime()) {
      onChange({ from: date, to: from })
    } else {
      onChange({ from, to: date })
    }
    setOpen(false)
  }

  const POPOVER_HEIGHT = 420

  function handleOpen() {
    if (disabled) return
    const base = value.from ?? today
    setViewYear(base.getFullYear())
    setViewMonth(base.getMonth())
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUp(spaceBelow < POPOVER_HEIGHT && rect.top > spaceBelow)
      setTriggerRect(rect)
    }
    setOpen(true)
  }

  const displayValue = value.from
    ? value.to
      ? `${formatDisplayDate(value.from)} - ${formatDisplayDate(value.to)}`
      : formatDisplayDate(value.from)
    : null

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          fieldInputClassName,
          fieldHeightClassName,
          'flex w-full items-center justify-between gap-2 text-start',
          !displayValue && 'text-neutral-500',
          disabled && 'cursor-not-allowed bg-neutral-100 opacity-70'
        )}
      >
        <span className="truncate">{displayValue ?? displayPlaceholder}</span>
        <CalendarIcon className="size-5 shrink-0 text-primary" />
      </button>

      {open && triggerRect && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: triggerRect.left,
            ...(openUp
              ? { bottom: window.innerHeight - triggerRect.top + 8 }
              : { top: triggerRect.bottom + 8 }),
          }}
          className="z-50 w-[340px] rounded-lg border border-neutral-100 bg-white p-5 shadow-xl"
        >
          <CalendarGrid
            viewYear={viewYear}
            viewMonth={viewMonth}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onDayClick={handleDayClick}
            isDaySelected={(date) =>
              (!!value.from && isSameDay(date, value.from)) || (!!value.to && isSameDay(date, value.to))
            }
            isToday={(date) => isSameDay(date, today)}
            dayClassName={(date) =>
              value.from && value.to && isBetween(date, value.from, value.to) ? 'rounded-none bg-primary/10' : undefined
            }
          />
        </div>,
        document.body
      )}
    </div>
  )
}