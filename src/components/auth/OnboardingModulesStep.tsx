import { useTranslation } from 'react-i18next'
import { CabOptionCard } from '@/components/auth/cab/CabOptionCard'
import { ONBOARDING_MODULE_OPTIONS, type OnboardingModuleId } from '@/lib/api/onboardingModulesApi'
import type { OnboardingModulesFields } from '@/lib/onboardingModulesForm'

interface OnboardingModulesStepProps {
  form: OnboardingModulesFields
  onPatch: (fields: Partial<OnboardingModulesFields>) => void
}

export function OnboardingModulesStep({ form, onPatch }: OnboardingModulesStepProps) {
  const { t } = useTranslation()

  const toggleModule = (value: OnboardingModuleId) => {
    onPatch({
      modules: form.modules.includes(value)
        ? form.modules.filter((module) => module !== value)
        : [...form.modules, value],
    })
  }

  return (
    <div className="w-full">
      <h1 className="text-page-title text-text-primary">{t('onboarding.modules.title')}</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ONBOARDING_MODULE_OPTIONS.map((option) => (
          <CabOptionCard
            key={option.value}
            title={t(option.titleKey)}
            description={t(option.descriptionKey)}
            selected={form.modules.includes(option.value)}
            onSelect={() => toggleModule(option.value)}
          />
        ))}
      </div>
    </div>
  )
}
