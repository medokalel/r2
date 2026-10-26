import { useTranslation } from 'react-i18next'
import { EntityTypeOption } from '@/components/auth/EntityTypeOption'
import type { EntityType } from '@/lib/entityTypes'

interface OnboardingEntityTypeStepProps {
  value: EntityType | ''
  onSelect: (type: EntityType) => void
}

export function OnboardingEntityTypeStep({ value, onSelect }: OnboardingEntityTypeStepProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full">
      <p className="mb-2 text-body-2-medium text-primary">{t('onboarding.entityType.hint')}</p>
      <h1 className="text-page-title text-text-primary">{t('onboarding.entityType.title')}</h1>
      <p className="mt-2 mb-6 text-body-2 text-neutral-600">{t('onboarding.entityType.subtitle')}</p>
      <EntityTypeOption selected={value || null} onSelect={onSelect} />
    </div>
  )
}
