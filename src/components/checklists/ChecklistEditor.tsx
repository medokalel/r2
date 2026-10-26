import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown2, ArrowUp2, Trash } from 'iconsax-reactjs'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Field, LibraryReviewBadge, Panel } from '@/components/execution/executionUi'
import { INPUT_CLASS, TEXTAREA_CLASS } from '@/components/execution/fieldClasses'
import { CHECKLIST_STAGES, emptyChecklistItem, type ChecklistInput, type ChecklistItemData, type ChecklistTemplate } from '@/lib/api/checklistsApi'
import { localized, stageKeyLabel } from '@/lib/execution/executionText'
import { cn } from '@/lib/utils'

interface ChecklistEditorProps {
  checklist: ChecklistTemplate
  busy: boolean
  /** Item to scroll to and highlight (deep link from an import "Complete" action). */
  focusItemId?: string | null
  onSave: (input: ChecklistInput) => void
  onCopy: () => void
  onClose: () => void
}

const lines = (value: string) => value.split('\n').map((s) => s.trim()).filter(Boolean)

/** View of a library checklist (read-only, copy to edit) or editor of a CAB checklist (header and items). */
export function ChecklistEditor({ checklist, busy, focusItemId, onSave, onCopy, onClose }: ChecklistEditorProps) {
  const { t, i18n } = useTranslation()
  const readOnly = checklist.source === 'library'
  const [name, setName] = useState(checklist.name)
  const [nameAr, setNameAr] = useState(checklist.nameAr)
  const [standardCode, setStandardCode] = useState(checklist.standardCode)
  const [standardLabel, setStandardLabel] = useState(checklist.standardLabel)
  const [description, setDescription] = useState(checklist.description)
  const [items, setItems] = useState<ChecklistItemData[]>(checklist.items ?? [])
  const [openId, setOpenId] = useState<string | null>(focusItemId ?? null)

  const update = (index: number, patch: Partial<ChecklistItemData>) => setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const move = (index: number, delta: number) =>
    setItems((list) => {
      const next = [...list]
      const [item] = next.splice(index, 1)
      next.splice(Math.max(0, Math.min(next.length, index + delta)), 0, item)
      return next
    })
  const keyOf = (item: ChecklistItemData, index: number) => item.id ?? `new-${index}`

  return (
    <Panel
      title={localized(i18n.language, checklist.name, checklist.nameAr)}
      description={`${checklist.standardLabel || checklist.standardCode} · ${t('execution.checklists.itemCount', { count: items.length })} · v${checklist.version}`}
      actions={
        <>
          <LibraryReviewBadge draft={checklist.draft} reviewStatus={checklist.reviewStatus} />
          {readOnly ? (
            <Button type="button" size="md" disabled={busy} onClick={onCopy} data-testid="copy-checklist">{t('execution.checklists.copyToEdit')}</Button>
          ) : (
            <Button type="button" size="md" disabled={busy} onClick={() => onSave({ name, nameAr, standardCode, standardLabel, description, items })} data-testid="save-checklist">{t('execution.checklists.save')}</Button>
          )}
          <Button type="button" size="md" variant="outline" onClick={onClose}>{t('execution.checklists.close')}</Button>
        </>
      }
    >
      {checklist.reviewNote && (
        // A warning only while the content is a draft; the approved library shows its approval line as information.
        <p
          data-testid="checklist-review-note"
          className={cn('rounded-md border px-3 py-2 text-caption', checklist.draft ? 'border-warning-100 bg-warning-50 text-warning-700' : 'border-neutral-100 bg-neutral-50 text-neutral-700')}
        >
          {localized(i18n.language, checklist.reviewNote.en, checklist.reviewNote.ar)}
        </p>
      )}
      {!readOnly && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label={t('execution.checklists.name')} required htmlFor="checklist-item-checklist-name"><input id="checklist-item-checklist-name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} /></Field>
          <Field label={t('execution.checklists.nameAr')} htmlFor="cl-name-ar"><input id="cl-name-ar" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={INPUT_CLASS} /></Field>
          <Field label={t('execution.checklists.standardCode')} required htmlFor="checklist-item-standard-code" hint={t('execution.checklists.standardCodeHint')}><input id="checklist-item-standard-code" dir="ltr" value={standardCode} onChange={(e) => setStandardCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '_'))} className={INPUT_CLASS} /></Field>
          <Field label={t('execution.checklists.standardLabel')} htmlFor="cl-label"><input id="cl-label" value={standardLabel} onChange={(e) => setStandardLabel(e.target.value)} className={INPUT_CLASS} /></Field>
          <div className="md:col-span-2"><Field label={t('execution.checklists.description')} htmlFor="cl-desc"><textarea id="cl-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={TEXTAREA_CLASS} /></Field></div>
        </div>
      )}

      <ol className="flex flex-col gap-2">
        {items.map((item, index) => {
          const key = keyOf(item, index)
          const open = openId === key
          // The item opened from an import "Complete" link uses the field ids the import framework focuses.
          const fid = (field: string) => (focusItemId && item.id === focusItemId ? `checklist-item-${field}` : `checklist-item-${field}-${key}`)
          return (
            <li key={key} id={item.id ? `checklist-item-${item.id}` : undefined} className={cn('rounded-md border', open ? 'border-primary' : 'border-neutral-100', focusItemId && item.id === focusItemId && 'ring-2 ring-primary')}>
              <button type="button" onClick={() => setOpenId(open ? null : key)} aria-expanded={open} className="flex min-h-11 w-full items-start gap-3 px-3 py-2.5 text-start">
                <span className="shrink-0 rounded-sm bg-primary-50 px-2 py-0.5 text-caption font-bold text-primary" dir="ltr">{item.clause || '·'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body-sm font-semibold text-neutral-900">{localized(i18n.language, item.title, item.titleAr) || t('execution.checklists.untitled')}</span>
                  <span className="mt-0.5 block text-caption text-neutral-600">
                    {(item.stages.length ? item.stages.map((s) => stageKeyLabel(t, s)).join(', ') : t('execution.checklists.allStages'))}
                    {item.mandatory ? ` · ${t('execution.checklists.mandatory')}` : ''}
                    {item.common ? ` · ${t('execution.checklists.common')}` : ''}
                  </span>
                </span>
                <ArrowDown2 size={16} className={cn('mt-1 shrink-0 transition-transform', open && 'rotate-180')} />
              </button>
              {open && (
                <div className="flex flex-col gap-3 border-t border-neutral-100 p-3">
                  {readOnly ? (
                    <div className="flex flex-col gap-2 text-body-sm text-neutral-800">
                      <p>{localized(i18n.language, item.requirement, item.requirementAr)}</p>
                      <p className="text-neutral-600"><span className="font-semibold">{t('execution.conduct.guidance')}: </span>{localized(i18n.language, item.guidance, item.guidanceAr)}</p>
                      <ul className="list-disc ps-5 text-neutral-700">
                        {(i18n.language.startsWith('ar') && item.evidencePromptsAr.length ? item.evidencePromptsAr : item.evidencePrompts).map((p) => <li key={p}>{p}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Field label={t('execution.checklists.clause')} required htmlFor={`clause-${key}`}><input id={`clause-${key}`} dir="ltr" value={item.clause} onChange={(e) => update(index, { clause: e.target.value })} className={INPUT_CLASS} /></Field>
                      <Field label={t('execution.checklists.itemCode')} htmlFor={`code-${key}`}><input id={`code-${key}`} dir="ltr" value={item.code} onChange={(e) => update(index, { code: e.target.value })} className={INPUT_CLASS} /></Field>
                      <Field label={t('execution.checklists.title')} required htmlFor={fid('title')}><input id={fid('title')} value={item.title} onChange={(e) => update(index, { title: e.target.value })} className={INPUT_CLASS} /></Field>
                      <Field label={t('execution.checklists.titleAr')} htmlFor={fid('title-ar')}><input id={fid('title-ar')} dir="rtl" value={item.titleAr} onChange={(e) => update(index, { titleAr: e.target.value })} className={INPUT_CLASS} /></Field>
                      <Field label={t('execution.checklists.requirement')} required htmlFor={`req-${key}`} hint={t('execution.checklists.ownWords')}><textarea id={`req-${key}`} value={item.requirement} onChange={(e) => update(index, { requirement: e.target.value })} className={TEXTAREA_CLASS} /></Field>
                      <Field label={t('execution.checklists.requirementAr')} htmlFor={fid('requirement-ar')}><textarea id={fid('requirement-ar')} dir="rtl" value={item.requirementAr} onChange={(e) => update(index, { requirementAr: e.target.value })} className={TEXTAREA_CLASS} /></Field>
                      <Field label={t('execution.checklists.guidance')} htmlFor={`guide-${key}`}><textarea id={`guide-${key}`} value={item.guidance} onChange={(e) => update(index, { guidance: e.target.value })} className={TEXTAREA_CLASS} /></Field>
                      <Field label={t('execution.checklists.guidanceAr')} htmlFor={`guide-ar-${key}`}><textarea id={`guide-ar-${key}`} dir="rtl" value={item.guidanceAr} onChange={(e) => update(index, { guidanceAr: e.target.value })} className={TEXTAREA_CLASS} /></Field>
                      <Field label={t('execution.checklists.evidence')} htmlFor={`ev-${key}`} hint={t('execution.checklists.onePerLine')}><textarea id={`ev-${key}`} value={item.evidencePrompts.join('\n')} onChange={(e) => update(index, { evidencePrompts: lines(e.target.value) })} className={TEXTAREA_CLASS} /></Field>
                      <Field label={t('execution.checklists.evidenceAr')} htmlFor={`ev-ar-${key}`} hint={t('execution.checklists.onePerLine')}><textarea id={`ev-ar-${key}`} dir="rtl" value={item.evidencePromptsAr.join('\n')} onChange={(e) => update(index, { evidencePromptsAr: lines(e.target.value) })} className={TEXTAREA_CLASS} /></Field>
                      <Field label={t('execution.checklists.sampling')} htmlFor={`sampling-${key}`}><input id={`sampling-${key}`} value={item.samplingHint} onChange={(e) => update(index, { samplingHint: e.target.value })} className={INPUT_CLASS} /></Field>
                      <fieldset className="flex flex-col gap-1.5">
                        <legend className="text-body-sm font-medium text-neutral-800">{t('execution.checklists.stagesLabel')}</legend>
                        <div className="flex flex-wrap gap-2">
                          {CHECKLIST_STAGES.map((stage) => (
                            <label key={stage} className="flex min-h-11 items-center gap-2 rounded-md border border-neutral-100 px-3 text-body-sm">
                              <Checkbox checked={item.stages.includes(stage)} onChange={() => update(index, { stages: item.stages.includes(stage) ? item.stages.filter((s) => s !== stage) : [...item.stages, stage] })} />
                              {stageKeyLabel(t, stage)}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <label className="flex min-h-11 items-center gap-2 text-body-sm text-neutral-800">
                        <Checkbox checked={item.mandatory} onChange={() => update(index, { mandatory: !item.mandatory })} />
                        {t('execution.checklists.mandatoryLabel')}
                      </label>
                      <div className="flex flex-wrap gap-2 md:col-span-2">
                        <Button type="button" size="md" variant="outline" disabled={index === 0} onClick={() => move(index, -1)} icon={<ArrowUp2 size={16} />}>{t('execution.checklists.moveUp')}</Button>
                        <Button type="button" size="md" variant="outline" disabled={index === items.length - 1} onClick={() => move(index, 1)} icon={<ArrowDown2 size={16} />}>{t('execution.checklists.moveDown')}</Button>
                        <Button type="button" size="md" variant="destructive" onClick={() => setItems((list) => list.filter((_, i) => i !== index))} icon={<Trash size={16} />}>{t('execution.checklists.removeItem')}</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {!readOnly && (
        <div>
          <Button type="button" size="md" variant="outline" onClick={() => { setItems((list) => [...list, emptyChecklistItem()]); setOpenId(`new-${items.length}`) }}>{t('execution.checklists.addItem')}</Button>
        </div>
      )}
    </Panel>
  )
}
