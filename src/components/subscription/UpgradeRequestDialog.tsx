import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui/Select'
import { FormDialog } from '@/components/platform/FormDialog'
import { FieldLabel } from '@/components/platform/PlatformUi'
import { textareaClassName } from '@/components/platform/platformStyles'
import { invalidateSubscription } from '@/hooks/useSubscription'
import type { FeatureKey } from '@/lib/api/platformTypes'
import { requestSubscriptionUpgrade } from '@/lib/api/subscriptionApi'
import { toast } from '@/lib/toast'

const PLAN_CODES = ['PROFESSIONAL', 'ENTERPRISE', 'EXTRA_USERS', 'OTHER'] as const

/** "Request upgrade": POST /subscription/upgrade-request — iCASCO staff are notified and get back to the CAB. */
export function UpgradeRequestDialog({
  open,
  onClose,
  currentPlanCode,
  feature,
}: {
  open: boolean
  onClose: () => void
  currentPlanCode?: string
  feature?: FeatureKey | null
}) {
  const { t } = useTranslation()
  const options = PLAN_CODES.filter((code) => code !== currentPlanCode)
  const [planCode, setPlanCode] = useState<string>(options[0])
  const [message, setMessage] = useState('')
  const [openedFor, setOpenedFor] = useState<string | null>(null)

  // Prefill each time the dialog opens (e.g. with the locked feature the user tried to open).
  const key = open ? `${feature ?? ''}|${currentPlanCode ?? ''}` : null
  if (key !== openedFor) {
    setOpenedFor(key)
    if (open) {
      setPlanCode(options[0])
      setMessage(feature ? t('subscription.upgrade.prefill', { feature: t(`platform.features.${feature}`) }) : '')
    }
  }

  return (
    <FormDialog
      open={open}
      title={t('subscription.upgrade.title')}
      description={t('subscription.upgrade.description')}
      submitLabel={t('subscription.upgrade.submit')}
      canSubmit={message.trim().length >= 5}
      onClose={onClose}
      onSubmit={async () => {
        await requestSubscriptionUpgrade({ planCode: planCode === 'OTHER' ? undefined : planCode, message: message.trim() })
        toast.success(t('subscription.upgrade.sent'))
        invalidateSubscription()
      }}
    >
      <div className="flex flex-col gap-2">
        <FieldLabel>{t('subscription.upgrade.whatYouNeed')}</FieldLabel>
        <SelectField value={planCode} onChange={setPlanCode} options={options.map((code) => ({ value: code, label: t(`subscription.upgrade.options.${code}`) }))} />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="upg-message" required>
          {t('subscription.upgrade.message')}
        </FieldLabel>
        <textarea
          id="upg-message"
          rows={4}
          className={textareaClassName}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('subscription.upgrade.messagePlaceholder')}
          maxLength={1000}
        />
      </div>
    </FormDialog>
  )
}
