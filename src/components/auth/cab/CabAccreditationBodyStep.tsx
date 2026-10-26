import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CabOptionCard } from '@/components/auth/cab/CabOptionCard'
import { TextField } from '@/components/ui'
import { ACCREDITATION_BODY_OTHER, getAccreditationBodyOptions } from '@/lib/api/cabOnboardingApi'
import { getCountryOptions } from '@/lib/countries'
import type { CabOnboardingForm } from '@/lib/cabOnboardingForm'

interface CabAccreditationBodyStepProps {
  form: CabOnboardingForm
  onPatch: (f: Partial<CabOnboardingForm>) => void
}

export function CabAccreditationBodyStep({ form, onPatch }: CabAccreditationBodyStepProps) {
  const { t, i18n } = useTranslation()
  const options = useMemo(() => getAccreditationBodyOptions(form.country), [form.country])
  const countryName = useMemo(
    () => getCountryOptions(i18n.language).find((c) => c.code === form.country)?.name ?? form.country,
    [i18n.language, form.country]
  )

  const handleSelect = (value: string) => {
    onPatch({
      accreditationBody: value,
      accreditationBodyOther: value === ACCREDITATION_BODY_OTHER ? form.accreditationBodyOther : '',
    })
  }

  return (
    <div className="w-full">
      <p className="mb-2 text-body-2-medium text-primary">
        {t('cab.onboarding.accreditationBody.hint', { country: countryName })}
      </p>
      <h1 className="text-page-title text-text-primary">{t('cab.onboarding.accreditationBody.title')}</h1>
      <p className="mt-2 mb-6 text-body-2 text-neutral-600">
        {t('cab.onboarding.accreditationBody.subtitle', { country: countryName })}
      </p>

      <div className="flex flex-col gap-4">
        {options.map((option) => (
          <CabOptionCard
            key={option.value}
            title={option.title}
            description={option.description}
            selected={form.accreditationBody === option.value}
            onSelect={() => handleSelect(option.value)}
          />
        ))}
      </div>

      {form.accreditationBody === ACCREDITATION_BODY_OTHER && (
        <div className="mt-6">
          <TextField
            id="cab-onboarding-accreditation-body-other"
            label={t('cab.onboarding.accreditationBody.otherLabel')}
            required
            type="text"
            value={form.accreditationBodyOther}
            placeholder={t('cab.onboarding.accreditationBody.otherPlaceholder')}
            onChange={(e) => onPatch({ accreditationBodyOther: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
