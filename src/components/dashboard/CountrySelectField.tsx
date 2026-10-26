import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { getCountryOptions, type CountryCode, type CountryOption } from '@/lib/countries'

interface CountrySelectFieldProps {
  value: CountryCode | null
  onChange: (code: CountryCode) => void
  className?: string
  placeholder?: string
  searchPlaceholder?: string
}

function labelFor(country: CountryOption): string {
  return `${country.flag} ${country.name}`
}

/**
 * Country dropdown with search, flag + localized name, backed by ISO country codes.
 */
export function CountrySelectField({
  value,
  onChange,
  className,
  placeholder,
  searchPlaceholder,
}: CountrySelectFieldProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])

  const options = useMemo(
    () =>
      countries.map((country) => ({
        value: country.code,
        label: labelFor(country),
      })),
    [countries]
  )

  return (
    <SearchableSelect
      value={value ?? ''}
      options={options}
      onChange={(code) => onChange(code as CountryCode)}
      placeholder={placeholder ?? t('common.countryPlaceholder', 'Select country')}
      searchPlaceholder={searchPlaceholder ?? t('common.search', 'Search...')}
      className={className}
    />
  )
}
