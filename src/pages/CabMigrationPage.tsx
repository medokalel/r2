import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AppIcon, DownloadIcon, ExcelFileIcon, UploadOutlineIcon } from '@/components/icons'
import { Alert } from '@/components/ui/Alert'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'
import { CompletenessRing, MiniBar } from '@/components/imports/importUi'
import { ImportWizard } from '@/components/imports/ImportWizard'
import { getImportTemplate, getMigrationStatus, listImportHistory, listIncompleteRecords, resolveIncompleteRecord } from '@/lib/api/importsApi'
import {
  columnLabel,
  definitionLabel,
  editLinkFor,
  IMPORT_BATCH_PARAM,
  IMPORT_DEF_PARAM,
  IMPORT_DEFINITIONS,
  MIGRATION_ORDER,
  importDefinition,
} from '@/lib/imports/entities'
import type { ImportDefinitionKey, ImportHistoryItem, ImportIncompleteRecord, MigrationStatus } from '@/lib/imports/types'
import { formatDate, formatDateTime } from '@/lib/format/dates'
import { CAB_HOME, ROUTES } from '@/lib/routes'
import { downloadBlob } from '@/lib/xlsxDownload'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const RETURN_TO = ROUTES.cabMigration

/** /cab/migration: every import template in one place, the CAB's migration progress and the records to complete. */
export function CabMigrationPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [history, setHistory] = useState<ImportHistoryItem[]>([])
  const [open, setOpen] = useState<ImportIncompleteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [areaFilter, setAreaFilter] = useState<ImportDefinitionKey | 'all'>('all')
  const [wizard, setWizard] = useState<{ key: ImportDefinitionKey; batchId: string | null } | null>(null)

  const load = useCallback(async () => {
    try {
      const [s, h, records] = await Promise.all([getMigrationStatus(), listImportHistory(), listIncompleteRecords()])
      setStatus(s)
      setHistory(h)
      setOpen(records)
      setError('')
    } catch (caught) {
      setError(getUserErrorMessage(caught, t) || t('imports.hub.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    let cancelled = false
    Promise.all([getMigrationStatus(), listImportHistory(), listIncompleteRecords()])
      .then(([s, h, records]) => {
        if (cancelled) return
        setStatus(s)
        setHistory(h)
        setOpen(records)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(getUserErrorMessage(caught, t) || t('imports.hub.loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  // Back from "Complete" in the wizard: reopen it on that batch, then clean the URL.
  const reopenDef = params.get(IMPORT_DEF_PARAM) as ImportDefinitionKey | null
  const reopenBatch = params.get(IMPORT_BATCH_PARAM)
  const [handledBatch, setHandledBatch] = useState<string | null>(null)
  if (reopenDef && reopenBatch && reopenDef in IMPORT_DEFINITIONS && handledBatch !== reopenBatch) {
    setHandledBatch(reopenBatch)
    setWizard({ key: reopenDef, batchId: reopenBatch })
  }
  useEffect(() => {
    if (!reopenBatch || handledBatch !== reopenBatch) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(IMPORT_DEF_PARAM)
        next.delete(IMPORT_BATCH_PARAM)
        return next
      },
      { replace: true },
    )
  }, [reopenBatch, handledBatch, setParams])

  // Overall progress from the API: the average progress of every area (imported records that need nothing more).
  const progress = status?.overall.progress ?? 0
  const started = status?.overall.started ?? 0
  const records = useMemo(() => open.filter((r) => areaFilter === 'all' || r.entity === areaFilter), [open, areaFilter])
  const areasWithRecords = useMemo(() => MIGRATION_ORDER.filter((e) => open.some((r) => r.entity === e)), [open])

  const dismiss = async (record: ImportIncompleteRecord) => {
    try {
      await resolveIncompleteRecord(record.id)
      setOpen((list) => list.filter((r) => r.id !== record.id))
      void load()
    } catch (caught) {
      toast.error(getUserErrorMessage(caught, t))
    }
  }

  const download = async (key: ImportDefinitionKey) => {
    try {
      const { blob, fileName } = await getImportTemplate(key, lang)
      downloadBlob(blob, fileName)
      toast.success(t('imports.template.downloaded', { file: fileName }))
    } catch (caught) {
      toast.error(getUserErrorMessage(caught, t))
    }
  }

  const recordLink = (record: ImportIncompleteRecord) =>
    editLinkFor(importDefinition(record.entity), { id: record.recordId ?? record.id, parentId: record.parentId, missing: record.missing, editRoute: record.editRoute }, RETURN_TO).to

  return (
    <CabLayout tourId="cab-migration" tourSteps={[]}>
      <CabHeader title={t('imports.hub.title')} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main" data-testid="migration-hub">
        <Breadcrumbs items={[{ label: t('nav.home'), to: CAB_HOME }, { label: t('imports.hub.breadcrumb') }]} />

        {/* Intro + overall progress */}
        <section className="grid gap-5 rounded-2xl border border-neutral-100 bg-white p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="min-w-0">
            <h1 className="text-page-title text-text-primary">{t('imports.hub.title')}</h1>
            <p className="mt-2 max-w-3xl text-body-sm leading-[1.75] text-text-secondary">{t('imports.hub.subtitle')}</p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(['step1', 'step2', 'step3', 'step4'] as const).map((key, index) => (
                <li key={key} className="flex gap-3 rounded-lg bg-neutral-25 p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-caption font-bold text-primary">{index + 1}</span>
                  <span className="text-caption leading-[1.6] text-text-secondary">{t(`imports.hub.how.${key}`)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-primary-100 bg-primary-25 p-4">
            <CompletenessRing value={progress} label={t('imports.hub.progress')} />
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-text-primary">{t('imports.hub.progress')}</p>
              <p className="mt-1 text-caption leading-[1.6] text-text-secondary" data-testid="migration-progress-hint">
                {t('imports.hub.progressHint', { done: started, total: MIGRATION_ORDER.length, open: open.length })}
              </p>
            </div>
          </div>
        </section>

        {error && <Alert tone="error" role="alert" title={error} action={<Button variant="outline" size="sm" onClick={() => void load()}>{t('imports.hub.retry')}</Button>} />}

        {/* Areas in the suggested order */}
        <section aria-labelledby="migration-order" className="space-y-3">
          <div>
            <h2 id="migration-order" className="text-body font-bold text-text-primary">{t('imports.hub.order')}</h2>
            <p className="text-caption text-text-secondary">{t('imports.hub.orderHint')}</p>
          </div>
          <ol className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {MIGRATION_ORDER.map((entity, index) => {
              const definition = IMPORT_DEFINITIONS[entity]
              const row = status?.entities.find((e) => e.entity === entity)
              const imported = (row?.imported ?? 0) + (row?.updated ?? 0)
              const incomplete = row?.incomplete ?? 0
              return (
                <li key={entity} className="flex flex-col rounded-xl border border-neutral-100 bg-white p-4 transition-shadow hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]" data-testid={`migration-card-${entity}`}>
                  <div className="flex items-start gap-3">
                    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-bold', imported ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-text-secondary')}>
                      {imported && !incomplete ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-body-sm font-bold text-text-primary">{definitionLabel(definition, lang)}</h3>
                      <p className="mt-1 text-caption leading-[1.6] text-text-secondary">{lang === 'ar' ? definition.descriptionAr : definition.descriptionEn}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {loading ? (
                      <span className="h-6 w-24 animate-pulse rounded-full bg-neutral-100" />
                    ) : imported === 0 ? (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-caption font-semibold text-text-secondary">{t('imports.hub.status.notStarted')}</span>
                    ) : (
                      <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-caption font-semibold text-success-700 ring-1 ring-inset ring-success-200">{t('imports.hub.status.imported', { count: imported })}</span>
                    )}
                    {incomplete > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAreaFilter(entity)
                          document.getElementById('migration-to-complete')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className="rounded-full bg-warning-50 px-2.5 py-0.5 text-caption font-semibold text-warning-800 ring-1 ring-inset ring-warning-200 hover:bg-warning-100"
                      >
                        {t('imports.hub.status.toComplete', { count: incomplete })}
                      </button>
                    )}
                    {row?.lastImport && <span className="text-caption text-text-secondary">{t('imports.hub.lastImport', { date: formatDate(row.lastImport.createdAt) })}</span>}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button variant="primary" size="sm" icon={<AppIcon icon={UploadOutlineIcon} size={16} />} onClick={() => setWizard({ key: entity, batchId: null })} data-testid={`migration-import-${entity}`}>
                      {t('imports.hub.import')}
                    </Button>
                    <Button variant="outline" size="sm" icon={<AppIcon icon={DownloadIcon} size={16} />} onClick={() => void download(entity)}>
                      {t('imports.hub.template')}
                    </Button>
                    <Link to={definition.route} className="inline-flex h-9 items-center px-2 text-body-sm font-semibold text-primary hover:underline">
                      {t('imports.hub.openRegister')}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Records to complete across areas */}
        <section id="migration-to-complete" aria-labelledby="migration-to-complete-title" className="scroll-mt-4 space-y-3 rounded-2xl border border-neutral-100 bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="migration-to-complete-title" className="text-body font-bold text-text-primary">
                {t('imports.hub.toComplete')} <span className="ms-1 rounded-full bg-warning-50 px-2 py-0.5 text-caption font-semibold text-warning-800">{open.length}</span>
              </h2>
              <p className="mt-1 max-w-3xl text-caption leading-[1.6] text-text-secondary">{t('imports.hub.toCompleteHint')}</p>
            </div>
          </div>
          {areasWithRecords.length > 1 && (
            <div className={pageTabListClassName} role="group">
              <button type="button" aria-pressed={areaFilter === 'all'} onClick={() => setAreaFilter('all')} className={pageTabClassName(areaFilter === 'all')}>
                {t('imports.hub.filterAll')}
              </button>
              {areasWithRecords.map((entity) => (
                <button key={entity} type="button" aria-pressed={areaFilter === entity} onClick={() => setAreaFilter(entity)} className={pageTabClassName(areaFilter === entity)}>
                  {definitionLabel(IMPORT_DEFINITIONS[entity], lang)}
                </button>
              ))}
            </div>
          )}
          {!loading && records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-body-sm text-text-secondary">{t('imports.hub.toCompleteEmpty')}</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {records.map((record) => {
                const definition = importDefinition(record.entity)
                return (
                  <li key={`${record.entity}:${record.id}`} className="flex flex-wrap items-center gap-3 py-3" data-testid="migration-record">
                    <div className="min-w-0 flex-1">
                      <p className="text-caption font-semibold text-text-secondary">{definitionLabel(definition, lang)}</p>
                      <p className="break-words text-body-sm font-semibold text-text-primary">{record.label}</p>
                      <p className="text-caption text-warning-800">{t('imports.review.missing', { fields: record.missing.map((f) => columnLabel(definition, f, lang)).join(', ') })}</p>
                    </div>
                    <MiniBar value={record.completeness} />
                    <div className="flex items-center gap-1">
                      <Button variant="tertiary" size="sm" onClick={() => void dismiss(record)} title={t('imports.hub.dismissHint')}>
                        {t('imports.hub.dismiss')}
                      </Button>
                      <Link to={recordLink(record)} className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-body-sm font-semibold !text-white hover:bg-primary-hover" data-testid="migration-complete-link">
                        {t('imports.result.complete')}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Recent imports */}
        <section aria-labelledby="migration-history" className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-4 sm:p-6">
          <h2 id="migration-history" className="text-body font-bold text-text-primary">{t('imports.hub.history')}</h2>
          {history.length === 0 ? (
            <p className="text-body-sm text-text-secondary">{loading ? t('common.loading') : t('imports.hub.historyEmpty')}</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {history.slice(0, 8).map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                  <AppIcon icon={ExcelFileIcon} size={22} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold text-text-primary" dir="ltr">
                      {item.fileName}
                    </p>
                    <p className="text-caption text-text-secondary">
                      {definitionLabel(IMPORT_DEFINITIONS[item.entity], lang)} · {formatDateTime(item.createdAt)} · {t('imports.hub.historyRows', { count: item.totals.rows })}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-caption font-semibold', item.status === 'committed' ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-text-secondary')}>
                    {t(`imports.hub.historyStatus.${item.status}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      {wizard && (
        <ImportWizard
          open
          onOpenChange={(next) => {
            if (!next) {
              setWizard(null)
              void load()
            }
          }}
          definitionKey={wizard.key}
          batchId={wizard.batchId}
          onImported={() => void load()}
        />
      )}
    </CabLayout>
  )
}
