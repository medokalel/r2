import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { fieldHeightClassName, fieldInputClassName } from '@/components/ui/fieldStyles'
import { useIpLocation } from '@/hooks/useIpLocation'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { useGovernorateOptions } from '@/hooks/useGovernorateOptions'
import { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS } from '@/lib/api/abOnboardingApi'
import type { AbOnboardingForm } from '@/lib/abOnboardingForm'
import { cn } from '@/lib/utils'

interface AbLocationStepProps {
  form: AbOnboardingForm
  onPatch: (f: Partial<AbOnboardingForm>) => void
}

export function AbLocationStep({ form, onPatch }: AbLocationStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const governorates = useGovernorateOptions(form.country)
  const ipLocation = useIpLocation()

  // Pre-fill the office country from the visitor's IP once it resolves,
  // but only if the user hasn't already picked one.
  useEffect(() => {
    if (!ipLocation || form.country) return
    const detected = ipLocation.countryCode as CountryCode
    if (!countries.some((country) => country.code === detected)) return
    onPatch({ country: detected })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipLocation, countries])

  // Once the IP-detected country's governorate list loads, try to match the
  // IP's city by name — best effort only, never overrides a manual pick.
  useEffect(() => {
    if (!ipLocation?.city || form.city || governorates.length === 0) return
    if (form.country !== ipLocation.countryCode) return
    const match = governorates.find(
      (governorate) => governorate.name.toLowerCase() === ipLocation.city?.toLowerCase()
    )
    if (match) onPatch({ city: match.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipLocation, governorates])

  const timezoneLabel = form.country
    ? `${getTimezoneForCountry(form.country)} (${t('ab.onboarding.location.autoDetected')})`
    : ''

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="mb-2 text-body-2-medium text-primary">
          {t('ab.onboarding.location.hint', { name: form.legalEntityName || form.tradingName })}
        </p>
        <h1 className="text-page-title text-text-primary">{t('ab.onboarding.location.title')}</h1>
        <p className="mt-2 text-body-2 text-neutral-600">{t('ab.onboarding.location.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SearchableSelect
          id="ab-onboarding-country"
          label={t('ab.onboarding.location.country')}
          required
          value={form.country}
          onChange={(value) => onPatch({ country: value as CountryCode, city: '' })}
          options={countries.map((country) => ({ value: country.code, label: `${country.flag} ${country.name}` }))}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />

        <SearchableSelect
          id="ab-onboarding-city"
          label={t('ab.onboarding.location.city')}
          required
          value={form.city}
          onChange={(value) => onPatch({ city: value })}
          options={governorates.map((g) => ({ value: g.id, label: g.name }))}
          placeholder={form.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <TextField
        id="ab-onboarding-address"
        label={t('ab.onboarding.location.address')}
        required
        type="text"
        value={form.address}
        placeholder={t('ab.onboarding.location.addressPlaceholder')}
        onChange={(e) => onPatch({ address: e.target.value })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <FormLabel>{t('ab.onboarding.location.timeZone')}</FormLabel>
          <div className={cn(fieldInputClassName, fieldHeightClassName, 'flex items-center bg-neutral-50 text-neutral-600')}>
            {timezoneLabel || t('ab.onboarding.location.timeZonePlaceholder')}
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>{t('ab.onboarding.location.languages')}</FormLabel>
          <MultiSelect
            tags={form.languages}
            options={OPERATING_LANGUAGE_OPTIONS}
            onChange={(tags) => onPatch({ languages: tags })}
            placeholder={t('ab.onboarding.location.languagesPlaceholder')}
            searchable
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>
    </div>
  )
}
