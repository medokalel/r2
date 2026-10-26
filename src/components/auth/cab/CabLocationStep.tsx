import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { fieldHeightClassName, fieldInputClassName } from '@/components/ui/fieldStyles'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { useGovernorateOptions } from '@/hooks/useGovernorateOptions'
import { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS } from '@/lib/api/cabOnboardingApi'
import type { CabOnboardingForm } from '@/lib/cabOnboardingForm'
import { cn } from '@/lib/utils'

interface CabLocationStepProps {
  form: CabOnboardingForm
  onPatch: (f: Partial<CabOnboardingForm>) => void
}

export function CabLocationStep({ form, onPatch }: CabLocationStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const governorates = useGovernorateOptions(form.country)

  const timezoneLabel = form.country
    ? `${getTimezoneForCountry(form.country)} (${t('cab.onboarding.location.autoDetected')})`
    : ''

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="mb-2 text-body-2-medium text-primary">
          {t('cab.onboarding.location.hint', { name: form.legalEntityName || form.tradingName })}
        </p>
        <h1 className="text-page-title text-text-primary">{t('cab.onboarding.location.title')}</h1>
        <p className="mt-2 text-body-2 text-neutral-600">{t('cab.onboarding.location.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SearchableSelect
          id="cab-onboarding-country"
          label={t('cab.onboarding.location.country')}
          required
          value={form.country}
          onChange={(value) => onPatch({ country: value as CountryCode, city: '' })}
          options={countries.map((country) => ({ value: country.code, label: `${country.flag} ${country.name}` }))}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />

        <SearchableSelect
          id="cab-onboarding-city"
          label={t('cab.onboarding.location.city')}
          required
          value={form.city}
          onChange={(value) => onPatch({ city: value })}
          options={governorates.map((g) => ({ value: g.id, label: g.name }))}
          placeholder={form.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <TextField
        id="cab-onboarding-address"
        label={t('cab.onboarding.location.address')}
        required
        type="text"
        value={form.address}
        placeholder={t('cab.onboarding.location.addressPlaceholder')}
        valueKind="mixed"
        onChange={(e) => onPatch({ address: e.target.value })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <FormLabel>{t('cab.onboarding.location.timeZone')}</FormLabel>
          <div className={cn(fieldInputClassName, fieldHeightClassName, 'flex items-center bg-neutral-50 text-neutral-600')}>
            {timezoneLabel || t('cab.onboarding.location.timeZonePlaceholder')}
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>{t('cab.onboarding.location.languages')}</FormLabel>
          <MultiSelect
            tags={form.languages}
            options={OPERATING_LANGUAGE_OPTIONS}
            onChange={(tags) => onPatch({ languages: tags })}
            placeholder={t('cab.onboarding.location.languagesPlaceholder')}
            searchable
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>
    </div>
  )
}
