import { WesternDigits } from '@/components/WesternDigits'
import { cn } from '@/lib/utils'

interface RatingScaleProps {
  value: number | null
  onChange: (value: number) => void
  className?: string
}

export function RatingScale({ value, onChange, className }: RatingScaleProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length: 10 }, (_, index) => {
        const rating = index + 1
        const selected = value === rating
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              'flex h-12 flex-1 items-center justify-center rounded-md border text-center text-body-2 font-medium transition-colors',
              selected
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-primary hover:bg-primary-subtle hover:text-primary'
            )}
          >
            <WesternDigits>{rating}</WesternDigits>
          </button>
        )
      })}
    </div>
  )
}
