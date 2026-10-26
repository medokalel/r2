import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui/Select'
import { FormDialog } from '@/components/platform/FormDialog'
import { FieldLabel } from '@/components/platform/PlatformUi'
import { textareaClassName } from '@/components/platform/platformStyles'
import { impersonateTenant } from '@/lib/api/platformApi'
import { launchImpersonation } from '@/lib/impersonation'
import { toast } from '@/lib/toast'

const MINUTES = ['15', '30', '45', '60']

/** Reason + duration (≤ 60 min), then the tenant's workspace opens in a new tab with the support banner. */
export function ImpersonateDialog({
  tenant,
  open,
  onClose,
  onDone,
}: {
  tenant: { id: string; name: string }
  open: boolean
  onClose: () => void
  onDone?: () => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [minutes, setMinutes] = useState('30')

  const submit = async () => {
    // Open the tab while the click still counts as a user gesture, then point it at the workspace.
    const target = window.open('', '_blank')
    try {
      const result = await impersonateTenant(tenant.id, reason.trim(), Number(minutes))
      const opened = launchImpersonation(target, result, tenant, reason.trim())
      if (opened) toast.success(t('platform.impersonate.opened', { name: tenant.name }))
      else toast.error(t('platform.impersonate.popupBlocked'))
      setReason('')
      onDone?.()
    } catch (error) {
      target?.close()
      throw error
    }
  }

  return (
    <FormDialog
      open={open}
      title={t('platform.impersonate.title', { name: tenant.name })}
      description={t('platform.impersonate.description')}
      submitLabel={t('platform.impersonate.submit')}
      canSubmit={reason.trim().length >= 5}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="imp-reason" required>
          {t('platform.common.reason')}
        </FieldLabel>
        <textarea
          id="imp-reason"
          rows={3}
          className={textareaClassName}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('platform.impersonate.reasonPlaceholder')}
          maxLength={500}
          autoFocus
        />
        <p className="text-caption text-neutral-600">{t('platform.impersonate.reasonHint')}</p>
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>{t('platform.impersonate.duration')}</FieldLabel>
        <SelectField value={minutes} onChange={setMinutes} options={MINUTES.map((m) => ({ value: m, label: t('platform.impersonate.minutes', { count: Number(m) }) }))} />
      </div>
    </FormDialog>
  )
}
