import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { notSet } from '@/lib/emptyValue'

/** Locale-aware formatters for the console. Arabic keeps Western digits like the rest of the app. */
export function usePlatformFormat() {
  const { i18n, t } = useTranslation()
  const locale = i18n.language?.startsWith('ar') ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB'

  return useMemo(() => {
    const usdFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
    const usdShort = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    const sarFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const dateFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })
    const dateTimeFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const valid = (iso: string | null | undefined) => (iso && !Number.isNaN(new Date(iso).getTime()) ? new Date(iso) : null)
    return {
      usd: (value: number) => usdFormat.format(value),
      usdShort: (value: number) => usdShort.format(value),
      money: (value: number, currency = 'USD') =>
        currency === 'USD' ? usdFormat.format(value) : `${sarFormat.format(value)} ${currency}`,
      sar: (value: number) => `${sarFormat.format(value)} ${t('platform.common.sar')}`,
      number: (value: number) => value.toLocaleString('en-US'),
      percent: (fraction: number) => `${Math.round(fraction * 1000) / 10}%`,
      date: (iso: string | null | undefined) => {
        const d = valid(iso)
        return d ? dateFormat.format(d) : notSet()
      },
      dateTime: (iso: string | null | undefined) => {
        const d = valid(iso)
        return d ? dateTimeFormat.format(d) : notSet()
      },
      /** Whole days from today (negative = past). */
      daysFromNow: (iso: string | null | undefined) => {
        const d = valid(iso)
        return d ? Math.ceil((d.getTime() - Date.now()) / 86_400_000) : null
      },
    }
  }, [locale, t])
}
