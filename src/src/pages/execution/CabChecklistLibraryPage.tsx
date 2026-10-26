import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import { ChecklistEditor } from '@/components/checklists/ChecklistEditor'
import { Chip, Field, LibraryReviewBadge, Panel } from '@/components/execution/executionUi'
import { INPUT_CLASS } from '@/components/execution/fieldClasses'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'
import {
  createChecklist,
  deleteChecklist,
  getChecklist,
  getLibraryChecklist,
  listChecklists,
  updateChecklist,
  type ChecklistInput,
  type ChecklistTemplate,
} from '@/lib/api/checklistsApi'
import { localized } from '@/lib/execution/executionText'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'

type Tab = 'library' | 'cab'

/** Checklist library (/cab/checklists): the iCASCO library (draft for review) and the CAB's own checklists. */
export function CabChecklistLibraryPage() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(params.get('checklist') || params.get('item') ? 'cab' : 'library')
  const [list, setList] = useState<ChecklistTemplate[]>([])
  const [search, setSearch] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<ChecklistTemplate | null>(null)
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [newName, setNewName] = useState('')
  const [newStandard, setNewStandard] = useState('')
  const focusItem = params.get('item')

  useEffect(() => {
    let alive = true
    listChecklists({ source: tab, includeArchived, search })
      .then((rows) => alive && setList(rows))
      .catch(() => alive && setList([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [tab, includeArchived, search, reloadKey])

  // Deep link (?checklist=<id>&item=<id>, or ?item=<id> from the import) opens the editor once.
  const deepId = params.get('checklist')
  const [deepDone, setDeepDone] = useState(false)
  useEffect(() => {
    if (deepDone || (!deepId && !focusItem)) return
    let alive = true
    const find = async (): Promise<ChecklistTemplate | null> => {
      if (deepId) return getChecklist(deepId)
      const own = await listChecklists({ source: 'cab', includeArchived: true })
      for (const c of own) {
        const full = await getChecklist(c.id as string)
        if ((full.items ?? []).some((i) => i.id === focusItem)) return full
      }
      return null
    }
    find().then((c) => {
      if (!alive) return
      setDeepDone(true)
      if (c) setOpen(c)
    }, () => alive && setDeepDone(true))
    return () => {
      alive = false
    }
  }, [deepId, focusItem, deepDone])

  const reload = () => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  const run = async <T,>(action: () => Promise<T>, success: string): Promise<T | null> => {
    setBusy(true)
    try {
      const result = await action()
      toast.success(success)
      return result
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
      return null
    } finally {
      setBusy(false)
    }
  }

  const view = async (c: ChecklistTemplate) => {
    const full = c.source === 'library' ? await getLibraryChecklist(c.key as string) : await getChecklist(c.id as string)
    setOpen(full)
    setParams((p) => {
      const next = new URLSearchParams(p)
      next.delete('item')
      if (full.id) next.set('checklist', full.id)
      else next.delete('checklist')
      return next
    }, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copy = async (source: ChecklistTemplate) => {
    const created = await run(() => createChecklist(source.source === 'library' ? { fromLibrary: source.key as string } : { fromChecklistId: source.id as string }), t('execution.checklists.copied'))
    if (created) {
      setTab('cab')
      setOpen(created)
      reload()
    }
  }

  const save = async (input: ChecklistInput) => {
    if (!open?.id) return
    const saved = await run(() => updateChecklist(open.id as string, input), t('execution.checklists.saved'))
    if (saved) {
      setOpen(saved)
      reload()
    }
  }

  const create = async () => {
    if (!newName.trim() || !newStandard.trim()) return
    const created = await run(() => createChecklist({ name: newName.trim(), standardCode: newStandard.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_'), kind: 'CUSTOM', items: [] }), t('execution.checklists.created'))
    if (created) {
      setNewName('')
      setNewStandard('')
      setTab('cab')
      setOpen(created)
      reload()
    }
  }

  return (
    <CabLayout>
      <div className="flex min-h-screen flex-col">
        <CabHeader title={t('execution.checklists.title')} subtitle={t('execution.checklists.subtitle')} />
        <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden page-main">
          <Alert tone="warning" title={t('execution.checklists.draftTitle')}>{t('execution.checklists.draftBody')}</Alert>

          {open && (
            <ChecklistEditor
              key={`${open.id ?? open.key}-${open.version}`}
              checklist={open}
              busy={busy}
              focusItemId={focusItem}
              onSave={(input) => void save(input)}
              onCopy={() => void copy(open)}
              onClose={() => {
                setOpen(null)
                setParams((p) => {
                  const next = new URLSearchParams(p)
                  next.delete('checklist')
                  next.delete('item')
                  return next
                }, { replace: true })
              }}
            />
          )}

          <Panel
            title={t('execution.checklists.listTitle')}
            actions={<ImportMenuButton definitionKey="checklists" size="md" onImported={() => { setTab('cab'); reload() }} />}
          >
            <div className={pageTabListClassName} role="tablist" aria-label={t('execution.checklists.listTitle')}>
              {(['library', 'cab'] as Tab[]).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} className={pageTabClassName(tab === key)} onClick={() => { setLoading(true); setTab(key) }} data-tab={key}>
                  {t(`execution.checklists.tabs.${key}`)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('execution.checklists.search')} aria-label={t('execution.checklists.search')} className={`${INPUT_CLASS} sm:max-w-sm`} />
              {tab === 'cab' && (
                <label className="flex min-h-11 items-center gap-2 text-body-sm text-neutral-800">
                  <input type="checkbox" className="size-5 accent-primary" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
                  {t('execution.checklists.showArchived')}
                </label>
              )}
            </div>

            {loading ? (
              <div className="skeleton h-24 w-full" aria-busy="true" />
            ) : list.length === 0 ? (
              <p className="text-body-sm text-neutral-600">{tab === 'cab' ? t('execution.checklists.emptyCab') : t('execution.checklists.emptySearch')}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2" data-testid="checklist-list">
                {list.map((c) => (
                  <li key={c.id ?? c.key} className="flex flex-col gap-3 rounded-lg border border-neutral-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-body-sm font-bold text-neutral-900">{localized(i18n.language, c.name, c.nameAr)}</p>
                        <p className="mt-0.5 text-caption text-neutral-600">{[c.standardLabel || c.standardCode, t('execution.checklists.itemCount', { count: c.itemCount }), `v${c.version}`].join(' · ')}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <LibraryReviewBadge draft={c.draft} reviewStatus={c.reviewStatus} />
                        {c.isDefault && <Chip className="border-success-500 bg-success-50 text-success-700">{t('execution.checklists.default')}</Chip>}
                        {c.status === 'ARCHIVED' && <Chip className="border-neutral-300 bg-neutral-50 text-neutral-700">{t('execution.checklists.archived')}</Chip>}
                        <Chip className="border-primary-300 bg-primary-50 text-primary-700">{t(`execution.checklists.kinds.${c.kind}`)}</Chip>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="md" variant="outline" onClick={() => void view(c)} data-testid="view-checklist">{c.source === 'library' ? t('execution.checklists.view') : t('execution.checklists.edit')}</Button>
                      <Button type="button" size="md" variant="outline" disabled={busy} onClick={() => void copy(c)}>{t('execution.checklists.copy')}</Button>
                      {c.source === 'cab' && c.status === 'ACTIVE' && !c.isDefault && (
                        <Button type="button" size="md" variant="outline" disabled={busy} onClick={async () => { if (await run(() => updateChecklist(c.id as string, { isDefault: true }), t('execution.checklists.defaultSet'))) reload() }}>{t('execution.checklists.makeDefault')}</Button>
                      )}
                      {c.source === 'cab' && (
                        <Button type="button" size="md" variant="outline" disabled={busy} onClick={async () => { if (await run(() => updateChecklist(c.id as string, { status: c.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' }), t('execution.checklists.saved'))) reload() }}>
                          {c.status === 'ACTIVE' ? t('execution.checklists.archive') : t('execution.checklists.restore')}
                        </Button>
                      )}
                      {c.source === 'cab' && (
                        <Button type="button" size="md" variant="destructive" disabled={busy} onClick={async () => { if (window.confirm(t('execution.checklists.deleteConfirm', { name: c.name })) && (await run(() => deleteChecklist(c.id as string), t('execution.checklists.deleted'))) !== null) { if (open?.id === c.id) setOpen(null); reload() } }}>
                          {t('execution.checklists.delete')}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={t('execution.checklists.newTitle')} description={t('execution.checklists.newHint')}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
              <Field label={t('execution.checklists.name')} htmlFor="new-checklist-name"><input id="new-checklist-name" value={newName} onChange={(e) => setNewName(e.target.value)} className={INPUT_CLASS} /></Field>
              <Field label={t('execution.checklists.standardCode')} htmlFor="new-checklist-standard"><input id="new-checklist-standard" dir="ltr" value={newStandard} onChange={(e) => setNewStandard(e.target.value)} className={INPUT_CLASS} placeholder="HALAL" /></Field>
              <Button type="button" size="md" disabled={busy || !newName.trim() || !newStandard.trim()} onClick={() => void create()}>{t('execution.checklists.create')}</Button>
            </div>
          </Panel>
        </main>
      </div>
    </CabLayout>
  )
}
