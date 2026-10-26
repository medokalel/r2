import { useEffect, useCallback, useState } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMapsLibrary,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps'
import { cn } from '@/lib/utils'
import { useIpLocation } from '@/hooks/useIpLocation'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

export interface LatLng {
  lat: number
  lng: number
}

export interface GeocodeAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface GeocodeResult {
  formatted_address: string
  address_components: GeocodeAddressComponent[]
}

const FALLBACK_CENTER: LatLng = { lat: 26, lng: 30 }
const FALLBACK_ZOOM = 5

interface GeocoderLayerProps {
  value: LatLng | null | undefined
  onAddress?: (address: string) => void
  onResult?: (result: GeocodeResult) => void
}

function GeocoderLayer({ value, onAddress, onResult }: GeocoderLayerProps) {
  const geocodingLib = useMapsLibrary('geocoding')

  const geocode = useCallback(
    (loc: LatLng) => {
      if (!geocodingLib) return
      const geocoder = new geocodingLib.Geocoder()
      geocoder.geocode({ location: loc }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          onAddress?.(results[0].formatted_address)
          onResult?.(results[0])
        }
      })
    },
    [geocodingLib, onAddress, onResult]
  )

  useEffect(() => {
    if (value) geocode(value)
    else onAddress?.('')
  }, [value, geocode, onAddress])

  return null
}

interface MapInit {
  center: LatLng
  zoom: number
}

interface LocationPickerProps {
  value?: LatLng | null
  onChange?: (loc: LatLng) => void
  onAddressChange?: (address: string) => void
  onGeocodeResult?: (result: GeocodeResult) => void
  className?: string
  readOnly?: boolean
}

export function LocationPicker({
  value,
  onChange,
  onAddressChange,
  onGeocodeResult,
  className,
  readOnly = false,
}: LocationPickerProps) {
  const ipLocation = useIpLocation()
  const [timedOut, setTimedOut] = useState(false)

  // Fallback: if IP fetch fails after a timeout, show the world view
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const mapInit: MapInit | null = ipLocation
    ? { center: { lat: ipLocation.lat, lng: ipLocation.lng }, zoom: 11 }
    : timedOut
      ? { center: FALLBACK_CENTER, zoom: FALLBACK_ZOOM }
      : null

  return (
    <APIProvider apiKey={API_KEY}>
      <div className={cn('overflow-hidden rounded-md', className)}>
        {!mapInit ? (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          </div>
        ) : (
          <Map
            defaultCenter={mapInit.center}
            defaultZoom={mapInit.zoom}
            gestureHandling={readOnly ? 'none' : 'greedy'}
            disableDefaultUI={readOnly}
            mapId="icasco-map"
            onClick={
              !readOnly && onChange
                ? (e: MapMouseEvent) => {
                    if (e.detail.latLng)
                      onChange({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng })
                  }
                : undefined
            }
            style={{ width: '100%', height: '100%' }}
          >
            {value && <AdvancedMarker position={value} />}
          </Map>
        )}
      </div>
      {(onAddressChange || onGeocodeResult) && (
        <GeocoderLayer value={value} onAddress={onAddressChange} onResult={onGeocodeResult} />
      )}
    </APIProvider>
  )
}
