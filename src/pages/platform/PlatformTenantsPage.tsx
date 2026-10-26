import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { listPlans, listTenants } from '@/lib/api/platformApi'
import { SUBSCRIPTION_STATUSES } from '@/lib/api/platformTypes'
import { getPlatformRole } from '@/lib/authStorage'
import { countryName } from '@/lib/countries'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES, platformTenantPath } from '@/lib/platformRoutes'
import { platformCan } from '@/lib/subscriptionFeatures'
import {
  DataTable,
  EmptyState,
  ErrorBlock,
  FieldLabel,
  LoadingBlock,
  MobileCard,
  MobileCards,
  PageHeader,
  PlanBadge,
  SubscriptionStatusBadge,
} from '@/components/platform/PlatformUi'
import { cellClass, inputClassName, rowClass } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { UsageMeter } from '@/components/subscription/UsageMeter'
import { notSet } from '@/lib/emptyValue'

const PAGE_SIZE = 10

export function PlatformTenantsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const f = usePlatformFormat()
  const role = getPlatformRole()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [plan, setPlan] = useState('all')
  const [page, setPage] = useState(1)

  const filters = { search: search.trim() || undefined, status: status === 'all' ? undefined : status, plan: plan === 'all' ? undefined : plan }
  const { data, loading, error, reload } = useLoader(() => listTenants(filters), [filters.search, filters.status, filters.plan])
  const plans = useLoader(listPlans, [])

  const rows = useMemo(() => data ?? [], [data])
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const hasFilters = Boolean(search || status !== 'all' || plan !== 'all')
  const showMoney = platformCan(role, 'money')
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'

  return (
    <>
      <PageHeader
        title={t('platform.tenants.title')}
        subtitle={t('platform.tenants.subtitle')}
        crumbs={[{ label: t('platform.nav.dashboard'), to: PLATFORM_ROUTES.dashboard }, { label: t('platform.tenants.title') }]}
        actions={
          platformCan(role, 'manageTenants') ? (
            <Button variant="primary" icon={<AppIcon icon={AddCircleIcon} size={20} />} onClick={() => navigate(PLATFORM_ROUTES.tenantNew)} className="w-full sm:w-auto">
              {t('platform.tenants.new')}
            </Button>
          ) : undefined
        }
      />

      <section className="rounded-lg border border-neutral-100 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <FieldLabel htmlFor="tenant-search">{t('platform.common.search')}</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                <AppIcon icon={SearchIcon} size={18} />
              </span>
              <input
                id="tenant-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setPage(1)
                  setSearch(event.target.value)
                }}
                placeholder={t('platform.tenants.searchPlaceholder')}
                className={`${inputClassName} ps-10`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>{t('platform.common.status')}</FieldLabel>
            <SelectField
              value={status}
              onChange={(value) => {
                setPage(1)
                setStatus(value)
              }}
              options={[{ value: 'all', label: t('platform.common.allStatuses') }, ...SUBSCRIPTION_STATUSES.map((s) => ({ value: s, label: t(`platform.status.${s}`) }))]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>{t('platform.common.plan')}</FieldLabel>
            <SelectField
              value={plan}
              onChange={(value) => {
                setPage(1)
                setPlan(value)
              }}
              options={[{ value: 'all', label: t('platform.common.allPlans') }, ...(plans.data ?? []).map((p) => ({ value: p.code, label: p.name }))]}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStatus('all')
              setPlan('all')
              setPage(1)
            }}
            disabled={!hasFilters}
            className="h-11 justify-self-start whitespace-nowrap text-body-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
          >
            {t('platform.common.clearFilters')}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-5">
        <p className="text-body-sm text-neutral-600">{loading ? t('platform.common.loading') : t('platform.tenants.count', { count: rows.length })}</p>
        {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
        {loading && !data ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState title={t('platform.tenants.empty')} hint={hasFilters ? t('platform.common.tryOtherFilters') : undefined} />
        ) : (
          <>
            <DataTable
              minWidth={showMoney ? 1040 : 920}
              head={[
                t('platform.tenants.col.tenant'),
                t('platform.common.plan'),
                t('platform.common.status'),
                t('platform.tenants.col.users'),
                t('platform.tenants.col.certificates'),
                t('platform.tenants.col.renewal'),
                ...(showMoney ? [t('platform.tenants.col.outstanding')] : []),
              ]}
            >
              {visible.map((row, index) => (
                <tr key={row.id} className={`${rowClass(index)} cursor-pointer hover:bg-primary-25`} onClick={() => navigate(platformTenantPath(row.id))}>
                  <td className={cellClass}>
                    <button type="button" className="text-start" onClick={() => navigate(platformTenantPath(row.id))}>
                      <span className="block font-semibold text-primary">{row.name}</span>
                      <span className="block text-caption text-neutral-600">
                        <span dir="ltr">{row.slug}</span> · {countryName(row.country, lang)}
                      </span>
                    </button>
                  </td>
                  <td className={cellClass}>
                    <PlanBadge code={row.plan.code} name={row.plan.name} />
                    <span className="mt-1 block text-caption text-neutral-600">{t(`platform.cycle.${row.billingCycle}`)}</span>
                  </td>
                  <td className={cellClass}>
                    <SubscriptionStatusBadge status={row.status} />
                  </td>
                  <td className={`${cellClass} w-[150px]`}>
                    <UsageMeter compact used={row.users.used} limit={row.users.limit} label={t('platform.tenants.col.users')} />
                  </td>
                  <td className={`${cellClass} w-[150px]`}>
                    <UsageMeter compact used={row.certificates.active} limit={row.certificates.limit} label={t('platform.tenants.col.certificates')} />
                  </td>
                  <td className={`${cellClass} whitespace-nowrap`}>{f.date(row.currentPeriodEnd)}</td>
                  {showMoney && (
                    <td className={`${cellClass} whitespace-nowrap font-medium`} dir="ltr" style={{ textAlign: 'start' }}>
                      {row.outstandingUsd > 0 ? f.usd(row.outstandingUsd) : notSet()}
                    </td>
                  )}
                </tr>
              ))}
            </DataTable>
            <MobileCards>
              {visible.map((row) => (
                <MobileCard key={row.id} onClick={() => navigate(platformTenantPath(row.id))}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-body font-semibold text-primary">{row.name}</p>
                      <p className="text-caption text-neutral-600">{countryName(row.country, lang)}</p>
                    </div>
                    <SubscriptionStatusBadge status={row.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-neutral-600">
                    <PlanBadge code={row.plan.code} name={row.plan.name} />
                    <span>{t(`platform.cycle.${row.billingCycle}`)}</span>
                    <span>· {t('platform.tenants.col.renewal')}: {f.date(row.currentPeriodEnd)}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <UsageMeter used={row.users.used} limit={row.users.limit} label={t('platform.tenants.col.users')} />
                    <UsageMeter used={row.certificates.active} limit={row.certificates.limit} label={t('platform.tenants.col.certificatesShort')} />
                  </div>
                  {showMoney && row.outstandingUsd > 0 && (
                    <p className="mt-3 text-body-sm font-medium text-error-600">
                      {t('platform.tenants.col.outstanding')}: <span dir="ltr">{f.usd(row.outstandingUsd)}</span>
                    </p>
                  )}
                </MobileCard>
              ))}
            </MobileCards>
            <div className="flex justify-end border-t border-neutral-100 pt-4">
              <TablePagination page={current} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>
    </>
  )
}
