import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, RiyalSymbolIcon } from '@/components/icons'
import {
  PaymentMethodToggle,
  WalletModalActions,
  WalletModalBody,
  WalletModalShell,
} from '@/components/dashboard/wallet/WalletModalShell'
import type { LinkedBankAccount, SavedVisaCard } from '@/lib/api/walletApi'
import { cn } from '@/lib/utils'

interface RechargeBalanceModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (amount: number, paymentMethod: 'visa' | 'bank', savedMethodId: string) => void
  visaCards?: SavedVisaCard[]
  bankAccounts?: LinkedBankAccount[]
}

const RECHARGE_MODAL_CLASS = 'w-[min(480px,calc(100vw-32px))] max-h-[calc(100dvh-24px)]'
const QUICK_AMOUNTS = [500, 1000, 2000]

function VisaCardIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="14" viewBox="0 0 22 16" fill="none" className={className}>
      <rect x="0.5" y="0.5" width="21" height="15" rx="2" stroke="currentColor" />
      <path d="M0 5h22" stroke="currentColor" />
    </svg>
  )
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 10h18M5 10V19M9 10V19M15 10V19M19 10V19M2 19h20M12 3l9 5H3l9-5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SavedMethodOption({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  detail,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  detail?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-md border px-4 py-3 text-start transition-colors',
        selected
          ? 'border-primary bg-primary-50'
          : 'border-neutral-300 bg-white hover:border-neutral-400'
      )}
    >
      <span className={cn('mt-0.5 shrink-0', selected ? 'text-primary' : 'text-neutral-500')}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-body-sm font-medium', selected ? 'text-primary' : 'text-neutral-900')}>
          {title}
        </span>
        <span className="mt-0.5 block text-caption text-neutral-600">{subtitle}</span>
        {detail && (
          <span className="mt-0.5 block font-mono text-caption text-neutral-700" dir="ltr">
            {detail}
          </span>
        )}
      </span>
    </button>
  )
}

export function RechargeBalanceModal({
  open,
  onClose,
  onConfirm,
  visaCards = [],
  bankAccounts = [],
}: RechargeBalanceModalProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('0.0')
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'bank'>('visa')
  const [pickedSavedId, setSelectedSavedId] = useState('')
  const [loading, setLoading] = useState(false)

  const numericAmount = parseFloat(amount) || 0
  const availableMethods = paymentMethod === 'visa' ? visaCards : bankAccounts
  const hasSavedMethods = availableMethods.length > 0

  // The picked saved method when it belongs to the current payment type, else the first one.
  const selectedSavedId = availableMethods.some((method) => method.id === pickedSavedId)
    ? pickedSavedId
    : (availableMethods[0]?.id ?? '')

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      onConfirm(numericAmount, paymentMethod, selectedSavedId)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const addQuickAmount = (value: number) => {
    const current = parseFloat(amount) || 0
    setAmount((current + value).toFixed(1))
  }

  return (
    <WalletModalShell
      open={open}
      onClose={onClose}
      title={t('wallet.rechargeModal.title')}
      subtitle={t('wallet.rechargeModal.subtitle')}
      className={RECHARGE_MODAL_CLASS}
      headerClassName="px-6 pt-8 pb-4"
      titleClassName="font-sans text-body-lg font-semibold leading-[1.6] text-neutral-900"
      subtitleClassName="text-body-sm leading-[1.5] text-neutral-600"
      closeClassName="size-9"
    >
      <WalletModalBody className="flex flex-col gap-6 px-6 pb-8 pt-1 font-sans">
        <div className="space-y-3">
          <label htmlFor="recharge-amount" className="block text-body-sm font-normal text-neutral-900">
            {t('wallet.rechargeModal.amountLabel')}
          </label>
          <div className="relative">
            <input
              id="recharge-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 w-full rounded-md border border-neutral-300 bg-white pe-12 ps-4 text-body-lg font-semibold text-neutral-900 outline-none focus:border-primary"
              dir="ltr"
            />
            <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center">
              <AppIcon icon={RiyalSymbolIcon} size={22} className="text-primary" />
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => addQuickAmount(value)}
                className="rounded-md bg-neutral-50 px-5 py-2.5 text-body-sm font-normal text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                + {value}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-body-sm font-normal text-neutral-900">
            {t('wallet.rechargeModal.choosePaymentMethod')}
          </p>
          <PaymentMethodToggle
            value={paymentMethod}
            onChange={setPaymentMethod}
            fullWidth
            variant="outlined"
          />

          <div className="space-y-2 pt-1">
            <p className="text-body-sm text-neutral-600">
              {paymentMethod === 'visa'
                ? t('wallet.rechargeModal.selectVisa')
                : t('wallet.rechargeModal.selectBankAccount')}
            </p>

            {paymentMethod === 'visa' ? (
              visaCards.length > 0 ? (
                visaCards.map((card) => (
                  <SavedMethodOption
                    key={card.id}
                    selected={selectedSavedId === card.id}
                    onClick={() => setSelectedSavedId(card.id)}
                    icon={<VisaCardIcon />}
                    title={card.paymentMethodName}
                    subtitle={card.cardHolderName}
                    detail={card.cardNumberMasked}
                  />
                ))
              ) : (
                <p className="rounded-md border border-dashed border-neutral-300 px-4 py-3 text-body-sm text-neutral-600">
                  {t('wallet.rechargeModal.noVisaCards')}
                </p>
              )
            ) : bankAccounts.length > 0 ? (
              bankAccounts.map((account) => (
                <SavedMethodOption
                  key={account.id}
                  selected={selectedSavedId === account.id}
                  onClick={() => setSelectedSavedId(account.id)}
                  icon={<BankIcon />}
                  title={account.bankName}
                  subtitle={account.accountHolderName}
                />
              ))
            ) : (
              <p className="rounded-md border border-dashed border-neutral-300 px-4 py-3 text-body-sm text-neutral-600">
                {t('wallet.rechargeModal.noBankAccounts')}
              </p>
            )}
          </div>
        </div>

        <WalletModalActions
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={t('wallet.rechargeModal.confirm')}
          confirmDisabled={numericAmount <= 0 || (hasSavedMethods && !selectedSavedId)}
          loading={loading}
          buttonClassName="h-11 font-normal text-body-sm"
        />
      </WalletModalBody>
    </WalletModalShell>
  )
}
