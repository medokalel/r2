import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/TextField'

export interface ConfirmActionDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  /** Red confirm button for actions that cannot be undone easily (suspend, withdraw, reject). */
  destructive?: boolean
  /** Ask for a reason; `required` blocks confirming until one is typed. */
  reason?: { label: string; required?: boolean; placeholder?: string }
  onClose: () => void
  /** Runs the action; a thrown error is shown in the dialog and the dialog stays open. */
  onConfirm: (reason: string) => Promise<void>
}

/** A small confirmation dialog, optionally collecting a reason, that runs an async action. */
export function ConfirmActionDialog(props: ConfirmActionDialogProps) {
  return (
    <Dialog.Root open={props.open} onOpenChange={(next) => !next && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={props.description ? 'confirm-action-description' : undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          {/* Remounted on every open so the reason and error start empty. */}
          {props.open ? <ConfirmActionBody {...props} /> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ConfirmActionBody({
  title,
  description,
  confirmLabel,
  destructive,
  reason,
  onClose,
  onConfirm,
}: ConfirmActionDialogProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const missingReason = Boolean(reason?.required && !text.trim())

  const confirm = async () => {
    if (missingReason || busy) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm(text.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('common.actionFailed', 'The action could not be completed. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4 p-6"
      onSubmit={(event) => {
        event.preventDefault()
        void confirm()
      }}
    >
      <Dialog.Title className="text-body-lg font-semibold leading-[1.4] text-neutral-900">{title}</Dialog.Title>
      {description ? (
        <Dialog.Description id="confirm-action-description" className="text-body-sm leading-[1.6] text-neutral-700">
          {description}
        </Dialog.Description>
      ) : null}
      {reason ? (
        <label className="flex flex-col gap-2 text-body-sm font-medium text-neutral-900">
          <span>
            {reason.label}
            {reason.required ? <span className="text-error-500"> *</span> : null}
          </span>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={reason.placeholder}
            rows={4}
            maxLength={2000}
            required={reason.required}
            autoFocus
          />
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant={destructive ? 'destructive' : 'primary'}
          size="sm"
          disabled={busy || missingReason}
          aria-busy={busy || undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </form>
  )
}
