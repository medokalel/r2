import { useTranslation } from 'react-i18next'
import { CabOptionCard } from '@/components/auth/cab/CabOptionCard'
import { FormLabel } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import {
  ORG_SCOPE_CATEGORY_OPTIONS,
  getOrgScopeSubOptions,
  type OrgScopeCategory,
} from '@/lib/api/onboardingOrgScopeApi'
import { ORG_SCOPE_CATEGORY_ICONS } from '@/components/auth/orgScopeCategoryIcons'
import type { OrgScopeFormFields } from '@/lib/onboardingOrgScopeForm'

interface OrgScopeTypeStepProps {
  form: OrgScopeFormFields
  onPatch: (fields: Partial<OrgScopeFormFields>) => void
}

export function OrgScopeTypeStep({ form, onPatch }: OrgScopeTypeStepProps) {
  const { t } = useTranslation()

  const getSubOptions = (category: OrgScopeCategory) =>
    getOrgScopeSubOptions(category).map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    }))

  const handleCategorySelect = (category: OrgScopeCategory) => {
    if (form.scopeCategory === category) {
      onPatch({ scopeCategory: '', scopeAreas: [] })
      return
    }
    onPatch({ scopeCategory: category, scopeAreas: [] })
  }

  return (
    <div className="w-full onboarding-fade-up motion-safe:animate-[onboardingFadeUp_0.4s_ease-out_both]">
      <p className="mb-2 text-body-2-medium text-primary">{t('onboarding.orgType.hint')}</p>
      <h1 className="text-page-title text-text-primary">{t('onboarding.orgType.title')}</h1>
      <p className="mt-2 mb-6 text-body-2 text-neutral-600">{t('onboarding.orgType.subtitle')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ORG_SCOPE_CATEGORY_OPTIONS.map((option) => (
          <CabOptionCard
            key={option.value}
            icon={ORG_SCOPE_CATEGORY_ICONS[option.value]}
            title={t(option.titleKey)}
            description={t(option.descriptionKey)}
            selected={form.scopeCategory === option.value}
            onSelect={() => handleCategorySelect(option.value)}
          />
        ))}
      </div>

      {form.scopeCategory && (
        <div
          key={form.scopeCategory}
          className="mt-6 space-y-2 onboarding-fade-up motion-safe:animate-[onboardingFadeUp_0.35s_ease-out_both]"
        >
          <FormLabel required>{t('onboarding.orgType.areasLabel')}</FormLabel>
          <MultiSelect
            tags={form.scopeAreas}
            options={getSubOptions(form.scopeCategory)}
            onChange={(scopeAreas) => onPatch({ scopeAreas })}
            layout="stacked"
            searchable
            placeholder={t('onboarding.orgType.areasPlaceholder')}
            searchPlaceholder={t('onboarding.orgType.areasSearchPlaceholder')}
          />
        </div>
      )}
    </div>
  )
}
