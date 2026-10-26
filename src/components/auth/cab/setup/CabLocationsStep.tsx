import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  SetupRecordCard,
  SetupSection,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { LOCATION_TYPE_OPTIONS, CAB_ACTIVITY_OPTIONS } from '@/lib/api/cabSetupApi'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS } from '@/lib/api/cabOnboardingApi'
import { createLocationRecord, type CabLocationRecord } from '@/lib/cabSetupForm'
import { isValidFieldKind } from '@/lib/validators'
import { useIpLocation } from '@/hooks/useIpLocation'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

/** Country-dependent city picker reused by the head office and each branch. */
function useGovernorates(country: CountryCode | '') {
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])

  useEffect(() => {
    let cancelled = false
    // Both branches resolve asynchronously so the effect never sets state synchronously.
    const load = country ? fetchGovernorateOptions(country) : Promise.resolve<GovernorateOption[]>([])
    load.then((options) => {
      if (!cancelled) setGovernorates(options)
    })
    return () => {
      cancelled = true
    }
  }, [country])

  return governorates
}

function LocationRow({
  index,
  location,
  countries,
  onChange,
  onRemove,
  duplicate,
}: {
  index: number
  location: CabLocationRecord
  duplicate: boolean
  countries: { value: string; label: string }[]
  onChange: (fields: Partial<CabLocationRecord>) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const governorates = useGovernorates(location.country)

  const typeOptions = useMemo(
    () => LOCATION_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const activityOptions = useMemo(
    () => CAB_ACTIVITY_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )

  return (
    <SetupRecordCard
      title={t('cab.setup.locations.branchTitle', { index: index + 1 })}
      onRemove={onRemove}
      removeLabel={t('common.delete')}
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id={`cab-setup-location-name-${location.id}`}
          label={t('cab.setup.locations.locationName')}
          required
          type="text"
          value={location.name}
          placeholder={t('cab.setup.locations.locationNamePlaceholder')}
          valueKind="text"
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <SearchableSelect
          id={`cab-setup-location-type-${location.id}`}
          label={t('cab.setup.locations.locationType')}
          required
          value={location.type}
          onChange={(type) => onChange({ type })}
          options={typeOptions}
          placeholder={t('cab.setup.locations.locationTypePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id={`cab-setup-location-country-${location.id}`}
          label={t('cab.setup.locations.country')}
          value={location.country}
          onChange={(country) => onChange({ country: country as CountryCode, city: '' })}
          options={countries}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id={`cab-setup-location-city-${location.id}`}
          label={t('cab.setup.locations.city')}
          value={location.city}
          onChange={(city) => onChange({ city })}
          options={governorates.map((governorate) => ({ value: governorate.id, label: governorate.name }))}
          placeholder={location.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <TextField
        id={`cab-setup-location-address-${location.id}`}
        label={t('cab.setup.locations.address')}
        required
        type="text"
        value={location.address}
        placeholder={t('cab.setup.locations.addressPlaceholder')}
        valueKind="mixed"
        onChange={(event) => onChange({ address: event.target.value })}
        error={duplicate ? t('validation.duplicateLocation') : undefined}
      />

      <div className="space-y-2">
        <FormLabel>{t('cab.setup.locations.locationActivities')}</FormLabel>
        <MultiSelect
          tags={location.activities}
          options={activityOptions}
          onChange={(activities) => onChange({ activities })}
          layout="stacked"
          searchable
          placeholder={t('cab.setup.locations.locationActivitiesPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>
    </SetupRecordCard>
  )
}

export function CabLocationsStep({ form, onPatch, onPatchSetup }: CabSetupStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(
    () =>
      getCountryOptions(i18n.language).map((country) => ({
        value: country.code,
        label: `${country.flag} ${country.name}`,
      })),
    [i18n.language]
  )
  const governorates = useGovernorates(form.country)
  const ipLocation = useIpLocation()
  // Mirrors isLocationsStepComplete: the same name + address may not repeat
  const duplicateLocationIds = new Set<string>()
  const seenLocations = new Set<string>()
  for (const location of form.cabSetup.locations) {
    if (!location.name.trim() || !location.address.trim()) continue
    const key = `${location.name.trim().toLowerCase()}|${location.address.trim().toLowerCase()}`
    if (seenLocations.has(key)) duplicateLocationIds.add(location.id)
    seenLocations.add(key)
  }

  // Pre-fill the head office country from the visitor's IP once it resolves,
  // but only if the user hasn't already picked one.
  useEffect(() => {
    if (!ipLocation || form.country) return
    const detected = ipLocation.countryCode as CountryCode
    if (!countries.some((country) => country.value === detected)) return
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

  // The head office time zone follows the selected country unless already set.
  useEffect(() => {
    if (!form.country) return
    const derived = getTimezoneForCountry(form.country)
    if (derived && form.cabSetup.timeZone !== derived) {
      onPatchSetup({ timeZone: derived })
    }
    // Deliberately keyed on country only — re-deriving on every keystroke would
    // fight a user who picked a different zone for the same country.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country])

  const updateLocation = (id: string, fields: Partial<CabLocationRecord>) => {
    onPatchSetup({
      locations: form.cabSetup.locations.map((location) =>
        location.id === id ? { ...location, ...fields } : location
      ),
    })
  }

  return (
    <div className="w-full space-y-6">

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="cab-setup-country"
          label={t('cab.setup.locations.headOfficeCountry')}
          required
          value={form.country}
          onChange={(country) => onPatch({ country: country as CountryCode, city: '' })}
          options={countries}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="cab-setup-city"
          label={t('cab.setup.locations.city')}
          required
          value={form.city}
          onChange={(city) => onPatch({ city })}
          options={governorates.map((governorate) => ({ value: governorate.id, label: governorate.name }))}
          placeholder={form.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <TextField
        id="cab-setup-address"
        label={t('cab.setup.locations.mainOfficeAddress')}
        required
        type="text"
        value={form.address}
        placeholder={t('cab.setup.locations.addressPlaceholder')}
        valueKind="mixed"
        onChange={(event) => onPatch({ address: event.target.value })}
        error={
          form.address && !isValidFieldKind(form.address, 'mixed')
            ? t('validation.mixedOnly')
            : undefined
        }
      />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="cab-setup-timezone"
          label={t('cab.setup.locations.timeZone')}
          required
          type="text"
          value={form.cabSetup.timeZone}
          placeholder={t('cab.setup.locations.timeZonePlaceholder')}
          valueKind="mixed"
          onChange={(event) => onPatchSetup({ timeZone: event.target.value })}
        />

        <div id="cab-setup-languages" className="space-y-2">
          <FormLabel required>{t('cab.setup.locations.languages')}</FormLabel>
          <MultiSelect
            tags={form.languages}
            options={OPERATING_LANGUAGE_OPTIONS}
            onChange={(languages) => onPatch({ languages })}
            searchable
            placeholder={t('cab.setup.locations.languagesPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>

      <SetupSection>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={form.cabSetup.hasAdditionalLocations}
            onChange={() => {
              const next = !form.cabSetup.hasAdditionalLocations
              onPatchSetup({
                hasAdditionalLocations: next,
                // Opening the drawer with nothing in it starts one blank branch.
                locations: next && form.cabSetup.locations.length === 0
                  ? [createLocationRecord()]
                  : form.cabSetup.locations,
              })
            }}
            aria-label={t('cab.setup.locations.hasAdditional')}
          />
          <span className="text-body-sm text-[var(--cab-ink)]">
            {t('cab.setup.locations.hasAdditional')}
          </span>
        </label>

        {form.cabSetup.hasAdditionalLocations && (
          <div className="mt-4 space-y-4">
            {form.cabSetup.locations.map((location, index) => (
              <LocationRow
                key={location.id}
                index={index}
                duplicate={duplicateLocationIds.has(location.id)}
                location={location}
                countries={countries}
                onChange={(fields) => updateLocation(location.id, fields)}
                onRemove={() =>
                  onPatchSetup({
                    locations: form.cabSetup.locations.filter((item) => item.id !== location.id),
                  })
                }
              />
            ))}

            <button
              type="button"
              onClick={() =>
                onPatchSetup({ locations: [...form.cabSetup.locations, createLocationRecord()] })
              }
              className="text-caption font-bold text-[var(--cab-primary)] hover:underline"
            >
              {t('cab.setup.locations.addLocation')}
            </button>
          </div>
        )}
      </SetupSection>
    </div>
  )
}
