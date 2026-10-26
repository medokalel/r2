import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { decideTeamException, type TeamException } from '@/lib/api/teamSelectionApi'
import { DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { useLocalized } from '@/components/teamSelection/teamSelectionUi'
import { formatDateTime } from '@/lib/format/dates'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { ApiError } from '@/lib/api/client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const STATUS_STYLE = { PENDING: 'bg-warning-50 text-warning-800', APPROVED: 'bg-success-50 text-success-700', REJECTED: 'bg-error-50 text-error-700' } as const

/** Exceptions with approve / reject for pending ones (a reason is required to reject). */
export function TeamExceptionsList({ exceptions, personName, onChanged }: { exceptions: TeamException[]; personName?: (id: string | null) => string; onChanged: () => void }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const [deciding, setDeciding] = useState<{ row: TeamException; decision: 'approve' | 'reject' } | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!exceptions.length) return <p className="text-caption text-neutral-600">{t('team.exceptions.empty')}</p>

  const submit = async () => {
    if (!deciding) return
    setBusy(true)
    setError(null)
    try {
      await decideTeamException(deciding.row.id, deciding.decision, notes)
      toast.success(deciding.decision === 'approve' ? t('team.exceptions.approved') : t('team.exceptions.rejected'))
      setDeciding(null)
      setNotes('')
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'SECOND_APPROVER_REQUIRED'
        ? t('team.exceptions.secondApproverRequired', 'Another CAB admin must decide on this exception because the second approver rule is on.')
        : workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {exceptions.map((e) => (
          <li key={e.id} className="flex flex-col gap-2 rounded-md border border-neutral-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-xs px-1.5 py-0.5 text-overline font-semibold', STATUS_STYLE[e.status])}>{t(`team.exceptions.status.${e.status}`)}</span>
              <p className="text-body-sm font-semibold text-neutral-900">{loc(e.issueText)}</p>
            </div>
            {personName && e.personId && <p className="text-caption text-neutral-700">{personName(e.personId)}</p>}
            <p className="text-caption text-neutral-700">“{e.justification}”</p>
            <p className="text-overline text-neutral-500">
              {t('team.exceptions.requestedBy', { name: e.requestedBy, date: formatDateTime(e.requestedAt) })}
              {e.decidedBy && ` · ${t('team.exceptions.decidedBy', { name: e.decidedBy, date: formatDateTime(e.decidedAt) })}`}
            </p>
            {e.decisionNotes && <p className="text-caption text-neutral-700">{e.decisionNotes}</p>}
            {e.status === 'PENDING' && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setDeciding({ row: e, decision: 'approve' })} className="h-9 rounded-md bg-primary px-3 text-caption font-semibold text-white hover:bg-primary-hover">
                  {t('team.exceptions.approve')}
                </button>
                <button type="button" onClick={() => setDeciding({ row: e, decision: 'reject' })} className="h-9 rounded-md border border-error-500 px-3 text-caption font-semibold text-error-600 hover:bg-error-50">
                  {t('team.exceptions.reject')}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <WorkflowDialog
        open={Boolean(deciding)}
        title={deciding?.decision === 'approve' ? t('team.exceptions.approveTitle') : t('team.exceptions.rejectTitle')}
        description={deciding ? loc(deciding.row.issueText) : undefined}
        confirmLabel={deciding?.decision === 'approve' ? t('team.exceptions.approve') : t('team.exceptions.reject')}
        tone={deciding?.decision === 'reject' ? 'destructive' : 'primary'}
        confirmDisabled={deciding?.decision === 'reject' && !notes.trim()}
        busy={busy}
        error={error}
        onConfirm={() => void submit()}
        onClose={() => {
          setDeciding(null)
          setError(null)
        }}
      >
        <DialogTextArea id="team-exception-notes" label={t('team.exceptions.notes')} required={deciding?.decision === 'reject'} value={notes} onChange={setNotes} />
      </WorkflowDialog>
    </>
  )
}
