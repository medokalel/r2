import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { listPlans } from '@/lib/api/platformApi'
import { FEATURE_KEYS } from '@/lib/api/platformTypes'
import { getPlatformRole } from '@/lib/authStorage'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES, platformPlanPath } from '@/lib/platformRoutes'
import { platformCan } from '@/lib/subscriptionFeatures'
import { cn } from '@/lib/utils'
import { Card, DataTable, ErrorBlock, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { cellClass, rowClass } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { notSet } from '@/lib/emptyValue'

const ACCENTS = ['#1236A5', '#008C8A', '#D4A017', '#005FAE']

export function PlatformPlansPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const f = usePlatformFormat()
  const role = getPlatformRole()
  const canEdit = platformCan(role, 'editPlans')
  const { data, loading, error, reload } = useLoader(listPlans, [])
  const plans = data ?? []

  return (
    <>
      <PageHeader
        title={t('platform.plans.title')}
        subtitle={t('platform.plans.subtitle')}
        crumbs={[{ label: t('platform.nav.dashboard'), to: PLATFORM_ROUTES.dashboard }, { label: t('platform.plans.title') }]}
        actions={
          canEdit ? (
            <Button variant="primary" icon={<AppIcon icon={AddCircleIcon} size={20} />} onClick={() => navigate(PLATFORM_ROUTES.planNew)} className="w-full sm:w-auto">
              {t('platform.plans.new')}
            </Button>
          ) : undefined
        }
      />
      {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
      {loading && !data ? <LoadingBlock rows={4} /> : null}
      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan, i) => {
              const enabled = FEATURE_KEYS.filter((k) => plan.features[k]).length
              return (
                <article key={plan.id} className={cn('relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-100 bg-white p-5', !plan.isActive && 'opacity-70')}>
                  <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: ACCENTS[i % ACCENTS.length] }} aria-hidden />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-body-lg font-bold text-neutral-900">{plan.name}</h2>
                      <p className="text-caption font-medium tracking-wide text-neutral-500" dir="ltr" style={{ textAlign: 'start' }}>{plan.code}</p>
                    </div>
                    {!plan.isActive && <span className="rounded-sm bg-neutral-100 px-2 py-1 text-caption font-medium text-neutral-700">{t('platform.plans.archived')}</span>}
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-body-sm text-neutral-600">{plan.description}</p>
                  <p className="mt-3 text-[24px] font-bold text-neutral-900" dir="ltr" style={{ textAlign: 'start' }}>
                    {f.usd(plan.priceMonthly)}
                    <span className="text-body-sm font-medium text-neutral-600"> / {t('platform.common.month')}</span>
                  </p>
                  <p className="text-caption text-neutral-600" dir="ltr" style={{ textAlign: 'start' }}>
                    {f.usd(plan.priceYearly)} / {t('platform.common.year')}
                  </p>
                  <ul className="mt-4 flex flex-col gap-1.5 text-body-sm text-neutral-800">
                    <li>{t('platform.plans.usersIncluded', { count: plan.includedUsers })}</li>
                    <li>{plan.maxActiveCertificates == null ? t('platform.plans.unlimitedCertificates') : t('platform.plans.certificatesCap', { count: plan.maxActiveCertificates })}</li>
                    <li>{plan.iafApiQuota == null ? t('platform.plans.unlimitedIaf') : t('platform.plans.iafQuota', { count: plan.iafApiQuota })}</li>
                    <li>{t('platform.plans.supportHours', { count: plan.supportHoursMonthly })}</li>
                    <li>{t('platform.plans.extraUserPrice', { price: f.usd(plan.extraUserPriceMonthly) })}</li>
                    <li>{t('platform.plans.featuresCount', { count: enabled, total: FEATURE_KEYS.length })}</li>
                  </ul>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                    <span className="text-body-sm text-neutral-600">{t('platform.dashboard.tenantsCount', { count: plan.tenantCount })}</span>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={() => navigate(platformPlanPath(plan.id))}>
                        {t('platform.common.edit')}
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <Card title={t('platform.plans.compare')}>
            <DataTable minWidth={520} head={[t('platform.features.feature'), ...plans.map((p) => p.name)]}>
              {FEATURE_KEYS.map((key, index) => (
                <tr key={key} className={rowClass(index)}>
                  <td className={cellClass}>{t(`platform.features.${key}`)}</td>
                  {plans.map((p) => (
                    <td key={p.id} className={cellClass}>
                      {p.features[key] ? <span className="font-semibold text-success-700">✓</span> : <span className="text-neutral-400">{notSet()}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </DataTable>
            <div className="flex flex-col gap-2 md:hidden">
              {FEATURE_KEYS.map((key) => (
                <div key={key} className="rounded-md border border-neutral-100 px-3 py-2">
                  <p className="text-body-sm font-medium text-neutral-900">{t(`platform.features.${key}`)}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-caption">
                    {plans.map((p) => (
                      <span key={p.id} className={p.features[key] ? 'text-success-700' : 'text-neutral-500'}>
                        {p.features[key] ? '✓' : notSet()} {p.name}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  )
}
