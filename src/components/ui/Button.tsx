import { Slot } from '@radix-ui/react-slot'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/buttonVariants'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  icon,
  iconPosition = 'start',
  children,
  ...props
}: ButtonProps) {
  const isIconOnly = size === 'icon' || size === 'icon-sm'

  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        icon && !isIconOnly && (size == null || size === 'default' || size === 'lg') &&
          variant !== 'tertiary' && variant !== 'link' &&
          (iconPosition === 'start' ? 'ps-4' : 'pe-4'),
        className,
      )}
      {...props}
    >
      {icon && iconPosition === 'start' && (
        <span className="inline-flex shrink-0">{icon}</span>
      )}
      {!isIconOnly && children}
      {isIconOnly && (icon ?? children)}
      {icon && iconPosition === 'end' && (
        <span className="inline-flex shrink-0">{icon}</span>
      )}
    </button>
  )
}

