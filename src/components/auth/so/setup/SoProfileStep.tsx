import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SO_OWNER_TYPE_OPTIONS, getYearEstablishedOptions } from '@/lib/api/soSetupApi'
import { isValidWebsite } from '@/lib/validators'
import type { SoSetupStepProps } from '@/components/auth/so/setup/types'

export function SoProfileStep({ form, onPatch, onPatchSetup }: SoSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.soSetup

  const ownerTypeOptions = useMemo(
    () => SO_OWNER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const yearOptions = useMemo(() => getYearEstablishedOptions(), [])

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="so-setup-legal-name"
          label={t('so.setup.profile.legalName')}
          required
          type="text"
          value={form.legalEntityName}
          placeholder={t('so.setup.profile.legalNamePlaceholder')}
          onChange={(event) => onPatch({ legalEntityName: event.target.value })}
        />
        <SearchableSelect
          id="so-setup-owner-type"
          label={t('so.setup.profile.ownerType')}
          required
          value={setup.ownerType}
          onChange={(ownerType) => onPatchSetup({ ownerType })}
          options={ownerTypeOptions}
          placeholder={t('so.setup.profile.ownerTypePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      {setup.ownerType === 'OTHER' && (
        <TextField
          id="so-setup-owner-type-other"
          label={t('so.setup.profile.ownerTypeOther')}
          required
          type="text"
          value={setup.ownerTypeOther}
          placeholder={t('so.setup.profile.ownerTypeOtherPlaceholder')}
          onChange={(event) => onPatchSetup({ ownerTypeOther: event.target.value })}
        />
      )}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="so-setup-registration-number"
          label={t('so.setup.profile.registrationNumber')}
          type="text"
          value={form.registrationNumber}
          placeholder={t('so.setup.profile.registrationNumberPlaceholder')}
          onChange={(event) => onPatch({ registrationNumber: event.target.value })}
        />
        <TextField
          id="so-setup-website"
          label={t('so.setup.profile.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('so.setup.profile.websitePlaceholder')}
          onChange={(event) => onPatch({ website: event.target.value })}
          error={!isValidWebsite(form.website) ? t('validation.invalidWebsite') : undefined}
        />
      </div>

      <SearchableSelect
        id="so-setup-year"
        label={t('so.setup.profile.yearEstablished')}
        value={setup.yearEstablished}
        onChange={(yearEstablished) => onPatchSetup({ yearEstablished })}
        options={yearOptions}
        placeholder={t('so.setup.profile.yearEstablishedPlaceholder')}
        searchPlaceholder={t('common.search')}
      />
    </div>
  )
}
