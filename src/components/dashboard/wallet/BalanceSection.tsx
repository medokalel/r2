import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, RiyalSymbolIcon } from '@/components/icons'
import {
  formatWalletAmount,
  type LinkedBankAccount,
  type WalletBalance,
} from '@/lib/api/walletApi'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/buttonVariants'

interface BalanceSectionProps {
  balance: WalletBalance
  linkedAccounts: LinkedBankAccount[]
  /** False until a payment gateway exists: top-up, refunds and payment methods are disabled. */
  onlinePaymentsAvailable: boolean
  onRecharge: () => void
  onRefund: () => void
  onAddPaymentMethod: () => void
  onUpdateAccount: () => void
}

const BALANCE_CARD_CLASS =
  'flex min-w-0 flex-col rounded-lg border border-neutral-100 bg-white p-5'

const BALANCE_CARD_HEADER_CLASS = 'mb-6 flex items-center justify-between gap-2'

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIconBadge() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary">
      <ClockIcon className="size-[18px]" />
    </span>
  )
}

function PlusCircleIcon() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function CardIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="shrink-0 text-white/70"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

function LinkedBankDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute -end-6 bottom-0 h-[140px] w-[180px] text-white/[0.08]"
        viewBox="0 0 180 140"
        fill="none"
      >
        <path
          d="M20 120C60 80 100 40 160 20"
          stroke="currentColor"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <path
          d="M0 140C50 100 90 70 140 50"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function AmountDisplay({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-[32px] font-semibold leading-none text-text-primary" dir="ltr">
        {formatWalletAmount(value)}
      </span>
      <AppIcon icon={RiyalSymbolIcon} size={22} className="shrink-0 text-primary" />
    </div>
  )
}

function LinkedBankAccountCarousel({
  accounts,
  onUpdateAccount,
  canUpdate,
}: {
  accounts: LinkedBankAccount[]
  onUpdateAccount: () => void
  canUpdate: boolean
}) {
  const { t, i18n } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const isRtl = i18n.dir() === 'rtl'
  // Clamped when the account list shrinks.
  const safeIndex = Math.min(activeIndex, Math.max(accounts.length - 1, 0))

  return (
    <div className="relative flex min-w-0 flex-col overflow-hidden rounded-lg bg-primary-900 p-5 text-white">
      <LinkedBankDecor />
      <div className="relative z-[1] flex flex-col">
        <div className="mb-4 flex items-start justify-between gap-2">
          <span className="text-body-sm font-medium text-white/90">
            {t('wallet.balanceSection.linkedBankAccount')}
          </span>
          <CardIcon />
        </div>

        {accounts.length === 0 ? (
          <p className="text-body-sm leading-[1.5] text-white/80">
            {t('wallet.balanceSection.noLinkedAccount', 'No bank account is linked to this wallet yet.')}
          </p>
        ) : null}

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${safeIndex * 100 * (isRtl ? 1 : -1)}%)` }}
          >
            {accounts.map((account) => (
              <div key={account.id} className="w-full shrink-0 min-w-0 space-y-3">
                <div className="min-w-0">
                  <p className="text-caption text-white/70">{t('wallet.balanceSection.bankName')}</p>
                  <p className="break-words text-body-sm font-semibold leading-[1.5]">
                    {account.bankName}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-caption text-white/70">{t('wallet.balanceSection.accountHolder')}</p>
                  <p className="break-words text-body-sm font-semibold leading-[1.5]">
                    {account.accountHolderName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {canUpdate ? (
          <button
            type="button"
            onClick={onUpdateAccount}
            className="mt-4 text-start text-body-sm font-medium text-primary-200 underline-offset-2 hover:underline"
          >
            {t('wallet.balanceSection.updateAccountInfo')}
          </button>
        ) : null}

        {accounts.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5">
            {accounts.map((account, index) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${index + 1}`}
                aria-current={index === safeIndex ? 'true' : undefined}
                className={cn(
                  'size-2 rounded-full transition-colors',
                  index === safeIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function BalanceSection({
  balance,
  linkedAccounts,
  onlinePaymentsAvailable,
  onRecharge,
  onRefund,
  onAddPaymentMethod,
  onUpdateAccount,
}: BalanceSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-body-lg font-semibold text-text-primary">
            {t('wallet.balanceSection.title')}
          </h2>
          <p className="mt-1 max-w-[640px] text-body-sm leading-[1.6] text-text-secondary">
            {t('wallet.balanceSection.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPaymentMethod}
          disabled={!onlinePaymentsAvailable}
          className={cn(buttonVariants({ variant: 'primary', size: 'default' }), 'shrink-0')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {t('wallet.balanceSection.addPaymentMethod')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Available Credit */}
        <div className={BALANCE_CARD_CLASS}>
          <div className={BALANCE_CARD_HEADER_CLASS}>
            <span className="text-body-sm font-medium text-text-secondary">
              {t('wallet.balanceSection.availableCredit')}
            </span>
            <PlusCircleIcon />
          </div>
          <AmountDisplay value={balance.availableCredit} />
          <p className="mt-2 text-body-sm leading-[1.5] text-text-secondary">
            {t('wallet.balanceSection.availableCreditHint')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRecharge}
              disabled={!onlinePaymentsAvailable}
              aria-describedby={onlinePaymentsAvailable ? undefined : 'wallet-topup-unavailable'}
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
            >
              {t('wallet.balanceSection.rechargeBalance')}
            </button>
            <button
              type="button"
              onClick={onRefund}
              disabled={!onlinePaymentsAvailable}
              aria-describedby={onlinePaymentsAvailable ? undefined : 'wallet-topup-unavailable'}
              className={cn(buttonVariants({ variant: 'secondary', size: 'md' }))}
            >
              {t('wallet.balanceSection.requestRefund')}
            </button>
          </div>
          {onlinePaymentsAvailable ? null : (
            <p
              id="wallet-topup-unavailable"
              role="note"
              className="mt-3 rounded-md border border-warning-100 bg-warning-50 px-3 py-2 text-body-sm leading-[1.5] text-warning-700"
            >
              {t(
                'wallet.balanceSection.topUpUnavailable',
                'Online top-up is not available yet. Contact the CAB to pay by bank transfer.',
              )}
            </p>
          )}
        </div>

        {/* Suspended Balance */}
        <div className={BALANCE_CARD_CLASS}>
          <div className={BALANCE_CARD_HEADER_CLASS}>
            <span className="text-body-sm font-medium text-text-secondary">
              {t('wallet.balanceSection.suspendedBalance')}
            </span>
            <ClockIconBadge />
          </div>
          <AmountDisplay value={balance.suspendedBalance} />
          <p className="mt-2 text-body-sm leading-[1.5] text-text-secondary">
            {t('wallet.balanceSection.suspendedBalanceHint')}
          </p>
          <div className="mt-5 space-y-2 border-t border-neutral-100 pt-4">
            <div className="flex items-center justify-between gap-2 text-body-sm">
              <span className="text-text-secondary">{t('wallet.balanceSection.financialDues')}</span>
              <span className="flex shrink-0 items-center gap-1 font-medium text-text-primary" dir="ltr">
                {formatWalletAmount(balance.financialDues)}
                <AppIcon icon={RiyalSymbolIcon} size={14} className="text-primary" />
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-body-sm">
              <span className="text-text-secondary">{t('wallet.balanceSection.refundsUnderReview')}</span>
              <span className="flex shrink-0 items-center gap-1 font-medium text-text-primary" dir="ltr">
                {formatWalletAmount(balance.refundsUnderReview)}
                <AppIcon icon={RiyalSymbolIcon} size={14} className="text-primary" />
              </span>
            </div>
          </div>
        </div>

        <LinkedBankAccountCarousel
          accounts={linkedAccounts}
          onUpdateAccount={onUpdateAccount}
          canUpdate={onlinePaymentsAvailable}
        />
      </div>
    </section>
  )
}
