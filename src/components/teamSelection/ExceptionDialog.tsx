import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { requestTeamException, type TeamIssue, type TeamScope } from '@/lib/api/teamSelectionApi'
import { useLocalized } from '@/components/teamSelection/teamSelectionUi'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { toast } from '@/lib/toast'

interface Props {
  scope: TeamScope
  issue: TeamIssue | null
  onClose: () => void
  onRequested: () => void
}

/** Ask for an exception to a non-mandatory blocking issue; a CAB admin approves it in the work queue. */
export function ExceptionDialog({ scope, issue, onClose, onRequested }: Props) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const [justification, setJustification] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!issue) return
    setBusy(true)
    setError(null)
    try {
      await requestTeamException({ ...scope, personId: issue.personId, issueCode: issue.code, justification: justification.trim() })
      toast.success(t('team.exception.requested'))
      setJustification('')
      onRequested()
      onClose()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <WorkflowDialog
      open={Boolean(issue)}
      title={t('team.exception.title')}
      description={issue ? loc(issue.message) : undefined}
      confirmLabel={t('team.exception.submit')}
      confirmDisabled={justification.trim().length < 10}
      busy={busy}
      error={error}
      onConfirm={() => void submit()}
      onClose={onClose}
    >
      <p className="text-caption text-neutral-600">{t('team.exception.hint')}</p>
      <DialogTextArea id="team-exception-justification" label={t('team.exception.justification')} required value={justification} onChange={setJustification} rows={4} />
    </WorkflowDialog>
  )
}
