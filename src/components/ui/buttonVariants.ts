import { cva } from 'class-variance-authority'

// Figma Design System > Button (228:37007): Primary / Secondary / Tertiary, height 56, radius/md (8),
// padding 24 x 10, Body SemiBold 16/1.6, icon 24; disabled = opacity/50; focus = 2px border-focus ring
// with a 2px offset. Small buttons keep the 36px minimum from the Accessibility page.
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-3 whitespace-nowrap',
    'rounded-md text-body font-semibold leading-[1.6]',
    'transition-[background-color,color,border-color,transform] duration-150',
    'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
    // Press feedback: a quick, subtle scale-down on click, skipped when disabled
    'active:scale-[0.97] disabled:active:scale-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-primary !text-white',
          'hover:bg-primary-hover',
          'active:bg-primary-hover',
          'disabled:bg-primary disabled:hover:bg-primary',
        ].join(' '),
        secondary: [
          'bg-white text-primary border border-primary',
          'hover:bg-primary-50 hover:text-primary-hover',
          'active:bg-primary-50 active:text-primary-hover',
          'disabled:bg-white disabled:text-primary',
        ].join(' '),
        tertiary: [
          'bg-transparent text-primary underline-offset-4',
          'hover:text-primary-hover hover:underline',
          'active:text-primary-active active:underline',
          'disabled:text-primary disabled:no-underline',
        ].join(' '),
        destructive: [
          'bg-error-500 !text-white',
          'hover:bg-error-600',
          'active:bg-error-700',
          'disabled:bg-error-500',
        ].join(' '),
        link: 'bg-transparent text-primary underline-offset-4 hover:text-primary-hover hover:underline p-0 h-auto',
        outline: [
          'bg-white text-primary border border-primary',
          'hover:bg-primary-50 hover:text-primary-hover',
          'active:bg-primary-50 active:text-primary-hover',
          'disabled:bg-white disabled:text-primary',
        ].join(' '),
      },
      size: {
        default: 'h-14 px-6 py-2.5',
        sm: 'h-9 gap-2 px-3 text-body-sm',
        // Compact toolbar/dialog button: 44px keeps the WCAG touch target (Figma Accessibility)
        md: 'h-11 gap-2 px-5 text-body-sm',
        lg: 'h-14 px-6 py-2.5',
        icon: 'h-14 w-[52px] px-4 py-2.5',
        'icon-sm': 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)
