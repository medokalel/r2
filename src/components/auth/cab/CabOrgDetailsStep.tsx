import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import {
  ORG_SCOPE_CATEGORY_OPTIONS,
  getOrgScopeSubOptions,
  type OrgScopeCategory,
} from '@/lib/api/onboardingOrgScopeApi'
import type { CabOnboardingForm } from '@/lib/cabOnboardingForm'
import { getOrgScopeNameFieldLabels } from '@/lib/orgScopeNameField'
import { isValidFieldKind, isValidWebsite } from '@/lib/validators'

interface CabOrgDetailsStepProps {
  form: CabOnboardingForm
  onPatch: (f: Partial<CabOnboardingForm>) => void
}

export function CabOrgDetailsStep({ form, onPatch }: CabOrgDetailsStepProps) {
  const { t } = useTranslation()
  const selectedScopeLabel = useMemo(() => {
    const category = ORG_SCOPE_CATEGORY_OPTIONS.find((option) => option.value === form.scopeCategory)
    return category ? t(category.titleKey) : ''
  }, [form.scopeCategory, t])

  const cabTypeOptions = useMemo(() => {
    if (!form.scopeCategory) return []
    return getOrgScopeSubOptions(form.scopeCategory as OrgScopeCategory).map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    }))
  }, [form.scopeCategory, t])

  const cabTypeTags = form.cabType.length > 0 ? form.cabType : form.scopeAreas
  const orgNameField = getOrgScopeNameFieldLabels(form.scopeCategory, t)

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="mb-2 text-body-2-medium text-primary">
          {t('cab.onboarding.orgDetails.hint', { orgType: selectedScopeLabel })}
        </p>
        <h1 className="text-page-title text-text-primary">{t('cab.onboarding.orgDetails.title')}</h1>
        <p className="mt-2 text-body-2 text-neutral-600">{t('cab.onboarding.orgDetails.subtitle')}</p>
      </div>

      <TextField
        id="cab-onboarding-legal-name"
        label={orgNameField.label}
        required
        type="text"
        value={form.legalEntityName}
        placeholder={orgNameField.placeholder}
        valueKind="text"
        onChange={(e) => onPatch({ legalEntityName: e.target.value })}
        error={
          form.legalEntityName && !isValidFieldKind(form.legalEntityName, 'text')
            ? t('validation.textOnly')
            : undefined
        }
      />

      <TextField
        id="cab-onboarding-trading-name"
        label={t('cab.onboarding.orgDetails.tradingName')}
        type="text"
        value={form.tradingName}
        placeholder={t('cab.onboarding.orgDetails.tradingNamePlaceholder')}
        valueKind="text"
        onChange={(e) => onPatch({ tradingName: e.target.value })}
        error={
          form.tradingName && !isValidFieldKind(form.tradingName, 'text')
            ? t('validation.textOnly')
            : undefined
        }
      />

      <TextField
        id="cab-onboarding-scope-category"
        label={t('cab.onboarding.orgDetails.orgType')}
        value={selectedScopeLabel}
        disabled
      />

      <div className="space-y-2">
        <FormLabel>{t('cab.onboarding.orgDetails.cabType')}</FormLabel>
        <MultiSelect
          tags={cabTypeTags}
          options={cabTypeOptions}
          onChange={() => undefined}
          layout="stacked"
          readOnly
          placeholder={t('cab.onboarding.orgDetails.cabTypePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TextField
          id="cab-onboarding-registration-number"
          label={t('cab.onboarding.orgDetails.registrationNumber')}
          type="text"
          value={form.registrationNumber}
          placeholder={t('cab.onboarding.orgDetails.registrationNumberPlaceholder')}
          valueKind="mixed"
          onChange={(e) => onPatch({ registrationNumber: e.target.value })}
          error={
            form.registrationNumber && !isValidFieldKind(form.registrationNumber, 'mixed')
              ? t('validation.mixedOnly')
              : undefined
          }
        />
        <TextField
          id="cab-onboarding-website"
          label={t('cab.onboarding.orgDetails.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('cab.onboarding.orgDetails.websitePlaceholder')}
          onChange={(e) => onPatch({ website: e.target.value })}
          error={!isValidWebsite(form.website) ? t('validation.invalidWebsite') : undefined}
        />
      </div>
    </div>
  )
}
