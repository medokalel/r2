import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AddPaymentMethodModal } from '@/components/dashboard/wallet/AddPaymentMethodModal'
import { BalanceSection } from '@/components/dashboard/wallet/BalanceSection'
import { RechargeBalanceModal } from '@/components/dashboard/wallet/RechargeBalanceModal'
import { RequestRefundModal } from '@/components/dashboard/wallet/RequestRefundModal'
import { UpdateAccountModal } from '@/components/dashboard/wallet/UpdateAccountModal'
import { WalletToastOverlay, type WalletToastVariant } from '@/components/dashboard/wallet/WalletToast'
import { WalletTransactionsTable } from '@/components/dashboard/wallet/WalletTransactionsTable'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { AppLayout } from '@/components/layout/AppLayout'
import { useWalletTourSteps } from '@/config/auditeeTourSteps'
import { TourProvider } from '@/context/TourContext'
import {
  getWalletBalance,
  getWalletPaymentMethods,
  getWalletTransactions,
  isOnlineTopUpAvailable,
  type WalletBalance,
  type WalletPaymentMethods,
  type WalletTransaction,
} from '@/lib/api/walletApi'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

const EMPTY_BALANCE: WalletBalance = { availableCredit: 0, suspendedBalance: 0, financialDues: 0, refundsUnderReview: 0 }
const NO_PAYMENT_METHODS: WalletPaymentMethods = { cards: [], bankAccounts: [] }

type ActiveModal = 'recharge' | 'addPayment' | 'refund' | 'update' | null

export function DigitalWalletPage() {
  const { t } = useTranslation()
  const tourSteps = useWalletTourSteps()
  const [balance, setBalance] = useState<WalletBalance>(EMPTY_BALANCE)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [paymentMethods, setPaymentMethods] = useState<WalletPaymentMethods>(NO_PAYMENT_METHODS)
  // No payment gateway yet: outside the preview the client pays the CAB by bank transfer.
  const onlinePayments = isOnlineTopUpAvailable()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [toast, setToast] = useState<WalletToastVariant | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([getWalletBalance(), getWalletTransactions(), getWalletPaymentMethods()])
      .then(([nextBalance, nextTransactions, nextMethods]) => {
        if (!active) return
        setBalance(nextBalance)
        setTransactions(nextTransactions)
        setPaymentMethods(nextMethods)
      })
      .catch(() => {
        // Keep the empty wallet; the API error event already surfaces the failure.
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  // Preview only (the recharge modal is not shown without online payments).
  const handleRecharge = (amount: number) => {
    if (amount <= 0) {
      setToast('error')
      return
    }
    setBalance((prev) => ({
      ...prev,
      availableCredit: prev.availableCredit + amount,
    }))
    setToast('success')
  }

  return (
    <TourProvider tourId="auditee-wallet" steps={tourSteps}>
      <AppLayout>
        <DashboardTourStep steps={tourSteps} stepId="wallet-header">
          <AccreditationHeader titleKey="wallet.pageTitle" />
        </DashboardTourStep>

        {toast && (
          <WalletToastOverlay
            variant={toast}
            onClose={() => setToast(null)}
            onRetry={() => {
              setToast(null)
              setActiveModal('recharge')
            }}
          />
        )}

        <div className="flex flex-1 flex-col gap-5 overflow-auto page-main">
          <DashboardTourStep steps={tourSteps} stepId="wallet-balance">
            <BalanceSection
              balance={balance}
              linkedAccounts={paymentMethods.bankAccounts}
              onlinePaymentsAvailable={onlinePayments}
              onRecharge={() => setActiveModal('recharge')}
              onRefund={() => setActiveModal('refund')}
              onAddPaymentMethod={() => setActiveModal('addPayment')}
              onUpdateAccount={() => setActiveModal('update')}
            />
          </DashboardTourStep>

          <DashboardTourStep steps={tourSteps} stepId="wallet-transactions">
            <WalletTransactionsTable transactions={transactions} />
          </DashboardTourStep>

          <div className="flex items-center justify-end gap-3 pb-2">
            <button
              type="button"
              className={cn(buttonVariants({ variant: 'secondary', size: 'default' }))}
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: 'primary', size: 'default' }))}
            >
              {t('common.next')}
            </button>
          </div>
        </div>

        {onlinePayments ? (
          <>
            <RechargeBalanceModal
              open={activeModal === 'recharge'}
              onClose={() => setActiveModal(null)}
              onConfirm={handleRecharge}
              visaCards={paymentMethods.cards}
              bankAccounts={paymentMethods.bankAccounts}
            />
            <AddPaymentMethodModal
              open={activeModal === 'addPayment'}
              onClose={() => setActiveModal(null)}
              onAdd={() => undefined}
            />
            <RequestRefundModal
              open={activeModal === 'refund'}
              onClose={() => setActiveModal(null)}
              onSubmit={() => undefined}
            />
            <UpdateAccountModal
              open={activeModal === 'update'}
              onClose={() => setActiveModal(null)}
              onUpdate={() => undefined}
            />
          </>
        ) : null}
      </AppLayout>
    </TourProvider>
  )
}