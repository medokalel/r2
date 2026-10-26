import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { CalendarIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { fieldInputClassName, fieldHeightClassName } from '@/components/ui/fieldStyles'
import { CalendarGrid } from '@/components/ui/CalendarGrid'
import { toDisplay } from './displayDate'

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ value, onChange, placeholder, className, disabled }: DatePickerProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const displayPlaceholder = placeholder ?? (isRTL ? 'يوم/شهر/سنة' : 'DD/MM/YYYY')

  const today = new Date()
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const [viewYear, setViewYear] = useState((value ?? today).getFullYear())
  const [viewMonth, setViewMonth] = useState((value ?? today).getMonth())
  const [internalSelected, setInternalSelected] = useState<Date | null>(value ?? null)
  const ref = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const selected = value === undefined ? internalSelected : value

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      const insideTrigger = ref.current?.contains(target)
      const insidePopover = popoverRef.current?.contains(target)
      if (!insideTrigger && !insidePopover) {
        setOpen(false)
      }
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
    setInternalSelected(date)
    onChange?.(date)
    setOpen(false)
  }

  // Approximate rendered popover height: padding + header + day names + 6 week rows
  const POPOVER_HEIGHT = 420

  function handleOpen() {
    if (disabled) return
    const base = selected ?? today
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

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          fieldInputClassName,
          fieldHeightClassName,
          'flex w-full items-center justify-between gap-2 text-start',
          !selected && 'text-neutral-500',
          disabled && 'cursor-not-allowed bg-neutral-100 opacity-70'
        )}
      >
        <span>{selected ? toDisplay(selected) : displayPlaceholder}</span>
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
            isDaySelected={(date) => !!selected && isSameDay(date, selected)}
            isToday={(date) => isSameDay(date, today)}
            renderDayIndicator={(date) =>
              isSameDay(date, today) && !(selected && isSameDay(date, selected)) ? (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
              ) : null
            }
          />
        </div>,
        document.body
      )}
    </div>
  )
}