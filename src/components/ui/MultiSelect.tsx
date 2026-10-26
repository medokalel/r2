import { useState, type ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CloseCircle } from 'iconsax-reactjs'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { WesternDigits } from '@/components/WesternDigits'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { useDirection } from '@/context/direction/useDirection'
import { cn } from '@/lib/utils'

/** Options may be plain strings (value === label) or explicit value/label pairs. */
type MultiSelectOption = string | { value: string; label: string }

function normalizeOption(option: MultiSelectOption) {
  return typeof option === 'string' ? { value: option, label: option } : option
}

interface MultiSelectProps {
  /** Currently selected values, rendered as removable tags in the trigger. */
  tags: string[]
  options: MultiSelectOption[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  /**
   * 'wrapped' (default): compact pills that wrap inline, e.g. Accreditation
   * Body Name. 'stacked': each selection takes its own full-width row, e.g.
   * the CAB Type accreditation-scopes picker.
   */
  layout?: 'wrapped' | 'stacked'
  /** Adds a filter input above the option list, for long option lists. */
  searchable?: boolean
  searchPlaceholder?: string
  /** Shows selected values without opening the dropdown or allowing edits. */
  readOnly?: boolean
  /** Optional leading icon per value (e.g. the sector icon of an IAF code), shown in tags and options. */
  renderIcon?: (value: string) => ReactNode
}

/**
 * Multi-select dropdown: shows chosen values as removable chips in the trigger
 * and a checkbox-style checklist in the popover.
 */
export function MultiSelect({
  tags,
  options,
  onChange,
  placeholder,
  className,
  layout = 'wrapped',
  searchable = false,
  searchPlaceholder,
  readOnly = false,
  renderIcon,
}: MultiSelectProps) {
  const { t } = useTranslation()
  const { dir } = useDirection()
  const [query, setQuery] = useState('')
  const allItems = options.map(normalizeOption)
  const items = searchable
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : allItems
  const labelFor = (value: string) => allItems.find((option) => option.value === value)?.label ?? value
  const toggleTag = (value: string) =>
    onChange(tags.includes(value) ? tags.filter((tag) => tag !== value) : [...tags, value])
  const stacked = layout === 'stacked'

  if (readOnly) {
    return (
      <div
        className={cn(
          'relative flex w-full items-center rounded-md border border-border-strong bg-bg-tertiary ps-3 text-start',
          stacked ? 'min-h-14 flex-col gap-2 py-2 pe-3' : 'min-h-14 gap-3 py-2 pe-3',
          className
        )}
      >
        {stacked ? (
          tags.length === 0 ? (
            placeholder && (
              <span className="text-body font-normal leading-[1.6] text-text-secondary">{placeholder}</span>
            )
          ) : (
            tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'flex w-full items-center rounded-sm bg-neutral-200 px-3 py-2.5',
                  fieldTextClassName,
                  'text-text-primary'
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {renderIcon?.(tag)}
                  <WesternDigits>{enumLabel(t, labelFor(tag))}</WesternDigits>
                </span>
              </span>
            ))
          )
        ) : (
          <div className="flex flex-1 flex-wrap gap-3">
            {tags.length === 0 && placeholder && (
              <span className="text-body font-normal leading-[1.6] text-text-secondary">{placeholder}</span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center rounded-sm bg-neutral-100 px-2.5 py-1.5',
                  fieldTextClassName,
                  'text-text-primary'
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {renderIcon?.(tag)}
                  <WesternDigits>{enumLabel(t, labelFor(tag))}</WesternDigits>
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu.Root dir={dir}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            // Stable hook so a surrounding theme (e.g. the CAB setup wizard) can restyle the trigger.
            'multiselect-trigger',
            'relative flex w-full items-center rounded-md border border-border-strong bg-white ps-3 text-start',
            'focus-visible:outline-none focus-visible:border-border-focus',
            stacked ? 'min-h-14 flex-col gap-2 py-2 pe-10' : 'min-h-14 gap-3 py-2 pe-3',
            className
          )}
        >
          {stacked ? (
            tags.length === 0 ? (
              <span className="flex w-full items-center justify-between">
                {placeholder && (
                  <span className="text-body font-normal leading-[1.6] text-text-secondary">
                    {placeholder}
                  </span>
                )}
                <SelectDropdownIcon className="shrink-0 text-neutral-900" />
              </span>
            ) : (
              <>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-sm bg-neutral-200 px-3 py-2.5',
                      fieldTextClassName,
                      'text-text-primary'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                  {renderIcon?.(tag)}
                  <WesternDigits>{enumLabel(t, labelFor(tag))}</WesternDigits>
                </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(tags.filter((item) => item !== tag))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          onChange(tags.filter((item) => item !== tag))
                        }
                      }}
                      className="flex shrink-0 cursor-pointer items-center justify-center text-icon-primary hover:text-primary"
                      aria-label={t('ui.removeItem', { name: enumLabel(t, labelFor(tag)) })}
                    >
                      <CloseCircle size={20} variant="Linear" />
                    </span>
                  </span>
                ))}
                <SelectDropdownIcon className="absolute end-4 top-4 shrink-0 text-neutral-900" />
              </>
            )
          ) : (
            <>
              <div className="flex flex-1 flex-wrap gap-3">
                {tags.length === 0 && placeholder && (
                  <span className="text-body font-normal leading-[1.6] text-text-secondary">{placeholder}</span>
                )}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-sm bg-neutral-100 px-2.5 py-1.5',
                      fieldTextClassName,
                      'text-text-primary'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                  {renderIcon?.(tag)}
                  <WesternDigits>{enumLabel(t, labelFor(tag))}</WesternDigits>
                </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(tags.filter((item) => item !== tag))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          onChange(tags.filter((item) => item !== tag))
                        }
                      }}
                      className="flex shrink-0 cursor-pointer items-center justify-center text-icon-primary hover:text-primary"
                    aria-label={t('ui.removeItem', { name: enumLabel(t, labelFor(tag)) })}
                    >
                      <CloseCircle size={16} variant="Linear" />
                    </span>
                  </span>
                ))}
              </div>
              <SelectDropdownIcon className="shrink-0 text-neutral-900" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-content-available-width)] overflow-hidden rounded-md border border-border-strong bg-white shadow-lg"
          sideOffset={4}
          align="start"
        >
          {searchable && (
            <div className="border-b border-neutral-100 p-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className={cn(
                  fieldTextClassName,
                  'w-full rounded-sm border border-neutral-300 px-3 py-2 font-light outline-none focus:border-primary-500'
                )}
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-1">
          {items.map((option) => {
            const selected = tags.includes(option.value)

            return (
              <DropdownMenu.Item
                key={option.value}
                onSelect={(event) => {
                  event.preventDefault()
                  toggleTag(option.value)
                }}
                className={cn(
                  fieldTextClassName,
                  'flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-neutral-900 outline-none',
                  'data-[highlighted]:bg-bg-hover',
                  selected && 'bg-primary-subtle'
                )}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border text-overline leading-none',
                    selected ? 'border-primary bg-primary text-white' : 'border-neutral-400 bg-white'
                  )}
                  aria-hidden
                >
                  {selected ? '\u2713' : ''}
                </span>
                {renderIcon?.(option.value)}
                <WesternDigits>{option.label}</WesternDigits>
              </DropdownMenu.Item>
            )
          })}
          {searchable && items.length === 0 && (
            <p className="px-3 py-2 text-body-3 text-neutral-600">{t('common.noMatches')}</p>
          )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}