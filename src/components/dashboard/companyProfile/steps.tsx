import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GeocodeResult, LatLng } from '@/components/maps/LocationPicker'
import { AddBranchForm } from './AddBranchForm'
import { AddressCard } from './AddressCard'
import { EditBranchModal } from './EditBranchModal'
import { BasicDataCard } from './BasicDataCard'
import { BranchesListCard } from './BranchesListCard'
import { CompanySummaryBanner } from './CompanySummaryBanner'
import { FileOperationsCard } from './FileOperationsCard'
import { MapCard } from './MapCard'
import {
  ConnectionNotesCard,
  NationalAddressFormCard,
  NationalAddressToggleCard,
} from './NationalAddressSection'
import { OfficialDocsCard } from './OfficialDocsCard'
import { CompletedStepRow } from './Primitives'
import { ProfileHeaderCard } from './ProfileHeaderCard'
import { useProfileForm } from './ProfileFormContext'
import { profileCardClassName } from './constants'
import { cn } from '@/lib/utils'
import { addressFieldsFromGeocode, googleMapsUrlFor, parseLatLngFromGoogleMapsUrl } from './mappers'

export function BasicDataStep() {
  // Company location preview — independent from the official address on step 2
  const [companyLocation, setCompanyLocation] = useState<LatLng | null>(null)
  return (
    <>
      <ProfileHeaderCard />
      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="w-full lg:w-[42%] lg:shrink-0">
          <MapCard location={companyLocation} onLocationChange={setCompanyLocation} />
        </div>
        <div className="min-w-0 flex-1">
          <BasicDataCard />
        </div>
      </div>
    </>
  )
}

export function AddressStep() {
  const { t } = useTranslation()
  const { form, update } = useProfileForm()
  const hasNationalAddress = form.nationalAddress.hasNationalAddress ? 'yes' : 'no'
  const setHasNationalAddress = (value: 'yes' | 'no') =>
    update('nationalAddress', { ...form.nationalAddress, hasNationalAddress: value === 'yes' })
  // Only fill the form from geocoding after the user picks on the map,
  // never when the saved location is restored on load
  const fillFormFromGeocodeRef = useRef(false)

  const handleLocationChange = (location: LatLng | null) => {
    fillFormFromGeocodeRef.current = location != null
    update('location', location)
    update('googleMapUrl', location ? googleMapsUrlFor(location) : '')
  }

  const handleGeocodeResult = (result: GeocodeResult) => {
    if (!fillFormFromGeocodeRef.current) return
    fillFormFromGeocodeRef.current = false
    const fields = addressFieldsFromGeocode(result)
    if (fields.country) update('country', fields.country)
    if (fields.city) update('city', fields.city)
    if (fields.district) update('district', fields.district)
    if (fields.street) update('street', fields.street)
    if (fields.buildingNumber) update('buildingNumber', fields.buildingNumber)
    if (fields.postalCode) update('postalCode', fields.postalCode)
  }

  // Pasting a Google Maps link: drop the pin on the map and, once it
  // geocodes, autofill country/city/etc — same path as picking on the map.
  const handleGoogleMapUrlChange = (value: string) => {
    update('googleMapUrl', value)
    const location = parseLatLngFromGoogleMapsUrl(value)
    if (location && (form.location?.lat !== location.lat || form.location?.lng !== location.lng)) {
      fillFormFromGeocodeRef.current = true
      update('location', location)
    }
  }

  return (
    <>
      <CompletedStepRow label={t('companyProfile.completedSteps.basicData')} />
      <CompanySummaryBanner incompleteKey="incompleteAddress" />
      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="w-full lg:w-[42%] lg:shrink-0">
          <MapCard
            location={form.location}
            onLocationChange={handleLocationChange}
            onGeocodeResult={handleGeocodeResult}
          />
        </div>
        <div className="min-w-0 flex-1">
          <AddressCard onGoogleMapUrlChange={handleGoogleMapUrlChange} />
        </div>
      </div>
      <NationalAddressToggleCard value={hasNationalAddress} onChange={setHasNationalAddress} />
      {hasNationalAddress === 'yes' && <NationalAddressFormCard />}
      <ConnectionNotesCard />
    </>
  )
}

export function BranchesStep() {
  const { t } = useTranslation()
  const { branches } = useProfileForm()
  const [hasBranches, setHasBranches] = useState<'yes' | 'no'>(
    branches.length > 0 ? 'yes' : 'no'
  )

  return (
    <>
      <CompletedStepRow label={t('companyProfile.completedSteps.basicData')} />
      <CompletedStepRow label={t('companyProfile.completedSteps.address')} />
      <CompanySummaryBanner />

      <div className={profileCardClassName}>
        <h3 className="text-body-lg font-semibold text-primary">
          {t('companyProfile.branchesCard.hasBranchesTitle', 'Does the client have branches?')}
        </h3>
        <div className="flex items-center gap-4">
          {(['yes', 'no'] as const).map((option) => {
            const active = hasBranches === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => setHasBranches(option)}
                className={cn(
                  'flex h-[52px] items-center gap-3 rounded-full px-6 py-3 transition-colors',
                  active
                    ? 'border border-primary bg-primary-25'
                    : 'border border-neutral-50 bg-neutral-25 hover:border-primary/40'
                )}
              >
                <span
                  className={cn(
                    'text-body leading-[1.6]',
                    active ? 'text-primary font-medium' : 'text-neutral-700'
                  )}
                >
                  {option === 'yes' ? t('common.yes', 'Yes') : t('common.no', 'No')}
                </span>
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    active ? 'border-primary bg-primary' : 'border-neutral-100 bg-white'
                  )}
                >
                  {active && <span className="size-2 rounded-full bg-white" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {hasBranches === 'yes' && (
        <div className="flex flex-col items-start gap-5 lg:flex-row">
          <div className="min-w-0 flex-1">
            <AddBranchForm />
          </div>
          <div className="w-full lg:w-[42%] lg:shrink-0">
            <div className="flex flex-col gap-5">
              <BranchesListCard />
              <FileOperationsCard />
            </div>
          </div>
        </div>
      )}
      <EditBranchModal />
    </>
  )
}

export function OfficialDocsStep() {
  const { t } = useTranslation()
  return (
    <>
      <CompletedStepRow label={t('companyProfile.completedSteps.basicData')} />
      <CompletedStepRow label={t('companyProfile.completedSteps.address')} />
      <CompletedStepRow label={t('companyProfile.completedSteps.branches')} />
      <CompanySummaryBanner incompleteKey="incompleteDocs" />
      <OfficialDocsCard />
    </>
  )
}
