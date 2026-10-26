import { Checkbox } from '@/components/ui/Checkbox'
import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'

interface CheckboxGroupProps {
  values: string[]
  onChange: (values: string[]) => void
  options: { value: string; label: string }[]
  className?: string
}

export function CheckboxGroup({ values, onChange, options, className }: CheckboxGroupProps) {
  const toggle = (optionValue: string) => {
    onChange(
      values.includes(optionValue)
        ? values.filter((value) => value !== optionValue)
        : [...values, optionValue]
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-x-10 gap-y-3', className)}>
      {options.map((option) =>
        option.value === 'other' ? (
          <label key={option.value} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="otherSystem"
              checked={values.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="size-5 accent-primary"
            />
            <span className={cn(fieldTextClassName, 'text-neutral-700')}>{option.label}</span>
          </label>
        ) : (
          <label key={option.value} className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={values.includes(option.value)} onChange={() => toggle(option.value)} />
            <span className={cn(fieldTextClassName, 'text-neutral-700')}>{option.label}</span>
          </label>
        )
      )}
    </div>
  )
}