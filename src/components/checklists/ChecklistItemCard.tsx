import { useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown2, Camera, Trash } from 'iconsax-reactjs'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/execution/executionUi'
import { INPUT_CLASS, TEXTAREA_CLASS } from '@/components/execution/fieldClasses'
import { cn } from '@/lib/utils'
import {
  CHECKLIST_RESULTS,
  NC_RESULTS,
  type AuditChecklistItemResult,
  type ChecklistResultKey,
  type ExecutionFile,
  type ItemUpdate,
} from '@/lib/api/executionApi'
import { RESULT_TONE, localized, resultLabel, resultShortLabel, splitList } from '@/lib/execution/executionText'

interface ChecklistItemCardProps {
  item: AuditChecklistItemResult
  files: ExecutionFile[]
  locked: boolean
  /** The change was queued while offline (shown with a "Waiting to sync" chip). */
  pending: boolean
  onChange: (update: ItemUpdate) => void
  onPhoto: (file: File) => void
  onRemovePhoto: (file: ExecutionFile) => void
  /** Opens the finding form pre-filled from this item. */
  onRaiseFinding: (item: AuditChecklistItemResult) => void
}

/** Results that lead to a finding in the audit report. */
const FINDING_RESULTS: ChecklistResultKey[] = [...NC_RESULTS, 'observation', 'ofi']

/** One requirement of a live checklist: result, evidence notes, documents sampled, interviewees, photos and the finding it raised. */
export function ChecklistItemCard({ item, files, locked, pending, onChange, onPhoto, onRemovePhoto, onRaiseFinding }: ChecklistItemCardProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(item.notes)
  const [docs, setDocs] = useState(item.documentsSampled.join(', '))
  const [people, setPeople] = useState(item.interviewees.join(', '))
  const lang = i18n.language
  const prompts = lang.startsWith('ar') && item.evidencePromptsAr.length ? item.evidencePromptsAr : item.evidencePrompts
  const sampling = localized(lang, item.samplingHint, item.samplingHintAr)
  const needsFinding = item.result !== null && FINDING_RESULTS.includes(item.result) && !item.findingId

  // Keep local text in step with the item when it changes from outside (sync, reload).
  const [prevItem, setPrevItem] = useState(item)
  if (prevItem !== item) {
    setPrevItem(item)
    if (prevItem.notes !== item.notes) setNotes(item.notes)
    if (prevItem.documentsSampled.join() !== item.documentsSampled.join()) setDocs(item.documentsSampled.join(', '))
    if (prevItem.interviewees.join() !== item.interviewees.join()) setPeople(item.interviewees.join(', '))
  }

  const photo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onPhoto(file)
  }

  return (
    <article
      className={cn('flex min-w-0 flex-col gap-3 rounded-lg border bg-white p-3 sm:p-4', item.result && NC_RESULTS.includes(item.result) ? 'border-error-200' : 'border-neutral-100')}
      data-testid="checklist-item"
      data-clause={item.clause}
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 rounded-sm bg-primary-50 px-2 py-1 text-caption font-bold text-primary" dir="ltr">{item.clause}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-body-sm font-semibold text-neutral-900">
            {localized(lang, item.title, item.titleAr)}
            {item.mandatory && <span className="ms-1 text-error-700" aria-label={t('execution.conduct.mandatory')}>*</span>}
          </h3>
          <p className="mt-1 text-body-sm text-neutral-700">{localized(lang, item.requirement, item.requirementAr)}</p>
        </div>
      </div>

      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-11 items-center gap-2 self-start rounded-md px-1 text-body-sm font-medium text-primary">
        <ArrowDown2 size={16} className={cn('transition-transform', open && 'rotate-180')} />
        {open ? t('execution.conduct.hideGuidance') : t('execution.conduct.showGuidance')}
      </button>
      {open && (
        <div className="flex flex-col gap-2 rounded-md bg-neutral-25 p-3 text-body-sm text-neutral-700">
          <p><span className="font-semibold text-neutral-900">{t('execution.conduct.guidance')}: </span>{localized(lang, item.guidance, item.guidanceAr)}</p>
          {prompts.length > 0 && (
            <div>
              <p className="font-semibold text-neutral-900">{t('execution.conduct.evidencePrompts')}</p>
              <ul className="list-disc ps-5">{prompts.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}
          {sampling && <p><span className="font-semibold text-neutral-900">{t('execution.conduct.sampling')}: </span>{sampling}</p>}
        </div>
      )}

      <fieldset className="flex flex-col gap-2" disabled={locked}>
        <legend className="mb-1 text-caption font-medium text-neutral-700">{t('execution.conduct.result')}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7" role="radiogroup">
          {CHECKLIST_RESULTS.map((result) => {
            const selected = item.result === result
            return (
              <button
                key={result}
                type="button"
                role="radio"
                aria-checked={selected}
                title={resultLabel(t, result)}
                onClick={() => onChange({ result: selected ? null : result })}
                className={cn(
                  'min-h-11 rounded-md border px-2 text-caption font-semibold transition-colors disabled:opacity-60',
                  selected ? RESULT_TONE[result] : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
                )}
                data-result={result}
              >
                {resultShortLabel(t, result)}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5 lg:col-span-2">
          <span className="text-caption font-medium text-neutral-700">{t('execution.conduct.notes')}</span>
          <textarea
            value={notes}
            disabled={locked}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== item.notes && onChange({ notes })}
            className={cn(TEXTAREA_CLASS, 'min-h-20')}
            placeholder={t('execution.conduct.notesPlaceholder')}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-neutral-700">{t('execution.conduct.documentsSampled')}</span>
          <input value={docs} disabled={locked} onChange={(e) => setDocs(e.target.value)} onBlur={() => docs !== item.documentsSampled.join(', ') && onChange({ documentsSampled: splitList(docs) })} className={INPUT_CLASS} placeholder={t('execution.conduct.listPlaceholder')} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-neutral-700">{t('execution.conduct.interviewees')}</span>
          <input value={people} disabled={locked} onChange={(e) => setPeople(e.target.value)} onBlur={() => people !== item.interviewees.join(', ') && onChange({ interviewees: splitList(people) })} className={INPUT_CLASS} placeholder={t('execution.conduct.listPlaceholder')} />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((f) => (
            <li key={f.id} className="relative">
              {f.url && f.mimeType.startsWith('image/') ? (
                <img src={f.url} alt={f.caption || f.name} className="size-20 rounded-md border border-neutral-100 object-cover" />
              ) : (
                <a href={f.url || undefined} target="_blank" rel="noreferrer" className="flex size-20 items-center justify-center rounded-md border border-neutral-100 bg-neutral-25 p-1 text-center text-caption text-neutral-700">{f.name}</a>
              )}
              {!locked && (
                <button type="button" onClick={() => onRemovePhoto(f)} className="absolute -end-2 -top-2 flex size-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-error-700" aria-label={t('execution.conduct.removePhoto', { name: f.name })}>
                  <Trash size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!locked && (
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-primary bg-white px-4 text-body-sm font-semibold text-primary hover:bg-primary-50">
            <Camera size={18} />
            {t('execution.conduct.addPhoto')}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={photo} data-testid="photo-input" />
          </label>
        )}
        {item.findingCode && <Chip className="border-primary-300 bg-primary-50 text-primary-700">{t('execution.conduct.finding', { code: item.findingCode })}</Chip>}
        {needsFinding && !locked && (
          <Button type="button" size="md" variant={item.result && NC_RESULTS.includes(item.result) ? 'primary' : 'outline'} onClick={() => onRaiseFinding(item)} data-testid="raise-finding">
            {t('execution.conduct.raiseFinding')}
          </Button>
        )}
        {pending && <Chip className="border-warning-500 bg-warning-50 text-warning-700">{t('execution.offline.pendingItem')}</Chip>}
        {item.auditorName && item.result && <span className="text-caption text-neutral-600">{t('execution.conduct.auditedBy', { name: item.auditorName })}</span>}
      </div>
    </article>
  )
}
