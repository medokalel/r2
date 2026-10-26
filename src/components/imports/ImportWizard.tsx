import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { AppIcon, DownloadIcon, ExcelFileIcon, UploadOutlineIcon } from '@/components/icons'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'
import { CompletenessRing, ImportStatusChip, MiniBar } from '@/components/imports/importUi'
import { STATUS_ORDER, STATUS_STYLES, describeRow, importErrorText, issueText } from '@/components/imports/importText'
import {
  commitImport,
  getImportBatch,
  getImportErrorsFile,
  getImportTemplate,
  listIncompleteRecords,
  previewImport,
} from '@/lib/api/importsApi'
import { columnLabel, definitionLabel, editLinkFor, importDefinition, IMPORT_BATCH_PARAM, IMPORT_DEF_PARAM, IMPORT_TEMPLATE_VERSION } from '@/lib/imports/entities'
import { IMPORT_ACCEPT, IMPORT_MAX_BYTES, ImportFileError } from '@/lib/imports/workbook'
import type {
  ImportCommitMode,
  ImportContext,
  ImportDefinitionKey,
  ImportIncompleteRecord,
  ImportPreview,
  ImportPreviewRow,
  ImportResult,
  ImportRowStatus,
} from '@/lib/imports/types'
import { downloadBlob } from '@/lib/xlsxDownload'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type Step = 'template' | 'upload' | 'review' | 'import' | 'result'
const STEPS: Step[] = ['template', 'upload', 'review', 'import', 'result']
const PAGE = 60

export interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  definitionKey: ImportDefinitionKey
  context?: ImportContext
  /** Called after a commit (refresh the page's list). */
  onImported?: (result: ImportResult) => void
  /** Reopen an earlier batch (preview + result) instead of starting fresh. */
  batchId?: string | null
}

function TickMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function StepRail({ step, onSelect, reachable }: { step: Step; onSelect: (s: Step) => void; reachable: (s: Step) => boolean }) {
  const { t } = useTranslation()
  const current = STEPS.indexOf(step)
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label={t('imports.wizard.stepOf', { current: current + 1, total: STEPS.length })}>
      {STEPS.map((s, index) => {
        const done = index < current
        const active = index === current
        const canGo = reachable(s) && !active
        return (
          <li key={s} className={cn('flex min-w-0 items-center gap-1.5 sm:gap-2', index < STEPS.length - 1 && 'flex-1')}>
            <button
              type="button"
              disabled={!canGo}
              onClick={() => onSelect(s)}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex min-w-0 items-center gap-2 rounded-full text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                canGo ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-bold transition-colors',
                  active ? 'bg-primary text-white shadow-[0_0_0_4px_rgba(18,54,163,0.12)]' : done ? 'bg-primary-50 text-primary' : 'bg-neutral-100 text-neutral-500',
                )}
              >
                {done ? <TickMark /> : index + 1}
              </span>
              <span className={cn('truncate text-body-sm', active ? 'font-semibold text-text-primary' : 'hidden text-text-secondary md:inline')}>
                {t(`imports.wizard.steps.${s}`)}
              </span>
            </button>
            {index < STEPS.length - 1 && <span aria-hidden className={cn('h-px min-w-3 flex-1', done ? 'bg-primary/40' : 'bg-neutral-200')} />}
          </li>
        )
      })}
    </ol>
  )
}

function ChoiceCard({
  checked,
  onSelect,
  title,
  hint,
  disabled,
  name,
}: {
  checked: boolean
  onSelect: () => void
  title: ReactNode
  hint: ReactNode
  disabled?: boolean
  name: string
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
        checked ? 'border-primary bg-primary-25 ring-1 ring-primary' : 'border-neutral-200 bg-white hover:border-primary/50',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onSelect} className="mt-1 size-4 accent-[var(--color-primary)]" />
      <span className="min-w-0">
        <span className="block text-body-sm font-semibold text-text-primary">{title}</span>
        <span className="mt-0.5 block text-caption leading-[1.6] text-text-secondary">{hint}</span>
      </span>
    </label>
  )
}

export function ImportWizard({ open, onOpenChange, definitionKey, context, onImported, batchId }: ImportWizardProps) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const exists = (key: string) => i18n.exists(key)
  const definition = importDefinition(definitionKey)
  const entityLabel = definitionLabel(definition, lang)

  const [step, setStep] = useState<Step>('template')
  const [templateLang, setTemplateLang] = useState<'en' | 'ar'>(lang)
  const [downloading, setDownloading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [filter, setFilter] = useState<ImportRowStatus | 'all'>('all')
  const [visible, setVisible] = useState(PAGE)
  const [mode, setMode] = useState<ImportCommitMode>('complete_only')
  const [updateExisting, setUpdateExisting] = useState(false)
  const [sendWelcomeEmails, setSendWelcomeEmails] = useState(true)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [openRecords, setOpenRecords] = useState<Set<string> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('template')
    setFile(null)
    setBusy(false)
    setError('')
    setPreview(null)
    setFilter('all')
    setVisible(PAGE)
    setMode('complete_only')
    setUpdateExisting(false)
    setResult(null)
    setOpenRecords(null)
  }

  // Reopen an earlier batch (coming back from a "Complete" link).
  useEffect(() => {
    if (!open || !batchId) return
    let cancelled = false
    getImportBatch(batchId)
      .then((detail) => {
        if (cancelled) return
        setPreview(detail)
        setResult(detail.result ?? null)
        setStep(detail.result ? 'result' : 'review')
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [open, batchId])

  // Which imported records are still open (completed ones get a check mark).
  useEffect(() => {
    if (step !== 'result' || !result?.incompleteRecords.length) return
    let cancelled = false
    listIncompleteRecords({ entity: definitionKey })
      .then((records) => {
        if (!cancelled) setOpenRecords(new Set(records.map((r) => `${r.entity}:${r.recordId ?? r.id}`)))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [step, result, definitionKey])

  const close = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const downloadTemplate = async () => {
    setDownloading(true)
    try {
      const { blob, fileName } = await getImportTemplate(definitionKey, templateLang, context)
      downloadBlob(blob, fileName)
      toast.success(t('imports.template.downloaded', { file: fileName }))
    } catch (caught) {
      toast.error(getUserErrorMessage(caught, t))
    } finally {
      setDownloading(false)
    }
  }

  const runPreview = async (next: File) => {
    setFile(next)
    setError('')
    if (next.size > IMPORT_MAX_BYTES) {
      setError(t('imports.upload.errors.FILE_TOO_LARGE'))
      return
    }
    setBusy(true)
    try {
      const data = await previewImport(definition.apiEntity, next, context)
      setPreview(data)
      setFilter('all')
      setVisible(PAGE)
      setMode(data.totals.ready > 0 || data.totals.partial === 0 ? 'complete_only' : 'include_partial')
      setStep('review')
    } catch (caught) {
      setError(caught instanceof ImportFileError ? t(`imports.upload.errors.${caught.code}`) : importErrorText(t, exists, caught) || getUserErrorMessage(caught, t) || t('imports.upload.errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped && !busy) void runPreview(dropped)
  }

  const counts = preview?.totals ?? { rows: 0, ready: 0, partial: 0, invalid: 0, duplicates: 0 }
  const statusCount = (s: ImportRowStatus) => (s === 'duplicate' ? counts.duplicates : counts[s])
  const toImport = counts.ready + (mode === 'include_partial' ? counts.partial : 0) + (updateExisting ? counts.duplicates : 0)
  const filtered = useMemo(() => (preview ? preview.rows.filter((r) => filter === 'all' || r.status === filter) : []), [preview, filter])
  const hasIssues = counts.partial + counts.invalid + counts.duplicates > 0

  const rowLabel = (row: ImportPreviewRow) =>
    definition.labelColumns
      .map((k) => row.values[k])
      .filter((v) => typeof v === 'string' && v)
      .map((v) => (definition.key === 'audit_plan_sections' && v === row.values.section ? t(`imports.sectionLabel.${v}`, String(v)) : String(v)))
      .join(' · ') || t('imports.issues.rowLabel', { row: row.rowNumber })

  const downloadIssues = async () => {
    if (!preview) return
    try {
      const { blob, fileName } = await getImportErrorsFile(preview.importId, lang, definition, (row) => describeRow(t, exists, definition, lang, row))
      downloadBlob(blob, fileName)
    } catch (caught) {
      toast.error(getUserErrorMessage(caught, t))
    }
  }

  const commit = async () => {
    if (!preview) return
    setBusy(true)
    setError('')
    try {
      const done = await commitImport(preview.importId, {
        mode,
        duplicates: updateExisting ? 'update' : 'skip',
        ...(definition.key === 'clients' ? { sendWelcomeEmails } : {}),
      })
      setResult(done)
      setStep('result')
      onImported?.(done)
    } catch (caught) {
      setError(importErrorText(t, exists, caught) || getUserErrorMessage(caught, t) || t('imports.import.failed'))
    } finally {
      setBusy(false)
    }
  }

  // The way back from an edit page: this page, reopened on this batch's result.
  const returnTo = useMemo(() => {
    const params = new URLSearchParams(location.search)
    params.delete(IMPORT_BATCH_PARAM)
    params.delete(IMPORT_DEF_PARAM)
    if (preview) {
      params.set(IMPORT_BATCH_PARAM, preview.importId)
      params.set(IMPORT_DEF_PARAM, definitionKey)
    }
    const qs = params.toString()
    return `${location.pathname}${qs ? `?${qs}` : ''}`
  }, [location.pathname, location.search, preview, definitionKey])

  const completeLink = (record: ImportIncompleteRecord) =>
    editLinkFor(definition, { id: record.recordId ?? record.id, parentId: record.parentId, missing: record.missing, editRoute: record.editRoute }, returnTo).to

  const reachable = (s: Step) => {
    if (s === 'template' || s === 'upload') return step !== 'result'
    if (s === 'review') return Boolean(preview) && step !== 'result'
    if (s === 'import') return Boolean(preview) && step !== 'result' && counts.rows > 0
    return Boolean(result)
  }

  const required = definition.columns.filter((c) => c.required || c.requiredIf)
  const later = definition.columns.filter((c) => c.later || c.laterIf)
  const optional = definition.columns.filter((c) => !required.includes(c) && !later.includes(c))
  const chips = (cols: typeof required, tone: string) => (
    <div className="flex flex-wrap gap-1.5">
      {cols.map((c) => (
        <span key={c.key} className={cn('rounded-full px-2.5 py-1 text-caption font-medium', tone)}>
          {lang === 'ar' ? c.labelAr : c.labelEn}
        </span>
      ))}
    </div>
  )

  const footer = (() => {
    switch (step) {
      case 'template':
        return (
          <>
            <Button variant="outline" size="md" onClick={() => close(false)}>
              {t('imports.wizard.close')}
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep('upload')}>
              {t('imports.template.haveFile')}
            </Button>
          </>
        )
      case 'upload':
        return (
          <>
            <Button variant="outline" size="md" onClick={() => setStep('template')} disabled={busy}>
              {t('imports.wizard.back')}
            </Button>
            {preview && (
              <Button variant="primary" size="md" onClick={() => setStep('review')} disabled={busy}>
                {t('imports.wizard.continue')}
              </Button>
            )}
          </>
        )
      case 'review':
        return (
          <>
            <Button variant="outline" size="md" onClick={() => setStep('upload')}>
              {t('imports.review.otherFile')}
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep('import')} disabled={!counts.rows}>
              {t('imports.wizard.continue')}
            </Button>
          </>
        )
      case 'import':
        return (
          <>
            <Button variant="outline" size="md" onClick={() => setStep('review')} disabled={busy}>
              {t('imports.wizard.back')}
            </Button>
            <Button variant="primary" size="md" onClick={() => void commit()} disabled={busy || toImport === 0}>
              {busy ? t('imports.import.importing') : t('imports.import.confirm', { count: toImport })}
            </Button>
          </>
        )
      default:
        return (
          <>
            <Button variant="outline" size="md" onClick={reset}>
              {t('imports.result.importAnother')}
            </Button>
            <Button variant="primary" size="md" onClick={() => close(false)}>
              {t('imports.result.finish')}
            </Button>
          </>
        )
    }
  })()

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50 backdrop-blur-[1px]" />
        <Dialog.Content
          aria-describedby={undefined}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className={cn(
            'fixed inset-0 z-50 flex flex-col overflow-hidden bg-white focus:outline-none',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(92vh,880px)] sm:w-[min(1040px,calc(100vw-48px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:shadow-card',
          )}
          data-testid="import-wizard"
        >
          {/* Header */}
          <div className="shrink-0 border-b border-neutral-100 px-4 pb-4 pt-4 sm:px-7 sm:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-success-50 sm:flex">
                  <AppIcon icon={ExcelFileIcon} size={26} />
                </span>
                <div className="min-w-0">
                  <Dialog.Title className="text-[20px] font-bold leading-tight text-text-primary sm:text-[22px]">
                    {t('imports.wizard.title', { entity: entityLabel })}
                  </Dialog.Title>
                  <p className="mt-1 hidden text-body-sm text-text-secondary sm:block">{t('imports.wizard.subtitle')}</p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={t('imports.wizard.close')}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
            <div className="mt-4">
              <StepRail step={step} onSelect={setStep} reachable={reachable} />
            </div>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-7 sm:py-6">
            {step === 'template' && (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-body font-bold text-text-primary">{t('imports.template.title', { entity: entityLabel })}</h3>
                    <p className="mt-1 text-body-sm leading-[1.7] text-text-secondary">{lang === 'ar' ? definition.descriptionAr : definition.descriptionEn}</p>
                    <p className="mt-1 text-body-sm leading-[1.7] text-text-secondary">{t('imports.template.body')}</p>
                  </div>
                  <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-25 p-4">
                    <div>
                      <p className="mb-1 text-caption font-semibold uppercase tracking-[0.08em] text-error-700">{t('imports.template.required')}</p>
                      <p className="mb-2 text-caption text-text-secondary">{t('imports.template.requiredHint')}</p>
                      {chips(required, 'bg-white text-text-primary ring-1 ring-inset ring-error-200')}
                    </div>
                    {later.length > 0 && (
                      <div>
                        <p className="mb-1 text-caption font-semibold uppercase tracking-[0.08em] text-warning-800">{t('imports.template.later')}</p>
                        <p className="mb-2 text-caption text-text-secondary">{t('imports.template.laterHint')}</p>
                        {chips(later, 'bg-white text-text-primary ring-1 ring-inset ring-warning-200')}
                      </div>
                    )}
                    {optional.length > 0 && (
                      <div>
                        <p className="mb-2 text-caption font-semibold uppercase tracking-[0.08em] text-text-secondary">{t('imports.template.optional')}</p>
                        {chips(optional, 'bg-white text-text-secondary ring-1 ring-inset ring-neutral-200')}
                      </div>
                    )}
                  </div>
                  <p className="text-caption leading-[1.7] text-text-secondary">{t('imports.template.formats')}</p>
                </div>
                <div className="flex flex-col gap-4 self-start rounded-lg border border-primary-100 bg-primary-25 p-4">
                  <div className="flex items-center gap-3">
                    <AppIcon icon={ExcelFileIcon} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-semibold text-text-primary" dir="ltr">
                        iCASCO_{definition.key}_template_{IMPORT_TEMPLATE_VERSION}.xlsx
                      </p>
                      <p className="text-caption text-text-secondary">Data · Instructions · Lists</p>
                    </div>
                  </div>
                  <fieldset>
                    <legend className="mb-2 text-caption font-semibold text-text-secondary">{t('imports.template.language')}</legend>
                    <div className={pageTabListClassName}>
                      {(['en', 'ar'] as const).map((l) => (
                        <button key={l} type="button" aria-pressed={templateLang === l} onClick={() => setTemplateLang(l)} className={pageTabClassName(templateLang === l)}>
                          {t(l === 'en' ? 'imports.template.english' : 'imports.template.arabic')}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <Button variant="primary" size="md" icon={<AppIcon icon={DownloadIcon} size={18} />} onClick={() => void downloadTemplate()} disabled={downloading} data-testid="import-download-template">
                    {downloading ? t('imports.template.downloading') : t('imports.template.download')}
                  </Button>
                </div>
              </div>
            )}

            {step === 'upload' && (
              <div className="mx-auto max-w-2xl space-y-4">
                <h3 className="text-body font-bold text-text-primary">{t('imports.upload.title')}</h3>
                <div
                  role="button"
                  tabIndex={0}
                  aria-describedby="import-upload-hint"
                  onClick={() => !busy && inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if ((event.key === 'Enter' || event.key === ' ') && !busy) {
                      event.preventDefault()
                      inputRef.current?.click()
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (!dragging) setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-[1.5px] border-dashed px-5 py-12 text-center transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    dragging ? 'border-primary bg-primary-50' : 'border-slate-300 bg-slate-50 hover:border-primary hover:bg-primary-25',
                    busy && 'pointer-events-none',
                  )}
                >
                  <span className={cn('flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-[0_1px_2px_rgba(15,23,42,0.08),inset_0_0_0_1px_#d9e2f0]', busy && 'animate-pulse')}>
                    <AppIcon icon={UploadOutlineIcon} size={24} />
                  </span>
                  {busy && file ? (
                    <>
                      <p className="text-body-sm font-semibold text-text-primary">{t('imports.upload.reading', { file: file.name })}</p>
                      <p className="text-caption text-text-secondary">{t('imports.upload.readingHint')}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-body-sm font-semibold text-text-primary">
                        {t('imports.upload.drop')} <span className="text-primary underline decoration-primary/30 underline-offset-2">{t('imports.upload.browse')}</span>
                      </p>
                      <p id="import-upload-hint" className="text-caption text-text-secondary">
                        {t('imports.upload.formats', { size: IMPORT_MAX_BYTES / 1024 / 1024 })}
                      </p>
                      {file && (
                        <p className="flex items-center gap-2 text-caption text-text-secondary" dir="ltr">
                          <AppIcon icon={ExcelFileIcon} size={16} />
                          {file.name}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept={IMPORT_ACCEPT}
                  className="sr-only"
                  tabIndex={-1}
                  data-testid="import-file-input"
                  onChange={(event) => {
                    const picked = event.target.files?.[0]
                    event.target.value = ''
                    if (picked) void runPreview(picked)
                  }}
                />
                {error && (
                  <Alert tone="error" role="alert" title={error} />
                )}
              </div>
            )}

            {step === 'review' && preview && (
              <div className="space-y-5">
                <div className="grid gap-4 rounded-xl border border-neutral-100 bg-white p-4 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-6">
                  <div className="flex items-center gap-4">
                    <CompletenessRing value={preview.completeness} label={t('imports.review.completeness')} />
                    <div className="md:hidden">
                      <p className="text-body-sm font-semibold text-text-primary">{t('imports.review.completeness')}</p>
                      <p className="text-caption text-text-secondary">{t('imports.review.rowsRead', { count: counts.rows })}</p>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="hidden items-baseline justify-between gap-3 md:flex">
                      <p className="text-body-sm font-semibold text-text-primary">{t('imports.review.completeness')}</p>
                      <p className="text-caption text-text-secondary">{t('imports.review.rowsRead', { count: counts.rows })}</p>
                    </div>
                    <p className="text-caption text-text-secondary">{t('imports.review.completenessHint')}</p>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100" aria-hidden>
                      {STATUS_ORDER.map((s) =>
                        statusCount(s) > 0 ? <span key={s} className={cn('h-full transition-[width] duration-500', STATUS_STYLES[s].bar)} style={{ width: `${(statusCount(s) / Math.max(1, counts.rows)) * 100}%` }} /> : null,
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {STATUS_ORDER.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setFilter(filter === s ? 'all' : s)
                            setVisible(PAGE)
                          }}
                          aria-pressed={filter === s}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-start transition-colors',
                            filter === s ? 'border-primary bg-primary-25' : 'border-neutral-100 bg-neutral-25 hover:border-neutral-300',
                          )}
                          data-testid={`import-count-${s}`}
                        >
                          <span className="flex items-center gap-2 text-caption font-semibold text-text-secondary">
                            <span aria-hidden className={cn('size-2 rounded-full', STATUS_STYLES[s].dot)} />
                            {t(`imports.review.status.${s}`)}
                          </span>
                          <span className="mt-0.5 block text-[20px] font-bold tabular-nums text-text-primary">{statusCount(s)}</span>
                          <span className="block truncate text-caption text-text-secondary">{t(`imports.review.statusHint.${s}`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {(preview.templateOutdated ?? (Boolean(preview.templateVersion) && preview.templateVersion !== IMPORT_TEMPLATE_VERSION)) && (
                  <Alert tone="info" title={t('imports.review.oldTemplate', { version: preview.templateVersion ?? '' })} />
                )}
                {(preview.columnsUnknown?.length ?? 0) > 0 && <Alert tone="info" title={t('imports.review.columnsUnknown', { columns: preview.columnsUnknown?.join(', ') })} />}
                {!preview.templateVersion && <Alert tone="info" title={t('imports.review.notTemplate')} />}
                {preview.columnsMissing.length > 0 && (
                  <Alert tone="warning" title={t('imports.review.columnsMissing', { columns: preview.columnsMissing.map((k) => columnLabel(definition, k, lang)).join(', ') })}>
                    {t('imports.review.columnsRecognised', { count: preview.columnsRecognised.length })}
                  </Alert>
                )}

                {counts.rows === 0 ? (
                  <Alert tone="warning" title={t('imports.review.noRows')} />
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className={pageTabListClassName} role="group" aria-label={t('imports.review.filterLabel')}>
                        {(['all', ...STATUS_ORDER] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            aria-pressed={filter === s}
                            onClick={() => {
                              setFilter(s)
                              setVisible(PAGE)
                            }}
                            className={pageTabClassName(filter === s)}
                          >
                            {s === 'all' ? t('imports.review.filterAll') : t(`imports.review.status.${s}`)}
                            <span className="text-caption tabular-nums text-text-secondary">{s === 'all' ? counts.rows : statusCount(s)}</span>
                          </button>
                        ))}
                      </div>
                      {hasIssues && (
                        <Button variant="secondary" size="sm" icon={<AppIcon icon={DownloadIcon} size={16} />} onClick={() => void downloadIssues()} title={t('imports.review.downloadIssuesHint')} data-testid="import-download-issues">
                          {t('imports.review.downloadIssues')}
                        </Button>
                      )}
                    </div>

                    {filtered.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-body-sm text-text-secondary">{t('imports.review.empty')}</p>
                    ) : (
                      <>
                        {/* Desktop table */}
                        <div className="hidden overflow-hidden rounded-lg border border-neutral-100 md:block">
                          <table className="w-full table-fixed border-collapse text-start text-body-sm">
                            <thead>
                              <tr className="bg-neutral-25 text-caption font-semibold uppercase tracking-[0.06em] text-text-secondary">
                                <th className="w-16 px-3 py-2.5 text-start">{t('imports.review.table.row')}</th>
                                <th className="w-[26%] px-3 py-2.5 text-start">{t('imports.review.table.record')}</th>
                                <th className="w-28 px-3 py-2.5 text-start">{t('imports.review.table.status')}</th>
                                <th className="w-32 px-3 py-2.5 text-start">{t('imports.review.table.completeness')}</th>
                                <th className="px-3 py-2.5 text-start">{t('imports.review.table.issues')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.slice(0, visible).map((row) => (
                                <tr key={row.rowNumber} className="border-t border-neutral-100 align-top" data-testid="import-row">
                                  <td className="px-3 py-3 tabular-nums text-text-secondary">{row.rowNumber}</td>
                                  <td className="break-words px-3 py-3 font-medium text-text-primary">{rowLabel(row)}</td>
                                  <td className="px-3 py-3">
                                    <ImportStatusChip status={row.status} />
                                  </td>
                                  <td className="px-3 py-3">
                                    <MiniBar value={row.completeness} />
                                  </td>
                                  <td className="px-3 py-3">
                                    <RowIssues row={row} definitionKey={definitionKey} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Phone cards */}
                        <ul className="space-y-2 md:hidden">
                          {filtered.slice(0, visible).map((row) => (
                            <li key={row.rowNumber} className="rounded-lg border border-neutral-100 bg-white p-3" data-testid="import-row-card">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-caption text-text-secondary">{t('imports.issues.rowLabel', { row: row.rowNumber })}</p>
                                  <p className="break-words text-body-sm font-semibold text-text-primary">{rowLabel(row)}</p>
                                </div>
                                <ImportStatusChip status={row.status} />
                              </div>
                              <div className="mt-2">
                                <MiniBar value={row.completeness} />
                              </div>
                              <div className="mt-2">
                                <RowIssues row={row} definitionKey={definitionKey} />
                              </div>
                            </li>
                          ))}
                        </ul>
                        {filtered.length > visible && (
                          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                            <span className="text-caption text-text-secondary">{t('imports.review.showing', { shown: visible, total: filtered.length })}</span>
                            <Button variant="tertiary" size="sm" onClick={() => setVisible((v) => v + PAGE)}>
                              {t('imports.review.showMore')}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 'import' && preview && (
              <div className="mx-auto max-w-2xl space-y-5">
                <h3 className="text-body font-bold text-text-primary">{t('imports.import.title')}</h3>
                <div className="grid gap-3">
                  <ChoiceCard
                    name="import-mode"
                    checked={mode === 'complete_only'}
                    onSelect={() => setMode('complete_only')}
                    title={t('imports.import.completeOnly')}
                    hint={t('imports.import.completeOnlyHint', { count: counts.ready })}
                  />
                  <ChoiceCard
                    name="import-mode"
                    checked={mode === 'include_partial'}
                    onSelect={() => setMode('include_partial')}
                    disabled={counts.partial === 0}
                    title={t('imports.import.includePartial')}
                    hint={t('imports.import.includePartialHint', { count: counts.ready + counts.partial })}
                  />
                </div>
                {counts.duplicates > 0 && (
                  <fieldset className="space-y-3">
                    <legend className="mb-2 text-body-sm font-semibold text-text-primary">{t('imports.import.duplicates', { count: counts.duplicates })}</legend>
                    <ChoiceCard name="import-duplicates" checked={!updateExisting} onSelect={() => setUpdateExisting(false)} title={t('imports.import.skip')} hint={t('imports.import.skipHint')} />
                    <ChoiceCard name="import-duplicates" checked={updateExisting} onSelect={() => setUpdateExisting(true)} title={t('imports.import.update')} hint={t('imports.import.updateHint')} />
                  </fieldset>
                )}
                {definition.key === 'clients' && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-4">
                    <input type="checkbox" checked={sendWelcomeEmails} onChange={(e) => setSendWelcomeEmails(e.target.checked)} className="mt-1 size-4 accent-[var(--color-primary)]" />
                    <span className="min-w-0">
                      <span className="block text-body-sm font-semibold text-text-primary">{t('imports.import.welcomeEmails')}</span>
                      <span className="mt-0.5 block text-caption text-text-secondary">{t('imports.import.welcomeEmailsHint')}</span>
                    </span>
                  </label>
                )}
                {counts.invalid > 0 && <Alert tone="warning" title={t('imports.import.invalidNote', { count: counts.invalid })} />}
                <div className="flex items-center justify-between gap-3 rounded-lg bg-neutral-25 px-4 py-3">
                  <span className="text-body-sm font-semibold text-text-primary">{toImport > 0 ? t('imports.import.summary', { count: toImport }) : t('imports.import.nothing')}</span>
                </div>
                {error && <Alert tone="error" role="alert" title={error} />}
              </div>
            )}

            {step === 'result' && result && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                    <TickMark size={24} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-bold text-text-primary">{t('imports.result.title')}</h3>
                    {preview && <p className="truncate text-body-sm text-text-secondary">{t('imports.result.subtitle', { file: preview.fileName, entity: entityLabel })}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ['created', result.created, 'text-success-700'],
                      ['updated', result.updated, 'text-info-700'],
                      ['skipped', result.skipped, 'text-text-secondary'],
                      ['failed', result.failed, result.failed ? 'text-error-700' : 'text-text-secondary'],
                    ] as const
                  ).map(([key, value, tone]) => (
                    <div key={key} className="rounded-lg border border-neutral-100 bg-white px-4 py-3" data-testid={`import-result-${key}`}>
                      <p className="text-caption font-semibold text-text-secondary">{t(`imports.result.${key}`)}</p>
                      <p className={cn('mt-0.5 text-[24px] font-bold tabular-nums', tone)}>{value}</p>
                    </div>
                  ))}
                </div>

                {result.incompleteRecords.length > 0 ? (
                  <section className="rounded-xl border border-warning-200 bg-bg-warning/60 p-4 sm:p-5" aria-labelledby="import-complete-title">
                    <h4 id="import-complete-title" className="text-body font-bold text-text-primary">
                      {t('imports.result.completeTitle', { count: result.incompleteRecords.filter((r) => !openRecords || openRecords.has(`${r.entity}:${r.id}`)).length })}
                    </h4>
                    <p className="mt-1 text-caption leading-[1.6] text-text-secondary">{t('imports.result.completeHint')}</p>
                    <ul className="mt-3 space-y-2">
                      {result.incompleteRecords.map((record) => {
                        const done = openRecords ? !openRecords.has(`${record.entity}:${record.id}`) : false
                        const to = completeLink(record)
                        return (
                          <li key={`${record.entity}:${record.id}`} className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]" data-testid="import-incomplete">
                            <div className="min-w-0 flex-1">
                              <p className="break-words text-body-sm font-semibold text-text-primary">{record.label}</p>
                              <p className="text-caption text-text-secondary">{t('imports.review.missing', { fields: record.missing.map((f) => columnLabel(definition, f, lang)).join(', ') })}</p>
                            </div>
                            <MiniBar value={record.completeness} />
                            {done ? (
                              <span className="inline-flex items-center gap-1 text-caption font-semibold text-success-700">
                                <TickMark />
                                {t('imports.result.completed')}
                              </span>
                            ) : to ? (
                              <Link to={to} onClick={() => onOpenChange(false)} className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-body-sm font-semibold !text-white hover:bg-primary-hover" data-testid="import-complete-link">
                                {t('imports.result.complete')}
                              </Link>
                            ) : (
                              <span className="text-caption text-text-secondary">{t('imports.result.noEditPage')}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ) : (
                  <Alert tone="success" title={t('imports.result.allDone')} />
                )}
                <Link to="/cab/migration" onClick={() => onOpenChange(false)} className="inline-flex text-body-sm font-semibold text-primary hover:underline">
                  {t('imports.result.openHub')}
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-white px-4 py-3 sm:px-7 sm:py-4">
            <span className="text-caption text-text-secondary">{t('imports.wizard.stepOf', { current: STEPS.indexOf(step) + 1, total: STEPS.length })}</span>
            <div className="flex flex-wrap gap-2 sm:gap-3">{footer}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function RowIssues({ row, definitionKey }: { row: ImportPreviewRow; definitionKey: ImportDefinitionKey }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const definition = importDefinition(definitionKey)
  const exists = (key: string) => i18n.exists(key)
  const laterMissing = row.missing.filter((f) => !row.errors.some((e) => e.field === f))
  const warnings = row.warnings.filter((w) => w.code !== 'DUPLICATE_EXISTING')
  if (!row.errors.length && !warnings.length && !laterMissing.length && row.status !== 'duplicate') {
    return <span className="text-caption text-success-700">{t('imports.review.noIssues')}</span>
  }
  return (
    <ul className="space-y-0.5 text-caption leading-[1.55]">
      {row.errors.map((issue, i) => (
        <li key={`e${i}`} className="text-error-700">
          {issueText(t, exists, definition, lang, issue)}
        </li>
      ))}
      {row.status === 'duplicate' && <li className="text-info-700">{t('imports.review.matched')}</li>}
      {laterMissing.length > 0 && <li className="text-warning-800">{t('imports.review.missing', { fields: laterMissing.map((f) => columnLabel(definition, f, lang)).join(', ') })}</li>}
      {warnings.map((issue, i) => (
        <li key={`w${i}`} className="text-text-secondary">
          {issueText(t, exists, definition, lang, issue)}
        </li>
      ))}
    </ul>
  )
}
