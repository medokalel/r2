import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { IA_EMPLOYEE_RANGE_OPTIONS, IA_INDUSTRY_OPTIONS } from '@/lib/api/iaSetupApi'
import { isValidWebsite } from '@/lib/validators'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

export function IaProfileStep({ form, onPatch, onPatchSetup }: IaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.iaSetup

  const industryOptions = useMemo(
    () => IA_INDUSTRY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="ia-setup-legal-name"
          label={t('ia.setup.profile.legalName')}
          required
          type="text"
          value={form.legalEntityName}
          placeholder={t('ia.setup.profile.legalNamePlaceholder')}
          onChange={(event) => onPatch({ legalEntityName: event.target.value })}
        />
        <SearchableSelect
          id="ia-setup-industry"
          label={t('ia.setup.profile.industry')}
          required
          value={setup.industry}
          onChange={(industry) => onPatchSetup({ industry })}
          options={industryOptions}
          placeholder={t('ia.setup.profile.industryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      {setup.industry === 'OTHER' && (
        <TextField
          id="ia-setup-industry-other"
          label={t('ia.setup.profile.industryOther')}
          required
          type="text"
          value={setup.industryOther}
          placeholder={t('ia.setup.profile.industryOtherPlaceholder')}
          onChange={(event) => onPatchSetup({ industryOther: event.target.value })}
        />
      )}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="ia-setup-registration-number"
          label={t('ia.setup.profile.registrationNumber')}
          type="text"
          value={form.registrationNumber}
          placeholder={t('ia.setup.profile.registrationNumberPlaceholder')}
          onChange={(event) => onPatch({ registrationNumber: event.target.value })}
        />
        <TextField
          id="ia-setup-website"
          label={t('ia.setup.profile.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('ia.setup.profile.websitePlaceholder')}
          onChange={(event) => onPatch({ website: event.target.value })}
          error={!isValidWebsite(form.website) ? t('validation.invalidWebsite') : undefined}
        />
      </div>

      <SearchableSelect
        id="ia-setup-employee-range"
        label={t('ia.setup.profile.employeeRange')}
        value={setup.employeeRange}
        onChange={(employeeRange) => onPatchSetup({ employeeRange })}
        options={IA_EMPLOYEE_RANGE_OPTIONS}
        placeholder={t('ia.setup.profile.employeeRangePlaceholder')}
        searchPlaceholder={t('common.search')}
      />
    </div>
  )
}
