import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'

interface RadioGroupProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
  disabled?: boolean
}

export function RadioGroup({ name, value, onChange, options, className, disabled }: RadioGroupProps) {
  // Two choices always fit on one row; only larger groups stack on small screens
  const inline = options.length <= 2
  return (
    <div
      className={cn(
        // Fills the shared 48px field height so the options are vertically
        // centered next to inputs while staying aligned to the start
        'flex min-h-12 justify-start',
        inline
          ? 'flex-row flex-wrap items-center gap-x-8 gap-y-2'
          : 'flex-col justify-center gap-2 2xl:flex-row 2xl:flex-wrap 2xl:items-center 2xl:gap-8 2xl:justify-start',
        className
      )}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn('flex items-center gap-2', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            disabled={disabled}
            className="size-5 accent-primary disabled:cursor-not-allowed"
          />
          <span
            className={cn(
              fieldTextClassName,
              // Hug the text so the circle centers on it exactly
              'leading-none',
              value === opt.value ? 'font-normal text-neutral-900' : 'font-normal text-neutral-700'
            )}
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  )
}
