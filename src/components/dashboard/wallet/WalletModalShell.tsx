import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

/** Shared wallet modal sizing — fits within viewport at 100% zoom. */
export const walletModalWidthClass = 'w-[min(520px,calc(100vw-32px))]'
export const walletModalWideWidthClass = 'w-[min(920px,calc(100vw-32px))]'
export const walletModalHeaderClass = 'flex shrink-0 items-start justify-between gap-3 px-6 pt-5 pb-1'
export const walletModalBodyClass = 'flex flex-col gap-3 px-6 pb-5 pt-2'
export const walletFieldInputClass = 'h-10 text-body-sm'
export const walletFieldsStackClass = 'flex flex-col gap-3'
export const walletFieldGridClass = 'grid grid-cols-1 gap-3 sm:grid-cols-2'

interface WalletModalShellProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  wide?: boolean
  headerClassName?: string
  titleClassName?: string
  subtitleClassName?: string
  closeClassName?: string
}

export function WalletModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  wide = false,
  headerClassName,
  titleClassName,
  subtitleClassName,
  closeClassName,
}: WalletModalShellProps) {
  const { t } = useTranslation()

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed start-1/2 top-[50%] z-50 flex max-h-[calc(100dvh-24px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-white shadow-xl focus:outline-none rtl:translate-x-1/2',
            wide ? walletModalWideWidthClass : walletModalWidthClass,
            className
          )}
        >
          <div className={cn(walletModalHeaderClass, headerClassName)}>
            <div className="min-w-0 pe-3">
              <Dialog.Title className={cn('text-body-lg font-semibold leading-[1.3] text-neutral-900', titleClassName)}>
                {title}
              </Dialog.Title>
              {subtitle && (
                <p className={cn('mt-0.5 text-body-sm leading-[1.5] text-neutral-600', subtitleClassName)}>
                  {subtitle}
                </p>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className={cn('flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-text-primary text-text-primary transition-colors', closeClassName)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function WalletModalBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(walletModalBodyClass, className)}>{children}</div>
}

export function WalletSecurityNotice({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-md bg-primary-50',
        compact ? 'px-4 py-3.5' : 'px-3 py-2',
        className
      )}
    >
      <svg
        width={compact ? 16 : 18}
        height={compact ? 16 : 18}
        viewBox="0 0 24 24"
        fill="none"
        className="mt-0.5 shrink-0 text-primary"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
      <p className={cn('leading-[1.5] text-primary', compact ? 'text-caption' : 'text-caption')}>
        {t('wallet.securityNotice')}
      </p>
    </div>
  )
}

export function WalletModalActions({
  onCancel,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  loading,
  buttonClassName,
  alignEnd = false,
}: {
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: string
  confirmDisabled?: boolean
  loading?: boolean
  buttonClassName?: string
  alignEnd?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex items-center gap-3', alignEnd && 'justify-end')}>
      <button
        type="button"
        onClick={onCancel}
        className={cn(
          'flex h-10 items-center justify-center rounded-md bg-error-50 text-body font-semibold text-error-500 transition-colors hover:bg-error-100',
          alignEnd ? 'w-[240px]' : 'flex-1',
          buttonClassName
        )}
      >
        {t('common.cancel')}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled || loading}
        className={cn(
          'flex h-10 items-center justify-center rounded-md bg-primary text-body font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60',
          alignEnd ? 'w-[240px]' : 'flex-1',
          buttonClassName
        )}
      >
        {loading ? t('common.loading') : confirmLabel}
      </button>
    </div>
  )
}

export function PaymentMethodToggle({
  value,
  onChange,
  fullWidth = false,
  compact = false,
  variant = 'segmented',
}: {
  value: 'visa' | 'bank'
  onChange: (value: 'visa' | 'bank') => void
  fullWidth?: boolean
  compact?: boolean
  variant?: 'segmented' | 'outlined'
}) {
  const { t } = useTranslation()

  const options = [
    {
      id: 'visa' as const,
      label: t('wallet.paymentMethods.visa'),
      icon: (
        <svg width="20" height="14" viewBox="0 0 22 16" fill="none">
          <rect x="0.5" y="0.5" width="21" height="15" rx="2" stroke="currentColor" />
          <path d="M0 5h22" stroke="currentColor" />
        </svg>
      ),
    },
    {
      id: 'bank' as const,
      label: t('wallet.paymentMethods.bankAccount'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 10h18M5 10V19M9 10V19M15 10V19M19 10V19M2 19h20M12 3l9 5H3l9-5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ]

  if (variant === 'outlined') {
    return (
      <div className={cn('flex gap-3', fullWidth ? 'w-full' : 'w-fit')}>
        {options.map((option) => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md border py-3 font-sans text-body-sm font-medium leading-[1.6] transition-colors',
                selected
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
              )}
            >
              <span className={selected ? 'text-primary' : 'text-neutral-500'}>{option.icon}</span>
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex gap-1 rounded-md bg-neutral-50 p-1', fullWidth ? 'w-full' : 'w-fit')}>
      {options.map((option) => {
        const selected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-sm font-sans font-bold leading-[1.6] transition-colors',
              compact ? 'px-2.5 py-1.5 text-body-sm' : 'px-4 py-2.5 text-body-sm',
              fullWidth && 'flex-1',
              selected
                ? 'bg-white text-primary shadow-sm'
                : 'bg-transparent text-neutral-600 hover:text-neutral-800'
            )}
          >
            <span className={selected ? 'text-primary' : 'text-neutral-500'}>{option.icon}</span>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
