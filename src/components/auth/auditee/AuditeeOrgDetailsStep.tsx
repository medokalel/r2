import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { ORG_SCOPE_CATEGORY_OPTIONS } from '@/lib/api/onboardingOrgScopeApi'
import type { AuditeeOnboardingForm } from '@/lib/auditeeOnboardingForm'
import { getOrgScopeNameFieldLabels } from '@/lib/orgScopeNameField'
import { isValidWebsite } from '@/lib/validators'

interface AuditeeOrgDetailsStepProps {
  form: AuditeeOnboardingForm
  onPatch: (f: Partial<AuditeeOnboardingForm>) => void
}

export function AuditeeOrgDetailsStep({ form, onPatch }: AuditeeOrgDetailsStepProps) {
  const { t } = useTranslation()
  const selectedScopeLabel = useMemo(() => {
    const category = ORG_SCOPE_CATEGORY_OPTIONS.find((option) => option.value === form.scopeCategory)
    return category ? t(category.titleKey) : ''
  }, [form.scopeCategory, t])

  const orgNameField = getOrgScopeNameFieldLabels(form.scopeCategory, t)

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="mb-2 text-body-2-medium text-primary">
          {t('auditee.onboarding.orgDetails.hint', { orgType: selectedScopeLabel })}
        </p>
        <h1 className="text-page-title text-text-primary">{t('auditee.onboarding.orgDetails.title')}</h1>
        <p className="mt-2 text-body-2 text-neutral-600">{t('auditee.onboarding.orgDetails.subtitle')}</p>
      </div>

      <TextField
        id="auditee-onboarding-legal-name"
        label={orgNameField.label}
        required
        type="text"
        value={form.legalEntityName}
        placeholder={orgNameField.placeholder}
        onChange={(e) => onPatch({ legalEntityName: e.target.value })}
      />

      <TextField
        id="auditee-onboarding-trading-name"
        label={t('auditee.onboarding.orgDetails.tradingName')}
        type="text"
        value={form.tradingName}
        placeholder={t('auditee.onboarding.orgDetails.tradingNamePlaceholder')}
        onChange={(e) => onPatch({ tradingName: e.target.value })}
      />

      <TextField
        id="auditee-onboarding-scope-category"
        label={t('auditee.onboarding.orgDetails.orgType')}
        value={selectedScopeLabel}
        disabled
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TextField
          id="auditee-onboarding-registration-number"
          label={t('auditee.onboarding.orgDetails.registrationNumber')}
          type="text"
          value={form.registrationNumber}
          placeholder={t('auditee.onboarding.orgDetails.registrationNumberPlaceholder')}
          onChange={(e) => onPatch({ registrationNumber: e.target.value })}
        />
        <TextField
          id="auditee-onboarding-website"
          label={t('auditee.onboarding.orgDetails.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('auditee.onboarding.orgDetails.websitePlaceholder')}
          onChange={(e) => onPatch({ website: e.target.value })}
          error={!isValidWebsite(form.website) ? t('validation.invalidWebsite') : undefined}
        />
      </div>
    </div>
  )
}
