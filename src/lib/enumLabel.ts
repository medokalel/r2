type Translate = (key: string, options?: { defaultValue?: string }) => string

/** Normalizes a display enum ("Partially paid", "IN_PROGRESS") to its i18n slug ("partially_paid", "in_progress"). */
export function enumSlug(value: string): string {
  return value
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

/**
 * Translates a status/type value that arrives as English text from data
 * (mock or API) via the shared `enum.*` namespace. Unknown values fall back
 * to the original text so nothing disappears.
 */
export function enumLabel(t: Translate, value: string | null | undefined): string {
  if (!value) return ''
  return t(`enum.${enumSlug(value)}`, { defaultValue: value })
}
