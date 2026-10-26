import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash } from 'iconsax-reactjs'
import { Button } from '@/components/ui/Button'
import { CheckRow, Chip, Field, Panel } from '@/components/execution/executionUi'
import { INPUT_CLASS, TEXTAREA_CLASS } from '@/components/execution/fieldClasses'
import type { StepProps } from '@/components/execution/types'
import { addWrapUp, deleteWrapUp, updateExecution, type ExecutionFinding } from '@/lib/api/executionApi'
import { formatDate } from '@/lib/format/dates'

const TYPE_TONE: Record<ExecutionFinding['type'], string> = {
  Nonconformity: 'border-error-500 bg-error-50 text-error-700',
  Observation: 'border-info-500 bg-info-50 text-info-700',
  Opportunity: 'border-primary-300 bg-primary-50 text-primary-700',
}

/** Step 4: daily wrap-ups, the findings raised so far and the team's agreement on their grading. */
export function StepTeamReview({ ws, busy, locked, run }: StepProps) {
  const { t, i18n } = useTranslation()
  const planId = ws.plan.id
  const [date, setDate] = useState(ws.plan.startDate)
  const [text, setText] = useState('')
  const [notes, setNotes] = useState(ws.teamReview.notes)
  const workspaceLink = ws.reportId ? `/cab/audit-reporting/workspace?reportId=${encodeURIComponent(ws.reportId)}` : '/cab/audit-reporting'

  return (
    <div className="flex flex-col gap-5">
      <Panel
        title={t('execution.teamReview.findingsTitle')}
        description={t('execution.teamReview.findingsDescription')}
        actions={<Link to={workspaceLink} className="text-body-sm font-semibold text-primary underline-offset-4 hover:underline">{t('execution.teamReview.openWorkspace')}</Link>}
      >
        {ws.findings.length === 0 ? (
          <p className="text-body-sm text-neutral-600">{t('execution.teamReview.noFindings')}</p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="execution-findings">
            {ws.findings.map((f) => (
              <li key={f.id} className="flex flex-col gap-1 rounded-md border border-neutral-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-sm font-bold text-neutral-900">{f.code}</span>
                  <Chip className={TYPE_TONE[f.type]}>{t(`execution.findingTypes.${f.type}`)}</Chip>
                  {f.classification && <Chip className="border-neutral-300 bg-neutral-50 text-neutral-700">{t(`execution.classifications.${f.classification}`)}</Chip>}
                  <Chip className={f.status === 'Submitted' ? 'border-success-500 bg-success-50 text-success-700' : 'border-warning-500 bg-warning-50 text-warning-700'}>{t(`execution.findingStatus.${f.status}`)}</Chip>
                </div>
                <p className="text-caption text-neutral-600">{f.requirementRef}</p>
                <p className="text-body-sm text-neutral-800">{f.statement}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t('execution.teamReview.wrapUpsTitle')} description={t('execution.teamReview.wrapUpsDescription')}>
        {ws.teamReview.wrapUps.length > 0 && (
          <ul className="flex flex-col gap-2">
            {ws.teamReview.wrapUps.map((w) => (
              <li key={w.id} className="flex items-start justify-between gap-2 rounded-md border border-neutral-100 p-3">
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-primary">{formatDate(w.date, i18n.language)} · {w.byName}</p>
                  <p className="mt-0.5 whitespace-pre-line text-body-sm text-neutral-800">{w.notes}</p>
                </div>
                {!locked && (
                  <button type="button" className="flex size-10 items-center justify-center rounded-md text-error-700 hover:bg-error-50" aria-label={t('execution.teamReview.removeWrapUp')} onClick={() => void run(() => deleteWrapUp(planId, w.id))}>
                    <Trash size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!locked && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <Field label={t('execution.teamReview.date')} htmlFor="wrap-date">
              <input id="wrap-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label={t('execution.teamReview.wrapUp')} htmlFor="wrap-text">
              <textarea id="wrap-text" value={text} onChange={(e) => setText(e.target.value)} className={TEXTAREA_CLASS} placeholder={t('execution.teamReview.wrapUpPlaceholder')} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="button" size="md" variant="outline" disabled={busy || !text.trim()} onClick={async () => { if (await run(() => addWrapUp(planId, { date, notes: text.trim() }), t('execution.teamReview.wrapUpAdded'))) setText('') }} data-testid="add-wrapup">
                {t('execution.teamReview.addWrapUp')}
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Panel title={t('execution.teamReview.consensusTitle')}>
        <CheckRow checked={ws.teamReview.gradingConsensus} disabled={locked || busy} onChange={(v) => void run(() => updateExecution(planId, { gradingConsensus: v }))} label={t('execution.teamReview.consensus')} hint={t('execution.teamReview.consensusHint')} testId="grading-consensus" />
        <Field label={t('execution.teamReview.notes')} htmlFor="team-notes">
          <textarea id="team-notes" value={notes} disabled={locked} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== ws.teamReview.notes && void run(() => updateExecution(planId, { teamReviewNotes: notes }))} className={TEXTAREA_CLASS} />
        </Field>
      </Panel>
    </div>
  )
}
