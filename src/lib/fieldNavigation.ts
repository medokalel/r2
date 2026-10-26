/**
 * One pattern for "errors you can click": every validation summary lists FieldIssue items; an
 * item either focuses a field on the current page (switching the wizard page, step or tab
 * first) or opens another page that carries `?returnTo=` so the user can come back and continue.
 *
 *   focusField('cab-setup-legal-name')                       // scroll + focus + highlight
 *   cabProfileFixLink('schemes', 'cab-setup-schemes', here)  // "/cab/company-profile?page=schemes&field=…&returnTo=…"
 *
 * Components that keep fields behind tabs listen for REVEAL_FIELD_EVENT and open the tab that
 * holds the field (see CabAccreditationRecordsStep).
 */
import type { TFunction } from 'i18next'
import { ROUTES } from '@/lib/routes'

export interface FieldIssue {
  /** Stable key for the list. */
  key: string
  /** What is wrong, in plain words ("Legal name is required"). */
  message: string
  /** Field to focus on this page. */
  fieldId?: string
  /** Route to open instead (already carrying `returnTo`). */
  to?: string
  /** Runs before focusing (e.g. switch the wizard page that holds the field). */
  onSelect?: () => void
}

export const REVEAL_FIELD_EVENT = 'icasco:reveal-field'
export const RETURN_TO_PARAM = 'returnTo'
export const FIELD_PARAM = 'field'

const FOCUSABLE = 'input:not([type=hidden]):not([disabled]),textarea,select,button,[tabindex]:not([tabindex="-1"])'

/**
 * Scrolls to a field, focuses it and flashes a highlight. The field may not exist yet (another
 * wizard page or tab is opening), so this retries for a short while.
 */
export function focusField(fieldId: string, attempts = 15): void {
  if (typeof window === 'undefined' || !fieldId) return
  window.dispatchEvent(new CustomEvent(REVEAL_FIELD_EVENT, { detail: { fieldId } }))
  let tries = 0
  const tick = () => {
    const root = document.getElementById(fieldId)
    if (!root) {
      tries += 1
      if (tries < attempts) window.setTimeout(tick, 120)
      return
    }
    root.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const focusable = root.matches(FOCUSABLE) ? root : root.querySelector<HTMLElement>(FOCUSABLE)
    const target = focusable ?? root
    target.focus?.({ preventScroll: true })
    // Highlight the visible field box (a hidden file input or sr-only checkbox has no box).
    const box = (target.closest('.field-text, .multiselect-trigger, [data-field-box]') as HTMLElement | null) ??
      (root.offsetParent ? root : target.parentElement) ?? root
    box.classList.remove('field-flash')
    void box.offsetWidth
    box.classList.add('field-flash')
    window.setTimeout(() => box.classList.remove('field-flash'), 1800)
  }
  window.setTimeout(tick, 60)
}

/** A safe in-app path from `?returnTo=` (never another origin). */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null
  return value.startsWith('/') && !value.startsWith('//') ? value : null
}

/** Adds `returnTo` (and optional extra params) to an in-app link. */
export function withReturnTo(target: string, returnTo: string, extra: Record<string, string> = {}): string {
  const [path, query = ''] = target.split('?')
  const params = new URLSearchParams(query)
  for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value)
  params.set(RETURN_TO_PARAM, returnTo)
  return `${path}?${params.toString()}`
}

/** Link to one CAB Profile page (and field), with a way back to `returnTo`. */
export function cabProfileFixLink(page: string, fieldId: string | undefined, returnTo: string): string {
  return withReturnTo(ROUTES.cabCompanyProfile, returnTo, { page, ...(fieldId ? { [FIELD_PARAM]: fieldId } : {}) })
}

/** "Back to quotation" style label for the page a `returnTo` path points at. */
export function returnToLabel(t: TFunction, path: string): string {
  const key = path.includes('importBatch=')
    ? 'import'
    : path.startsWith('/cab/migration')
      ? 'migration'
      : path.includes('/quotation')
    ? 'quotation'
    : path.includes('/competence/persons') || path.includes('/personnel')
      ? 'personnel'
      : path.includes('/invoices')
        ? 'invoice'
        : path.includes('/applications')
          ? 'application'
          : 'previous'
  return t(`ui.returnTo.${key}`)
}
