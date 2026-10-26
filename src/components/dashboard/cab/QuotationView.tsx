import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { FormField, TextField, Textarea } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import { toIsoDate } from '@/components/dashboard/companyProfile/mappers'
import { AuditTimeBreakdown } from '@/components/dashboard/cab/AuditTimeBreakdown'
import { TravelCostPanel } from '@/components/travel/TravelCostPanel'
import { ApiError } from '@/lib/api/client'
import {
  getQuotation,
  overrideEventDays,
  transitionQuotation,
  updateQuotation,
  type Quotation,
  type QuotationStatus,
  type QuotationEvent,
  type QuotationTransition,
} from '@/lib/api/cabQuotationApi'
import { isValidDayOverride } from '@/lib/quotationForm'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

const card = 'rounded-lg border border-neutral-100 bg-white p-5 sm:p-6'

const STATUS_STYLE: Record<QuotationStatus, string> = {
  CREATED: 'bg-primary-50 text-primary',
  DRAFT: 'bg-neutral-50 text-neutral-700',
  ISSUED: 'bg-warning-50 text-warning-800',
  ACCEPTED: 'bg-success-50 text-success-600',
  REJECTED: 'bg-error-50 text-error-500',
  CANCELLED: 'bg-neutral-50 text-neutral-600',
}

type PhaseKey = 'initial' | 'surveillance1' | 'surveillance2' | 'recertification'
type PhaseWhen = 'beforeCertification' | 'year1' | 'year2' | 'year3' | 'renewal'

interface ProgrammePhase {
  key: PhaseKey
  when: PhaseWhen
  events: QuotationEvent[]
  fee: number
  included: boolean
}

const PHASE_OF: Record<QuotationEvent['auditEventType'], PhaseKey> = {
  STAGE_1: 'initial',
  STAGE_2: 'initial',
  SURVEILLANCE_1: 'surveillance1',
  SURVEILLANCE_2: 'surveillance2',
  RECERTIFICATION: 'recertification',
}

/** Standards in quotation order; each with its phases in audit order (initial or renewal → S1 → S2 → recertification). */
function buildProgramme(events: QuotationEvent[], isIncluded: (event: QuotationEvent) => boolean) {
  const byStandard = new Map<string, QuotationEvent[]>()
  ;[...events].sort((a, b) => a.sequenceOrder - b.sequenceOrder).forEach((event) => {
    byStandard.set(event.standardCode, [...(byStandard.get(event.standardCode) ?? []), event])
  })
  return [...byStandard.entries()].map(([code, list]) => {
    const phases: ProgrammePhase[] = []
    list.forEach((event) => {
      const key = PHASE_OF[event.auditEventType]
      let phase = phases.find((p) => p.key === key)
      if (!phase) {
        const renewal = key === 'recertification' && phases.length === 0
        const when: PhaseWhen = key === 'initial' ? 'beforeCertification' : key === 'surveillance1' ? 'year1' : key === 'surveillance2' ? 'year2' : renewal ? 'renewal' : 'year3'
        phase = { key, when, events: [], fee: 0, included: true }
        phases.push(phase)
      }
      phase.events.push(event)
      phase.fee += Number(event.auditFee)
      phase.included = phase.included && isIncluded(event)
    })
    return {
      code,
      phases,
      totalDays: list.reduce((sum, e) => sum + Number(e.auditDays), 0),
      totalFee: list.reduce((sum, e) => sum + Number(e.auditFee), 0),
    }
  })
}

const asDate = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00`) : undefined)

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const { t } = useTranslation()
  return (
    <span className={cn('rounded px-2 py-1 text-caption font-semibold', STATUS_STYLE[status])}>
      {t(`cab.quotationFlow.status.${status}`)}
    </span>
  )
}

export function QuotationView({ quotation, onChange }: { quotation: Quotation; onChange: (next: Quotation) => void }) {
  const { t, i18n } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  // Justified day override being edited (one event at a time).
  const [editing, setEditing] = useState<{ eventId: string; days: string; reason: string } | null>(null)
  const [travel, setTravel] = useState(String(Number(quotation.travelExpenses)))
  const [items, setItems] = useState<Array<{ key: string; name: string; cost: string }>>(
    quotation.additionalItems.map((item) => ({ key: crypto.randomUUID(), name: item.name, cost: String(item.cost) })),
  )
  const [offerEnd, setOfferEnd] = useState(quotation.offerEndDate?.slice(0, 10) ?? '')
  const [notes, setNotes] = useState('')

  const editable = quotation.status === 'CREATED'
  const money = (value: string | number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: quotation.currency }).format(Number(value))
  const date = (value: string | null) =>
    value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(i18n.language) : notSet()

  const run = async (action: () => Promise<Quotation>) => {
    setBusy(true)
    setError(null)
    try {
      onChange(await action())
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  const itemsValid = items.every((item) => item.name.trim() && Number(item.cost) >= 0 && item.cost.trim() !== '')
  const travelValid = travel.trim() !== '' && Number(travel) >= 0
  const save = () =>
    run(() =>
      updateQuotation(quotation.id, {
        travelExpenses: Number(travel),
        additionalItems: items.map((item) => ({ name: item.name.trim(), cost: Number(item.cost) })),
        offerEndDate: offerEnd || null,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    )

  const saveOverride = () => {
    if (!editing || !isValidDayOverride(editing.days, editing.reason)) return
    const { eventId, days, reason } = editing
    void run(async () => {
      const next = await overrideEventDays(quotation.id, eventId, { appliedDays: Number(days), reason: reason.trim() })
      setEditing(null)
      return next
    })
  }
  const resetOverride = (eventId: string) => void run(() => overrideEventDays(quotation.id, eventId, { reset: true }))

  const transition = (action: QuotationTransition) => {
    if (action !== 'issue' && !window.confirm(t(`cab.quotationFlow.confirm.${action}`))) return
    void run(() => transitionQuotation(quotation.id, action, note))
    setNote('')
  }

  // Group the events per standard, then into the phases of the certification cycle.
  const isIncluded = (event: QuotationEvent) =>
    Number(quotation.initialAuditDays) > 0 && (event.auditEventType === 'STAGE_1' || event.auditEventType === 'STAGE_2') && Number(event.auditFee) === 0
  const combinedInitial = quotation.events.some(isIncluded)
  const programme = buildProgramme(quotation.events, isIncluded)
  const num = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)

  const actions: QuotationTransition[] =
    quotation.status === 'CREATED' ? ['issue', 'cancel'] : quotation.status === 'ISSUED' ? ['cancel'] : []

  return (
    <div className="space-y-6">
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-body-lg font-bold text-primary">
              {t('cab.quotationFlow.quotationNo')} {quotation.quotationNumber ?? quotation.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="mt-1 text-body-sm text-neutral-600">
              {t('cab.quotationFlow.startDate')}: {date(quotation.startDate)} · {t('cab.quotationFlow.offerEnd')}: {date(quotation.offerEndDate)} ·{' '}
              {quotation.standardCodesUsed.join(', ')}
              {quotation.cycleType && quotation.cycleType !== 'INITIAL' && ` · ${t(`cab.auditTime.cycle.${quotation.cycleType}`, { defaultValue: quotation.cycleType === 'RECERTIFICATION' ? 'Recertification' : 'Transfer (IAF MD 2)' })}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" disabled={busy} onClick={() => void run(() => getQuotation(quotation.id))} className="text-caption font-semibold text-primary hover:underline">
              {t('cab.quotationFlow.refresh')}
            </button>
            <QuotationStatusBadge status={quotation.status} />
          </div>
        </div>
        {quotation.isProvisional && (
          <p role="alert" className="mt-4 rounded-md bg-warning-50 p-3 text-body-sm text-warning-800">
            {quotation.provisionalDisclaimer ?? t('cab.quotationFlow.provisional')}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-neutral-100 bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-100 px-5 py-4">
          <h2 className="text-body font-bold text-primary">{t('cab.quotationFlow.events')}</h2>
          <p className="text-caption text-text-secondary">
            {t('cab.quotationFlow.programme.standardsCount', { count: programme.length })} · {num(Number(quotation.totalAuditDays))} {t('cab.quotationFlow.programme.days')} · {money(quotation.totalAuditFee)}
          </p>
        </div>

        {combinedInitial && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-primary-25 px-5 py-3 text-body-sm">
            <span className="font-semibold text-primary">{t('cab.quotationFlow.initialAudit')}</span>
            <span>
              {num(Number(quotation.initialAuditDays))} {t('cab.quotationFlow.programme.days')} × {money(quotation.dailyRate)} ={' '}
              <strong>{money(quotation.initialAuditFee ?? 0)}</strong>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-5 p-4 sm:p-5">
          {programme.map(({ code, phases, totalDays, totalFee }) => (
            <article key={code} data-standard={code} className="overflow-hidden rounded-lg border border-primary-100">
              <header className="flex flex-wrap items-center justify-between gap-2 bg-primary px-4 py-3 text-white">
                <h3 className="text-body font-bold" dir="ltr">{code.replace('_', ' ')}</h3>
                <p className="text-body-sm">
                  {num(totalDays)} {t('cab.quotationFlow.programme.days')} · <strong>{money(totalFee)}</strong>
                </p>
              </header>

              <ol className="grid grid-cols-1 gap-px bg-neutral-100 sm:grid-cols-2 xl:grid-cols-4">
                {phases.map((phase, index) => (
                  <li key={phase.key} className="flex flex-col gap-3 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-body-sm font-bold text-primary">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-neutral-900">{t(`cab.quotationFlow.programme.phase.${phase.key}`)}</p>
                        <p className="text-caption text-text-secondary">{t(`cab.quotationFlow.programme.when.${phase.when}`)}</p>
                      </div>
                    </div>

                    <ul className="flex flex-col gap-2">
                      {phase.events.map((event) => {
                        const included = isIncluded(event)
                        const label = `${code} ${t(`cab.quotationFlow.event.${event.auditEventType}`)}`
                        const isEditing = editing?.eventId === event.id
                        const canReset = editable && event.manualOverride && event.calculatedDays != null
                        return (
                          <li key={event.id} className="flex flex-col gap-1.5 text-body-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-neutral-800">
                                {phase.events.length > 1 ? t(`cab.quotationFlow.event.${event.auditEventType}`) : t('cab.quotationFlow.col.days')}
                                {!included && event.policyVerificationStatus !== 'VERIFIED' && (
                                  <span className="ms-1 text-warning-700">({event.policyVerificationStatus})</span>
                                )}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="font-semibold tabular-nums">{num(Number(event.auditDays))}</span>
                                <span className="text-text-secondary">{t('cab.quotationFlow.programme.days')}</span>
                                {editable && !included && !isEditing && (
                                  <button type="button" disabled={busy} aria-label={`${t('cab.auditTime.adjustDays', 'Adjust')}: ${label}`}
                                    className="text-caption font-semibold text-primary hover:underline disabled:opacity-50"
                                    onClick={() => setEditing({ eventId: event.id, days: String(Number(event.auditDays)), reason: '' })}>
                                    {t('cab.auditTime.adjustDays', 'Adjust')}
                                  </button>
                                )}
                              </span>
                            </div>
                            {event.manualOverride && (
                              <p className="text-caption text-warning-700">
                                {t('cab.quotationFlow.overridden')}
                                {event.calculatedDays != null && ` · ${t('cab.auditTime.calculatedDays', { days: num(Number(event.calculatedDays)), defaultValue: 'calculated {{days}}' })}`}
                                {event.overrideReason && ` · ${event.overrideReason}`}
                                {canReset && (
                                  <button type="button" disabled={busy} className="ms-2 font-semibold text-primary hover:underline disabled:opacity-50" onClick={() => resetOverride(event.id)}>
                                    {t('cab.auditTime.resetDays', 'Reset to calculated')}
                                  </button>
                                )}
                              </p>
                            )}
                            {isEditing && editing && (
                              <div className="flex flex-col gap-2 rounded-md border border-primary-100 bg-primary-25 p-2">
                                <label className="flex items-center justify-between gap-2 text-caption">
                                  <span>{t('cab.quotationFlow.col.days')}</span>
                                  <input
                                    type="number" min="0" max="365" step="0.5"
                                    aria-label={`${label} ${t('cab.quotationFlow.col.days')}`}
                                    className="h-9 w-24 rounded-md border border-neutral-100 bg-white px-2 text-center focus:border-focus focus:outline-none"
                                    value={editing.days}
                                    onChange={(e) => setEditing({ ...editing, days: e.target.value })}
                                  />
                                </label>
                                <label className="flex flex-col gap-1 text-caption">
                                  <span>{t('cab.auditTime.overrideReasonLabel', 'Reason (required, recorded)')}</span>
                                  <textarea
                                    rows={2} maxLength={500}
                                    className="rounded-md border border-neutral-100 bg-white px-2 py-1 focus:border-focus focus:outline-none"
                                    value={editing.reason}
                                    onChange={(e) => setEditing({ ...editing, reason: e.target.value })}
                                  />
                                </label>
                                {!isValidDayOverride(editing.days, editing.reason) && (
                                  <p className="text-caption text-text-secondary">{t('cab.auditTime.overrideHint', 'Half-day steps (0 to 365) and a reason of at least 3 characters.')}</p>
                                )}
                                <div className="flex gap-2">
                                  <Button type="button" size="sm" disabled={busy || !isValidDayOverride(editing.days, editing.reason)} onClick={saveOverride}>
                                    {t('cab.auditTime.saveOverride', 'Save days')}
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditing(null)}>
                                    {t('common.cancel', 'Cancel')}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>

                    <div className="mt-auto flex flex-col gap-0.5 border-t border-dashed border-neutral-100 pt-2">
                      <span className="text-body font-bold text-neutral-900 tabular-nums">{phase.included ? notSet() : money(phase.fee)}</span>
                      <span className="text-caption text-text-secondary">{phase.included ? t('cab.quotationFlow.includedInitial') : `${money(phase.events[0].dailyRate)} / ${t('cab.quotationFlow.programme.day')}`}</span>
                    </div>
                  </li>
                ))}
                {phases.length % 4 !== 0 && (
                  <li aria-hidden className="hidden bg-white xl:block" style={{ gridColumn: `span ${4 - (phases.length % 4)}` }} />
                )}
                {phases.length % 2 !== 0 && <li aria-hidden className="hidden bg-white sm:block xl:hidden" />}
              </ol>
            </article>
          ))}
          {quotation.calculation ? (
            <AuditTimeBreakdown breakdown={quotation.calculation.breakdown} events={quotation.events} classificationOverrides={quotation.classificationOverrides} reference={quotation.quotationNumber ?? quotation.id} />
          ) : (
            quotation.calculation === null && (
              <p className="text-caption text-text-secondary">{t('cab.auditTime.legacy', 'This quotation was calculated before the audit-time engine; no breakdown is stored.')}</p>
            )
          )}
          {(quotation.dayOverrides?.length ?? 0) > 0 && (
            <section className="rounded-lg border border-neutral-100 p-4">
              <h3 className="text-body-sm font-semibold text-primary">{t('cab.auditTime.overrideHistory', 'Day adjustments')}</h3>
              <ul className="mt-2 flex flex-col divide-y divide-neutral-100 text-caption">
                {quotation.dayOverrides!.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                    <span>
                      <strong dir="ltr">{entry.standardCode.replace('_', ' ')}</strong> · {t(`cab.quotationFlow.event.${entry.auditEventType}`)}:{' '}
                      <span className="tabular-nums">{num(Number(entry.fromDays))} → {num(Number(entry.toDays))}</span>: {entry.reason}
                    </span>
                    <span className="shrink-0 text-text-secondary">{entry.changedByName ?? notSet()} · {date(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-body font-bold text-primary">{t('cab.quotationEditor.summary')}</h2>
        <dl className="mt-4 space-y-3 text-body-sm">
          <div className="flex justify-between gap-3">
            <dt>{t('cab.quotationEditor.auditFee')} ({Number(quotation.totalAuditDays)} {t('cab.quotationEditor.auditDays')})</dt>
            <dd className="font-semibold">{money(quotation.totalAuditFee)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>
              {t('cab.quotationEditor.travelExpenses')}
              {Number(quotation.travelExpenses) > 0 && (
                <span className="block text-caption font-normal text-text-secondary">
                  {quotation.travelEstimate?.priceConfirmed ? t('travel.banner.confirmedTitle') : t('travel.banner.estimateTitle')}
                </span>
              )}
            </dt>
            <dd className="font-semibold">{money(quotation.travelExpenses)}</dd>
          </div>
          {quotation.additionalItems.map((item, index) => (
            <div key={index} className="flex justify-between gap-3">
              <dt>{item.name}</dt><dd className="font-semibold">{money(item.cost)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <dt>{t('cab.quotationEditor.taxes')} ({Math.round(Number(quotation.taxRate) * 10000) / 100}%)</dt>
            <dd className="font-semibold">{money(quotation.taxAmount)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-neutral-100 pt-3 text-body-lg font-bold text-primary">
            <dt>{t('cab.quotationEditor.total')}</dt><dd>{money(quotation.totalAmount)}</dd>
          </div>
        </dl>
      </section>

      {editable && (
        <section className={card}>
          <h2 className="text-body font-bold text-primary">{t('cab.quotationFlow.editTitle')}</h2>
          {/* Smart travel cost calculator: its approved total (or a manual amount) feeds the travel expenses. */}
          <TravelCostPanel
            scope={{ quotationId: quotation.id }}
            variant="quotation"
            currency={quotation.currency}
            value={travel}
            onAmountChange={setTravel}
            className="mt-4 rounded-lg border border-neutral-100 p-4 sm:p-5"
          />
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <FormField label={t('cab.quotationFlow.offerEnd')}>
              <DatePicker value={asDate(offerEnd || null)} onChange={(d) => setOfferEnd(toIsoDate(d))} />
            </FormField>
          </div>
          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div key={item.key} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                <TextField
                  id={`edit-item-name-${item.key}`}
                  label={t('cab.quotationEditor.description', { number: index + 1 })}
                  maxLength={200}
                  value={item.name}
                  onChange={(e) => setItems((rows) => rows.map((row) => (row.key === item.key ? { ...row, name: e.target.value } : row)))}
                />
                <TextField
                  id={`edit-item-cost-${item.key}`}
                  label={`${t('cab.quotationEditor.amount')} (${quotation.currency})`}
                  type="number" min="0" step="0.01"
                  value={item.cost}
                  onChange={(e) => setItems((rows) => rows.map((row) => (row.key === item.key ? { ...row, cost: e.target.value } : row)))}
                />
                <Button type="button" variant="outline" onClick={() => setItems((rows) => rows.filter((row) => row.key !== item.key))}>
                  {t('cab.quotationEditor.remove')}
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setItems((rows) => [...rows, { key: crypto.randomUUID(), name: '', cost: '' }])}>
              + {t('cab.quotationEditor.addCharge')}
            </Button>
          </div>
          <div className="mt-5 space-y-2">
            <label htmlFor="edit-notes" className="text-body-sm font-medium">{t('cab.quotationFlow.notes')}</label>
            <Textarea id="edit-notes" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="button" className="mt-5" disabled={busy || !travelValid || !itemsValid} onClick={() => void save()}>
            {t('cab.quotationFlow.saveChanges')}
          </Button>
        </section>
      )}

      {actions.length > 0 && (
        <section className={card}>
          <h2 className="text-body font-bold text-primary">{t('cab.quotationFlow.actionsTitle')}</h2>
          <p className="mt-2 text-body-sm text-neutral-600">{t(`cab.quotationFlow.hint.${quotation.status}`)}</p>
          <div className="mt-4 space-y-2">
            <label htmlFor="transition-note" className="text-body-sm font-medium">{t('cab.quotationFlow.note')}</label>
            <Textarea id="transition-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button
                key={action}
                type="button"
                variant={action === 'issue' || action === 'accept' ? 'primary' : 'outline'}
                disabled={busy}
                onClick={() => transition(action)}
              >
                {t(`cab.quotationFlow.action.${action}`)}
              </Button>
            ))}
          </div>
        </section>
      )}

      {error && <p role="alert" className="text-body-sm text-error-700">{error}</p>}
    </div>
  )
}
