import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { CountryFlag } from '@/components/ui/CountryFlag'
import {
  DEFAULT_COUNTRY_CODE,
  getCountryOptions,
  type CountryCode,
} from '@/lib/countries'
import { cn } from '@/lib/utils'

export type { CountryCode }

interface CountryCodeSelectProps {
  value: CountryCode
  onChange: (code: CountryCode) => void
  'aria-label': string
  className?: string
  disabled?: boolean
}

interface PhoneInputRowProps extends CountryCodeSelectProps {
  rowClassName?: string
  children: ReactNode
}

// Phone numbers always read left-to-right, so the flag selector + input row
// keeps LTR order even when the page is RTL.
export function PhoneInputRow({
  rowClassName,
  children,
  ...selectProps
}: PhoneInputRowProps) {
  return (
    <div dir="ltr" className={cn('flex', rowClassName)}>
      <CountryCodeSelect {...selectProps} />
      {children}
    </div>
  )
}

export function CountryCodeSelect({
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
  disabled,
}: CountryCodeSelectProps) {
  const { i18n } = useTranslation()
  const countries = useMemo(
    () => getCountryOptions(i18n.language),
    [i18n.language]
  )
  const selected =
    countries.find((country) => country.code === value) ??
    countries.find((country) => country.code === DEFAULT_COUNTRY_CODE) ??
    countries[0]

  // Always rendered left-to-right (see PhoneInputRow): flag, dial code, chevron.
  return (
    <div
      dir="ltr"
      className={cn(
        'relative h-14 shrink-0 rounded-md border border-neutral-100 bg-white transition-colors focus-within:border-focus',
        disabled && 'opacity-60',
        className
      )}
    >
      <select
        value={selected.code}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as CountryCode)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name} ({country.dial})
          </option>
        ))}
      </select>
      <span className="pointer-events-none flex h-full items-center gap-2 ps-3 pe-2.5" aria-hidden>
        <CountryFlag code={selected.code} className="h-4 w-6 shrink-0" />
        <span className="text-body leading-[1.6] text-text-primary tabular-nums">{selected.dial}</span>
        <SelectDropdownIcon className="shrink-0 text-neutral-700" />
      </span>
    </div>
  )
}
