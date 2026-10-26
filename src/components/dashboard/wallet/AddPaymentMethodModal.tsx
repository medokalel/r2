import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { CvvHintTooltip } from '@/components/dashboard/wallet/CvvHintTooltip'
import {
  PaymentMethodToggle,
  WalletModalActions,
  WalletModalBody,
  WalletModalShell,
  WalletSecurityNotice,
} from '@/components/dashboard/wallet/WalletModalShell'
import { formatBankAccountNumber, formatCardNumber, formatCvv } from '@/components/dashboard/wallet/walletFormatters'
import {
  BankFormRow,
  PAYMENT_BANK_MODAL_CLASS,
  PAYMENT_VISA_MODAL_CLASS,
  paymentBankFormClass,
  paymentContentClass,
  paymentFieldClass,
  paymentFieldsStackClass,
} from '@/components/dashboard/wallet/walletPaymentFormShared'
import { cn } from '@/lib/utils'

interface AddPaymentMethodModalProps {
  open: boolean
  onClose: () => void
  onAdd: () => void
}

export function AddPaymentMethodModal({ open, onClose, onAdd }: AddPaymentMethodModalProps) {
  const { t } = useTranslation()
  const [method, setMethod] = useState<'visa' | 'bank'>('visa')
  const [loading, setLoading] = useState(false)

  const [visaForm, setVisaForm] = useState({
    paymentMethodName: '',
    cardHolderName: '',
    cardNumber: formatCardNumber('80000000608010167519'),
    cvv: '567',
  })

  const [bankForm, setBankForm] = useState({
    bankName: '',
    bankBranch: 'grandmother',
    iban: '8000 0000 6080 1016 7519',
    paymentMethodName: '',
    accountHolderName: '',
    accountNumber: formatBankAccountNumber('2345607968574635'),
    swiftCode: 'XXXXsar36748',
  })

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      onAdd()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <WalletModalShell
      open={open}
      onClose={onClose}
      title={t('wallet.addPaymentModal.title')}
      subtitle={t('wallet.addPaymentModal.subtitle')}
      className={method === 'bank' ? PAYMENT_BANK_MODAL_CLASS : PAYMENT_VISA_MODAL_CLASS}
      headerClassName={method === 'bank' ? 'px-8 pt-8 pb-4' : 'px-6 pt-8 pb-4'}
      titleClassName="font-sans text-body-lg font-semibold leading-[1.6]"
      subtitleClassName="text-caption leading-[1.35]"
      closeClassName="size-9"
    >
      <WalletModalBody
        className={cn(
          'flex flex-col gap-6 pt-1 font-sans leading-[1.6] [&_.field-label]:text-body-sm [&_.field-label]:font-normal',
          method === 'bank' ? 'px-8 pb-8' : 'px-6 pb-10'
        )}
      >
        <div className={paymentContentClass}>
          <PaymentMethodToggle value={method} onChange={setMethod} compact />

          {method === 'visa' ? (
            <div className={paymentFieldsStackClass}>
              <TextField
                id="visa-payment-name"
                label={t('wallet.addPaymentModal.paymentMethodName')}
                value={visaForm.paymentMethodName}
                onChange={(e) => setVisaForm((prev) => ({ ...prev, paymentMethodName: e.target.value }))}
                placeholder={t('wallet.addPaymentModal.paymentMethodNamePlaceholder')}
                className={paymentFieldClass}
              />
              <TextField
                id="visa-card-holder"
                label={t('wallet.addPaymentModal.cardHolderName')}
                value={visaForm.cardHolderName}
                onChange={(e) => setVisaForm((prev) => ({ ...prev, cardHolderName: e.target.value }))}
                placeholder={t('wallet.addPaymentModal.cardHolderNamePlaceholder')}
                className={paymentFieldClass}
              />
              <TextField
                id="visa-card-number"
                label={t('wallet.addPaymentModal.cardNumber')}
                value={visaForm.cardNumber}
                onChange={(e) =>
                  setVisaForm((prev) => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))
                }
                className={paymentFieldClass}
                dir="ltr"
                inputMode="numeric"
                maxLength={19}
              />
              <TextField
                id="visa-cvv"
                label={t('wallet.addPaymentModal.cvv')}
                labelExtra={<CvvHintTooltip />}
                value={visaForm.cvv}
                onChange={(e) => setVisaForm((prev) => ({ ...prev, cvv: formatCvv(e.target.value) }))}
                className={paymentFieldClass}
                dir="ltr"
                inputMode="numeric"
                maxLength={3}
              />
            </div>
          ) : (
            <div className={paymentBankFormClass}>
              <BankFormRow
                left={{
                  id: 'bank-name',
                  label: t('wallet.addPaymentModal.bankName'),
                  field: (
                    <SelectField
                      id="bank-name"
                      value={bankForm.bankName}
                      onChange={(value) => setBankForm((prev) => ({ ...prev, bankName: value }))}
                      placeholder={t('wallet.addPaymentModal.bankNamePlaceholder')}
                      className={paymentFieldClass}
                      options={[
                        t('wallet.addPaymentModal.bankOptions.national'),
                        t('wallet.addPaymentModal.bankOptions.rajhi'),
                        t('wallet.addPaymentModal.bankOptions.riyad'),
                      ]}
                    />
                  ),
                }}
                right={{
                  id: 'bank-payment-name',
                  label: t('wallet.addPaymentModal.paymentMethodName'),
                  field: (
                    <TextField
                      id="bank-payment-name"
                      value={bankForm.paymentMethodName}
                      onChange={(e) => setBankForm((prev) => ({ ...prev, paymentMethodName: e.target.value }))}
                      placeholder={t('wallet.addPaymentModal.bankPaymentNamePlaceholder')}
                      className={paymentFieldClass}
                    />
                  ),
                }}
              />
              <BankFormRow
                left={{
                  id: 'bank-branch',
                  label: t('wallet.addPaymentModal.bankBranch'),
                  field: (
                    <SelectField
                      id="bank-branch"
                      value={bankForm.bankBranch}
                      onChange={(value) => setBankForm((prev) => ({ ...prev, bankBranch: value }))}
                      className={paymentFieldClass}
                      options={['grandmother', 'Jeddah', 'Riyadh']}
                    />
                  ),
                }}
                right={{
                  id: 'bank-account-holder',
                  label: t('wallet.addPaymentModal.accountHolderName'),
                  field: (
                    <TextField
                      id="bank-account-holder"
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm((prev) => ({ ...prev, accountHolderName: e.target.value }))}
                      placeholder={t('wallet.addPaymentModal.accountHolderNamePlaceholder')}
                      className={paymentFieldClass}
                    />
                  ),
                }}
              />
              <BankFormRow
                left={{
                  id: 'bank-iban',
                  label: t('wallet.addPaymentModal.iban'),
                  field: (
                    <TextField
                      id="bank-iban"
                      value={bankForm.iban}
                      onChange={(e) => setBankForm((prev) => ({ ...prev, iban: e.target.value }))}
                      className={paymentFieldClass}
                      dir="ltr"
                    />
                  ),
                }}
                right={{
                  id: 'bank-account-number',
                  label: t('wallet.addPaymentModal.accountNumber'),
                  field: (
                    <TextField
                      id="bank-account-number"
                      value={bankForm.accountNumber}
                      onChange={(e) =>
                        setBankForm((prev) => ({
                          ...prev,
                          accountNumber: formatBankAccountNumber(e.target.value),
                        }))
                      }
                      className={paymentFieldClass}
                      dir="ltr"
                      inputMode="numeric"
                      maxLength={19}
                    />
                  ),
                }}
              />
              <BankFormRow
                left={{
                  id: 'bank-swift',
                  label: t('wallet.addPaymentModal.swiftCode'),
                  field: (
                    <TextField
                      id="bank-swift"
                      value={bankForm.swiftCode}
                      onChange={(e) => setBankForm((prev) => ({ ...prev, swiftCode: e.target.value }))}
                      className={paymentFieldClass}
                      dir="ltr"
                    />
                  ),
                }}
              />
            </div>
          )}

          <WalletSecurityNotice compact />

          <WalletModalActions
            onCancel={onClose}
            onConfirm={handleConfirm}
            confirmLabel={t('wallet.addPaymentModal.add')}
            loading={loading}
            alignEnd={method === 'bank'}
            buttonClassName="h-10 font-normal text-caption"
          />
        </div>
      </WalletModalBody>
    </WalletModalShell>
  )
}
