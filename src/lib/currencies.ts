/**
 * World currencies (ISO 4217) for pickers: every code the browser knows
 * (Intl.supportedValuesOf('currency')), with a fallback list for older browsers, the
 * conventional symbol and the localized name (Intl.DisplayNames) in the UI language.
 *
 * Option label format: "<symbol> <CODE> · <name>", e.g. "$ USD · US dollar".
 */

/** Used when the browser cannot list currencies. Covers every active ISO 4217 code. */
const FALLBACK_CODES = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF',
  'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC',
  'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS',
  'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD',
  'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL',
  'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD',
  'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD',
  'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SYP', 'SZL',
  'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES', 'VND',
  'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWL',
]

/** Symbols the browser does not give in narrow form, as used locally. */
const SYMBOL_OVERRIDES: Record<string, string> = {
  SAR: '﷼',
  EGP: 'E£',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  JOD: 'د.أ',
  IQD: 'ع.د',
  LYD: 'ل.د',
  TND: 'د.ت',
  DZD: 'د.ج',
  MAD: 'د.م',
  YER: '﷼',
  CHF: 'CHF',
}

/** The currencies shown first, in this order (the CAB's home markets). */
export const PRIORITY_CURRENCIES = ['SAR', 'USD', 'EUR', 'EGP', 'AED', 'GBP']

let cachedCodes: string[] | null = null

/** Every ISO 4217 currency code, priority currencies first, then A to Z. */
export function listCurrencyCodes(): string[] {
  if (cachedCodes) return cachedCodes
  let codes: string[]
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    codes = intl.supportedValuesOf?.('currency') ?? []
  } catch {
    codes = []
  }
  if (codes.length < 100) codes = FALLBACK_CODES
  const rest = codes.filter((code) => !PRIORITY_CURRENCIES.includes(code)).sort()
  cachedCodes = [...PRIORITY_CURRENCIES, ...rest]
  return cachedCodes
}

/** Conventional symbol, or '' when the code itself is the symbol. */
export function currencySymbol(code: string): string {
  if (SYMBOL_OVERRIDES[code]) return SYMBOL_OVERRIDES[code] === code ? '' : SYMBOL_OVERRIDES[code]
  try {
    const part = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((item) => item.type === 'currency')?.value
    return part && part !== code ? part : ''
  } catch {
    return ''
  }
}

/** Localized currency name ("Saudi riyal", "ريال سعودي"). */
export function currencyName(code: string, language: string): string {
  try {
    const names = new Intl.DisplayNames([language.startsWith('ar') ? 'ar' : 'en'], { type: 'currency' })
    return names.of(code) ?? code
  } catch {
    return code
  }
}

/** "$ USD · US dollar" (symbol omitted when there is none). */
export function currencyLabel(code: string, language: string): string {
  const symbol = currencySymbol(code)
  return `${symbol ? `${symbol} ` : ''}${code} · ${currencyName(code, language)}`
}

/** Options for SearchableSelect: searchable by code, symbol and the name in both languages. */
export function currencyOptions(language: string, codes: string[] = listCurrencyCodes()) {
  return codes.map((code) => ({
    value: code,
    label: currencyLabel(code, language),
    keywords: `${code} ${currencyName(code, 'en')} ${currencyName(code, 'ar')}`,
  }))
}
