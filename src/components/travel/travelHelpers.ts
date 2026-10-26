import type { TFunction } from 'i18next'
import type { Horizon, LegMode, PriceStatus, TravelCategory, TravelMode } from '@/lib/api/travelApi'
import { ApiError } from '@/lib/api/client'

/** Chip colours per price status (design-system tones). */
export const STATUS_TONE: Record<PriceStatus, string> = {
  LIVE: 'bg-success-50 text-success-700',
  CACHED: 'bg-success-50 text-success-600',
  ADVANCE_ESTIMATE: 'bg-info-50 text-info-700',
  BENCHMARK: 'bg-warning-50 text-warning-700',
  POLICY: 'bg-primary-50 text-primary',
  MANUAL: 'bg-neutral-50 text-neutral-700',
  DEMO: 'bg-error-50 text-error-600',
}

export const statusLabel = (t: TFunction, status: PriceStatus) => t(`travel.status.${status}`)
export const statusHint = (t: TFunction, status: PriceStatus) => t(`travel.statusHint.${status}`)
export const categoryLabel = (t: TFunction, category: TravelCategory) => t(`travel.category.${category}`)
export const legModeLabel = (t: TFunction, mode: LegMode) => t(`travel.legMode.${mode}`)
export const modeLabel = (t: TFunction, mode: TravelMode) => t(`travel.mode.${mode}`)
export const horizonLabel = (t: TFunction, horizon: Horizon) => t(`travel.horizon.${horizon}`)
export const optionLabel = (t: TFunction, key: string) => t(`travel.option.${key}`, key)

/** Money in the estimate currency, digits per UI language (the i18n post-processor keeps Latin digits). */
export const formatMoney = (value: number | null | undefined, currency: string, language: string) =>
  value === null || value === undefined
    ? ''
    : new Intl.NumberFormat(language.startsWith('ar') ? 'ar-SA-u-nu-latn' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)

/** Error text shown inside the panel / dialogs. */
export const travelErrorMessage = (err: unknown, t: TFunction) => {
  if (err instanceof ApiError) {
    if (err.message.includes('TRAVEL_ESTIMATE_STALE')) return t('travel.errors.stale')
    if (err.message.includes('TRAVEL_ESTIMATE_EXPIRED')) return t('travel.errors.expired')
    if (err.message.includes('APPROVAL_SEPARATION')) return t('travel.errors.separation')
    if (err.message.includes('TRAVEL_NOT_PRICED')) return t('travel.errors.notPriced')
    return err.message
  }
  return err instanceof Error && err.message ? err.message : t('travel.errors.generic')
}
