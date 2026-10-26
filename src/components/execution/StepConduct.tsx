import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChecklistItemCard } from '@/components/checklists/ChecklistItemCard'
import { ApprovedLibraryBadge, Field, Panel, ProgressBar } from '@/components/execution/executionUi'
import { INPUT_CLASS } from '@/components/execution/fieldClasses'
import { TimePanel } from '@/components/execution/TimePanel'
import type { ConductProps } from '@/components/execution/types'
import { NC_RESULTS } from '@/lib/api/executionApi'
import { localized } from '@/lib/execution/executionText'
import { formatDate } from '@/lib/format/dates'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'

type Filter = 'all' | 'open' | 'nonconforming'

/** Step 3: agenda by auditor, live checklists (results, evidence, photos, findings) and time spent. */
export function StepConduct({ ws, busy, run, pendingItemIds, onItemChange, onPhoto, onRemoveFile, onRaiseFinding }: ConductProps) {
  const { t, i18n } = useTranslation()
  const [checklistId, setChecklistId] = useState(ws.checklists[0]?.id ?? '')
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const checklist = ws.checklists.find((c) => c.id === checklistId) ?? ws.checklists[0]
  const resultsLocked = ws.steps.some((s) => s.key === 'closing' && s.status === 'done')

  const byAuditor = useMemo(() => {
    const groups = new Map<string, typeof ws.plan.agenda>()
    for (const row of ws.plan.agenda) {
      for (const name of row.auditors.length ? row.auditors : [ws.plan.leadAuditor]) {
        groups.set(name, [...(groups.get(name) ?? []), row])
      }
    }
    return [...groups.entries()]
  }, [ws])

  const items = (checklist?.items ?? []).filter((item) => {
    if (filter === 'open' && item.result) return false
    if (filter === 'nonconforming' && !(item.result && NC_RESULTS.includes(item.result))) return false
    const q = query.trim().toLowerCase()
    return !q || `${item.clause} ${item.title} ${item.titleAr} ${item.requirement}`.toLowerCase().includes(q)
  })
  const filesOf = (itemId: string) => ws.files.filter((f) => f.checklistItemId === itemId)

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t('execution.conduct.progressTitle')}>
        <ProgressBar
          value={ws.conduct.progress.answered}
          total={ws.conduct.progress.total}
          label={
            <>
              <span>{t('execution.conduct.answered', { answered: ws.conduct.progress.answered, total: ws.conduct.progress.total })}</span>
              <span>{t('execution.conduct.ncCount', { count: ws.conduct.progress.minorNc + ws.conduct.progress.majorNc })}</span>
            </>
          }
        />
      </Panel>

      {byAuditor.length > 0 && (
        <Panel title={t('execution.conduct.timelineTitle')} description={t('execution.conduct.timelineDescription')}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {byAuditor.map(([name, rows]) => (
              <div key={name} className="rounded-md border border-neutral-100 p-3">
                <p className="text-body-sm font-semibold text-neutral-900">{name}</p>
                <ol className="mt-2 flex flex-col gap-1.5">
                  {rows.map((r) => (
                    <li key={`${name}-${r.id}`} className="flex flex-wrap gap-x-3 text-caption text-neutral-700">
                      <span className="font-semibold text-primary">{formatDate(r.date, i18n.language)} · {t('execution.timeRange', { start: r.startTime, end: r.endTime })}</span>
                      <span>{r.activity}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title={t('execution.conduct.checklistsTitle')}
        description={resultsLocked ? t('execution.conduct.lockedHint') : t('execution.conduct.checklistsDescription')}
        actions={checklist?.sourceType === 'library' ? <ApprovedLibraryBadge /> : undefined}
      >
        {ws.checklists.length === 0 ? (
          <p className="text-body-sm text-neutral-600">{t('execution.preparation.noChecklists')}</p>
        ) : (
          <>
            <div className="hidden md:block">
              <div className={pageTabListClassName} role="tablist" aria-label={t('execution.conduct.checklistsTitle')}>
                {ws.checklists.map((c) => (
                  <button key={c.id} type="button" role="tab" aria-selected={c.id === checklist?.id} className={pageTabClassName(c.id === checklist?.id)} onClick={() => setChecklistId(c.id)}>
                    {localized(i18n.language, c.name, c.nameAr)} ({c.progress.answered}/{c.progress.total})
                  </button>
                ))}
              </div>
            </div>
            <div className="md:hidden">
              <Field label={t('execution.conduct.checklist')} htmlFor="checklist-picker">
                <select id="checklist-picker" value={checklist?.id} onChange={(e) => setChecklistId(e.target.value)} className={INPUT_CLASS}>
                  {ws.checklists.map((c) => <option key={c.id} value={c.id}>{localized(i18n.language, c.name, c.nameAr)} ({c.progress.answered}/{c.progress.total})</option>)}
                </select>
              </Field>
            </div>
            {checklist && (
              <p className="text-caption text-neutral-600">{t('execution.conduct.assignedTo', { name: checklist.auditorName || '·' })}</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('execution.conduct.search')} aria-label={t('execution.conduct.search')} className={`${INPUT_CLASS} sm:max-w-xs`} />
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('execution.conduct.filter')}>
                {(['all', 'open', 'nonconforming'] as Filter[]).map((f) => (
                  <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={`min-h-11 rounded-md border px-3 text-body-sm font-medium ${filter === f ? 'border-primary bg-primary-50 text-primary' : 'border-neutral-200 bg-white text-neutral-700'}`}>
                    {t(`execution.conduct.filters.${f}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <ChecklistItemCard
                  key={item.id}
                  item={item}
                  files={filesOf(item.id)}
                  locked={resultsLocked}
                  pending={pendingItemIds.has(item.id)}
                  onChange={(update) => onItemChange(item, update)}
                  onPhoto={(file) => onPhoto(item, file)}
                  onRemovePhoto={onRemoveFile}
                  onRaiseFinding={onRaiseFinding}
                />
              ))}
              {items.length === 0 && <p className="text-body-sm text-neutral-600">{t('execution.conduct.noMatch')}</p>}
            </div>
          </>
        )}
      </Panel>

      <TimePanel ws={ws} busy={busy} locked={resultsLocked} run={run} />
    </div>
  )
}
