import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash } from 'iconsax-reactjs'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Chip, Field, Panel, ProgressBar } from '@/components/execution/executionUi'
import { INPUT_CLASS } from '@/components/execution/fieldClasses'
import { addTimeEntry, removeTimeEntry, type AuditExecutionWorkspace } from '@/lib/api/executionApi'
import { daysText, durationText } from '@/lib/execution/executionText'
import { formatDate } from '@/lib/format/dates'
import { cn } from '@/lib/utils'

interface TimePanelProps {
  ws: AuditExecutionWorkspace
  busy: boolean
  locked: boolean
  run: (action: () => Promise<AuditExecutionWorkspace>, success?: string) => Promise<boolean>
}

const STATUS_TONE: Record<AuditExecutionWorkspace['time']['status'], string> = {
  notStarted: 'border-neutral-300 bg-neutral-50 text-neutral-700',
  within: 'border-success-500 bg-success-50 text-success-700',
  under: 'border-warning-500 bg-warning-50 text-warning-700',
  over: 'border-info-500 bg-info-50 text-info-700',
}

/** Time spent by the audit team against the planned audit days (IAF MD 5); feeds the competence audit log. */
export function TimePanel({ ws, busy, locked, run }: TimePanelProps) {
  const { t, i18n } = useTranslation()
  const team = [...new Set([ws.plan.leadAuditor, ...ws.plan.auditTeam].filter(Boolean))]
  const [auditor, setAuditor] = useState(team[0] ?? '')
  const [date, setDate] = useState(ws.plan.startDate)
  const [hours, setHours] = useState('8')
  const [activity, setActivity] = useState('')
  const [remote, setRemote] = useState(false)
  const time = ws.time
  const minutes = Math.round(Number(hours) * 60)

  const add = async () => {
    if (!auditor || !date || !(minutes > 0)) return
    if (await run(() => addTimeEntry(ws.plan.id, { auditorName: auditor, date, minutes, activity, remote }), t('execution.time.added'))) setActivity('')
  }

  return (
    <Panel
      title={t('execution.time.title')}
      description={t('execution.time.description')}
      actions={<Chip className={STATUS_TONE[time.status]}>{t(`execution.time.status.${time.status}`)}</Chip>}
    >
      <ProgressBar
        value={time.actualDays}
        total={Math.max(time.plannedDays, time.actualDays) || 1}
        tone={time.status === 'under' ? 'warning' : time.status === 'within' ? 'success' : 'primary'}
        label={
          <>
            <span>{t('execution.time.actual', { days: daysText(time.actualDays) })}</span>
            <span>{t('execution.time.planned', { days: daysText(time.plannedDays) })}</span>
          </>
        }
      />
      {time.remoteDays > 0 && <p className="text-caption text-neutral-600">{t('execution.time.remoteShare', { days: daysText(time.remoteDays), percent: time.remoteSharePercent })}</p>}
      {time.byAuditor.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {time.byAuditor.map((a) => (
            <li key={a.name} className="flex items-center justify-between rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
              <span className="font-medium text-neutral-900">{a.name}</span>
              <span className="text-neutral-700">{t('execution.time.days', { days: daysText(a.days) })}</span>
            </li>
          ))}
        </ul>
      )}
      {time.entries.length > 0 && (
        <ul className="flex flex-col divide-y divide-neutral-100 rounded-md border border-neutral-100" data-testid="time-entries">
          {time.entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="text-body-sm font-medium text-neutral-900">{e.auditorName} · {durationText(t, e.minutes)}</p>
                <p className="text-caption text-neutral-600">{[formatDate(e.date, i18n.language), e.activity, e.remote ? t('execution.time.remote') : ''].filter(Boolean).join(' · ')}</p>
              </div>
              {!locked && (
                <button type="button" className="flex size-10 items-center justify-center rounded-md text-error-700 hover:bg-error-50" aria-label={t('execution.time.remove')} onClick={() => void run(() => removeTimeEntry(ws.plan.id, e.id))}>
                  <Trash size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!locked && (
        <div className={cn('grid grid-cols-1 gap-3 rounded-md border border-dashed border-neutral-200 bg-neutral-25 p-3 sm:grid-cols-2 lg:grid-cols-5')}>
          <Field label={t('execution.time.auditor')} htmlFor="time-auditor">
            <select id="time-auditor" value={auditor} onChange={(e) => setAuditor(e.target.value)} className={INPUT_CLASS}>
              {team.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label={t('execution.time.date')} htmlFor="time-date">
            <input id="time-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label={t('execution.time.hoursLabel')} htmlFor="time-hours">
            <input id="time-hours" type="number" min="0.25" max="24" step="0.25" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label={t('execution.time.activity')} htmlFor="time-activity">
            <input id="time-activity" value={activity} onChange={(e) => setActivity(e.target.value)} className={INPUT_CLASS} placeholder={t('execution.time.activityPlaceholder')} />
          </Field>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex min-h-11 items-center gap-2 text-body-sm text-neutral-800">
              <Checkbox checked={remote} onChange={() => setRemote((v) => !v)} />
              {t('execution.time.remoteLabel')}
            </label>
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="button" size="md" variant="outline" disabled={busy || !auditor || !(minutes > 0)} onClick={() => void add()} data-testid="add-time">
              {t('execution.time.add')}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}
