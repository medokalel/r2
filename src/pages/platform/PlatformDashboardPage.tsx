import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchPlatformDashboard } from '@/lib/api/platformApi'
import type { TenantRow } from '@/lib/api/platformTypes'
import { getPlatformRole } from '@/lib/authStorage'
import { platformCan } from '@/lib/subscriptionFeatures'
import { PLATFORM_ROUTES, platformTenantPath } from '@/lib/platformRoutes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { Card, EmptyState, ErrorBlock, KpiCard, LoadingBlock, PageHeader, PlanBadge, SubscriptionStatusBadge } from '@/components/platform/PlatformUi'
import { PLATFORM_BRAND } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { ActivityItem } from '@/components/platform/ActivityItem'
import { UsageMeter } from '@/components/subscription/UsageMeter'

const PLAN_COLORS = [PLATFORM_BRAND.blue, PLATFORM_BRAND.teal, PLATFORM_BRAND.gold, PLATFORM_BRAND.mid]

function TenantLine({ row, extra }: { row: TenantRow; extra: React.ReactNode }) {
  return (
    <li className="py-3">
      <Link to={platformTenantPath(row.id)} className="flex min-w-0 flex-col gap-1.5 rounded-md hover:bg-neutral-25 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0">
          <span className="block truncate text-body-sm font-semibold text-neutral-900">{row.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <PlanBadge code={row.plan.code} name={row.plan.name} />
            <SubscriptionStatusBadge status={row.status} />
          </span>
        </span>
        <span className="shrink-0 text-body-sm text-neutral-700">{extra}</span>
      </Link>
    </li>
  )
}

export function PlatformDashboardPage() {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const role = getPlatformRole()
  const showMoney = platformCan(role, 'money')
  const { data, loading, error, reload } = useLoader(fetchPlatformDashboard, [])

  const featureUse = [...(data?.usage.featureUse ?? [])].sort((a, b) => b.tenants - a.tenants)
  const maxFeatureUse = Math.max(1, ...featureUse.map((f2) => f2.tenants))

  return (
    <>
      <PageHeader title={t('platform.dashboard.title')} subtitle={t('platform.dashboard.subtitle')} />
      {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
      {loading && !data ? <LoadingBlock rows={6} /> : null}
      {data && (
        <>
          <section aria-label={t('platform.dashboard.kpis')} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {showMoney && <KpiCard label={t('platform.dashboard.kpi.mrr')} value={f.usdShort(data.kpis.mrrUsd)} hint={t('platform.dashboard.kpi.mrrHint')} />}
            {showMoney && <KpiCard label={t('platform.dashboard.kpi.arr')} value={f.usdShort(data.kpis.arrUsd)} accent={PLATFORM_BRAND.mid} />}
            <KpiCard label={t('platform.dashboard.kpi.active')} value={f.number(data.kpis.activeTenants)} accent={PLATFORM_BRAND.teal} />
            <KpiCard label={t('platform.dashboard.kpi.trial')} value={f.number(data.kpis.trialTenants)} accent={PLATFORM_BRAND.mid} />
            <KpiCard label={t('platform.dashboard.kpi.pastDue')} value={f.number(data.kpis.pastDueTenants)} accent={PLATFORM_BRAND.gold} />
            <KpiCard label={t('platform.dashboard.kpi.suspended')} value={f.number(data.kpis.suspendedTenants)} accent="#e74d3c" />
            <KpiCard label={t('platform.dashboard.kpi.newThisMonth')} value={f.number(data.kpis.newThisMonth)} accent={PLATFORM_BRAND.teal} />
            <KpiCard label={t('platform.dashboard.kpi.churn')} value={f.percent(data.kpis.churnRate90d)} hint={t('platform.dashboard.kpi.churnHint')} accent="#7c7c7c" />
            {showMoney && <KpiCard label={t('platform.dashboard.kpi.outstanding')} value={f.usdShort(data.kpis.outstandingUsd)} accent={PLATFORM_BRAND.gold} />}
            {showMoney && <KpiCard label={t('platform.dashboard.kpi.overdue')} value={f.usdShort(data.kpis.overdueUsd)} accent="#e74d3c" />}
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
            {showMoney ? (
              <Card title={t('platform.dashboard.revenueByPlan')}>
                <div className="h-[260px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueByPlan} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#ececec" />
                      <XAxis dataKey="plan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                      <YAxis axisLine={false} tickLine={false} width={56} tick={{ fontSize: 11, fill: '#999' }} tickFormatter={(v: number) => f.usdShort(v)} />
                      <Tooltip
                        cursor={{ fill: '#f3f6fd' }}
                        formatter={(value) => [f.usd(Number(value)), t('platform.dashboard.mrr')]}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Bar dataKey="mrrUsd" radius={[6, 6, 0, 0]} maxBarSize={72}>
                        {data.revenueByPlan.map((entry, i) => (
                          <Cell key={entry.plan} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {data.revenueByPlan.map((entry, i) => (
                    <li key={entry.plan} className="flex items-center justify-between gap-2 rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                        <span className="truncate font-medium text-neutral-800">{entry.plan}</span>
                      </span>
                      <span className="shrink-0 text-neutral-600">{t('platform.dashboard.tenantsCount', { count: entry.tenants })}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : (
              <Card title={t('platform.dashboard.tenantsByPlan')}>
                <ul className="flex flex-col gap-2">
                  {data.revenueByPlan.map((entry) => (
                    <li key={entry.plan} className="flex justify-between rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
                      <span className="font-medium">{entry.plan}</span>
                      <span className="text-neutral-600">{t('platform.dashboard.tenantsCount', { count: entry.tenants })}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title={t('platform.dashboard.usage')}>
              <div className="flex flex-col gap-4">
                <UsageMeter label={t('platform.dashboard.seats')} used={data.usage.seatsUsed} limit={data.usage.seatsAllowed} />
                <p className="text-body-sm text-neutral-700">
                  {t('platform.dashboard.certificatesActive')}: <span className="font-semibold text-neutral-900">{f.number(data.usage.certificatesActive)}</span>
                </p>
                <div>
                  <p className="mb-2 text-body-sm font-semibold text-neutral-800">{t('platform.dashboard.featureUse')}</p>
                  <ul className="flex flex-col gap-1.5">
                    {featureUse.slice(0, 8).map((item) => (
                      <li key={item.featureKey} className="grid grid-cols-[minmax(0,1fr)_80px_28px] items-center gap-2 text-caption">
                        <span className="truncate text-neutral-800">{t(`platform.features.${item.featureKey}`)}</span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                          <span className="block h-full rounded-full bg-accent-teal" style={{ width: `${(item.tenants / maxFeatureUse) * 100}%` }} />
                        </span>
                        <span className="text-end text-neutral-600">{item.tenants}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card title={t('platform.dashboard.renewals')} actions={<Link to={PLATFORM_ROUTES.tenants} className="text-body-sm font-semibold text-primary hover:underline">{t('platform.common.viewAll')}</Link>}>
              {data.renewalsNext30.length === 0 ? (
                <EmptyState title={t('platform.dashboard.noRenewals')} />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.renewalsNext30.map((row) => (
                    <TenantLine
                      key={row.id}
                      row={row}
                      extra={
                        <>
                          {f.date(row.currentPeriodEnd)} · {t('platform.common.inDays', { count: Math.max(0, f.daysFromNow(row.currentPeriodEnd) ?? 0) })}
                        </>
                      }
                    />
                  ))}
                </ul>
              )}
            </Card>
            <Card title={t('platform.dashboard.upgradeCandidates')}>
              {data.upgradeCandidates.length === 0 ? (
                <EmptyState title={t('platform.dashboard.noCandidates')} />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.upgradeCandidates.map((row) => (
                    <TenantLine key={row.id} row={row} extra={t(`platform.dashboard.reasons.${row.reason}`, { defaultValue: row.reason })} />
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title={t('platform.dashboard.recentActivity')}>
            {data.recentActivity.length === 0 ? (
              <EmptyState title={t('platform.audit.empty')} />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {data.recentActivity.map((row) => (
                  <ActivityItem key={row.id} row={row} />
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  )
}
