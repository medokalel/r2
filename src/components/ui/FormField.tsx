import { cn } from '@/lib/utils'
import {
  fieldCompactLabelClassName,
  fieldLabelClassName,
  formSectionClassName,
  questionLabelClassName,
} from '@/components/ui/fieldStyles'

// A non-breaking space keeps the marker glued to the label's last word —
// a plain space lets the browser wrap "*" onto its own line in narrow columns.
export function RequiredMark() {
  return <span className="text-error-500">{' *'}</span>
}

interface FormLabelProps {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
  variant?: 'default' | 'compact'
}

export function FormLabel({ htmlFor, children, required, variant = 'default' }: FormLabelProps) {
  return (
    <label htmlFor={htmlFor} className={variant === 'compact' ? fieldCompactLabelClassName : fieldLabelClassName}>
      {children}
      {required && <RequiredMark />}
    </label>
  )
}

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'question' | 'compact'
}

export function FormField({
  label,
  required,
  children,
  className,
  variant = 'default',
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {variant === 'question' ? (
        <p className={questionLabelClassName}>
          {label}
          {required && <RequiredMark />}
        </p>
      ) : (
        <FormLabel required={required} variant={variant === 'compact' ? 'compact' : 'default'}>
          {label}
        </FormLabel>
      )}
      {children}
    </div>
  )
}

interface FormSectionProps {
  children: React.ReactNode
  className?: string
}

export function FormSection({ children, className }: FormSectionProps) {
  return <div className={cn(formSectionClassName, className)}>{children}</div>
}
