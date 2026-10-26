import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TravelEstimate, TravelLine, TravelOption } from '@/lib/api/travelApi'
import { formatDateTime } from '@/lib/format/dates'
import { cn } from '@/lib/utils'
import { PriceStatusBadge } from '@/components/travel/PriceStatusBadge'
import { categoryLabel, formatMoney, legModeLabel, optionLabel } from '@/components/travel/travelHelpers'

/** Itinerary options side by side: total cost, travel time and the mode of every leg. */
export function TravelOptions({ estimate, disabled, onSelect }: { estimate: TravelEstimate; disabled?: boolean; onSelect: (key: string) => void }) {
  const { t, i18n } = useTranslation()
  if (estimate.options.length <= 1 && estimate.options[0]?.key === 'remote') return null
  const cheapest = Math.min(...estimate.options.map((o) => o.total))
  const fastest = Math.min(...estimate.options.map((o) => o.travelHours))
  return (
    <div className="grid gap-3 @2xl:grid-cols-3" role="radiogroup" aria-label={t('travel.options.title')}>
      {estimate.options.map((option: TravelOption) => {
        const selected = option.key === estimate.selectedOption
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => !selected && onSelect(option.key)}
            className={cn(
              'flex min-w-0 flex-col gap-2 rounded-lg border p-4 text-start transition-colors disabled:cursor-not-allowed',
              selected ? 'border-primary bg-primary-25' : 'border-neutral-100 bg-white hover:border-primary-200',
            )}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-body-sm font-semibold text-neutral-900">{optionLabel(t, option.key)}</span>
              {option.total === cheapest && <span className="rounded-sm bg-success-50 px-2 py-0.5 text-caption text-success-700">{t('travel.options.lowestCost')}</span>}
              {option.travelHours === fastest && <span className="rounded-sm bg-info-50 px-2 py-0.5 text-caption text-info-700">{t('travel.options.fastest')}</span>}
            </span>
            <span className="text-body-lg font-bold text-primary">{formatMoney(option.total, estimate.currency, i18n.language)}</span>
            <span className="text-caption text-text-secondary">{t('travel.options.hours', { hours: option.travelHours })}</span>
            <ul className="space-y-1 text-caption text-neutral-700">
              {option.legs.map((leg, i) => (
                <li key={`${leg.groupKey}-${i}`} className="truncate">
                  {leg.from} → {leg.to}: {legModeLabel(t, leg.mode)}
                  {leg.distanceKm ? ` · ${Math.round(leg.distanceKm)} ${t('travel.common.km')}` : ''}
                </li>
              ))}
            </ul>
          </button>
        )
      })}
    </div>
  )
}

/** Line title: the category in the UI language, then the calculated description (route, dates, nights). */
function LineTitle({ line }: { line: TravelLine }) {
  const { t } = useTranslation()
  return (
    <>
      <p className="text-body-sm font-medium text-neutral-900">{categoryLabel(t, line.category)}</p>
      <p className="text-caption text-text-secondary" dir="auto">
        {line.label}
        {line.auditorName ? ` · ${line.auditorName}` : ''}
      </p>
    </>
  )
}

/** Source details of one line: provider, retrieval, expiry, cache age, FX and assumption. */
function LineDetails({ line, currency }: { line: TravelLine; currency: string }) {
  const { t, i18n } = useTranslation()
  const facts: Array<[string, string]> = [[t('travel.details.source'), line.source]]
  if (line.retrievedAt) facts.push([t('travel.details.retrieved'), formatDateTime(line.retrievedAt, i18n.language)])
  if (line.expiresAt) facts.push([t('travel.details.expires'), formatDateTime(line.expiresAt, i18n.language)])
  if (line.cacheAgeMinutes !== null) facts.push([t('travel.details.cacheAge'), t('travel.details.minutes', { count: line.cacheAgeMinutes })])
  if (line.originalCurrency && line.originalCurrency !== currency && line.originalAmount !== null) {
    facts.push([t('travel.details.original'), `${formatMoney(line.originalAmount, line.originalCurrency, i18n.language)}${line.fxRate ? ` × ${line.fxRate}` : ''}`])
    if (line.fxSource) facts.push([t('travel.details.fx'), `${line.fxSource}${line.fxDate ? ` (${line.fxDate})` : ''}`])
  }
  if (line.offerRef) facts.push([t('travel.details.offer'), line.offerRef])
  if (line.assumption) facts.push([t('travel.details.assumption'), line.assumption])
  if (line.adjusted || line.manual) {
    facts.push([t('travel.details.adjustedBy'), `${line.adjustedByName ?? ''}${line.adjustedAt ? `, ${formatDateTime(line.adjustedAt, i18n.language)}` : ''}`])
    if (line.adjustmentReason) facts.push([t('travel.details.reason'), line.adjustmentReason])
    if (line.calculatedAmount !== null) facts.push([t('travel.details.calculated'), formatMoney(line.calculatedAmount, currency, i18n.language)])
  }
  if (line.actualNote) facts.push([t('travel.details.actualNote'), line.actualNote])
  return (
    <dl className="grid gap-x-4 gap-y-1 text-caption @md:grid-cols-[max-content_minmax(0,1fr)]">
      {facts.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="font-medium text-neutral-700">{k}</dt>
          <dd className="break-words text-text-secondary">{v}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

/** Editable cost breakdown with price status per line, totals and, for plans, actual cost and variance. */
export function TravelBreakdown({ estimate, showActuals, editable, onAdjust, onRemove }: { estimate: TravelEstimate; showActuals: boolean; editable: boolean; onAdjust: (line: TravelLine) => void; onRemove: (line: TravelLine) => void }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState<string | null>(null)
  const money = (v: number | null) => formatMoney(v, estimate.currency, i18n.language)
  if (!estimate.lines.length) return <p className="rounded-md bg-neutral-50 px-4 py-3 text-body-sm text-neutral-700">{t('travel.table.empty')}</p>
  return (
    <div className="@container min-w-0">
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto @3xl:block">
        <table className="w-full min-w-[720px] text-body-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-start text-caption text-text-secondary">
              <th className="py-2 pe-3 text-start font-medium">{t('travel.table.description')}</th>
              <th className="py-2 pe-3 text-end font-medium">{t('travel.table.quantity')}</th>
              <th className="py-2 pe-3 text-end font-medium">{t('travel.table.unitAmount')}</th>
              <th className="py-2 pe-3 text-end font-medium">{t('travel.table.estimated')}</th>
              {showActuals && <th className="py-2 pe-3 text-end font-medium">{t('travel.table.actual')}</th>}
              {showActuals && <th className="py-2 pe-3 text-end font-medium">{t('travel.table.variance')}</th>}
              <th className="py-2 pe-3 text-start font-medium">{t('travel.table.status')}</th>
              <th className="py-2 text-end font-medium"><span className="sr-only">{t('travel.table.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {estimate.lines.map((line) => (
              <Fragment key={line.id}>
                <tr className="border-b border-neutral-50 align-top">
                  <td className="py-2 pe-3">
                    <LineTitle line={line} />
                  </td>
                  <td className="py-2 pe-3 text-end tabular-nums">{line.quantity}</td>
                  <td className="py-2 pe-3 text-end tabular-nums">{money(line.unitAmount)}</td>
                  <td className="py-2 pe-3 text-end font-semibold tabular-nums">{money(line.amount)}</td>
                  {showActuals && <td className="py-2 pe-3 text-end tabular-nums">{line.actualAmount === null ? '' : money(line.actualAmount)}</td>}
                  {showActuals && <td className={cn('py-2 pe-3 text-end tabular-nums', (line.variance ?? 0) > 0 ? 'text-error-600' : 'text-success-700')}>{line.variance === null ? '' : money(line.variance)}</td>}
                  <td className="py-2 pe-3">
                    <PriceStatusBadge status={line.status} />
                    {line.adjustmentNeedsApproval && <p className="mt-1 text-caption text-warning-800">{t('travel.table.needsApproval')}</p>}
                  </td>
                  <td className="py-2 text-end whitespace-nowrap">
                    <button type="button" className="text-caption font-medium text-primary hover:underline" aria-expanded={open === line.id} onClick={() => setOpen(open === line.id ? null : line.id)}>
                      {t('travel.table.details')}
                    </button>
                    {editable && line.category !== 'CONTINGENCY' && (
                      <button type="button" className="ms-3 text-caption font-medium text-primary hover:underline" onClick={() => onAdjust(line)}>
                        {t('travel.table.adjust')}
                      </button>
                    )}
                    {editable && line.manual && (
                      <button type="button" className="ms-3 text-caption font-medium text-error-600 hover:underline" onClick={() => onRemove(line)}>
                        {t('travel.table.remove')}
                      </button>
                    )}
                  </td>
                </tr>
                {open === line.id && (
                  <tr className="border-b border-neutral-50 bg-neutral-25">
                    <td colSpan={showActuals ? 8 : 6} className="px-3 py-3">
                      <LineDetails line={line} currency={estimate.currency} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone cards */}
      <ul className="space-y-3 @3xl:hidden">
        {estimate.lines.map((line) => (
          <li key={line.id} className="rounded-md border border-neutral-100 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <LineTitle line={line} />
                <p className="text-caption text-text-secondary">
                  {line.quantity} × {money(line.unitAmount)}
                </p>
              </div>
              <p className="shrink-0 text-body-sm font-semibold tabular-nums">{money(line.amount)}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <PriceStatusBadge status={line.status} />
              {showActuals && line.actualAmount !== null && (
                <span className="text-caption text-neutral-700">
                  {t('travel.table.actual')}: {money(line.actualAmount)} ({money(line.variance)})
                </span>
              )}
              <button type="button" className="text-caption font-medium text-primary" aria-expanded={open === line.id} onClick={() => setOpen(open === line.id ? null : line.id)}>
                {t('travel.table.details')}
              </button>
              {editable && line.category !== 'CONTINGENCY' && (
                <button type="button" className="text-caption font-medium text-primary" onClick={() => onAdjust(line)}>
                  {t('travel.table.adjust')}
                </button>
              )}
              {editable && line.manual && (
                <button type="button" className="text-caption font-medium text-error-600" onClick={() => onRemove(line)}>
                  {t('travel.table.remove')}
                </button>
              )}
            </div>
            {open === line.id && (
              <div className="mt-3 border-t border-neutral-100 pt-3">
                <LineDetails line={line} currency={estimate.currency} />
              </div>
            )}
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-3 text-body-sm">
        <div className="flex justify-between gap-3">
          <dt>{t('travel.totals.subtotal')}</dt>
          <dd className="tabular-nums">{money(estimate.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t('travel.totals.contingency')}</dt>
          <dd className="tabular-nums">{money(estimate.contingency)}</dd>
        </div>
        <div className="flex justify-between gap-3 text-body-lg font-bold text-primary">
          <dt>{t('travel.totals.total')}</dt>
          <dd className="tabular-nums">{money(estimate.totalEstimated)}</dd>
        </div>
        {showActuals && estimate.totalActual !== null && (
          <>
            <div className="flex justify-between gap-3">
              <dt>{t('travel.totals.actual')}</dt>
              <dd className="tabular-nums">{money(estimate.totalActual)}</dd>
            </div>
            <div className={cn('flex justify-between gap-3 font-semibold', (estimate.variance ?? 0) > 0 ? 'text-error-600' : 'text-success-700')}>
              <dt>{t('travel.totals.variance')}</dt>
              <dd className="tabular-nums">
                {money(estimate.variance)}
                {estimate.variancePct !== null ? ` (${estimate.variancePct}%)` : ''}
              </dd>
            </div>
          </>
        )}
      </dl>
    </div>
  )
}

/** Audit trail of the estimate: every pricing run, change, approval and actual cost. */
export function TravelAuditTrail({ estimate }: { estimate: TravelEstimate }) {
  const { t, i18n } = useTranslation()
  if (!estimate.events.length) return null
  return (
    <details className="rounded-md border border-neutral-100 p-3">
      <summary className="cursor-pointer text-body-sm font-semibold text-neutral-900">{t('travel.trail.title', { count: estimate.events.length })}</summary>
      <ol className="mt-3 space-y-2">
        {estimate.events.map((ev) => {
          const reason = typeof ev.details.justification === 'string' ? ev.details.justification : typeof ev.details.reason === 'string' ? ev.details.reason : null
          return (
            <li key={ev.id} className="text-caption">
              <span className="font-medium text-neutral-900">{t(`travel.trail.action.${ev.action}`, ev.action)}</span>
              <span className="text-text-secondary">
                {' · '}
                {ev.actorName ?? t('travel.trail.system')} · {formatDateTime(ev.createdAt, i18n.language)}
              </span>
              {reason && <p className="text-neutral-700">{reason}</p>}
            </li>
          )
        })}
      </ol>
    </details>
  )
}
