import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { AB_MODEL_OPTIONS, getYearEstablishedOptions, requiresMandateReference } from '@/lib/api/abSetupApi'
import { isValidWebsite } from '@/lib/validators'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

export function AbProfileStep({ form, onPatch, onPatchSetup }: AbSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.abSetup

  const modelOptions = useMemo(
    () => AB_MODEL_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const yearOptions = useMemo(() => getYearEstablishedOptions(), [])

  // National/government ABs cite a decree; private ones cite a registration.
  const mandateLabel = requiresMandateReference(setup.abModel)
    ? t('ab.setup.profile.mandate')
    : t('ab.setup.profile.registrationBasis')

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="ab-setup-legal-name"
          label={t('ab.setup.profile.legalName')}
          required
          type="text"
          value={form.legalEntityName}
          placeholder={t('ab.setup.profile.legalNamePlaceholder')}
          onChange={(event) => onPatch({ legalEntityName: event.target.value })}
        />
        <TextField
          id="ab-setup-short-name"
          label={t('ab.setup.profile.shortName')}
          type="text"
          value={form.tradingName}
          placeholder={t('ab.setup.profile.shortNamePlaceholder')}
          onChange={(event) => onPatch({ tradingName: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="ab-setup-model"
          label={t('ab.setup.profile.model')}
          required
          value={setup.abModel}
          onChange={(abModel) => onPatchSetup({ abModel })}
          options={modelOptions}
          placeholder={t('ab.setup.profile.modelPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="ab-setup-mandate"
          label={mandateLabel}
          required
          type="text"
          value={setup.mandateReference}
          placeholder={t('ab.setup.profile.mandatePlaceholder')}
          onChange={(event) => onPatchSetup({ mandateReference: event.target.value })}
        />
      </div>

      {setup.abModel === 'OTHER' && (
        <TextField
          id="ab-setup-model-other"
          label={t('ab.setup.profile.modelOther')}
          required
          type="text"
          value={setup.abModelOther}
          placeholder={t('ab.setup.profile.modelOtherPlaceholder')}
          onChange={(event) => onPatchSetup({ abModelOther: event.target.value })}
        />
      )}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="ab-setup-website"
          label={t('ab.setup.profile.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('ab.setup.profile.websitePlaceholder')}
          onChange={(event) => onPatch({ website: event.target.value })}
          error={!isValidWebsite(form.website) ? t('validation.invalidWebsite') : undefined}
        />
        <SearchableSelect
          id="ab-setup-year"
          label={t('ab.setup.profile.yearEstablished')}
          value={setup.yearEstablished}
          onChange={(yearEstablished) => onPatchSetup({ yearEstablished })}
          options={yearOptions}
          placeholder={t('ab.setup.profile.yearEstablishedPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupNote>{t('ab.setup.profile.note')}</SetupNote>
    </div>
  )
}
