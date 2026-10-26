import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AttendancePanel } from '@/components/execution/AttendancePanel'
import { CheckRow, Field, Panel } from '@/components/execution/executionUi'
import { TEXTAREA_CLASS } from '@/components/execution/fieldClasses'
import type { StepProps } from '@/components/execution/types'
import { addAttendee, removeAttendee, updateAttendee, updateExecution } from '@/lib/api/executionApi'
import { formatDate } from '@/lib/format/dates'

/** Step 2: agenda and confidentiality confirmed, ICT test for remote parts, attendance with signatures. */
export function StepOpening({ ws, busy, locked, run }: StepProps) {
  const { t, i18n } = useTranslation()
  const planId = ws.plan.id
  const [notes, setNotes] = useState(ws.opening.notes)
  const team = [...new Set([ws.plan.leadAuditor, ...ws.plan.auditTeam].filter(Boolean))]

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t('execution.opening.title')} description={t('execution.opening.description')}>
        <div className="flex flex-col gap-2">
          <CheckRow checked={ws.opening.agendaConfirmed} disabled={locked || busy} onChange={(v) => void run(() => updateExecution(planId, { agendaConfirmed: v }))} label={t('execution.opening.agendaConfirmed')} hint={t('execution.opening.agendaConfirmedHint')} testId="agenda-confirmed" />
          <CheckRow checked={ws.opening.confidentialityConfirmed} disabled={locked || busy} onChange={(v) => void run(() => updateExecution(planId, { confidentialityConfirmed: v }))} label={t('execution.opening.confidentiality')} hint={t('execution.opening.confidentialityHint')} testId="confidentiality-confirmed" />
          {ws.opening.ictRequired && (
            <CheckRow checked={ws.opening.ictTestDone} disabled={locked || busy} onChange={(v) => void run(() => updateExecution(planId, { ictTestDone: v }))} label={t('execution.opening.ictTest')} hint={t('execution.opening.ictTestHint', { platform: ws.plan.remotePlatform || '·' })} testId="ict-test" />
          )}
        </div>
        <Field label={t('execution.opening.notes')} htmlFor="opening-notes">
          <textarea id="opening-notes" value={notes} disabled={locked} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== ws.opening.notes && void run(() => updateExecution(planId, { openingNotes: notes }))} className={TEXTAREA_CLASS} />
        </Field>
      </Panel>

      <Panel title={t('execution.opening.agendaTitle')}>
        {ws.plan.agenda.length === 0 ? (
          <p className="text-body-sm text-neutral-600">{t('execution.opening.noAgenda')}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {ws.plan.agenda.map((a) => (
              <li key={a.id} className="flex flex-col gap-0.5 rounded-md border border-neutral-100 px-3 py-2 sm:flex-row sm:items-center sm:gap-4">
                <span className="shrink-0 text-caption font-semibold text-primary" dir="ltr">{formatDate(a.date, i18n.language)} · {t('execution.timeRange', { start: a.startTime, end: a.endTime })}</span>
                <span className="min-w-0 flex-1 text-body-sm text-neutral-900">{a.activity}</span>
                <span className="text-caption text-neutral-600">{a.auditors.join(', ')}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <AttendancePanel
        meeting="opening"
        attendees={ws.opening.attendance}
        locked={locked}
        busy={busy}
        teamNames={team}
        onAdd={(input) => run(() => addAttendee(planId, input), t('execution.attendance.added'))}
        onSign={(a, signature, kind) => run(() => updateAttendee(planId, a.id, { signature, signatureType: kind }), t('execution.attendance.signedToast'))}
        onRemove={(a) => void run(() => removeAttendee(planId, a.id))}
      />
    </div>
  )
}
