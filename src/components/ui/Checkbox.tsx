import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * Shared checkbox visual — rounded box, checked state fills solid primary
 * with a white check icon. Drop-in replacement for a native
 * `<input type="checkbox">`; wrap it in your own `<label>` for the text.
 */
export function Checkbox({ checked, onChange, disabled, className, ...rest }: CheckboxProps) {
  return (
    <span className={cn('relative inline-flex size-5 shrink-0', className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...rest}
      />
      <span
        aria-hidden
        className={cn(
          'flex size-full items-center justify-center rounded-sm border transition-colors',
          checked ? 'border-primary bg-primary' : 'border-neutral-400 bg-white',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-1',
          disabled && 'opacity-50'
        )}
      >
        {checked && (
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.6437 7.84288L0.157101 4.35628C-0.0523671 4.14681 -0.0523671 3.80718 0.157101 3.59769L0.915668 2.8391C1.12514 2.62961 1.46479 2.62961 1.67426 2.8391L4.023 5.18782L9.05374 0.157101C9.26321 -0.0523671 9.60286 -0.0523671 9.81233 0.157101L10.5709 0.915689C10.7804 1.12516 10.7804 1.46479 10.5709 1.67428L4.40229 7.8429C4.1928 8.05237 3.85317 8.05237 3.6437 7.84288Z"
              fill="white"
            />
          </svg>
        )}
      </span>
    </span>
  )
}