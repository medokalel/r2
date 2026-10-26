import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AttendancePanel } from '@/components/execution/AttendancePanel'
import { CheckRow, Field, InfoGrid, Panel } from '@/components/execution/executionUi'
import { INPUT_CLASS, TEXTAREA_CLASS } from '@/components/execution/fieldClasses'
import type { StepProps } from '@/components/execution/types'
import { addAttendee, removeAttendee, updateAttendee, updateExecution, type ClientPosition } from '@/lib/api/executionApi'
import { daysText } from '@/lib/execution/executionText'
import { cn } from '@/lib/utils'

const POSITIONS: ClientPosition[] = ['agreed', 'partiallyAgreed', 'disagreed']

/** Step 5: findings presented, the client's agreement or disagreement, NC response deadline, signatures and the time check. */
export function StepClosing({ ws, busy, locked, run }: StepProps) {
  const { t } = useTranslation()
  const planId = ws.plan.id
  const [comments, setComments] = useState(ws.closing.clientComments)
  const [notes, setNotes] = useState(ws.closing.notes)
  const [deviation, setDeviation] = useState(ws.time.deviationNote)
  const team = [...new Set([ws.plan.leadAuditor, ...ws.plan.auditTeam].filter(Boolean))]
  const ncCount = ws.findings.filter((f) => f.type === 'Nonconformity').length

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t('execution.closing.title')} description={t('execution.closing.description')}>
        <CheckRow checked={ws.closing.findingsPresented} disabled={locked || busy} onChange={(v) => void run(() => updateExecution(planId, { findingsPresented: v }))} label={t('execution.closing.findingsPresented', { count: ws.findings.length })} hint={t('execution.closing.findingsPresentedHint')} testId="findings-presented" />
        <fieldset className="flex flex-col gap-2" disabled={locked || busy}>
          <legend className="mb-1 text-body-sm font-medium text-neutral-800">{t('execution.closing.clientPosition')}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup">
            {POSITIONS.map((p) => (
              <button key={p} type="button" role="radio" aria-checked={ws.closing.clientPosition === p} onClick={() => void run(() => updateExecution(planId, { clientPosition: p }))} className={cn('min-h-11 rounded-md border px-3 text-body-sm font-medium', ws.closing.clientPosition === p ? 'border-primary bg-primary-50 text-primary' : 'border-neutral-200 bg-white text-neutral-700')} data-position={p}>
                {t(`execution.closing.positions.${p}`)}
              </button>
            ))}
          </div>
        </fieldset>
        <Field label={t('execution.closing.clientComments')} htmlFor="client-comments" hint={t('execution.closing.clientCommentsHint')}>
          <textarea id="client-comments" value={comments} disabled={locked} onChange={(e) => setComments(e.target.value)} onBlur={() => comments !== ws.closing.clientComments && void run(() => updateExecution(planId, { clientComments: comments }))} className={TEXTAREA_CLASS} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('execution.closing.ncDueDate')} htmlFor="nc-due" required={ncCount > 0} hint={t('execution.closing.ncDueDateHint', { count: ncCount })}>
            <input id="nc-due" type="date" value={ws.closing.ncResponseDueDate} disabled={locked || busy} onChange={(e) => void run(() => updateExecution(planId, { ncResponseDueDate: e.target.value || null }))} className={INPUT_CLASS} />
          </Field>
        </div>
        <Field label={t('execution.closing.notes')} htmlFor="closing-notes">
          <textarea id="closing-notes" value={notes} disabled={locked} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== ws.closing.notes && void run(() => updateExecution(planId, { closingNotes: notes }))} className={TEXTAREA_CLASS} />
        </Field>
      </Panel>

      <Panel title={t('execution.closing.timeTitle')} description={t('execution.closing.timeDescription')}>
        <InfoGrid
          rows={[
            [t('execution.closing.plannedDays'), daysText(ws.time.plannedDays)],
            [t('execution.closing.actualDays'), daysText(ws.time.actualDays)],
            [t('execution.closing.variance'), `${ws.time.variancePercent}%`],
          ]}
        />
        {(ws.time.status === 'under' || deviation) && (
          <Field label={t('execution.closing.deviationNote')} htmlFor="deviation-note" required={ws.time.status === 'under'} hint={t('execution.closing.deviationNoteHint')}>
            <textarea id="deviation-note" value={deviation} disabled={locked} onChange={(e) => setDeviation(e.target.value)} onBlur={() => deviation !== ws.time.deviationNote && void run(() => updateExecution(planId, { timeDeviationNote: deviation }))} className={TEXTAREA_CLASS} />
          </Field>
        )}
      </Panel>

      <AttendancePanel
        meeting="closing"
        attendees={ws.closing.attendance}
        locked={locked}
        busy={busy}
        teamNames={[...team, ...ws.opening.attendance.map((a) => a.name)]}
        onAdd={(input) => run(() => addAttendee(planId, input), t('execution.attendance.added'))}
        onSign={(a, signature, kind) => run(() => updateAttendee(planId, a.id, { signature, signatureType: kind }), t('execution.attendance.signedToast'))}
        onRemove={(a) => void run(() => removeAttendee(planId, a.id))}
      />
    </div>
  )
}
