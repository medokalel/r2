import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Add, ArrowDown2, ArrowUp2, Eye, Trash } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Textarea, TextField } from '@/components/ui/TextField'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AgreementFormDialog } from '@/components/agreements/AgreementFormDialog'
import { ErrorBlock, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { AgreementDocumentView } from '@/components/agreements/AgreementDocumentView'
import { agreementErrorMessage } from '@/components/agreements/agreementHelpers'
import {
  getAgreementTemplate,
  listAgreementClients,
  previewAgreementTemplate,
  resetAgreementTemplate,
  saveAgreementTemplate,
  type AgreementGateMode,
  type AgreementSection,
  type AgreementTemplate,
} from '@/lib/api/agreementsApi'
import { formatDateTime } from '@/lib/format/dates'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type Field = 'titleEn' | 'titleAr' | 'bodyEn' | 'bodyAr'
const FIELD_PATH: Record<Field, ['title' | 'body', 'en' | 'ar']> = {
  titleEn: ['title', 'en'],
  titleAr: ['title', 'ar'],
  bodyEn: ['body', 'en'],
  bodyAr: ['body', 'ar'],
}

/**
 * Settings → Agreement terms (/cab/settings/agreement-terms): the CAB's certification agreement template
 * (bilingual sections with {{variables}}), the audit-plan gate (block or warn) and a live preview.
 */
export function CabAgreementTemplatePage() {
  const { t, i18n } = useTranslation()
  const ar = i18n.language.startsWith('ar')
  const [template, setTemplate] = useState<AgreementTemplate | null>(null)
  const [sections, setSections] = useState<AgreementSection[]>([])
  const [gateMode, setGateMode] = useState<AgreementGateMode>('block')
  const [error, setError] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [preview, setPreview] = useState<AgreementSection[] | null>(null)
  const [previewClient, setPreviewClient] = useState('')
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [open, setOpen] = useState<number | null>(0)
  const focused = useRef<{ index: number; field: Field; el: HTMLInputElement | HTMLTextAreaElement } | null>(null)

  const apply = (tpl: AgreementTemplate) => {
    setTemplate(tpl)
    setSections(tpl.sections.map((s) => ({ ...s, title: { ...s.title }, body: { ...s.body } })))
    setGateMode(tpl.gateMode)
    setDirty(false)
  }

  useEffect(() => {
    let alive = true
    getAgreementTemplate().then(
      (tpl) => alive && apply(tpl),
      () => alive && setError(true),
    )
    listAgreementClients().then((list) => alive && setClients(list), () => undefined)
    return () => {
      alive = false
    }
  }, [])

  const change = (index: number, field: Field, value: string) => {
    const [part, lang] = FIELD_PATH[field]
    setSections((list) => list.map((s, i) => (i === index ? { ...s, [part]: { ...s[part], [lang]: value } } : s)))
    setDirty(true)
  }

  /** Inserts {{key}} where the cursor was in the last edited field. */
  const insertVariable = (key: string) => {
    const target = focused.current
    const token = `{{${key}}}`
    if (!target) {
      void navigator.clipboard?.writeText(token).then(() => toast.info(t('agreements.terms.copied', { token })), () => undefined)
      return
    }
    const { index, field, el } = target
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const next = `${el.value.slice(0, start)}${token}${el.value.slice(end)}`
    change(index, field, next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const move = (index: number, delta: number) => {
    setSections((list) => {
      const next = [...list]
      const [item] = next.splice(index, 1)
      next.splice(index + delta, 0, item)
      return next
    })
    setOpen(index + delta)
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      apply(await saveAgreementTemplate({ sections, gateMode }))
      toast.success(t('agreements.terms.saved'))
    } catch (err) {
      toast.error(agreementErrorMessage(err, t))
    } finally {
      setSaving(false)
    }
  }

  const runPreview = async (clientId = previewClient) => {
    try {
      const result = await previewAgreementTemplate({ sections, ...(clientId ? { organizationId: clientId } : {}) })
      setPreview(result.sections)
    } catch (err) {
      toast.error(agreementErrorMessage(err, t))
    }
  }

  const focusProps = (index: number, field: Field) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      focused.current = { index, field, el: e.currentTarget }
    },
  })

  return (
    <CabLayout tourId="cab-agreement-terms" tourSteps={[]}>
      <CabHeader title={t('agreements.terms.title')} />
      <main className="flex min-w-0 flex-1 flex-col gap-5 page-main">
        <PageHeader
          title={t('agreements.terms.title')}
          subtitle={t('agreements.terms.subtitle')}
          crumbs={[
            { label: t('agreements.common.hub'), to: ROUTES.workspace },
            { label: t('agreements.common.settings'), to: ROUTES.cabCompanyProfile },
            { label: t('agreements.terms.title') },
          ]}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setResetOpen(true)} disabled={!template} className="w-full sm:w-auto">
                {t('agreements.terms.reset')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => void save()} disabled={!template || saving || !dirty} aria-busy={saving || undefined} className="w-full sm:w-auto">
                {t('agreements.common.save')}
              </Button>
            </>
          }
        />

        {error && !template ? <ErrorBlock message={t('agreements.common.loadError')} /> : null}
        {!error && !template ? <LoadingBlock rows={6} /> : null}

        {template && (
          <>
            <div role="note" className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-body-sm text-warning-700">
              <p className="font-semibold">{t('agreements.terms.draftNoticeTitle')}</p>
              <p className="mt-1">{t('agreements.terms.draftNotice')}</p>
              <p className="mt-1 text-caption">
                {template.isDefault
                  ? t('agreements.terms.usingDefault')
                  : t('agreements.terms.version', { version: template.version, name: template.updatedByName ?? '', date: formatDateTime(template.updatedAt) })}
              </p>
            </div>

            <section className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-5">
              <h2 className="text-body font-semibold text-neutral-900">{t('agreements.terms.gateTitle')}</h2>
              <p className="mt-1 text-body-sm text-neutral-600">{t('agreements.terms.gateHint')}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('agreements.terms.gateTitle')}>
                {(['block', 'warn'] as const).map((mode) => (
                  <label
                    key={mode}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                      gateMode === mode ? 'border-primary bg-primary-25' : 'border-neutral-100 hover:border-primary/40',
                    )}
                  >
                    <input
                      type="radio"
                      name="gate-mode"
                      value={mode}
                      checked={gateMode === mode}
                      onChange={() => {
                        setGateMode(mode)
                        setDirty(true)
                      }}
                      className="mt-1 accent-[var(--color-primary)]"
                    />
                    <span>
                      <span className="block text-body-sm font-semibold text-neutral-900">{t(`agreements.terms.gate.${mode}`)}</span>
                      <span className="block text-caption text-neutral-600">{t(`agreements.terms.gate.${mode}Hint`)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-body font-semibold text-neutral-900">{t('agreements.terms.sections', { count: sections.length })}</h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<AppIcon icon={Add} size={18} />}
                    onClick={() => {
                      setSections((list) => [...list, { key: '', title: { en: '', ar: '' }, body: { en: '', ar: '' } }])
                      setOpen(sections.length)
                      setDirty(true)
                    }}
                  >
                    {t('agreements.terms.addSection')}
                  </Button>
                </div>
                {sections.map((s, index) => {
                  const expanded = open === index
                  return (
                    <article key={`${s.key}-${index}`} className="min-w-0 rounded-lg border border-neutral-100 bg-white">
                      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                        <button
                          type="button"
                          onClick={() => setOpen(expanded ? null : index)}
                          aria-expanded={expanded}
                          className="flex min-w-0 flex-1 items-center gap-2 text-start"
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-25 text-caption font-semibold text-primary">{index + 1}</span>
                          <span className="truncate text-body-sm font-semibold text-neutral-900">{(ar ? s.title.ar : s.title.en) || t('agreements.terms.untitled')}</span>
                        </button>
                        <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t('agreements.terms.moveUp')} className="rounded p-1.5 text-neutral-600 hover:bg-neutral-25 disabled:opacity-40">
                          <AppIcon icon={ArrowUp2} size={16} />
                        </button>
                        <button type="button" onClick={() => move(index, 1)} disabled={index === sections.length - 1} aria-label={t('agreements.terms.moveDown')} className="rounded p-1.5 text-neutral-600 hover:bg-neutral-25 disabled:opacity-40">
                          <AppIcon icon={ArrowDown2} size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSections((list) => list.filter((_, i) => i !== index))
                            setDirty(true)
                          }}
                          disabled={sections.length === 1}
                          aria-label={t('agreements.terms.remove')}
                          className="rounded p-1.5 text-error-600 hover:bg-error-50 disabled:opacity-40"
                        >
                          <AppIcon icon={Trash} size={16} />
                        </button>
                      </div>
                      {expanded && (
                        <div className="grid gap-4 border-t border-neutral-100 p-3 sm:grid-cols-2 sm:p-4">
                          <TextField id={`title-en-${index}`} label={t('agreements.terms.titleEn')} dir="ltr" value={s.title.en} onChange={(e) => change(index, 'titleEn', e.target.value)} {...focusProps(index, 'titleEn')} />
                          <TextField id={`title-ar-${index}`} label={t('agreements.terms.titleAr')} dir="rtl" value={s.title.ar} onChange={(e) => change(index, 'titleAr', e.target.value)} {...focusProps(index, 'titleAr')} />
                          <label className="flex flex-col gap-2 text-body-sm font-semibold text-neutral-800">
                            {t('agreements.terms.bodyEn')}
                            <Textarea dir="ltr" rows={9} value={s.body.en} onChange={(e) => change(index, 'bodyEn', e.target.value)} {...focusProps(index, 'bodyEn')} />
                          </label>
                          <label className="flex flex-col gap-2 text-body-sm font-semibold text-neutral-800">
                            {t('agreements.terms.bodyAr')}
                            <Textarea dir="rtl" rows={9} value={s.body.ar} onChange={(e) => change(index, 'bodyAr', e.target.value)} {...focusProps(index, 'bodyAr')} className="font-arabic" />
                          </label>
                        </div>
                      )}
                    </article>
                  )
                })}
              </section>

              <aside className="flex min-w-0 flex-col gap-5">
                <section className="rounded-lg border border-neutral-100 bg-white p-4">
                  <h2 className="text-body font-semibold text-neutral-900">{t('agreements.terms.variablesTitle')}</h2>
                  <p className="mt-1 text-caption text-neutral-600">{t('agreements.terms.variablesHint')}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {template.variables.map((v) => (
                      <li key={v.key}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertVariable(v.key)}
                          title={`{{${v.key}}}`}
                          className="rounded-full border border-primary-100 bg-primary-25 px-3 py-1 text-caption font-medium text-primary hover:border-primary"
                        >
                          {ar ? v.label.ar : v.label.en}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="rounded-lg border border-neutral-100 bg-white p-4">
                  <h2 className="text-body font-semibold text-neutral-900">{t('agreements.terms.previewTitle')}</h2>
                  <label className="mt-3 flex flex-col gap-2 text-body-sm font-medium text-neutral-800" htmlFor="preview-client">
                    {t('agreements.terms.previewWith')}
                    <select
                      id="preview-client"
                      value={previewClient}
                      onChange={(e) => {
                        setPreviewClient(e.target.value)
                        if (preview) void runPreview(e.target.value)
                      }}
                      className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                    >
                      <option value="">{t('agreements.terms.sampleValues')}</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button variant="secondary" size="sm" icon={<AppIcon icon={Eye} size={18} />} onClick={() => void runPreview()} className="mt-3 w-full">
                    {t('agreements.terms.preview')}
                  </Button>
                </section>
              </aside>
            </div>

            {preview && (
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-body font-semibold text-neutral-900">{t('agreements.terms.previewTitle')}</h2>
                  <button type="button" onClick={() => setPreview(null)} className="text-body-sm font-semibold text-primary hover:underline">
                    {t('agreements.terms.closePreview')}
                  </button>
                </div>
                <AgreementDocumentView title={t('agreements.kind.original')} reference="AGR-PREVIEW" sections={preview} />
              </div>
            )}
          </>
        )}
      </main>
      <AgreementFormDialog
        open={resetOpen}
        destructive
        title={t('agreements.terms.resetTitle')}
        submitLabel={t('agreements.terms.reset')}
        onClose={() => setResetOpen(false)}
        onSubmit={async () => {
          apply(await resetAgreementTemplate())
          toast.success(t('agreements.terms.resetDone'))
        }}
      >
        <p className="text-body-sm text-neutral-700">{t('agreements.terms.resetHint')}</p>
      </AgreementFormDialog>
    </CabLayout>
  )
}
