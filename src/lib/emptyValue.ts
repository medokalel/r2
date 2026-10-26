/**
 * Shared display text for missing values and ranges, so no screen falls back to a dash:
 * an empty value reads "Not set" (غير محدد) and a range reads "A to B" (A إلى B).
 */
import i18n from '@/i18n'

/** Localized "Not set" for an empty value. Render it muted where it sits in a table or card. */
export function notSet(): string {
  return i18n.t('common.notSet')
}

/** Localized "{{from}} to {{to}}" for date, time and number ranges. */
export function rangeText(from: string | number, to: string | number): string {
  return i18n.t('common.range', { from, to })
}

/**
 * Splits a finding description into its clause reference and text: "Clause 7.2: Records…".
 * Older records separate the two with a dash, which is accepted here but never displayed.
 */
export function splitClause(description: string): { clause: string; text: string } {
  const dashes = `${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}`
  const pattern = new RegExp(`^((?:clause|\u0627\u0644\u0628\u0646\u062f)?\\s*[\\d.]+[^:${dashes}]*?)(?::\\s|\\s[${dashes}]\\s)([\\s\\S]+)$`, 'i')
  const match = description.match(pattern)
  return match ? { clause: match[1].trim(), text: match[2].trim() } : { clause: '', text: description }
}
