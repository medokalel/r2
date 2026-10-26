import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Refresh2 } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import {
  addTravelLine,
  adjustTravelLine,
  approveTravelEstimate,
  createTravelEstimate,
  getTravelContext,
  getTravelEstimate,
  getTravelPolicy,
  listTravelCities,
  previewTravelEstimate,
  recordTravelActuals,
  refreshTravelEstimate,
  removeTravelLine,
  selectTravelOption,
  type TravelCity,
  type TravelContext,
  type TravelEstimate,
  type TravelEstimateRequest,
  type TravelLine,
  type TravelScope,
} from '@/lib/api/travelApi'
import { formatDate, formatDateTime } from '@/lib/format/dates'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { TravelInputsForm, type TravelInputs } from '@/components/travel/TravelInputsForm'
import { TravelAuditTrail, TravelBreakdown, TravelOptions } from '@/components/travel/TravelBreakdown'
import { ActualsDialog, AddLineDialog, AdjustLineDialog, RemoveLineDialog } from '@/components/travel/TravelDialogs'
import { formatMoney, horizonLabel, travelErrorMessage } from '@/components/travel/travelHelpers'

export interface TravelCostPanelProps {
  /** Record the estimate belongs to. */
  scope: TravelScope
  /** "quotation" feeds the travel expenses field; "plan" adds actual costs and variance. */
  variant: 'quotation' | 'plan'
  /** Currency of the quotation (defaults to the policy currency). */
  currency?: string
  /** Team chosen on the page (quotation step 2); when given it replaces the record's team. */
  teamNames?: string[]
  /** What the page already shows, used to prefill the preview (demo mode) and the dates. */
  seed?: Partial<TravelContext>
  /** Current travel expenses value of the quotation (string as typed). */
  value?: string
  /** Called with the amount the quotation should carry (approved total, or a manual amount). */
  onAmountChange?: (amount: string) => void
  className?: string
}

const toInputs = (ctx: TravelContext): TravelInputs => ({
  mode: ctx.mode,
  startDate: ctx.startDate,
  endDate: ctx.endDate,
  sites: ctx.sites.map((s) => ({ ...s, city: s.city || '' })),
  team: ctx.team,
})

const request = (scope: TravelScope, inputs: TravelInputs, currency?: string): TravelEstimateRequest => ({
  ...scope,
  mode: inputs.mode,
  startDate: inputs.startDate,
  endDate: inputs.endDate,
  ...(currency ? { currency } : {}),
  sites: inputs.sites
    .filter((s) => s.name.trim())
    .map((s) => ({ key: s.key, name: s.name.trim(), address: s.address || '', city: s.city || '', country: s.country || '', latitude: s.latitude ?? null, longitude: s.longitude ?? null, auditDays: s.auditDays ?? null, onsite: s.onsite !== false })),
  team: inputs.team
    .filter((m) => m.name.trim())
    .map((m) => ({ key: m.key, employeeProfileId: m.employeeProfileId ?? null, name: m.name.trim(), role: m.role ?? null, ...(m.baseCity ? { baseCity: m.baseCity } : {}) })),
})

/**
 * Smart travel & logistics cost calculator: prefilled from the application / quotation / audit plan,
 * compares itinerary options, shows every line with its price status and source, supports justified
 * adjustments, approval, refresh before the client sees it, and (plans) actual costs with variance.
 * Never presents an estimate as a confirmed price.
 */
export function TravelCostPanel({ scope, variant, currency, teamNames, seed, value, onAmountChange, className }: TravelCostPanelProps) {
  const { t, i18n } = useTranslation()
  const [context, setContext] = useState<TravelContext | null>(null)
  const [cities, setCities] = useState<TravelCity[]>([])
  const [threshold, setThreshold] = useState<number | null>(null)
  const [rawInputs, setInputs] = useState<TravelInputs | null>(null)
  const [estimate, setEstimate] = useState<TravelEstimate | null>(null)
  const [editing, setEditing] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [adjusting, setAdjusting] = useState<TravelLine | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<TravelLine | null>(null)
  const [actualsOpen, setActualsOpen] = useState(false)
  const scopeKey = `${scope.applicationId ?? ''}|${scope.quotationId ?? ''}|${scope.auditPlanId ?? ''}`
  const teamKey = (teamNames ?? []).join('|')
  const seedKey = JSON.stringify(seed ?? {})

  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    Promise.all([getTravelContext(scope, seed), listTravelCities(), getTravelPolicy()])
      .then(async ([ctx, list, policy]) => {
        // Open the latest estimate of this record (approved first).
        const latest = ctx.estimates.find((e) => e.status === 'APPROVED') ?? ctx.estimates.find((e) => e.status === 'DRAFT')
        const current = latest ? await getTravelEstimate(latest.id) : null
        if (!alive) return
        setContext(ctx)
        setCities(list)
        setThreshold(policy.settings.adjustmentApprovalThreshold)
        setInputs(toInputs(ctx))
        if (current) {
          setEstimate(current)
          setEditing(false)
        }
      })
      .catch(() => alive && setLoadFailed(true))
    return () => {
      alive = false
    }
    // scopeKey / seedKey stand for the scope and seed objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, seedKey, attempt])

  // The quotation step's team replaces the record's team (names only; bases resolved by the server).
  const inputs = useMemo(
    () => (rawInputs && teamNames?.length ? { ...rawInputs, team: teamNames.map((name) => rawInputs.team.find((m) => m.name === name) ?? { name }) } : rawInputs),
    // teamKey stands for teamNames
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawInputs, teamKey],
  )

  const run = async (label: string, action: () => Promise<TravelEstimate>, success?: string) => {
    setBusy(label)
    setError(null)
    try {
      const next = await action()
      setEstimate(next)
      if (success) toast.success(success)
      return next
    } catch (err) {
      setError(travelErrorMessage(err, t))
      return null
    } finally {
      setBusy(null)
    }
  }

  const saved = Boolean(estimate?.id)
  const editable = saved && estimate?.status !== 'SUPERSEDED'
  const money = (v: number | null | undefined) => formatMoney(v ?? 0, estimate?.currency ?? currency ?? 'SAR', i18n.language)
  const inputsValid = Boolean(inputs && inputs.startDate && inputs.endDate && inputs.endDate >= inputs.startDate && (inputs.mode === 'REMOTE' || (inputs.sites.some((s) => s.name.trim()) && inputs.team.some((m) => m.name.trim()))))
  const approvedApplied = variant === 'quotation' && estimate?.status === 'APPROVED' && value !== undefined && Number(value) === estimate.totalEstimated

  // An approved estimate feeds the quotation's travel expenses.
  useEffect(() => {
    if (variant !== 'quotation' || !onAmountChange || estimate?.status !== 'APPROVED') return
    if (Number(value) !== estimate.totalEstimated) onAmountChange(estimate.totalEstimated.toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimate?.status, estimate?.totalEstimated])

  const calculate = () => inputs && run('preview', () => previewTravelEstimate(request(scope, inputs, currency)))
  const save = async () => {
    if (!inputs) return
    const next = await run('save', () => createTravelEstimate({ ...request(scope, inputs, currency), selectedOption: estimate?.selectedOption ?? undefined }), t('travel.toast.saved'))
    if (next) setEditing(false)
  }
  const recalculate = async () => {
    if (!inputs || !estimate?.id) return
    const next = await run('save', () => refreshTravelEstimate(estimate.id as string, request({}, inputs)), t('travel.toast.recalculated'))
    if (next) setEditing(false)
  }

  const banner = useMemo(() => {
    if (!estimate) return null
    if (estimate.stale) return { tone: 'error' as const, title: t('travel.banner.staleTitle'), text: estimate.staleReason ?? t('travel.banner.staleText') }
    if (estimate.expired) return { tone: 'error' as const, title: t('travel.banner.expiredTitle'), text: t('travel.banner.expiredText', { date: formatDate(estimate.validUntil, i18n.language) }) }
    if (estimate.priceConfirmed && estimate.lines.length) return { tone: 'success' as const, title: t('travel.banner.confirmedTitle'), text: t('travel.banner.confirmedText', { date: formatDate(estimate.validUntil, i18n.language) }) }
    return { tone: 'warning' as const, title: t('travel.banner.estimateTitle'), text: t('travel.banner.estimateText', { date: formatDate(estimate.validUntil, i18n.language) }) }
  }, [estimate, t, i18n.language])

  if (loadFailed) {
    return (
      <section className={className}>
        <Alert tone="error" title={t('travel.errors.loadTitle')} action={<Button size="sm" variant="outline" onClick={() => { setLoadFailed(false); setAttempt((n) => n + 1) }}>{t('travel.common.retry')}</Button>}>
          {t('travel.errors.load')}
        </Alert>
      </section>
    )
  }
  if (!context || !inputs) return <p className={className ?? 'text-body-sm text-neutral-600'}>{t('travel.common.loading')}</p>

  return (
    <section className={cn('@container min-w-0', className)} aria-labelledby="travel-panel-title" data-testid="travel-cost-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="travel-panel-title" className="text-body font-bold text-primary">
            {t('travel.panel.title')}
          </h3>
          <p className="mt-1 text-body-sm text-neutral-600">{variant === 'plan' ? t('travel.panel.subtitlePlan') : t('travel.panel.subtitleQuotation')}</p>
        </div>
        {estimate?.estimateNumber && (
          <span className="rounded-sm bg-neutral-50 px-2 py-1 text-caption font-medium text-neutral-700">
            {estimate.estimateNumber} · {t(`travel.estimateStatus.${estimate.status}`)}
          </span>
        )}
      </div>

      {context.samplesPending > 0 && (
        <p className="mt-3 text-caption text-text-secondary">
          {t('travel.panel.samples', { count: context.samplesPending })}{' '}
          <Link className="font-medium text-primary underline" to={ROUTES.cabTravelPolicy}>
            {t('travel.panel.openPolicy')}
          </Link>
        </p>
      )}

      {banner && (
        <Alert className="mt-4" tone={banner.tone} title={banner.title} role={banner.tone === 'error' ? 'alert' : 'status'}>
          {banner.text}
        </Alert>
      )}

      {editing || !estimate ? (
        <div className="mt-4 space-y-4">
          <TravelInputsForm value={inputs} onChange={setInputs} cities={cities} teamLocked={Boolean(teamNames?.length)} />
          <div className="flex flex-wrap gap-3">
            <Button type="button" size="md" variant="outline" disabled={!inputsValid || Boolean(busy)} onClick={() => void calculate()}>
              {busy === 'preview' ? t('travel.common.working') : t('travel.actions.calculate')}
            </Button>
            {estimate?.id ? (
              <>
                <Button type="button" size="md" disabled={!inputsValid || Boolean(busy)} onClick={() => void recalculate()}>
                  {t('travel.actions.recalculate')}
                </Button>
                <Button type="button" size="md" variant="tertiary" onClick={() => setEditing(false)}>
                  {t('travel.common.cancel')}
                </Button>
              </>
            ) : (
              <Button type="button" size="md" disabled={!inputsValid || Boolean(busy) || !estimate} onClick={() => void save()}>
                {busy === 'save' ? t('travel.common.working') : t('travel.actions.save')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-neutral-25 px-4 py-3 text-body-sm">
          <span className="min-w-0 text-neutral-700">
            {t(`travel.mode.${estimate.mode}`)} · {formatDate(estimate.startDate, i18n.language)} → {formatDate(estimate.endDate, i18n.language)} · {t('travel.panel.sitesCount', { count: estimate.inputs.sites.length })} · {t('travel.panel.teamCount', { count: estimate.inputs.team.length })}
          </span>
          <Button type="button" size="sm" variant="outline" disabled={!editable} onClick={() => setEditing(true)}>
            {t('travel.actions.editInputs')}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
          {error}
        </p>
      )}

      {estimate && (
        <div className="mt-5 space-y-5">
          {estimate.warnings.length > 0 && (
            <Alert tone="warning" title={t('travel.panel.warnings')}>
              <ul className="list-disc space-y-1 ps-4">
                {estimate.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}

          {estimate.options.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-body-sm font-semibold text-neutral-900">{t('travel.options.title')}</h4>
              <TravelOptions
                estimate={estimate}
                disabled={Boolean(busy) || (saved && !editable)}
                onSelect={(key) => {
                  if (estimate.id) void run('option', () => selectTravelOption(estimate.id as string, key))
                  else if (inputs) void run('preview', () => previewTravelEstimate({ ...request(scope, inputs, currency), selectedOption: key }))
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-body-sm font-semibold text-neutral-900">{t('travel.table.title')}</h4>
              <span className="text-caption text-text-secondary">
                {estimate.horizon ? `${horizonLabel(t, estimate.horizon)} · ` : ''}
                {estimate.pricedAt ? t('travel.panel.pricedAt', { date: formatDateTime(estimate.pricedAt, i18n.language) }) : ''}
              </span>
            </div>
            <TravelBreakdown estimate={estimate} showActuals={variant === 'plan'} editable={editable && !busy} onAdjust={setAdjusting} onRemove={setRemoving} />
          </div>

          <dl className="grid gap-3 text-body-sm @lg:grid-cols-3">
            <div>
              <dt className="text-text-secondary">{t('travel.panel.validUntil')}</dt>
              <dd className="font-semibold">{formatDate(estimate.validUntil, i18n.language)}</dd>
            </div>
            {estimate.bookBy && (
              <div>
                <dt className="text-text-secondary">{t('travel.panel.bookBy')}</dt>
                <dd className="font-semibold">{formatDate(estimate.bookBy, i18n.language)}</dd>
              </div>
            )}
            <div>
              <dt className="text-text-secondary">{t('travel.panel.priceLabel')}</dt>
              <dd className="font-semibold">{estimate.priceConfirmed && estimate.lines.length ? t('travel.banner.confirmedTitle') : t('travel.banner.estimateTitle')}</dd>
            </div>
          </dl>

          {estimate.assumptions.length > 0 && (
            <details className="rounded-md border border-neutral-100 p-3">
              <summary className="cursor-pointer text-body-sm font-semibold text-neutral-900">{t('travel.panel.assumptions', { count: estimate.assumptions.length })}</summary>
              <ul className="mt-2 list-disc space-y-1 ps-5 text-caption text-neutral-700">
                {estimate.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex flex-wrap gap-3">
            {editable && (
              <Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void run('refresh', () => refreshTravelEstimate(estimate.id as string), t('travel.toast.refreshed'))}>
                <AppIcon icon={Refresh2} size={16} />
                {busy === 'refresh' ? t('travel.common.working') : t('travel.actions.refresh')}
              </Button>
            )}
            {editable && (
              <Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => setAdding(true)}>
                {t('travel.actions.addCost')}
              </Button>
            )}
            {editable && estimate.status === 'DRAFT' && (
              <Button type="button" size="sm" disabled={Boolean(busy) || estimate.stale || estimate.expired || estimate.canApprove === false} onClick={() => void run('approve', () => approveTravelEstimate(estimate.id as string), t('travel.toast.approved'))}>
                {busy === 'approve' ? t('travel.common.working') : t('travel.actions.approve')}
              </Button>
            )}
            {variant === 'plan' && editable && (
              <Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => setActualsOpen(true)}>
                {t('travel.actions.actuals')}
              </Button>
            )}
            {!saved && (
              <Button type="button" size="sm" disabled={!inputsValid || Boolean(busy)} onClick={() => void save()}>
                {busy === 'save' ? t('travel.common.working') : t('travel.actions.save')}
              </Button>
            )}
          </div>
          {estimate.status === 'DRAFT' && estimate.canApprove === false && !estimate.stale && <p className="text-caption text-warning-800">{t('travel.panel.secondApprover')}</p>}

          <TravelAuditTrail estimate={estimate} />
        </div>
      )}

      {variant === 'quotation' && onAmountChange && (
        <div className="mt-5 border-t border-neutral-100 pt-4">
          <TextField
            id="quotation-travel"
            label={`${t('travel.panel.quotationAmount')} (${currency ?? context.currency})`}
            type="number"
            min="0"
            step="0.01"
            required
            value={value ?? ''}
            readOnly={approvedApplied}
            onChange={(event) => onAmountChange(event.target.value)}
          />
          <p className="mt-2 text-caption text-text-secondary">{approvedApplied ? t('travel.panel.amountFromEstimate', { number: estimate?.estimateNumber ?? '' }) : t('travel.panel.amountManual')}</p>
          {context.quotedTravel !== null && variant === 'quotation' && <p className="mt-1 text-caption text-text-secondary">{t('travel.panel.quoted', { amount: money(context.quotedTravel) })}</p>}
        </div>
      )}
      {variant === 'plan' && context.quotedTravel !== null && <p className="mt-3 text-caption text-text-secondary">{t('travel.panel.quoted', { amount: money(context.quotedTravel) })}</p>}

      {estimate && (
        <>
          <AdjustLineDialog
            line={adjusting}
            currency={estimate.currency}
            threshold={threshold}
            onClose={() => setAdjusting(null)}
            onAdjust={async (body) => {
              const next = await adjustTravelLine(estimate.id as string, (adjusting as TravelLine).id, body)
              setEstimate(next)
            }}
            onReset={async () => {
              const next = await adjustTravelLine(estimate.id as string, (adjusting as TravelLine).id, { reset: true })
              setEstimate(next)
            }}
          />
          <RemoveLineDialog
            line={removing}
            onClose={() => setRemoving(null)}
            onRemove={async (why) => setEstimate(await removeTravelLine(estimate.id as string, (removing as TravelLine).id, why))}
          />
          <AddLineDialog
            open={adding}
            currency={estimate.currency}
            onClose={() => setAdding(false)}
            onAdd={async (body) => setEstimate(await addTravelLine(estimate.id as string, body))}
          />
          <ActualsDialog
            estimate={estimate}
            open={actualsOpen}
            onClose={() => setActualsOpen(false)}
            onSave={async (lines) => setEstimate(await recordTravelActuals(estimate.id as string, lines))}
          />
        </>
      )}
    </section>
  )
}
