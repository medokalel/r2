import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FormLabel } from '@/components/ui/FormField'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import {
  fieldHeightClassName,
  fieldInputClassName,
  fieldTextClassName,
} from '@/components/ui/fieldStyles'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/context/direction/useDirection'
import { cn } from '@/lib/utils'

interface SearchableSelectOption {
  value: string
  label: string
  /** Extra text matched by the search (e.g. country names). */
  keywords?: string
  /** Small secondary line under the label in the list. */
  hint?: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  id?: string
  className?: string
  /** Optional leading visual (logo, flag) for an option, shown in the list and the field. */
  renderOptionIcon?: (value: string) => ReactNode
}

/**
 * A dropdown with a search input for filtering long option lists (languages,
 * long country/standard lists, etc). Built without an external combobox
 * library, matching the visual language of SelectField.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  label,
  required,
  disabled,
  id,
  className,
  renderOptionIcon,
}: SearchableSelectProps) {
  const { t } = useTranslation()
  const { dir } = useDirection()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((option) => option.value === value)
  const needle = query.trim().toLowerCase()
  const filtered = options.filter((option) =>
    `${option.label} ${option.keywords ?? ''}`.toLowerCase().includes(needle)
  )

  useEffect(() => {
    if (!open) return
    searchInputRef.current?.focus()
    function onOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutsideClick)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value)
    setOpen(false)
    setQuery('')
  }

  const field = (
    <div ref={rootRef} className={cn('relative', className)} dir={dir}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((prev) => !prev)
        }}
        className={cn(
          fieldInputClassName,
          fieldHeightClassName,
          'flex w-full items-center justify-between gap-2 font-normal text-start',
          !selected && 'text-text-secondary',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected && renderOptionIcon?.(selected.value)}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <SelectDropdownIcon className="shrink-0 text-neutral-900" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border-strong bg-white shadow-lg">
          <div className="border-b border-neutral-100 p-2">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                fieldTextClassName,
                'w-full rounded-sm border border-neutral-300 px-3 py-2 font-light outline-none focus:border-primary-500'
              )}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-body-3 text-neutral-600">{t('common.noMatches')}</p>
            ) : (
              filtered.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => selectOption(option)}
                  className={cn(
                    fieldTextClassName,
                    'flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-start font-light text-neutral-900 outline-none hover:bg-neutral-50',
                    option.value === value && 'bg-primary-subtle'
                  )}
                >
                  {renderOptionIcon?.(option.value)}
                  <span className="min-w-0">
                    <span className="block">{option.label}</span>
                    {option.hint && <span className="block text-caption text-neutral-600">{option.hint}</span>}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (!label) return field

  return (
    <div className="space-y-2">
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      {field}
    </div>
  )
}