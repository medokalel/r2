/**
 * Shared date formatting for the UI language.
 *
 * - Arabic uses Arabic month names with Latin digits (the Saudi business norm) and the Gregorian calendar.
 * - English uses the en-GB short form the API already sends ("07 Oct 2026").
 *
 * Some endpoints return ready-to-show English dates ("07 Oct 2026", "07 Oct 2026, 13:00").
 * `localizeDisplayDates` turns exactly those values into the UI language; the API client runs it on
 * every response, and `delocalizeDisplayDates` turns them back before a body is sent, so the
 * server keeps receiving the format it produced. ISO values are left alone; format them with
 * `formatDate` / `formatDateTime`.
 */
import i18next from 'i18next'
import { notSet } from '@/lib/emptyValue'

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Current UI language ("ar" | "en"), read from the shared i18next instance. */
export function uiLanguage(): 'ar' | 'en' {
  return (i18next.language ?? '').startsWith('ar') ? 'ar' : 'en'
}

/** Intl locale for a UI language: Arabic months with Latin digits, Gregorian calendar. */
export function uiLocale(language: string = uiLanguage()): string {
  return language.startsWith('ar') ? 'ar-u-nu-latn-ca-gregory' : 'en-GB'
}

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(locale: string, kind: 'date' | 'time', timeZone?: string): Intl.DateTimeFormat {
  const key = `${locale}|${kind}|${timeZone ?? ''}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(
      locale,
      kind === 'date'
        ? { day: '2-digit', month: 'short', year: 'numeric', timeZone }
        : { hour: '2-digit', minute: '2-digit', hour12: false, timeZone },
    )
    formatters.set(key, f)
  }
  return f
}

let arMonths: string[] | null = null
/** Arabic month names exactly as Intl prints them in `uiLocale('ar')`. */
function arabicMonths(): string[] {
  if (!arMonths) {
    const f = new Intl.DateTimeFormat(uiLocale('ar'), { month: 'short', timeZone: 'UTC' })
    arMonths = EN_MONTHS.map((_, m) => f.format(new Date(Date.UTC(2026, m, 15))))
  }
  return arMonths
}

const EN_DISPLAY = new RegExp(`^(\\d{1,2}) (${EN_MONTHS.join('|')}) (\\d{4})(?:,? (\\d{2}):(\\d{2}))?$`)
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
const ISO_FULL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

function arDisplay(): RegExp {
  return new RegExp(`^(\\d{1,2}) (${arabicMonths().join('|')}) (\\d{4})(?:[،,]? (\\d{2}):(\\d{2}))?$`)
}

interface DisplayParts { day: number; month: number; year: number; hour?: number; minute?: number }

function partsOf(text: string): DisplayParts | null {
  const en = EN_DISPLAY.exec(text)
  if (en) {
    return { day: Number(en[1]), month: EN_MONTHS.indexOf(en[2]), year: Number(en[3]), hour: en[4] ? Number(en[4]) : undefined, minute: en[5] ? Number(en[5]) : undefined }
  }
  if (!/[؀-ۿ]/.test(text)) return null
  const ar = arDisplay().exec(text)
  if (ar) {
    return { day: Number(ar[1]), month: arabicMonths().indexOf(ar[2]), year: Number(ar[3]), hour: ar[4] ? Number(ar[4]) : undefined, minute: ar[5] ? Number(ar[5]) : undefined }
  }
  return null
}

function render(parts: DisplayParts, language: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const month = language.startsWith('ar') ? arabicMonths()[parts.month] : EN_MONTHS[parts.month]
  const date = `${pad(parts.day)} ${month} ${parts.year}`
  if (parts.hour === undefined) return date
  return `${date}${language.startsWith('ar') ? '،' : ','} ${pad(parts.hour)}:${pad(parts.minute ?? 0)}`
}

/**
 * Reads ISO values ("2026-10-07", "2026-10-07T13:00:00Z") and the display forms in either
 * language ("07 Oct 2026", "07 أكتوبر 2026, 13:00"). Display forms are read as UTC wall time.
 */
export function parseDisplayDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const text = value.trim()
  if (ISO_DAY.test(text)) return new Date(`${text}T00:00:00Z`)
  if (ISO_FULL.test(text)) {
    const d = new Date(text)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const parts = partsOf(text)
  if (parts) return new Date(Date.UTC(parts.year, parts.month, parts.day, parts.hour ?? 0, parts.minute ?? 0))
  const fallback = new Date(text)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

/** "07 Oct 2026" / "07 أكتوبر 2026" for an ISO value, a Date or an English display date; "—" when empty. */
export function formatDate(value: string | Date | null | undefined, language: string = uiLanguage()): string {
  if (!value) return notSet()
  if (typeof value === 'string') {
    const parts = partsOf(value.trim())
    if (parts) return render({ ...parts, hour: undefined }, language)
    // A calendar day has no time zone: keep it on the same day everywhere.
    if (ISO_DAY.test(value.trim())) return formatter(uiLocale(language), 'date', 'UTC').format(new Date(`${value.trim()}T00:00:00Z`))
  }
  const date = parseDisplayDate(value)
  return date ? formatter(uiLocale(language), 'date').format(date) : String(value)
}

/** "07 Oct 2026, 13:00" / "07 أكتوبر 2026، 13:00"; "—" when empty. */
export function formatDateTime(value: string | Date | null | undefined, language: string = uiLanguage()): string {
  if (!value) return notSet()
  if (typeof value === 'string') {
    const parts = partsOf(value.trim())
    if (parts) return render(parts, language)
  }
  const date = parseDisplayDate(value)
  if (!date) return String(value)
  const locale = uiLocale(language)
  return `${formatter(locale, 'date').format(date)}${language.startsWith('ar') ? '،' : ','} ${formatter(locale, 'time').format(date)}`
}

/** Rewrites one display date into `language`, or returns null when `text` is not a display date. */
export function localizeDisplayDate(text: string, language: string = uiLanguage()): string | null {
  const parts = partsOf(text)
  return parts ? render(parts, language) : null
}

function walk(value: unknown, convert: (text: string) => string | null): unknown {
  if (typeof value === 'string') {
    // Display dates are short; skip long text early.
    if (value.length > 24 || !/^\d/.test(value)) return value
    return convert(value) ?? value
  }
  if (Array.isArray(value)) {
    let changed = false
    const out = value.map((item) => {
      const next = walk(item, convert)
      if (next !== item) changed = true
      return next
    })
    return changed ? out : value
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    let changed = false
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      const next = walk(item, convert)
      if (next !== item) changed = true
      out[key] = next
    }
    return changed ? out : value
  }
  return value
}

/** Turns every English display date in an API payload into the UI language (no-op in English). */
export function localizeDisplayDates<T>(data: T, language: string = uiLanguage()): T {
  if (!language.startsWith('ar')) return data
  return walk(data, (text) => (EN_DISPLAY.test(text) ? localizeDisplayDate(text, language) : null)) as T
}

/** Turns Arabic display dates in a JSON body back into the English form the API produced. */
export function delocalizeDisplayDates(body: string): string {
  if (!/[؀-ۿ]/.test(body)) return body
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return body
  }
  const months = arabicMonths()
  if (!months.some((m) => body.includes(m))) return body
  const next = walk(parsed, (text) => (EN_DISPLAY.test(text) ? null : partsOf(text) ? localizeDisplayDate(text, 'en') : null))
  return next === parsed ? body : JSON.stringify(next)
}
