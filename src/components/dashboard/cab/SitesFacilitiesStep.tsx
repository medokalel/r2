import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { TablePagination } from '@/components/dashboard/TablePagination'
import {
  AppIcon,
  AddCircleIcon,
  BuildingsIcon,
  DashboardGridIcon,
  EditIcon,
  GlobeIcon,
  TrashIcon,
  UsersIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import type { SitesFacilitiesForm } from '@/lib/sitesFacilitiesForm'
import { cn } from '@/lib/utils'

interface SitesFacilitiesStepProps {
  form: SitesFacilitiesForm
  onPatch: (f: Partial<SitesFacilitiesForm>) => void
  /** Wired up once the multi-site rule logic is defined; button stays visible either way. */
  onApplyMultiSiteRule?: () => void
}

const PAGE_SIZE = 3
/** Multi-site certification (IAF MD1) only applies once there's a head office plus satellites. */
const MULTI_SITE_MIN_SITES = 3

const SITE_TYPE_BADGE_COLORS: Record<string, string> = {
  'Head Office': 'bg-primary-50 text-primary',
  'Manufacturing Site': 'bg-success-100 text-success-600',
  Warehouse: 'bg-[#ede9fe] text-[#6d28d9]',
  'Branch Office': 'bg-[#d7f4f0] text-[#0f9488]',
  Laboratory: 'bg-[#fef3c7] text-warning-500',
}
const DEFAULT_SITE_TYPE_BADGE_COLOR = 'bg-neutral-50 text-neutral-600'

export function SitesFacilitiesStep({ form, onPatch, onApplyMultiSiteRule }: SitesFacilitiesStepProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const removeSite = (id: string) => onPatch({ sites: form.sites.filter((s) => s.id !== id) })

  const totalEmployees = useMemo(
    () => form.sites.reduce((sum, s) => sum + s.employees, 0),
    [form.sites]
  )
  const countries = useMemo(
    () => new Set(form.sites.map((s) => s.country).filter(Boolean)),
    [form.sites]
  )
  const allActivities = useMemo(
    () => Array.from(new Set(form.sites.flatMap((s) => s.activities))),
    [form.sites]
  )

  const statCards = [
    {
      key: 'totalSites',
      value: form.sites.length,
      icon: BuildingsIcon,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary',
    },
    {
      key: 'totalEmployees',
      value: totalEmployees,
      icon: UsersIcon,
      bgColor: 'bg-[#d7f4f0]',
      iconColor: 'text-[#0f9488]',
    },
    {
      key: 'countries',
      value: countries.size,
      icon: GlobeIcon,
      bgColor: 'bg-[#ede9fe]',
      iconColor: 'text-[#6d28d9]',
    },
    {
      key: 'activitiesScope',
      value: allActivities.length,
      icon: DashboardGridIcon,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-hover',
    },
  ] as const

  const totalPages = Math.max(1, Math.ceil(form.sites.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageSites = form.sites.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="space-y-5">
      <SectionHeading
        title={t('cab.applicationDraft.sitesFacilities.title')}
        accordion
                headerActions={
          <div className="flex items-center gap-3">
            {form.sites.length >= MULTI_SITE_MIN_SITES && (
              <Button
                type="button"
                variant="secondary"
                className="h-[40px] gap-2 rounded-[var(--radius-sm)] px-4"
                onClick={onApplyMultiSiteRule}
              >
                {t('cab.applicationDraft.sitesFacilities.applyMultiSiteRule')}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="h-[40px] gap-2 rounded-[var(--radius-sm)] px-4"
              onClick={() => navigate('/cab/applications/draft/sites/new')}
            >
              <AppIcon icon={AddCircleIcon} size={24} />
              {t('cab.applicationDraft.sitesFacilities.addNewSite')}
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-[14px] text-neutral-500">
          {t('cab.applicationDraft.sitesFacilities.subtitle')}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map(({ key, value, icon, bgColor, iconColor }) => (
            <div key={key} className="flex flex-col gap-3 rounded-[16px] border border-alabaster-150 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-[28px] font-bold leading-none text-neutral-900">{value}</span>
                <span className={cn('flex size-10 items-center justify-center rounded-[10px]', bgColor)}>
                  <AppIcon icon={icon} size={20} className={iconColor} />
                </span>
              </div>
              <p className="text-[14px] font-medium text-neutral-700">
                {t(`cab.applicationDraft.sitesFacilities.stats.${key}`)}
              </p>
            </div>
          ))}
        </div>

        {form.sites.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.empty')}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-center">
                <thead className="bg-primary text-white">
                  <tr className="rounded-[10px] bg-primary text-white">
                    <th className="w-12 p-[18px] text-center text-[14px] font-medium">#</th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.siteNameLocation')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.address')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.siteActivitiesScope')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.employees')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.primaryContact')}
                    </th>
                    <th className="w-20 p-[18px] text-center text-[14px] font-medium">
                      {t('cab.applicationDraft.sitesFacilities.columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageSites.map((site, index) => (
                    <tr key={site.id} className={index % 2 === 1 ? 'bg-neutral-25' : 'bg-white'}>
                      <td className="px-4 py-4 text-[14px] text-neutral-500">
                        {pageStart + index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[15px] font-medium text-neutral-900">{site.name}</p>
                        <span
                          className={cn(
                            'mt-0.5 inline-block rounded-[6px] px-2 py-0.5 text-[12px] font-medium',
                            SITE_TYPE_BADGE_COLORS[site.siteType] ?? DEFAULT_SITE_TYPE_BADGE_COLOR
                          )}
                        >
                          {site.siteType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[14px] text-neutral-700">{site.address}</td>
                      <td className="px-4 py-4">
                        <ul className="space-y-0.5">
                          {site.activities.map((activity) => (
                            <li key={activity} className="text-[13px] text-neutral-700">
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-4 text-[14px] text-neutral-700">{site.employees}</td>
                      <td className="px-4 py-4 text-[13px] text-neutral-700">
                        <p className="font-medium text-neutral-900">{site.contact.name}</p>
                        <p>{site.contact.phone}</p>
                        <p className="text-primary">{site.contact.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="text-neutral-400 hover:text-primary"
                            aria-label={t('common.edit')}
                          >
                            <AppIcon icon={EditIcon} size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSite(site.id)}
                            className="text-error-400 hover:text-error-600"
                            aria-label={t('common.delete')}
                          >
                            <AppIcon icon={TrashIcon} size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-neutral-500">
                {t('cab.applicationDraft.sitesFacilities.showing', {
                  from: pageStart + 1,
                  to: pageStart + pageSites.length,
                  total: form.sites.length,
                })}
              </p>
              <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </SectionHeading>

      {form.multiSiteRule && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-primary/20 bg-primary-25 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary">
              <AppIcon icon={DashboardGridIcon} size={18} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-neutral-900">
                {t('cab.applicationDraft.sitesFacilities.multiSiteRule.appliedBadge')}
              </p>
              <p className="text-[13px] text-neutral-600">
                {form.multiSiteRule.totalEstimatedMandays.toFixed(1)}{' '}
                {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.mandaysUnit')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-[var(--radius-sm)] px-4"
            onClick={() =>
              navigate('/cab/applications/draft/sites/multi-site-rule/preview', {
                state: { multiSiteRule: form.multiSiteRule },
              })
            }
          >
            {t('common.view')}
          </Button>
        </div>
      )}

      {allActivities.length > 0 && (
        <SectionHeading
          title={t('cab.applicationDraft.sitesFacilities.activitiesCovered.title')}
          accordion
        >
          <p className="mb-4 text-[14px] text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.activitiesCovered.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            {allActivities.map((activity) => (
              <span
                key={activity}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-25 px-4 py-2 text-[14px] font-medium text-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12.5l2.5 2.5 5-5" />
                </svg>
                {activity}
              </span>
            ))}
          </div>
        </SectionHeading>
      )}
    </div>
  )
}