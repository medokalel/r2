import { useEffect, useState } from 'react'

export interface IpLocation {
  countryCode: string
  city: string | null
  lat: number
  lng: number
}

const FETCH_TIMEOUT_MS = 5000

// Module-level cache — fetch runs once for the whole app lifetime
let cached: Promise<IpLocation | null> | null = null

function fetchIpLocation(): Promise<IpLocation | null> {
  if (!cached) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    cached = fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) =>
        d.latitude && d.longitude && d.country_code
          ? {
              countryCode: String(d.country_code).toUpperCase(),
              city: typeof d.city === 'string' && d.city ? d.city : null,
              lat: d.latitude as number,
              lng: d.longitude as number,
            }
          : null
      )
      .catch((error) => {
        console.error('[useIpLocation] Failed to fetch IP location:', error)
        return null
      })
      .finally(() => clearTimeout(timeout))
  }
  return cached
}

export function useIpLocation(): IpLocation | null {
  const [location, setLocation] = useState<IpLocation | null>(null)

  useEffect(() => {
    fetchIpLocation().then(setLocation)
  }, [])

  return location
}