import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { DataTable, EmptyState, ErrorBlock, FieldLabel, LoadingBlock, MobileCard, MobileCards, PageHeader } from '@/components/platform/PlatformUi'
import { cellClass, inputClassName, rowClass } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { SelectField } from '@/components/ui/Select'
import { getPlatformAuditLog, listStaff } from '@/lib/api/platformApi'
import type { AuditRow } from '@/lib/api/platformTypes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'
import { notSet } from '@/lib/emptyValue'

const LIMIT = 15

function changeSummary(row: AuditRow): string {
  const pick = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : null)
  const before = pick(row.before)
  const after = pick(row.after)
  if (!after) return ''
  return Object.keys(after)
    .filter((key) => ['status', 'plan', 'planId', 'billingCycle', 'role', 'minutes', 'amount', 'extraUsers'].includes(key))
    .map((key) => (before && key in before ? `${key}: ${String(before[key])} → ${String(after[key])}` : `${key}: ${String(after[key])}`))
    .join(' · ')
}

export function PlatformAuditLogPage() {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const [actor, setActor] = useState('all')
  const staff = useLoader(listStaff, [])
  const [target, setTarget] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useLoader(
    () => getPlatformAuditLog({ actor: actor === 'all' ? undefined : actor, target: target.trim() || undefined, from: from || undefined, to: to || undefined, page, limit: LIMIT }),
    [actor, target, from, to, page],
  )
  const action = (row: AuditRow) => t(`platform.auditActions.${row.action.replace(/\./g, '_')}`, { defaultValue: row.action })
  const reset = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1)
    fn(e.target.value)
  }

  return (
    <>
      <PageHeader
        title={t('platform.audit.title')}
        subtitle={t('platform.audit.subtitle')}
        crumbs={[{ label: t('platform.nav.dashboard'), to: PLATFORM_ROUTES.dashboard }, { label: t('platform.audit.title') }]}
      />
      <section className="rounded-lg border border-neutral-100 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <FieldLabel>{t('platform.audit.actor')}</FieldLabel>
            <SelectField
              value={actor}
              onChange={(v) => {
                setPage(1)
                setActor(v)
              }}
              options={[{ value: 'all', label: t('platform.audit.allActors') }, ...(staff.data ?? []).map((u) => ({ value: u.id, label: u.name }))]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="al-target">{t('platform.audit.target')}</FieldLabel>
            <input id="al-target" type="search" className={inputClassName} value={target} onChange={reset(setTarget)} placeholder={t('platform.audit.targetPlaceholder')} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="al-from">{t('platform.audit.from')}</FieldLabel>
            <input id="al-from" type="date" dir="ltr" className={inputClassName} value={from} max={to || undefined} onChange={reset(setFrom)} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="al-to">{t('platform.audit.to')}</FieldLabel>
            <input id="al-to" type="date" dir="ltr" className={inputClassName} value={to} min={from || undefined} onChange={reset(setTo)} />
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-5">
        <p className="text-body-sm text-neutral-600">{loading ? t('platform.common.loading') : t('platform.audit.count', { count: data?.total ?? 0 })}</p>
        {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
        {loading && !data ? (
          <LoadingBlock />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title={t('platform.audit.empty')} />
        ) : (
          <>
            <DataTable minWidth={980} head={[t('platform.audit.when'), t('platform.audit.actor'), t('platform.audit.action'), t('platform.audit.target'), t('platform.common.reason'), t('platform.audit.changes')]}>
              {data.items.map((row, index) => (
                <tr key={row.id} className={rowClass(index)}>
                  <td className={`${cellClass} whitespace-nowrap`}>{f.dateTime(row.createdAt)}</td>
                  <td className={cellClass}>{row.actorName ?? row.actorUserId}</td>
                  <td className={`${cellClass} font-medium text-neutral-900`}>{action(row)}</td>
                  <td className={cellClass}>
                    <span className="block">{row.targetName ?? row.targetId}</span>
                    <span className="block text-caption text-neutral-600">{t(`platform.audit.targetTypes.${row.targetType}`, { defaultValue: row.targetType })}</span>
                  </td>
                  <td className={`${cellClass} max-w-[220px]`}>{row.reason ?? notSet()}</td>
                  <td className={`${cellClass} max-w-[240px] text-caption text-neutral-600`} dir="ltr" style={{ textAlign: 'start' }}>{changeSummary(row) || notSet()}</td>
                </tr>
              ))}
            </DataTable>
            <MobileCards>
              {data.items.map((row) => (
                <MobileCard key={row.id}>
                  <p className="text-body-sm font-semibold text-neutral-900">{action(row)}</p>
                  <p className="text-body-sm text-neutral-700">{row.targetName ?? row.targetId}</p>
                  {row.reason && <p className="mt-1 text-body-sm text-neutral-600">“{row.reason}”</p>}
                  <p className="mt-2 text-caption text-neutral-500">
                    {row.actorName ?? row.actorUserId} · {f.dateTime(row.createdAt)}
                  </p>
                </MobileCard>
              ))}
            </MobileCards>
            <div className="flex justify-end border-t border-neutral-100 pt-4">
              <TablePagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>
    </>
  )
}
