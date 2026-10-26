import { cn } from '@/lib/utils'

/**
 * Shared field styling tokens used across every form in the app (auth,
 * dashboard, company profile, entity data). Keep visual field definitions here
 * so components — not scattered call sites — are the single source of truth.
 */

export const fieldTextClassName = 'field-text text-body leading-[1.6]'
export const fieldBodyTextClassName = 'text-body-1 leading-[1.6]'
export const fieldTitleClassName = 'field-card-title'
export const fieldLabelClassName = 'field-label text-text-primary'
export const questionLabelClassName = fieldLabelClassName
export const fieldCompactLabelClassName = 'text-caption font-medium leading-[1.6] text-text-secondary'
// Figma Design System > Text Field (228:37260): 56px high, radius/md (8), 16px inline padding,
// border-strong (Neutral/200) at rest, border-focus (Primary/500) on focus, border-error on error.
// Label: Body L Medium, text-primary. Value: Body Regular. Supporting/error text: Caption.
export const fieldHeightClassName = 'h-14'

// Placeholder + inner text styling shared by the plain input and the
// icon/adornment variant (where the border lives on the wrapper, not the input).
export const fieldPlaceholderClassName =
  'placeholder:text-body placeholder:font-normal placeholder:leading-[1.6] placeholder:text-text-secondary'
export const fieldInputTextClassName = cn(
  fieldTextClassName,
  'font-normal text-text-primary',
  fieldPlaceholderClassName
)

export const fieldInputClassName = cn(
  fieldInputTextClassName,
  'w-full rounded-md border border-border-strong bg-white px-4',
  'focus:outline-none focus:ring-0 focus:border-border-focus'
)
export const fieldTextareaClassName = cn(fieldInputClassName, 'min-h-[134px] resize-none py-2.5')

// Native <select> styling (auth selects, country pickers). Native selects have
// no placeholder pseudo-element, so the empty state is expressed by text color.
export const nativeSelectBaseClassName = cn(
  fieldTextClassName,
  'w-full rounded-md border border-border-strong bg-white',
  fieldHeightClassName,
  'px-4 appearance-none cursor-pointer font-sans font-normal',
  'focus:outline-none focus:ring-0 focus:border-border-focus',
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-tertiary'
)
export function nativeSelectClassName(hasValue: boolean) {
  return cn(nativeSelectBaseClassName, hasValue ? 'text-text-primary' : 'text-text-secondary')
}

export const formSectionClassName =
  'space-y-5 rounded-lg border border-border-default bg-bg-secondary p-4 sm:p-6'
export const fieldActionButtonClassName =
  'min-w-[200px] rounded-md disabled:opacity-50'
export const fieldStandardTabClassName =
  'field-standard-tab rounded-sm px-2 py-1.5 transition-colors'
export const fieldStandardTabActiveClassName = 'bg-white font-semibold text-text-primary shadow-sm'
export const fieldStandardTabInactiveClassName = 'text-text-secondary hover:text-text-primary'

/** Small text under a field: validation errors (Figma Caption, text-error with AA-safe Error/700). */
export const fieldErrorTextClassName = 'text-caption text-error-700'
/** Helper/supporting text under a field (Figma Caption, text-secondary). */
export const fieldHelperTextClassName = 'text-caption text-text-secondary'
