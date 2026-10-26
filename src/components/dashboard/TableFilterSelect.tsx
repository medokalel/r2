import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { cn } from '@/lib/utils'

export interface TableFilterOption {
  value: string
  label: string
}

interface TableFilterSelectProps {
  label: string
  value: string
  options: TableFilterOption[]
  onChange: (value: string) => void
  className?: string
}

export function TableFilterSelect({ label, value, options, onChange, className }: TableFilterSelectProps) {
  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-11 w-full cursor-pointer appearance-none rounded-md border border-neutral-100 bg-white ps-4 pe-9 text-body-sm text-neutral-900 outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-neutral-500">
        <SelectDropdownIcon />
      </span>
    </label>
  )
}