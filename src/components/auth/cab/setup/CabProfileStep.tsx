import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { CAB_ACTIVITY_OPTIONS, getYearEstablishedOptions } from '@/lib/api/cabSetupApi'
import { isValidFieldKind, isValidWebsite } from '@/lib/validators'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

export function CabProfileStep({ form, onPatch, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()

  const activityOptions = useMemo(
    () => CAB_ACTIVITY_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const yearOptions = useMemo(() => getYearEstablishedOptions(), [])

  return (
    <div className="w-full space-y-6">

      <TextField
        id="cab-setup-legal-name"
        label={t('cab.setup.profile.legalName')}
        required
        type="text"
        value={form.legalEntityName}
        placeholder={t('cab.setup.profile.legalNamePlaceholder')}
        valueKind="text"
        onChange={(event) => onPatch({ legalEntityName: event.target.value })}
        error={
          form.legalEntityName && !isValidFieldKind(form.legalEntityName, 'text')
            ? t('validation.textOnly')
            : undefined
        }
      />

      <TextField
        id="cab-setup-trading-name"
        label={t('cab.setup.profile.tradingName')}
        type="text"
        value={form.tradingName}
        placeholder={t('cab.setup.profile.tradingNamePlaceholder')}
        valueKind="text"
        onChange={(event) => onPatch({ tradingName: event.target.value })}
        error={
          form.tradingName && !isValidFieldKind(form.tradingName, 'text')
            ? t('validation.textOnly')
            : undefined
        }
      />

      <div className="space-y-2">
        <FormLabel required>{t('cab.setup.profile.activity')}</FormLabel>
        <div id="cab-setup-activities">
          <MultiSelect
            tags={form.cabSetup.activities}
            options={activityOptions}
            onChange={(activities) => onPatchSetup({ activities })}
            layout="stacked"
            searchable
            placeholder={t('cab.setup.profile.activityPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
        <SetupNote>{t('cab.setup.profile.activityNote')}</SetupNote>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="cab-setup-registration-number"
          label={t('cab.setup.profile.registrationNumber')}
          required
          type="text"
          value={form.registrationNumber}
          placeholder={t('cab.setup.profile.registrationNumberPlaceholder')}
          valueKind="mixed"
          onChange={(event) => onPatch({ registrationNumber: event.target.value })}
          error={
            form.registrationNumber && !isValidFieldKind(form.registrationNumber, 'mixed')
              ? t('validation.mixedOnly')
              : undefined
          }
        />
        <TextField
          id="cab-setup-website"
          label={t('cab.setup.profile.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('cab.setup.profile.websitePlaceholder')}
          onChange={(event) => onPatch({ website: event.target.value })}
          error={!isValidWebsite(form.website) ? t('validation.invalidWebsite') : undefined}
        />
      </div>

      <SearchableSelect
        id="cab-setup-year-established"
        label={t('cab.setup.profile.yearEstablished')}
        value={form.cabSetup.yearEstablished}
        onChange={(yearEstablished) => onPatchSetup({ yearEstablished })}
        options={yearOptions}
        placeholder={t('cab.setup.profile.yearEstablishedPlaceholder')}
        searchPlaceholder={t('common.search')}
      />
    </div>
  )
}
