import { cn } from '@/lib/utils'

/** iCASCO brand colours used by the platform console (primary blue is the app's --color-primary). */
export const PLATFORM_BRAND = {
  blue: '#1236A5',
  mid: '#005FAE',
  teal: '#008C8A',
  gold: '#D4A017',
} as const

export const inputClassName =
  'h-11 w-full min-w-0 rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-25 disabled:text-neutral-600'

export const textareaClassName =
  'w-full min-w-0 rounded-md border border-neutral-100 bg-white px-3 py-2.5 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none'

export const rowClass = (index: number): string => cn('border-b border-neutral-100 last:border-b-0', index % 2 ? 'bg-neutral-25' : '')
export const cellClass = 'px-4 py-3.5 align-middle text-body-sm text-neutral-800'
