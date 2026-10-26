import { cn } from '@/lib/utils'

/** Input classes of the execution, checklist and stage report forms (design-system field shell). */
export const FIELD_CLASS =
  'w-full rounded-md border border-neutral-200 bg-white px-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-neutral-50 disabled:text-neutral-600'
export const INPUT_CLASS = cn(FIELD_CLASS, 'h-11')
export const TEXTAREA_CLASS = cn(FIELD_CLASS, 'min-h-24 resize-y py-2.5')
