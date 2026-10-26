import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { getAllAccreditationBodyOptions } from '@/lib/api/abOnboardingApi'
import {
  ORG_SCOPE_CATEGORY_OPTIONS,
  getOrgScopeSubOptions,
  type OrgScopeCategory,
} from '@/lib/api/onboardingOrgScopeApi'
import type { AbOnboardingForm } from '@/lib/abOnboardingForm'
import { getOrgScopeNameFieldLabels } from '@/lib/orgScopeNameField'
import { isValidWebsite } from '@/lib/validators'

interface AbOrgDetailsStepProps {
  form: AbOnboardingForm
  onPatch: (f: Partial<AbOnboardingForm>) => void
}

function getAccreditationBodyNameLabels(values: string[], options: { value: string; label: string }[]): string {
  return values
    .map((value) => options.find((option) => option.value === value)?.label ?? value)
    .join(', ')
}

export function AbOrgDetailsStep({ form, onPatch }: AbOrgDetailsStepProps) {
  const { t } = useTranslation()
  const isAccreditationBodyScope = form.scopeCategory === 'ACCREDITATION_BODY'

  const selectedScopeLabel = useMemo(() => {
    const category = ORG_SCOPE_CATEGORY_OPTIONS.find((option) => option.value === form.scopeCategory)
    return category ? t(category.titleKey) : ''
  }, [form.scopeCategory, t])

  const abTypeOptions = useMemo(() => {
    if (!form.scopeCategory) return []
    return getOrgScopeSubOptions(form.scopeCategory as OrgScopeCategory).map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    }))
  }, [form.scopeCategory, t])

  const accreditationBodyNameOptions = useMemo(
    () =>
      getAllAccreditationBodyOptions().map((option) => ({
        value: option.value,
        label: option.title,
      })),
    []
  )

  const abTypeTags = form.abType.length > 0 ? form.abType : form.scopeAreas
  const orgNameField = getOrgScopeNameFieldLabels(form.scopeCategory, t)

  const handleAccreditationBodyNamesChange = (values: string[]) => {
    onPatch({
      accreditationBodyNames: values,
      legalEntityName: getAccreditationBodyNameLabels(values, accreditationBodyNameOptions),
    })
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="mb-2 text-body-2-medium text-primary">
          {t('ab.onboarding.orgDetails.hint', { orgType: selectedScopeLabel })}
        </p>
        <h1 className="text-page-title text-text-primary">{t('ab.onboarding.orgDetails.title')}</h1>
        <p className="mt-2 text-body-2 text-neutral-600">{t('ab.onboarding.orgDetails.subtitle')}</p>
      </div>

      {isAccreditationBodyScope ? (
        <div className="space-y-2">
          <FormLabel required>{orgNameField.label}</FormLabel>
          <MultiSelect
            tags={form.accreditationBodyNames}
            options={accreditationBodyNameOptions}
            onChange={handleAccreditationBodyNamesChange}
            searchable
            searchPlaceholder={t('ab.onboarding.orgDetails.accreditationBodyNameSearchPlaceholder')}
            placeholder={t('ab.onboarding.orgDetails.accreditationBodyNamePlaceholder')}
          />
        </div>
      ) : (
        <TextField
          id="ab-onboarding-legal-name"
          label={orgNameField.label}
          required
          type="text"
          value={form.legalEntityName}
          placeholder={orgNameField.placeholder}
          onChange={(e) => onPatch({ legalEntityName: e.target.value })}
        />
      )}

      <TextField
        id="ab-onboarding-trading-name"
        label={t('ab.onboarding.orgDetails.tradingName')}
        type="text"
        value={form.tradingName}
        placeholder={t('ab.onboarding.orgDetails.tradingNamePlaceholder')}
        onChange={(e) => onPatch({ tradingName: e.target.value })}
      />

      <TextField
        id="ab-onboarding-scope-category"
        label={t('ab.onboarding.orgDetails.orgType')}
        value={selectedScopeLabel}
        disabled
      />

      <div className="space-y-2">
        <FormLabel>{t('ab.onboarding.orgDetails.abType')}</FormLabel>
        <MultiSelect
          tags={abTypeTags}
          options={abTypeOptions}
          onChange={() => undefined}
          layout="stacked"
          readOnly
          placeholder={t('ab.onboarding.orgDetails.abTypePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TextField
          id="ab-onboarding-registration-number"
          label={t('ab.onboarding.orgDetails.registrationNumber')}
          type="text"
          value={form.registrationNumber}
          placeholder={t('ab.onboarding.orgDetails.registrationNumberPlaceholder')}
          onChange={(e) => onPatch({ registrationNumber: e.target.value })}
        />
        <TextField
          id="ab-onboarding-website"
          label={t('ab.onboarding.orgDetails.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('ab.onboarding.orgDetails.websitePlaceholder')}
          onChange={(e) => onPatch({ website: e.target.value })}
          error={!isValidWebsite(form.website) ? t('validation.invalidWebsite') : undefined}
        />
      </div>
    </div>
  )
}
