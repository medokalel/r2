import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Design-system typography utilities (src/styles/design-system.css). Registered
 * as font sizes so tailwind-merge no longer treats them as text colours and
 * drops them when a colour class (text-primary, text-neutral-700…) is merged
 * into the same call.
 */
const DS_TEXT_STYLES = [
  'h1', 'h2', 'h3', 'h3-bold', 'h3-semi',
  'body-1', 'body-1-medium', 'body-1-semibold',
  'body-compact', 'body-compact-medium', 'body-compact-semibold',
  'body-2', 'body-2-light', 'body-2-medium', 'body-2-semibold',
  'body-3', 'body-3-medium', 'body-3-semibold',
  'small', 'small-light', 'small-medium',
  // Figma type scale (fixed sizes) and page/section title styles
  'overline', 'overline-caps', 'caption', 'body-sm', 'body', 'body-lg',
  'heading-lg', 'heading-xl', 'display-sm', 'display-md', 'display-lg', 'display-xl',
  'page-title', 'section-title',
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: DS_TEXT_STYLES }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
