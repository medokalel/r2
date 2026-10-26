import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getAllAccreditationBodyOptions } from '@/lib/api/cabOnboardingApi'
import { ONBOARDING_MODULE_OPTIONS } from '@/lib/api/onboardingModulesApi'
import {
  getOrgScopeSubOptions,
  type OrgScopeCategory,
} from '@/lib/api/onboardingOrgScopeApi'
import { getAuthSession } from '@/lib/authStorage'
import { getOrgScopeNameFieldLabels } from '@/lib/orgScopeNameField'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

interface OnboardingSummaryStepProps {
  form: UnifiedOnboardingForm
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-neutral-300 py-4 last:border-b-0">
      <span className="shrink-0 text-body-2 text-neutral-600">{label}</span>
      <span className="text-end text-body-2 text-neutral-900">{value}</span>
    </div>
  )
}

export function OnboardingSummaryStep({ form }: OnboardingSummaryStepProps) {
  const { t } = useTranslation()

  const emptyValue = t('onboarding.shared.summary.emptyValue')

  const organizationName = useMemo(() => {
    if (form.scopeCategory === 'ACCREDITATION_BODY' && form.accreditationBodyNames.length > 0) {
      const options = getAllAccreditationBodyOptions().map((option) => ({
        value: option.value,
        label: option.title,
      }))
      const labels = form.accreditationBodyNames.map(
        (value) => options.find((option) => option.value === value)?.label ?? value
      )
      return labels.join(', ')
    }

    return form.legalEntityName.trim() || form.tradingName.trim()
  }, [form.accreditationBodyNames, form.legalEntityName, form.scopeCategory, form.tradingName])

  const contactPerson = useMemo(() => {
    return getAuthSession()?.organization?.name?.trim() || emptyValue
  }, [emptyValue])

  const selectedSchemes = useMemo(() => {
    if (!form.scopeCategory) return emptyValue

    const schemeValues =
      form.entityType === 'ACCREDITATION_BODY' && form.abType.length > 0
        ? form.abType
        : form.entityType === 'CERTIFICATION_BODY' && form.cabType.length > 0
          ? form.cabType
          : form.scopeAreas

    if (schemeValues.length === 0) return emptyValue

    const options = getOrgScopeSubOptions(form.scopeCategory as OrgScopeCategory)
    const labels = schemeValues.map((value) => {
      const option = options.find((item) => item.value === value)
      return option ? t(option.labelKey) : value
    })

    return labels.join(', ')
  }, [emptyValue, form.abType, form.cabType, form.entityType, form.scopeAreas, form.scopeCategory, t])

  const selectedModules = useMemo(() => {
    if (form.modules.length === 0) return emptyValue

    const labels = form.modules.map((moduleId) => {
      const option = ONBOARDING_MODULE_OPTIONS.find((item) => item.value === moduleId)
      return option ? t(option.titleKey) : moduleId
    })

    return labels.join(', ')
  }, [emptyValue, form.modules, t])

  const organizationNameLabel = getOrgScopeNameFieldLabels(form.scopeCategory, t).label

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-page-title text-text-primary">{t('onboarding.shared.summary.title')}</h1>
      </div>

      <div className="rounded-md border border-neutral-300 bg-white px-4">
        <SummaryRow
          label={organizationNameLabel}
          value={organizationName || emptyValue}
        />
        <SummaryRow label={t('onboarding.shared.summary.contactPerson')} value={contactPerson} />
        <SummaryRow label={t('onboarding.shared.summary.selectedSchemes')} value={selectedSchemes} />
        <SummaryRow label={t('onboarding.shared.summary.selectedModules')} value={selectedModules} />
      </div>
    </div>
  )
}
