import * as Select from '@radix-ui/react-select'
import { useState } from 'react'
import { FormLabel } from '@/components/ui/FormField'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { fieldHeightClassName, fieldInputClassName, fieldTextClassName } from '@/components/ui/fieldStyles'
import { useDirection } from '@/context/direction/useDirection'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { cn } from '@/lib/utils'

type SelectOption = string | { value: string; label: string; textValue?: string }

interface SelectFieldProps {
  value: string
  onChange?: (value: string) => void
  options?: SelectOption[]
  placeholder?: string
  disabled?: boolean
  /** Optional label rendered above the field via the shared FormLabel. */
  label?: string
  required?: boolean
  id?: string
  className?: string
  labelVariant?: 'default' | 'compact'
}

function normalizeOption(option: SelectOption) {
  return typeof option === 'string' ? { value: option, label: option } : option
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  label,
  required,
  id,
  className,
  labelVariant = 'default',
}: SelectFieldProps) {
  const { dir } = useDirection()
  const items = (options ?? (value ? [value] : [])).map(normalizeOption)
  const [internalValue, setInternalValue] = useState(value)

  // Follow the controlled value whenever the parent changes it.
  const valueChanged = useValuesChanged([value])
  if (valueChanged) {
    setInternalValue(value)
  }

  const select = (
    <Select.Root
      dir={dir}
      value={internalValue}
      disabled={disabled}
      onValueChange={(next) => {
        setInternalValue(next)
        onChange?.(next)
      }}
    >
      <Select.Trigger
        id={id}
        className={cn(
          fieldInputClassName,
          fieldHeightClassName,
          'flex w-full items-center justify-between gap-2 font-normal text-start',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon asChild>
          <SelectDropdownIcon className="shrink-0 text-neutral-900" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="z-50 max-h-60 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border-strong bg-white shadow-lg"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {items.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                textValue={opt.textValue ?? opt.label}
                className={cn(
                  fieldTextClassName,
                  'relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 font-normal text-text-primary outline-none',
                  'data-[highlighted]:bg-bg-hover data-[state=checked]:bg-primary-subtle'
                )}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )

  if (!label) return select

  return (
    <div className="space-y-2">
      <FormLabel htmlFor={id} required={required} variant={labelVariant}>
        {label}
      </FormLabel>
      {select}
    </div>
  )
  
}
