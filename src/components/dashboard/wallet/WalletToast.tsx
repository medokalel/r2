import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type WalletToastVariant = 'success' | 'error'

interface WalletToastProps {
  variant: WalletToastVariant
  onClose: () => void
  onRetry?: () => void
}

export function WalletToast({ variant, onClose, onRetry }: WalletToastProps) {
  const { t } = useTranslation()
  const isSuccess = variant === 'success'

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border px-4 py-3 shadow-sm',
        isSuccess ? 'border-success-200 bg-success-50' : 'border-error-100 bg-error-50'
      )}
      role="status"
    >
      <span
        className={cn(
          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
          isSuccess ? 'bg-success-500 text-white' : 'bg-error-500 text-white'
        )}
      >
        {isSuccess ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('text-body font-semibold', isSuccess ? 'text-success-700' : 'text-error-700')}>
          {t(isSuccess ? 'wallet.toast.successTitle' : 'wallet.toast.errorTitle')}
        </p>
        <p className={cn('text-body-sm leading-[1.5]', isSuccess ? 'text-success-600' : 'text-error-700')}>
          {t(isSuccess ? 'wallet.toast.successMessage' : 'wallet.toast.errorMessage')}
        </p>
        {!isSuccess && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-error-500 px-4 py-1.5 text-body-sm font-medium text-error-700 transition-colors hover:bg-white"
          >
            {t('errors.retry')}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        className="shrink-0 text-neutral-600 hover:text-neutral-800"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

/** Fixed overlay toast — floats above page content without shifting layout. */
export function WalletToastOverlay({ variant, onClose, onRetry }: WalletToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[76px] z-50 flex justify-center px-5">
      <div className="pointer-events-auto w-full max-w-[640px]">
        <WalletToast variant={variant} onClose={onClose} onRetry={onRetry} />
      </div>
    </div>
  )
}
