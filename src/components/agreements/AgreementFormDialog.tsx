import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { agreementErrorMessage } from '@/components/agreements/agreementHelpers'

interface AgreementFormDialogProps {
  open: boolean
  title: string
  description?: string
  submitLabel: string
  canSubmit?: boolean
  destructive?: boolean
  wide?: boolean
  onClose: () => void
  /** Runs the action; the error (agreement rules in plain words) stays inside the dialog. */
  onSubmit: () => Promise<void>
  children: React.ReactNode
}

/** Dialog with a form body for the agreement actions (generate, terminate, amend, edit, sign). */
export function AgreementFormDialog(props: AgreementFormDialogProps) {
  return (
    <Dialog.Root open={props.open} onOpenChange={(next) => !next && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={props.description ? 'agreement-dialog-description' : undefined}
          className={`fixed start-1/2 top-1/2 z-50 flex max-h-[92vh] ${props.wide ? 'w-[min(720px,calc(100vw-32px))]' : 'w-[min(520px,calc(100vw-32px))]'} -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2`}
        >
          {props.open ? <Body {...props} /> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Body({ title, description, submitLabel, canSubmit = true, destructive, onClose, onSubmit, children }: AgreementFormDialogProps) {
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
      setError(agreementErrorMessage(err, t))
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
      <div className="flex flex-col gap-4 overflow-y-auto p-5 sm:p-6">
        <Dialog.Title className="text-body-lg font-semibold leading-[1.4] text-neutral-900">{title}</Dialog.Title>
        {description && (
          <Dialog.Description id="agreement-dialog-description" className="-mt-2 text-body-sm leading-[1.6] text-neutral-700">
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
      <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-100 px-5 py-4 sm:px-6">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
          {t('agreements.common.cancel')}
        </Button>
        <Button type="submit" variant={destructive ? 'destructive' : 'primary'} size="sm" disabled={busy || !canSubmit} aria-busy={busy || undefined}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
