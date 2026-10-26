import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { AppIcon, LocationAddIcon, MapPinIcon } from '@/components/icons'
import {
  LocationPicker,
  type GeocodeResult,
  type LatLng,
} from '@/components/maps/LocationPicker'
import { profileCardClassName } from './constants'
import { CardHeader } from './Primitives'

interface MapCardProps {
  location: LatLng | null
  onLocationChange: (location: LatLng | null) => void
  onGeocodeResult?: (result: GeocodeResult) => void
}

export function MapCard({ location, onLocationChange, onGeocodeResult }: MapCardProps) {
  const { t } = useTranslation()
  const [address, setAddress] = useState('')

  return (
    <div className={profileCardClassName}>
      <CardHeader title={t('companyProfile.mapCard.title')} />
      <LocationPicker
        value={location}
        onChange={onLocationChange}
        onAddressChange={setAddress}
        onGeocodeResult={onGeocodeResult}
        className="h-[380px]"
      />
      {address && (
        <div className="flex items-start gap-2 rounded-md bg-primary-25 px-3 py-2">
          <AppIcon icon={MapPinIcon} size={16} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-body-sm leading-[1.6] text-neutral-800">{address}</p>
        </div>
      )}
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        icon={<AppIcon icon={LocationAddIcon} size={20} />}
        iconPosition="start"
        onClick={() => { onLocationChange(null); setAddress('') }}
      >
        {location ? t('companyProfile.mapCard.changeLocation') : t('companyProfile.mapCard.setLocation')}
      </Button>
    </div>
  )
}
