import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { deleteRelationship, reviewRelationship, type ImpartialityRelationship } from '@/lib/api/impartialityApi'
import { formatDate } from '@/lib/format/dates'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const EFFECT_STYLE = { blocks: 'bg-error-50 text-error-700', warns: 'bg-warning-50 text-warning-800', none: 'bg-neutral-50 text-neutral-600' } as const
const REVIEW_STYLE = { PENDING: 'bg-warning-50 text-warning-800', CONFIRMED: 'bg-primary-50 text-primary', DISMISSED: 'bg-neutral-50 text-neutral-600' } as const

/** Relationships of the impartiality register with their effect on team selection and the CAB review. */
export function RelationshipList({
  rows,
  showPerson,
  onEdit,
  onChanged,
}: {
  rows: ImpartialityRelationship[]
  showPerson?: boolean
  onEdit: (row: ImpartialityRelationship) => void
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [reviewing, setReviewing] = useState<{ row: ImpartialityRelationship; outcome: 'CONFIRMED' | 'DISMISSED' } | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!rows.length) return <p className="text-caption text-neutral-600">{t('team.impartiality.empty')}</p>

  const review = async () => {
    if (!reviewing) return
    setBusy(true)
    setError(null)
    try {
      await reviewRelationship(reviewing.row.id, reviewing.outcome, notes)
      toast.success(t('team.impartiality.reviewed'))
      setReviewing(null)
      setNotes('')
      onChanged()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row: ImpartialityRelationship) => {
    try {
      await deleteRelationship(row.id)
      toast.success(t('team.impartiality.deleted'))
      onChanged()
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    }
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-md border border-neutral-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-xs px-1.5 py-0.5 text-overline font-semibold', EFFECT_STYLE[r.effect])}>
                {r.effect === 'blocks' && r.blockedUntil ? t('team.impartiality.effect.blocksUntil', { date: formatDate(r.blockedUntil) }) : t(`team.impartiality.effect.${r.effect}`)}
              </span>
              <span className={cn('rounded-xs px-1.5 py-0.5 text-overline font-semibold', REVIEW_STYLE[r.reviewStatus])}>{t(`team.impartiality.review.${r.reviewStatus}`)}</span>
              <p className="text-body-sm font-semibold text-neutral-900">
                {showPerson && `${r.personName} · `}
                {t(`team.impartiality.types.${r.type}`)} · {r.clientName}
              </p>
            </div>
            <p className="text-caption text-neutral-700">{r.description}</p>
            <p className="text-overline text-neutral-500">
              {r.startDate ? formatDate(r.startDate) : t('team.impartiality.unknownStart')} / {r.endDate ? formatDate(r.endDate) : t('team.impartiality.ongoing')} · {t(`team.impartiality.source.${r.source}`)}
              {r.reviewedBy && ` · ${t('team.impartiality.reviewedBy', { name: r.reviewedBy })}`}
            </p>
            {r.reviewNotes && <p className="text-caption italic text-neutral-600">{r.reviewNotes}</p>}
            <div className="flex flex-wrap gap-3">
              {r.reviewStatus === 'PENDING' && (
                <>
                  <button type="button" className="text-caption font-semibold text-primary hover:underline" onClick={() => setReviewing({ row: r, outcome: 'CONFIRMED' })}>
                    {t('team.impartiality.confirm')}
                  </button>
                  <button type="button" className="text-caption font-semibold text-primary hover:underline" onClick={() => setReviewing({ row: r, outcome: 'DISMISSED' })}>
                    {t('team.impartiality.dismiss')}
                  </button>
                </>
              )}
              <button type="button" className="text-caption font-semibold text-primary hover:underline" onClick={() => onEdit(r)}>
                {t('team.impartiality.edit')}
              </button>
              {r.reviewStatus === 'PENDING' && (
                <button type="button" className="text-caption font-semibold text-error-600 hover:underline" onClick={() => void remove(r)}>
                  {t('team.impartiality.delete')}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <WorkflowDialog
        open={Boolean(reviewing)}
        title={reviewing?.outcome === 'CONFIRMED' ? t('team.impartiality.confirmTitle') : t('team.impartiality.dismissTitle')}
        description={reviewing?.outcome === 'CONFIRMED' ? t('team.impartiality.confirmHint') : t('team.impartiality.dismissHint')}
        confirmLabel={reviewing?.outcome === 'CONFIRMED' ? t('team.impartiality.confirm') : t('team.impartiality.dismiss')}
        confirmDisabled={reviewing?.outcome === 'DISMISSED' && !notes.trim()}
        busy={busy}
        error={error}
        onConfirm={() => void review()}
        onClose={() => {
          setReviewing(null)
          setError(null)
        }}
      >
        <DialogTextArea id="relationship-review-notes" label={t('team.impartiality.reviewNotes')} required={reviewing?.outcome === 'DISMISSED'} value={notes} onChange={setNotes} />
      </WorkflowDialog>
    </>
  )
}
