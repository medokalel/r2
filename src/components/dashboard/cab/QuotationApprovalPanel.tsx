import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  approveQuotation,
  getQuotationApproval,
  returnQuotationToDraft,
  submitQuotationForApproval,
  type QuotationApproval,
} from '@/lib/api/cabApplicationQuotationApi'
import type { Quotation } from '@/lib/api/cabQuotationApi'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

type Action = 'submit' | 'approve' | 'return'

const TONE: Record<QuotationApproval['approvalStatus'], string> = {
  DRAFT: 'bg-neutral-50 text-neutral-800',
  PENDING: 'bg-warning-50 text-warning-700',
  APPROVED: 'bg-success-50 text-success-700',
}

/**
 * Internal approval of the quotation (submit → approve → issue), shown above the quotation on
 * the quotation page. Issuing stays in QuotationView; it needs an approved quotation.
 */
export function QuotationApprovalPanel({ quotation }: { quotation: Quotation }) {
  const { t, i18n } = useTranslation()
  const [approval, setApproval] = useState<QuotationApproval | null>(null)
  const [failed, setFailed] = useState(false)
  const [action, setAction] = useState<Action | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getQuotationApproval(quotation.id)
      .then((result) => {
        if (!cancelled) setApproval(result)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [quotation.id, quotation.updatedAt, quotation.status])

  if (failed) {
    return <p role="alert" className="text-body-sm text-error-700">{t('cab.quotationApproval.loadError', 'The approval status could not be loaded.')}</p>
  }
  if (!approval) return null

  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }) : '')
  const statusLabel = {
    DRAFT: t('cab.quotationApproval.status.DRAFT', 'Draft (not submitted)'),
    PENDING: t('cab.quotationApproval.status.PENDING', 'Awaiting approval'),
    APPROVED: t('cab.quotationApproval.status.APPROVED', 'Approved'),
  }[approval.approvalStatus]
  const labels: Record<Action, string> = {
    submit: t('cab.quotationApproval.actions.submit', 'Submit for approval'),
    approve: t('cab.quotationApproval.actions.approve', 'Approve'),
    return: t('cab.quotationApproval.actions.return', 'Return for changes'),
  }
  const descriptions: Record<Action, string> = {
    submit: t('cab.quotationApproval.confirm.submit', 'The CAB is notified that this quotation waits for approval.'),
    approve: t('cab.quotationApproval.confirm.approve', 'Approving allows the quotation to be issued to the client.'),
    return: t('cab.quotationApproval.confirm.return', 'The quotation goes back to draft; the preparer sees your reason.'),
  }

  const run = async () => {
    if (!action) return
    setBusy(true)
    setError(null)
    try {
      const result =
        action === 'submit'
          ? await submitQuotationForApproval(quotation.id, note)
          : action === 'approve'
            ? await approveQuotation(quotation.id, note)
            : await returnQuotationToDraft(quotation.id, note)
      setApproval(result)
      toast.success(
        action === 'approve'
          ? t('cab.quotationApproval.approved', 'Quotation approved. It can now be issued to the client.')
          : action === 'submit'
            ? t('cab.quotationApproval.submitted', 'Quotation submitted for approval.')
            : t('cab.quotationApproval.returned', 'Quotation returned for changes.'),
      )
      setAction(null)
      setNote('')
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const open = approval.status === 'CREATED' || approval.status === 'DRAFT'

  return (
    <section
      aria-label={t('cab.quotationApproval.title', 'Internal approval')}
      className="flex flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-body font-bold text-neutral-900">{t('cab.quotationApproval.title', 'Internal approval')}</h2>
          <span className={cn('rounded px-2 py-1 text-caption font-semibold', TONE[approval.approvalStatus])}>{statusLabel}</span>
        </div>
        <p className="text-body-sm text-neutral-600">
          {approval.approvedBy
            ? t('cab.quotationApproval.approvedBy', { defaultValue: 'Approved by {{name}} on {{date}}.', name: approval.approvedBy.name, date: date(approval.approvedAt) })
            : approval.submittedBy && approval.approvalStatus === 'PENDING'
              ? t('cab.quotationApproval.submittedBy', { defaultValue: 'Submitted by {{name}} on {{date}}.', name: approval.submittedBy.name, date: date(approval.submittedAt) })
              : t('cab.quotationApproval.preparedBy', { defaultValue: 'Prepared by {{name}}.', name: approval.preparedBy?.name ?? notSet() })}
        </p>
        {approval.note && <p className="text-body-sm text-neutral-800">“{approval.note}”</p>}
        {open && approval.issueBlockedReason === 'approvalRequired' && (
          <p className="text-caption text-warning-700">{t('cab.quotationApproval.issueLocked', 'Issuing to the client is available once the quotation is approved.')}</p>
        )}
        {approval.approveBlockedReason === 'separationOfDuties' && (
          <p className="text-caption text-neutral-600">
            {t('cab.quotationApproval.separation', 'You prepared this quotation; another CAB user (or the CAB administrator) must approve it.')}
          </p>
        )}
      </div>
      {open && (
        <div className="flex flex-wrap gap-2">
          {approval.canSubmit && (
            <Button type="button" size="sm" className="h-10 px-4" onClick={() => setAction('submit')}>
              {labels.submit}
            </Button>
          )}
          {approval.approvalStatus === 'PENDING' && (
            <Button
              type="button"
              size="sm"
              className="h-10 px-4"
              disabled={!approval.canApprove}
              title={approval.canApprove ? undefined : t('cab.quotationApproval.separation', 'You prepared this quotation; another CAB user (or the CAB administrator) must approve it.')}
              onClick={() => setAction('approve')}
            >
              {labels.approve}
            </Button>
          )}
          {approval.canReturn && (
            <Button type="button" size="sm" variant="outline" className="h-10 px-4" onClick={() => setAction('return')}>
              {labels.return}
            </Button>
          )}
        </div>
      )}
      <WorkflowDialog
        open={action !== null}
        title={action ? labels[action] : ''}
        description={action ? descriptions[action] : ''}
        confirmLabel={action ? labels[action] : ''}
        busy={busy}
        error={error}
        confirmDisabled={action === 'return' && note.trim().length < 3}
        onConfirm={() => void run()}
        onClose={() => {
          setAction(null)
          setError(null)
          setNote('')
        }}
      >
        <DialogTextArea
          id="quotation-approval-note"
          label={action === 'return' ? t('cab.quotationApproval.reason', 'Reason') : t('cab.quotationApproval.note', 'Note (optional)')}
          required={action === 'return'}
          value={note}
          onChange={setNote}
        />
      </WorkflowDialog>
    </section>
  )
}
