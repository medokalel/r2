import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui'
import { DialogDateField, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  addCompetenceAuditLog,
  deleteCompetenceAuditLog,
  rememberSavedPerson,
  updateCompetenceAuditLog,
  updateCompetencePerson,
  type CompetenceAuditLogEntry,
  type CompetencePerson,
} from '@/lib/api/cabCompetenceApi'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { notSet } from '@/lib/emptyValue'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'

type Tab = 'trainings' | 'witnessings' | 'auditLogs'
type Training = NonNullable<CompetencePerson['trainings']>[number]
type Witnessing = NonNullable<CompetencePerson['witnessings']>[number]

const TRAINING_RESULTS: Training['result'][] = ['Completed', 'Pending', 'Failed']
const WITNESS_OUTCOMES: Witnessing['outcome'][] = ['Positive', 'Conditional', 'Negative']
const AUDIT_RESULTS: CompetenceAuditLogEntry['result'][] = ['Satisfactory', 'Needs Improvement', 'Unsatisfactory']

/** Draft of the row being added or edited in the dialog (string fields only). */
type Draft = Record<string, string>

interface Props {
  person: CompetencePerson
  onChange: (person: CompetencePerson) => void
}

const cellClass = 'px-3 py-3 text-body-sm text-neutral-800'
const headClass = 'px-3 py-3 text-start text-caption font-semibold text-white'

/** Trainings, witnessed audits and audit log of a person, with add / edit / delete. */
export function CompetenceRecordsTabs({ person, onChange }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('trainings')
  const [editing, setEditing] = useState<{ tab: Tab; id: string | null; draft: Draft; fromPlan?: boolean } | null>(null)
  const [deleting, setDeleting] = useState<{ tab: Tab; id: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trainings = person.trainings ?? []
  const witnessings = person.witnessings ?? []
  const auditLogs = person.auditLogs ?? []
  const label = (value: string) => t(`cab.competence.records.values.${value.replace(/\s+/g, '')}`, value)

  const labels: Record<Tab, string> = {
    trainings: t('cab.competence.records.tabs.trainings', 'Trainings'),
    witnessings: t('cab.competence.records.tabs.witnessings', 'Witnessed audits'),
    auditLogs: t('cab.competence.records.tabs.auditLogs', 'Audit log'),
  }

  const openNew = (which: Tab) => {
    setError(null)
    const today = new Date().toISOString().slice(0, 10)
    const draft: Draft =
      which === 'trainings'
        ? { date: today, course: '', provider: '', result: 'Completed' }
        : which === 'witnessings'
          ? { date: today, client: '', clientCode: '', auditType: '', witnessedBy: '', outcome: 'Positive' }
          : { date: today, client: '', clientCode: '', activity: '', role: 'Auditor', result: 'Satisfactory' }
    setEditing({ tab: which, id: null, draft })
  }

  const openEdit = (which: Tab, row: Training | Witnessing | CompetenceAuditLogEntry) => {
    setError(null)
    const { id, ...rest } = row
    const draft = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, String(v ?? '')]))
    setEditing({ tab: which, id, draft, fromPlan: which === 'auditLogs' && (row as CompetenceAuditLogEntry).source === 'auditPlan' })
  }

  const required: Record<Tab, string[]> = {
    trainings: ['date', 'course', 'result'],
    witnessings: ['date', 'client', 'auditType', 'witnessedBy', 'outcome'],
    auditLogs: ['date', 'client', 'activity', 'role', 'result'],
  }
  const draftValid = editing ? required[editing.tab].every((key) => (editing.draft[key] ?? '').trim()) : false

  /** Runs a save; demo mode keeps the person in the local register first. */
  const persist = async (run: () => Promise<CompetencePerson | undefined>, fallback: CompetencePerson) => {
    rememberSavedPerson(person)
    const saved = await run()
    onChange(saved ?? fallback)
  }

  const save = async () => {
    if (!editing) return
    setBusy(true)
    setError(null)
    const d = editing.draft
    try {
      if (editing.tab === 'trainings') {
        const row: Training = { id: editing.id ?? `tr-${Date.now()}`, date: d.date, course: d.course.trim(), provider: d.provider?.trim() ?? '', result: d.result as Training['result'] }
        const list = editing.id ? trainings.map((x) => (x.id === editing.id ? row : x)) : [row, ...trainings]
        await persist(() => updateCompetencePerson(person.id, { trainings: list }), { ...person, trainings: list })
      } else if (editing.tab === 'witnessings') {
        const row: Witnessing = {
          id: editing.id ?? `wt-${Date.now()}`,
          date: d.date,
          client: d.client.trim(),
          clientCode: d.clientCode?.trim() ?? '',
          auditType: d.auditType.trim(),
          witnessedBy: d.witnessedBy.trim(),
          outcome: d.outcome as Witnessing['outcome'],
        }
        const list = editing.id ? witnessings.map((x) => (x.id === editing.id ? row : x)) : [row, ...witnessings]
        await persist(() => updateCompetencePerson(person.id, { witnessings: list }), { ...person, witnessings: list })
      } else {
        const input = { date: d.date, client: d.client.trim(), clientCode: d.clientCode?.trim() ?? '', activity: d.activity.trim(), role: d.role.trim(), result: d.result as CompetenceAuditLogEntry['result'] }
        if (editing.id) {
          const patch = editing.fromPlan ? { result: input.result } : input
          const list = auditLogs.map((x) => (x.id === editing.id ? { ...x, ...patch } : x))
          const id = editing.id
          await persist(() => updateCompetenceAuditLog(person.id, id, patch), { ...person, auditLogs: list })
        } else {
          const list = [{ ...input, id: `log-${Date.now()}`, source: 'manual' as const }, ...auditLogs]
          await persist(() => addCompetenceAuditLog(person.id, input), { ...person, auditLogs: list })
        }
      }
      toast.success(t('cab.competence.records.saved', 'Saved.'))
      setEditing(null)
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      if (deleting.tab === 'trainings') {
        const list = trainings.filter((x) => x.id !== deleting.id)
        await persist(() => updateCompetencePerson(person.id, { trainings: list }), { ...person, trainings: list })
      } else if (deleting.tab === 'witnessings') {
        const list = witnessings.filter((x) => x.id !== deleting.id)
        await persist(() => updateCompetencePerson(person.id, { witnessings: list }), { ...person, witnessings: list })
      } else {
        const list = auditLogs.filter((x) => x.id !== deleting.id)
        const id = deleting.id
        await persist(() => deleteCompetenceAuditLog(person.id, id), { ...person, auditLogs: list })
      }
      toast.success(t('cab.competence.records.deleted', 'Deleted.'))
      setDeleting(null)
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const setDraft = (key: string, value: string) => setEditing((prev) => (prev ? { ...prev, draft: { ...prev.draft, [key]: value } } : prev))
  const rowActions = (which: Tab, row: Training | Witnessing | CompetenceAuditLogEntry, canDelete = true) => (
    <div className="flex justify-end gap-2">
      <button type="button" className="text-caption font-semibold text-primary hover:underline" onClick={() => openEdit(which, row)}>
        {t('common.edit', 'Edit')}
      </button>
      {canDelete && (
        <button type="button" className="text-caption font-semibold text-error-600 hover:underline" onClick={() => setDeleting({ tab: which, id: row.id })}>
          {t('common.delete', 'Delete')}
        </button>
      )}
    </div>
  )

  const empty = (text: string) => (
    <tr>
      <td colSpan={6} className="px-3 py-6 text-center text-body-sm text-neutral-600">
        {text}
      </td>
    </tr>
  )

  const field = (key: string, labelText: string, opts: { required?: boolean; disabled?: boolean } = {}) => (
    <TextField id={`competence-${key}`} label={labelText} required={opts.required} disabled={opts.disabled} value={editing?.draft[key] ?? ''} maxLength={300} onChange={(e) => setDraft(key, e.target.value)} />
  )
  const select = (key: string, labelText: string, values: string[], disabled = false) => (
    <SelectField id={`competence-${key}`} label={labelText} required disabled={disabled} value={editing?.draft[key] ?? ''} options={values.map((v) => ({ value: v, label: label(v) }))} onChange={(v) => setDraft(key, v)} />
  )

  return (
    <section className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label={t('cab.competence.records.title', 'Competence records')} className={pageTabListClassName}>
          {(Object.keys(labels) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={pageTabClassName(tab === key)}
            >
              {labels[key]} ({key === 'trainings' ? trainings.length : key === 'witnessings' ? witnessings.length : auditLogs.length})
            </button>
          ))}
        </div>
        <Button type="button" size="sm" className="h-9 px-4" onClick={() => openNew(tab)}>
          {tab === 'trainings'
            ? t('cab.competence.records.addTraining', '+ Add training')
            : tab === 'witnessings'
              ? t('cab.competence.records.addWitnessing', '+ Add witnessed audit')
              : t('cab.competence.records.addAuditLog', '+ Add audit')}
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-primary">
            {tab === 'trainings' && (
              <tr>
                <th className={headClass}>{t('cab.competence.records.date', 'Date')}</th>
                <th className={headClass}>{t('cab.competence.records.course', 'Course')}</th>
                <th className={headClass}>{t('cab.competence.records.provider', 'Provider')}</th>
                <th className={headClass}>{t('cab.competence.records.result', 'Result')}</th>
                <th className={headClass} />
              </tr>
            )}
            {tab === 'witnessings' && (
              <tr>
                <th className={headClass}>{t('cab.competence.records.date', 'Date')}</th>
                <th className={headClass}>{t('cab.competence.records.client', 'Client')}</th>
                <th className={headClass}>{t('cab.competence.records.auditType', 'Audit type')}</th>
                <th className={headClass}>{t('cab.competence.records.witnessedBy', 'Witnessed by')}</th>
                <th className={headClass}>{t('cab.competence.records.outcome', 'Outcome')}</th>
                <th className={headClass} />
              </tr>
            )}
            {tab === 'auditLogs' && (
              <tr>
                <th className={headClass}>{t('cab.competence.records.date', 'Date')}</th>
                <th className={headClass}>{t('cab.competence.records.client', 'Client')}</th>
                <th className={headClass}>{t('cab.competence.records.activity', 'Activity')}</th>
                <th className={headClass}>{t('cab.competence.records.role', 'Role')}</th>
                <th className={headClass}>{t('cab.competence.records.result', 'Result')}</th>
                <th className={headClass} />
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tab === 'trainings' &&
              (trainings.length
                ? trainings.map((row) => (
                    <tr key={row.id}>
                      <td className={cellClass} dir="ltr">{row.date}</td>
                      <td className={cellClass}>{row.course}</td>
                      <td className={cellClass}>{row.provider || notSet()}</td>
                      <td className={cellClass}>{label(row.result)}</td>
                      <td className={cellClass}>{rowActions('trainings', row)}</td>
                    </tr>
                  ))
                : empty(t('cab.competence.records.noTrainings', 'No trainings recorded yet.')))}
            {tab === 'witnessings' &&
              (witnessings.length
                ? witnessings.map((row) => (
                    <tr key={row.id}>
                      <td className={cellClass} dir="ltr">{row.date}</td>
                      <td className={cellClass}>
                        {row.client}
                        {row.clientCode && <span className="block text-caption text-neutral-600">{row.clientCode}</span>}
                      </td>
                      <td className={cellClass}>{row.auditType}</td>
                      <td className={cellClass}>{row.witnessedBy}</td>
                      <td className={cellClass}>{label(row.outcome)}</td>
                      <td className={cellClass}>{rowActions('witnessings', row)}</td>
                    </tr>
                  ))
                : empty(t('cab.competence.records.noWitnessings', 'No witnessed audits recorded yet.')))}
            {tab === 'auditLogs' &&
              (auditLogs.length
                ? auditLogs.map((row) => (
                    <tr key={row.id}>
                      <td className={cellClass} dir="ltr">{row.date}</td>
                      <td className={cellClass}>
                        {row.client}
                        {row.clientCode && <span className="block text-caption text-neutral-600">{row.clientCode}</span>}
                      </td>
                      <td className={cellClass}>
                        {row.activity}
                        <span className="mt-0.5 block text-caption text-neutral-600">
                          {row.source === 'manual' ? t('cab.competence.records.sourceManual', 'Added by hand') : t('cab.competence.records.sourcePlan', 'From audit plan')}
                        </span>
                      </td>
                      <td className={cellClass}>{row.role}</td>
                      <td className={cellClass}>{label(row.result)}</td>
                      <td className={cellClass}>{rowActions('auditLogs', row, row.source === 'manual')}</td>
                    </tr>
                  ))
                : empty(t('cab.competence.records.noAuditLogs', 'No audits recorded yet. Completed audit plans are added automatically.')))}
          </tbody>
        </table>
      </div>

      <WorkflowDialog
        open={editing !== null}
        size="lg"
        title={editing ? `${editing.id ? t('common.edit', 'Edit') : t('common.add', 'Add')} · ${labels[editing.tab]}` : ''}
        description={editing?.fromPlan ? t('cab.competence.records.planHint', 'This audit was recorded from a completed audit plan; only the result can be changed.') : undefined}
        confirmLabel={t('common.save', 'Save')}
        confirmDisabled={!draftValid}
        busy={busy}
        error={error}
        onConfirm={() => void save()}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editing.fromPlan ? (
              <p className="text-body-sm text-neutral-700 sm:col-span-2">
                {editing.draft.date} · {editing.draft.client} · {editing.draft.activity}
              </p>
            ) : (
              <DialogDateField label={t('cab.competence.records.date', 'Date')} required value={editing.draft.date ?? ''} onChange={(v) => setDraft('date', v)} />
            )}
            {editing.tab === 'trainings' && (
              <>
                {field('course', t('cab.competence.records.course', 'Course'), { required: true })}
                {field('provider', t('cab.competence.records.provider', 'Provider'))}
                {select('result', t('cab.competence.records.result', 'Result'), TRAINING_RESULTS)}
              </>
            )}
            {editing.tab === 'witnessings' && (
              <>
                {field('client', t('cab.competence.records.client', 'Client'), { required: true })}
                {field('clientCode', t('cab.competence.records.clientCode', 'Client code'))}
                {field('auditType', t('cab.competence.records.auditType', 'Audit type'), { required: true })}
                {field('witnessedBy', t('cab.competence.records.witnessedBy', 'Witnessed by'), { required: true })}
                {select('outcome', t('cab.competence.records.outcome', 'Outcome'), WITNESS_OUTCOMES)}
              </>
            )}
            {editing.tab === 'auditLogs' && (
              <>
                {!editing.fromPlan && (
                  <>
                    {field('client', t('cab.competence.records.client', 'Client'), { required: true })}
                    {field('clientCode', t('cab.competence.records.clientCode', 'Client code'))}
                    {field('activity', t('cab.competence.records.activity', 'Activity'), { required: true })}
                    {field('role', t('cab.competence.records.role', 'Role'), { required: true })}
                  </>
                )}
                {select('result', t('cab.competence.records.result', 'Result'), AUDIT_RESULTS)}
              </>
            )}
          </div>
        )}
      </WorkflowDialog>

      <WorkflowDialog
        open={deleting !== null}
        title={t('common.delete', 'Delete')}
        description={t('cab.competence.records.confirmDelete', 'Delete this record?')}
        confirmLabel={t('common.delete', 'Delete')}
        tone="destructive"
        busy={busy}
        onConfirm={() => void remove()}
        onClose={() => setDeleting(null)}
      />
    </section>
  )
}
