import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type CountryCode } from '@/components/auth/CountryCodeSelect'
import { Button } from '@/components/ui/Button'
import { AppIcon, AddCircleIcon } from '@/components/icons'
import { useIpLocation } from '@/hooks/useIpLocation'
import { createBranch } from '@/lib/api/organizationProfileApi'
import { BranchFormFields } from './BranchFormFields'
import { branchPayloadFrom } from './mappers'
import { profileCardClassName } from './constants'
import { useProfileForm } from './ProfileFormContext'
import { EMPTY_BRANCH_FORM, type BranchFormValues } from './types'
import { isBranchFormComplete } from './validation'

export function AddBranchForm() {
  const { t } = useTranslation()
  const ipLocation = useIpLocation()
  const { refreshBranches, notify, handleApiError } = useProfileForm()
  const [form, setForm] = useState<BranchFormValues>(EMPTY_BRANCH_FORM)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const countryCode: CountryCode =
    form.countryCode ?? (ipLocation?.countryCode as CountryCode | undefined) ?? 'SA'

  const onSave = async () => {
    setSaving(true)
    try {
      await createBranch(branchPayloadFrom(form, countryCode))
      await refreshBranches()
      setForm(EMPTY_BRANCH_FORM)
      notify({ type: 'success', message: t('companyProfile.messages.branchSaved') })
    } catch (error) {
      handleApiError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={profileCardClassName}>
      <div className="flex items-center gap-2">
        <AppIcon icon={AddCircleIcon} size={22} className="text-primary" />
        <p className="text-body-lg font-bold leading-[1.6] text-primary">
          {t('companyProfile.addBranch.title')}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <BranchFormFields form={form} set={set} countryCode={countryCode} />

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onSave}
          disabled={saving || !isBranchFormComplete(form, countryCode)}
        >
          {saving ? t('common.loading') : t('companyProfile.addBranch.saveButton')}
        </Button>
      </div>
    </div>
  )
}
