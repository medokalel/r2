import { useSyncExternalStore, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getToasts, subscribeToasts, toast, type ToastItem, type ToastType } from '@/lib/toast'

/**
 * iCASCO toast: white card, brand-tinted icon tile per type, title + optional details,
 * a hairline progress bar and a close button. Sits at the top inline-end corner on
 * desktop (right in English, left in Arabic) and slides in from that edge; on phones it
 * spans the top of the screen and drops down.
 */
const TONES: Record<ToastType, { tile: string; bar: string; ring: string }> = {
  success: { tile: 'bg-bg-success-subtle text-icon-success', bar: 'bg-success-500', ring: 'border-success-200' },
  error: { tile: 'bg-bg-error text-icon-error', bar: 'bg-error-500', ring: 'border-error-200' },
  info: { tile: 'bg-bg-info text-info-500', bar: 'bg-info-500', ring: 'border-info-100' },
  warning: { tile: 'bg-bg-warning text-warning-500', bar: 'bg-warning-500', ring: 'border-warning-200' },
}

const ICONS: Record<ToastType, ReactNode> = {
  success: <path d="M7.5 12.5l3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />,
  error: (
    <>
      <path d="M12 7.5v5.5" strokeLinecap="round" />
      <path d="M12 16.5v.01" strokeLinecap="round" />
    </>
  ),
  info: (
    <>
      <path d="M12 11v5.5" strokeLinecap="round" />
      <path d="M12 7.5v.01" strokeLinecap="round" />
    </>
  ),
  warning: (
    <>
      <path d="M12 8v5" strokeLinecap="round" />
      <path d="M12 16.5v.01" strokeLinecap="round" />
    </>
  ),
}

function ToastIcon({ type }: { type: ToastType }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      {type === 'warning' ? (
        <path d="M10.3 4.2L2.9 17a2 2 0 001.7 3h14.8a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z" strokeLinejoin="round" />
      ) : (
        <circle cx="12" cy="12" r="9" />
      )}
      {ICONS[type]}
    </svg>
  )
}

function ToastCard({ item }: { item: ToastItem }) {
  const { t } = useTranslation()
  const tone = TONES[item.type]
  const assertive = item.type === 'error' || item.type === 'warning'

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={() => toast.hold(item.id)}
      onMouseLeave={() => toast.release(item.id)}
      onFocus={() => toast.hold(item.id)}
      onBlur={() => toast.release(item.id)}
      className={cn(
        'icasco-toast pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-white p-3.5 pe-2.5',
        'shadow-xl',
        tone.ring,
      )}
    >
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-md', tone.tile)}>
        <ToastIcon type={item.type} />
      </span>

      <div className="min-w-0 flex-1 py-0.5">
        <span className="sr-only">{t(`common.toast.${item.type}`)}: </span>
        <p className="text-body-sm font-semibold leading-[1.6] text-text-primary">{item.message}</p>
        {item.description && (
          <p className="mt-0.5 whitespace-pre-line text-caption leading-[1.6] text-text-secondary">{item.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(item.id)}
        aria-label={t('common.close')}
        className="flex size-10 shrink-0 items-center justify-center rounded-md text-icon-secondary transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-border-focus"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>

      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-bg-tertiary" aria-hidden>
        <span
          className={cn('icasco-toast-progress block h-full opacity-70', tone.bar)}
          style={{ animationDuration: `${item.duration}ms` }}
        />
      </span>
    </div>
  )
}

/** Renders the toasts raised through `toast.success / error / info / warning`. Mount once at the app root. */
export function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-stretch gap-2.5 px-3 sm:inset-x-auto sm:end-5 sm:top-5 sm:w-[400px] sm:px-0"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}
