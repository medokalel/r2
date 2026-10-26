import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SA_APPROVAL_MODEL_OPTIONS, allowsSiteSpecificSuppliers } from '@/lib/api/saSetupApi'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { useIpLocation } from '@/hooks/useIpLocation'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import { OPERATING_LANGUAGE_OPTIONS } from '@/lib/api/cabOnboardingApi'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

function toCount(raw: string): number {
  const parsed = Number(raw.replace(/\D/g, ''))
  return Math.min(Math.max(Number.isNaN(parsed) ? 1 : parsed, 1), 999)
}

export function SaLocationsStep({ form, onPatch, onPatchSetup }: SaSetupStepProps) {
  const { t, i18n } = useTranslation()
  const setup = form.saSetup

  const countries = useMemo(
    () =>
      getCountryOptions(i18n.language).map((country) => ({
        value: country.code,
        label: `${country.flag} ${country.name}`,
      })),
    [i18n.language]
  )
  const modelOptions = useMemo(
    () => SA_APPROVAL_MODEL_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])
  const ipLocation = useIpLocation()

  useEffect(() => {
    let cancelled = false
    const load = form.country
      ? fetchGovernorateOptions(form.country)
      : Promise.resolve<GovernorateOption[]>([])
    load.then((options) => {
      if (!cancelled) setGovernorates(options)
    })
    return () => {
      cancelled = true
    }
  }, [form.country])

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

  const siteSpecificAllowed = allowsSiteSpecificSuppliers(setup.approvalModel)

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="sa-setup-country"
          label={t('sa.setup.locations.headOfficeCountry')}
          required
          value={form.country}
          onChange={(country) => onPatch({ country: country as CountryCode, city: '' })}
          options={countries}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="sa-setup-city"
          label={t('sa.setup.locations.city')}
          required
          value={form.city}
          onChange={(city) => onPatch({ city })}
          options={governorates.map((g) => ({ value: g.id, label: g.name }))}
          placeholder={form.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <TextField
          id="sa-setup-procurement-offices"
          label={t('sa.setup.locations.procurementOffices')}
          required
          type="text"
          inputMode="numeric"
          value={String(setup.procurementOffices)}
          onChange={(event) => onPatchSetup({ procurementOffices: toCount(event.target.value) })}
        />
        <TextField
          id="sa-setup-receiving-sites"
          label={t('sa.setup.locations.receivingSites')}
          required
          type="text"
          inputMode="numeric"
          value={String(setup.receivingSites)}
          onChange={(event) => onPatchSetup({ receivingSites: toCount(event.target.value) })}
        />
        <TextField
          id="sa-setup-supplier-countries"
          label={t('sa.setup.locations.supplierCountries')}
          required
          type="text"
          inputMode="numeric"
          value={String(setup.supplierCountries)}
          onChange={(event) => onPatchSetup({ supplierCountries: toCount(event.target.value) })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="sa-setup-approval-model"
          label={t('sa.setup.locations.approvalModel')}
          value={setup.approvalModel}
          onChange={(approvalModel) =>
            onPatchSetup({
              approvalModel,
              centralizedApproval: approvalModel === 'CENTRALIZED',
              // Site-specific suppliers cannot survive a switch to centralized.
              allowSiteSpecificSuppliers: allowsSiteSpecificSuppliers(approvalModel)
                ? setup.allowSiteSpecificSuppliers
                : false,
            })
          }
          options={modelOptions}
          placeholder={t('sa.setup.locations.approvalModelPlaceholder')}
          searchPlaceholder={t('common.search')}
        />

        <div className="space-y-2">
          <FormLabel>{t('sa.setup.locations.languages')}</FormLabel>
          <MultiSelect
            tags={form.languages}
            options={OPERATING_LANGUAGE_OPTIONS}
            onChange={(languages) => onPatch({ languages })}
            searchable
            placeholder={t('sa.setup.locations.languagesPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>

      <SetupSection>
        <SetupToggleRow
          label={t('sa.setup.locations.centralizedApproval')}
          checked={setup.centralizedApproval}
          onChange={(centralizedApproval) => onPatchSetup({ centralizedApproval })}
        />
        <SetupToggleRow
          label={t('sa.setup.locations.allowSiteSpecific')}
          description={
            siteSpecificAllowed ? undefined : t('sa.setup.locations.siteSpecificDisabledHint')
          }
          checked={setup.allowSiteSpecificSuppliers && siteSpecificAllowed}
          onChange={(allowSiteSpecificSuppliers) => {
            if (!siteSpecificAllowed) return
            onPatchSetup({ allowSiteSpecificSuppliers })
          }}
        />
      </SetupSection>
    </div>
  )
}
