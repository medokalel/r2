import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { getUserErrorMessage } from '@/lib/errorMessages'

export interface FormDialogProps {
  open: boolean
  title: string
  description?: string
  submitLabel: string
  /** Disables the submit button (invalid form). */
  canSubmit?: boolean
  destructive?: boolean
  wide?: boolean
  onClose: () => void
  /** Runs the action; an error is shown inside the dialog, which stays open. */
  onSubmit: () => Promise<void>
  children: React.ReactNode
}

/** Dialog with a form body, used for payments, impersonation, announcements, staff and upgrade requests. */
export function FormDialog(props: FormDialogProps) {
  return (
    <Dialog.Root open={props.open} onOpenChange={(next) => !next && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={props.description ? 'form-dialog-description' : undefined}
          className={`fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] ${props.wide ? 'w-[min(640px,calc(100vw-32px))]' : 'w-[min(500px,calc(100vw-32px))]'} -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2`}
        >
          {props.open ? <FormDialogBody {...props} /> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FormDialogBody({ title, description, submitLabel, canSubmit = true, destructive, onClose, onSubmit, children }: FormDialogProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!canSubmit || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit()
      onClose()
    } catch (err) {
      setError(getUserErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="flex min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-col gap-4 overflow-y-auto p-6">
        <Dialog.Title className="text-body-lg font-semibold leading-[1.4] text-neutral-900">{title}</Dialog.Title>
        {description && (
          <Dialog.Description id="form-dialog-description" className="-mt-2 text-body-sm leading-[1.6] text-neutral-700">
            {description}
          </Dialog.Description>
        )}
        {children}
        {error && (
          <p role="alert" className="whitespace-pre-line rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-100 px-6 py-4">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant={destructive ? 'destructive' : 'primary'} size="sm" disabled={busy || !canSubmit} aria-busy={busy || undefined}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
