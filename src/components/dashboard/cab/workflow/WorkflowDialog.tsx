import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { FormLabel } from '@/components/ui/FormField'
import { Textarea } from '@/components/ui/TextField'
import { DatePicker } from '@/components/ui/DatePicker'
import { parseIsoDate, toIsoDate } from '@/components/dashboard/companyProfile/mappers'
import { cn } from '@/lib/utils'

export interface WorkflowDialogProps {
  open: boolean
  title: string
  description?: React.ReactNode
  confirmLabel: string
  /** Destructive actions (suspend, withdraw …) use the red button. */
  tone?: 'primary' | 'destructive'
  busy?: boolean
  confirmDisabled?: boolean
  /** Inline error shown above the buttons. */
  error?: string | null
  onConfirm: () => void
  onClose: () => void
  children?: React.ReactNode
  /** Wider body for forms. */
  size?: 'md' | 'lg'
}

/**
 * Confirmation / small-form dialog shared by the CAB workflow screens
 * (audit-plan status, offer approval, certificate lifecycle, cycle requests …).
 */
export function WorkflowDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  busy = false,
  confirmDisabled = false,
  error,
  onConfirm,
  onClose,
  children,
  size = 'md',
}: WorkflowDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2',
            size === 'lg' ? 'w-[min(720px,calc(100vw-32px))]' : 'w-[min(520px,calc(100vw-32px))]',
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5 sm:px-6">
            <Dialog.Title className="text-body-lg font-bold leading-snug text-neutral-900 sm:text-body-lg">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={busy}
                aria-label={t('common.close', 'Close')}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition hover:bg-neutral-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              if (!busy && !confirmDisabled) onConfirm()
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 text-body-sm text-neutral-800 sm:px-6">
              {description && <div className="leading-relaxed">{description}</div>}
              {children}
              {error && (
                <p role="alert" className="rounded-md bg-error-50 px-3 py-2 text-body-sm text-error-600">
                  {error}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" size="sm" className="h-10 px-4" disabled={busy} onClick={onClose}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant={tone === 'destructive' ? 'destructive' : 'primary'}
                size="sm"
                className="h-10 px-4"
                disabled={busy || confirmDisabled}
              >
                {busy ? t('common.loading', 'Loading…') : confirmLabel}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Labelled multi-line text input for dialogs (reasons, notes). */
export function DialogTextArea({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  rows = 3,
  maxLength = 2000,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  return (
    <div className="flex flex-col gap-2">
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      <Textarea id={id} rows={rows} maxLength={maxLength} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

/** Labelled date input for dialogs; value is "YYYY-MM-DD" ('' when empty). */
export function DialogDateField({
  label,
  value,
  onChange,
  required,
  id,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  /** Id of the field box (target of `?field=` deep links). */
  id?: string
}) {
  return (
    <div id={id} className="flex flex-col gap-2">
      <FormLabel required={required}>{label}</FormLabel>
      <DatePicker value={parseIsoDate(value) ?? null} onChange={(date) => onChange(toIsoDate(date))} />
    </div>
  )
}
