import { forwardRef } from 'react'
import type { AppIconComponent } from '@/components/icons'
import { AppIcon } from '@/components/icons'
import { FormLabel } from '@/components/ui/FormField'
import {
  fieldErrorTextClassName,
  fieldHeightClassName,
  fieldInputClassName,
  fieldInputTextClassName,
  fieldTextareaClassName,
} from '@/components/ui/fieldStyles'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { sanitizeFieldKind, type FieldValueKind } from '@/lib/validators'
import { cn } from '@/lib/utils'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional label rendered above the field via the shared FormLabel. */
  label?: string
  /** Optional control rendered beside the label (e.g. an info tooltip). */
  labelExtra?: React.ReactNode
  /** Leading icon rendered inside the field border. */
  icon?: AppIconComponent
  /** Validation message shown under the field; also flags the border red. */
  error?: string
  /** Trailing control (e.g. a password-visibility toggle) pinned to the end. */
  trailing?: React.ReactNode
  required?: boolean
  /** Restrict typed characters to numbers, letters, or both. */
  valueKind?: FieldValueKind
}

/**
 * The single text input used across the app — dashboard forms and auth screens
 * alike. Used bare it renders a plain bordered input; pass `icon`/`trailing`/
 * `label`/`error` for the richer auth-style field. Numeric and credential
 * inputs normalize Arabic digits to Latin so stored values stay consistent.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, labelExtra, icon, error, trailing, required, className, id, type, inputMode, valueKind, onChange, ...props },
  ref
) {
  const resolvedInputMode = inputMode ?? (valueKind === 'number' ? 'numeric' : undefined)
  const usesEnglishDigits =
    type === 'email' ||
    type === 'tel' ||
    type === 'password' ||
    type === 'number' ||
    resolvedInputMode === 'numeric' ||
    resolvedInputMode === 'decimal' ||
    valueKind === 'number'
  const forceLtr =
    type === 'tel' || type === 'number' || resolvedInputMode === 'numeric' || resolvedInputMode === 'decimal'

  const handleChange = onChange
    ? (event: React.ChangeEvent<HTMLInputElement>) => {
        let next = event.target.value
        if (usesEnglishDigits) next = toEnglishDigits(next)
        if (valueKind) next = sanitizeFieldKind(next, valueKind)
        event.target.value = next
        onChange(event)
      }
    : onChange

  const sharedInputProps = {
    ref,
    id,
    type,
    inputMode: resolvedInputMode,
    lang: usesEnglishDigits ? 'en' : undefined,
    dir: forceLtr ? ('ltr' as const) : undefined,
    onChange: handleChange,
    ...props,
  }

  const field =
    icon || trailing ? (
      <div className="relative">
        <div
          className={cn(
            'flex items-center overflow-hidden rounded-md border border-border-strong bg-white',
            fieldHeightClassName,
            'focus-within:border-border-focus',
            error && 'border-border-error focus-within:border-border-error',
            className
          )}
        >
          {icon && (
            <span className="flex size-10 shrink-0 items-center justify-center text-primary pointer-events-none">
              <AppIcon icon={icon} size={20} />
            </span>
          )}
          <input
            {...sharedInputProps}
            className={cn(
              'min-w-0 flex-1 h-full bg-transparent focus:outline-none',
              fieldInputTextClassName,
              icon ? 'pe-4' : 'px-4',
              trailing && 'pe-10',
              usesEnglishDigits && englishDigitsClassName,
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
        </div>
        {trailing && (
          <div className="absolute inset-y-0 end-3 flex items-center">{trailing}</div>
        )}
      </div>
    ) : (
      <input
        {...sharedInputProps}
        className={cn(
          fieldInputClassName,
          fieldHeightClassName,
          usesEnglishDigits && englishDigitsClassName,
          className
        )}
      />
    )

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-1.5">
          <FormLabel htmlFor={id} required={required}>
            {label}
          </FormLabel>
          {labelExtra}
        </div>
      )}
      {field}
      {error && <p className={fieldErrorTextClassName}>{error}</p>}
    </div>
  )
})

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

/** Multi-line variant sharing the same field styling. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea ref={ref} className={cn(fieldTextareaClassName, className)} {...props} />
    )
  }
)
