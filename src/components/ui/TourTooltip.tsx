import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import * as Popover from '@radix-ui/react-popover'
import { useDirection } from '@/context/direction/useDirection'
import { cn } from '@/lib/utils'

/**
 * z-index layering for the tour overlay. Kept as named constants so stacking
 * order is explicit:
 * 1. Backdrop overlay: 1000 (darkens normal page content)
 * 2. Highlighted element: 1001 (shines above backdrop)
 * 3. Tour dialog content: 9999 (always on top of backdrop and highlighted element)
 */
const TOUR_Z_BACKDROP = 1000
const TOUR_Z_HIGHLIGHT = 1001
const TOUR_Z_CONTENT = 9999

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
    } else {
      mql.addListener(onChange)
    }

    onChange()

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange)
      } else {
        mql.removeListener(onChange)
      }
    }
  }, [breakpoint])

  return isMobile
}

/** Pill-style progress indicator — the current step's dot elongates into a
 *  bar, completed steps stay as small filled dots, upcoming steps are muted.
 *  Scans faster than a "Step X of Y" pill alone, especially for a 7-step tour. */
function TourProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const dotStep = i + 1
        const isCurrent = dotStep === current
        const isDone = dotStep < current
        return (
          <span
            key={dotStep}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              isCurrent ? 'w-5 bg-primary' : isDone ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-slate-200'
            )}
          />
        )
      })}
    </div>
  )
}

export interface TourTooltipProps {
  step?: number
  totalSteps?: number
  title: ReactNode
  description: ReactNode
  skipLabel?: string
  backLabel?: string
  nextLabel?: string
  closeLabel?: string
  onSkip?: () => void
  onBack?: () => void
  onNext?: () => void

  /** Whether this step's popover is currently open. Fully controlled by the caller. */
  open: boolean

  /** Side to display the tooltip relative to the anchor element */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Align position along the alignment axis */
  align?: 'start' | 'center' | 'end'

  /** Distance (px) from the anchor along the main axis. Radix flips this automatically in RTL. */
  sideOffset?: number
  /** Distance (px) along the alignment axis, e.g. to nudge the popover past a wide anchor. */
  alignOffset?: number

  children: ReactNode
  className?: string
  contentClassName?: string
}

export function TourTooltip({
  step = 1,
  totalSteps = 7,
  title,
  description,
  skipLabel,
  backLabel,
  nextLabel,
  closeLabel,
  onSkip,
  onBack,
  onNext,
  open,
  side = 'right',
  align = 'start',
  sideOffset = 14,
  alignOffset = 0,
  children,
  className,
  contentClassName,
}: TourTooltipProps) {
  const { t } = useTranslation()
  const { dir } = useDirection()
  const isMobile = useIsMobile(768)
  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && anchorRef.current) {
      if (anchorRef.current.offsetParent !== null) {
        anchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [open])

  const isLastStep = step === totalSteps
  const resolvedNextLabel =
    nextLabel ?? (isLastStep ? t('cab.tour.nextSection', 'انتقل للقسم التالي') : t('cab.tour.next', 'التالي'))
  const resolvedBackLabel = backLabel ?? t('cab.tour.back', 'السابق')
  const resolvedSkipLabel = skipLabel ?? t('cab.tour.skip', 'تخطي الجولة')
  const resolvedCloseLabel = closeLabel ?? t('cab.tour.close', 'إغلاق')

  const tooltipBody = (
    <>
      {/* Progress + close */}
      <div className="mb-3.5 sm:mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TourProgressDots total={totalSteps} current={step} />
          <span className="text-caption font-medium text-slate-400">
            {step}/{totalSteps}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSkip?.()}
          aria-label={resolvedCloseLabel}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 text-body sm:text-body-lg font-bold tracking-tight text-slate-900 leading-snug">{title}</h3>

      {/* Description */}
      <p className="mb-4 sm:mb-5 text-body-sm sm:text-body-sm font-normal leading-relaxed text-slate-500">{description}</p>

      {/* Separator Line */}
      <div className="border-t border-slate-100 pt-3.5" />

      {/* Footer / Action buttons */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSkip?.()}
          className="text-caption sm:text-body-sm font-medium text-slate-400 transition-colors hover:text-slate-700 cursor-pointer shrink-0"
        >
          {resolvedSkipLabel}
        </button>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={() => onBack?.()}
              className="rounded-3xl border border-primary px-3.5 py-1.5 text-caption sm:text-body-sm font-semibold text-primary transition-colors hover:bg-primary-subtle cursor-pointer whitespace-nowrap"
            >
              {resolvedBackLabel}
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={() => onNext?.()}
              className="rounded-3xl bg-primary px-4 sm:px-5 py-1.5 text-caption sm:text-body-sm font-semibold text-white transition-all hover:bg-primary-hover active:bg-primary-active active:scale-95 cursor-pointer shadow-md shadow-primary/20 whitespace-nowrap"
            >
              {resolvedNextLabel}
            </button>
          )}
        </div>
      </div>
    </>
  )

  const anchorElement = (
    <div
      ref={anchorRef}
      style={open ? { zIndex: TOUR_Z_HIGHLIGHT } : undefined}
      className={cn(
        'relative transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  )

  if (isMobile) {
    return (
      <>
        {anchorElement}

        {open &&
          typeof document !== 'undefined' &&
          createPortal(
            <>
              {/* Darkened spotlight backdrop */}
              <div
                className="fixed inset-0 bg-surface-overlay/50 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
                style={{ zIndex: TOUR_Z_BACKDROP }}
                aria-hidden="true"
                onClick={(e) => e.preventDefault()}
              />

              {/* Mobile Fixed Responsive Dialog */}
              <div
                dir={dir}
                role="dialog"
                aria-label={typeof title === 'string' ? title : undefined}
                style={{ zIndex: TOUR_Z_CONTENT }}
                className={cn(
                  'fixed inset-x-4 bottom-6 z-[9999] mx-auto w-[calc(100vw-32px)] max-w-[400px]',
                  'rounded-2xl border border-slate-100 bg-white p-5 sm:p-6',
                  'shadow-[0_24px_60px_-12px_rgba(18,54,163,0.35)]',
                  'animate-[fadeInScale_0.2s_ease-out]',
                  contentClassName
                )}
              >
                {tooltipBody}
              </div>
            </>,
            document.body
          )}
      </>
    )
  }

  return (
    <Popover.Root open={open} modal={false}>
      <Popover.Anchor asChild>
        {anchorElement}
      </Popover.Anchor>

      {/* Darkened spotlight backdrop — pointer-events-auto so it blocks interaction
          with the rest of the page while the tour is open. */}
      {open && (
        <Popover.Portal>
          <div
            className="fixed inset-0 bg-surface-overlay/50 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
            style={{ zIndex: TOUR_Z_BACKDROP }}
            aria-hidden="true"
            onClick={(e) => e.preventDefault()}
          />
        </Popover.Portal>
      )}

      <Popover.Portal>
        <Popover.Content
          dir={dir}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions
          collisionPadding={16}
          role="dialog"
          aria-label={typeof title === 'string' ? title : undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={() => onSkip?.()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          style={{ zIndex: TOUR_Z_CONTENT }}
          className={cn(
            'w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-slate-100 bg-white p-6 z-[9999]',
            'shadow-[0_24px_60px_-12px_rgba(18,54,163,0.28)]',
            'data-[state=open]:animate-[fadeInScale_0.2s_ease-out]',
            contentClassName
          )}
        >
          {tooltipBody}
          <Popover.Arrow className="fill-white drop-shadow-sm" width={18} height={9} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

