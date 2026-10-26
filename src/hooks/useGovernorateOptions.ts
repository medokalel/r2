import { useEffect, useState } from 'react'
import type { CountryCode } from '@/lib/countries'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'

/**
 * Governorate/city options for the selected country. The list is fetched
 * lazily; it is cleared as soon as the country is cleared and otherwise keeps
 * the last loaded list until the new country's options arrive.
 */
export function useGovernorateOptions(country: CountryCode): GovernorateOption[] {
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])
  const [prevCountry, setPrevCountry] = useState(country)

  // Clear during render when the country is removed (no effect round-trip).
  if (prevCountry !== country) {
    setPrevCountry(country)
    if (!country) setGovernorates([])
  }

  useEffect(() => {
    if (!country) return
    let cancelled = false
    fetchGovernorateOptions(country).then((options) => {
      if (!cancelled) setGovernorates(options)
    })
    return () => {
      cancelled = true
    }
  }, [country])

  return governorates
}
