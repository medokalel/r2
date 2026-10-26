import type { CountryCode } from '@/lib/countries'

export interface GovernorateOption {
  id: string
  name: string
  isoCode: string
}

export async function fetchGovernorateOptions(
  countryCode: CountryCode
): Promise<GovernorateOption[]> {
  const { State } = await import('country-state-city')
  const states = State.getStatesOfCountry(countryCode) ?? []

  return states
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((state) => ({
      id: state.isoCode,
      name: state.name,
      isoCode: state.isoCode,
    }))
}
