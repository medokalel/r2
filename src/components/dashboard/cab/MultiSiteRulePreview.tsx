import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import {
  AppIcon,
  AirplaneIcon,
  TrainIcon,
  RoadIcon,
  InfoIcon,
  CorrectiveActionIcon,
  HistoryIcon,
  RefreshIcon,
  UserIcon,
  ErrorCircleIcon,
  PdfFileIcon,
} from '@/components/icons'
import { SectionTitle } from '@/components/dashboard/SectionTitle'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { Card, Badge, SectionCard, CalloutCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { downloadPdfFromTable, type TableColumn } from '@/lib/tableTools'
import {
  rowMandays,
  APPLICABLE_RULE_OPTIONS,
  MANDAYS_MODEL_OPTIONS,
  type MultiSiteRuleResult,
  type MultiSiteRuleSiteRow,
} from '@/lib/multiSiteRuleForm'

const PAGE_SIZE = 3

const TRAVEL_ICON_BY_OPTION: Record<string, typeof AirplaneIcon> = {
  'Airplane Required': AirplaneIcon,
  'Train Required': TrainIcon,
  'Airplane & Train Required': RoadIcon,
}

interface MultiSiteRulePreviewProps {
  multiSiteRule: MultiSiteRuleResult
}

export function MultiSiteRulePreview({ multiSiteRule }: MultiSiteRulePreviewProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  const { form, rows, sampledSatelliteSiteIds } = multiSiteRule
  const headOfficeRow = rows.find((row) => row.isHeadOffice)
  const satelliteRows = rows.filter((row) => !row.isHeadOffice)
  const includedRows = rows.filter((row) => row.included)

  const totalSites = rows.length
  const sampledPercent = totalSites > 0 ? Math.round((includedRows.length / totalSites) * 100) : 0

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = rows.slice(pageStart, pageStart + PAGE_SIZE)

  const rowMandaysById = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((row) => map.set(row.site.id, rowMandays(row, form)))
    return map
  }, [rows, form])

  const travelGroups = useMemo(() => {
    const groups: Record<'airplane' | 'train' | 'both', MultiSiteRuleSiteRow[]> = {
      airplane: [],
      train: [],
      both: [],
    }
    includedRows.forEach((row) => {
      const reqs = row.travelRequirements
      if (reqs.includes('Airplane & Train Required') || (reqs.includes('Airplane Required') && reqs.includes('Train Required'))) {
        groups.both.push(row)
      } else if (reqs.includes('Airplane Required')) {
        groups.airplane.push(row)
      } else if (reqs.includes('Train Required')) {
        groups.train.push(row)
      }
    })
    return groups
  }, [includedRows])

  const permitRequiredRows = includedRows.filter((row) => row.permitRequired)
  const permitNotRequiredRows = includedRows.filter((row) => !row.permitRequired)

  const handleDownloadPdf = () => {
    const columns: TableColumn<MultiSiteRuleSiteRow>[] = [
      { header: t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.siteNameLocation'), value: (row) => row.site.name },
      { header: t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.roleMultiSite'), value: (row) => t(row.role) },
      {
        header: t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.permitRequired'),
        value: (row) =>
          row.permitRequired
            ? t('cab.applicationDraft.sitesFacilities.multiSiteRule.yes')
            : t('cab.applicationDraft.sitesFacilities.multiSiteRule.no'),
      },
      {
        header: t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.columns.includedInSampling'),
        value: (row) =>
          row.sampledThisCycle
            ? t('cab.applicationDraft.sitesFacilities.multiSiteRule.yes')
            : t('cab.applicationDraft.sitesFacilities.multiSiteRule.no'),
      },
      { header: t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.samplingFactor'), value: (row) => (row.included ? row.samplingFactor.toFixed(1) : '--') },
      {
        header: t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.columns.mandays'),
        value: (row) => (rowMandaysById.get(row.site.id) ?? 0).toFixed(1),
      },
    ]
    downloadPdfFromTable(
      'multi-site-rule-preview.pdf',
      t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.title'),
      columns,
      rows
    )
  }

  return (
    <div className="space-y-5 rounded-[var(--radius-lg)] border border-alabaster-150 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.title')}
          subtitle={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.subtitle')}
        />
        <Button type="button" variant="secondary" className="h-[42px] gap-2 rounded-[var(--radius-sm)] px-4" onClick={handleDownloadPdf}>
          <AppIcon icon={PdfFileIcon} size={20} />
          {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.downloadPdf')}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <Card title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.structure')}>
          <p className="text-[15px] font-bold text-neutral-900">
            {t(`cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptions.${form.structureType}`)}
          </p>
          <Badge tone={form.considerations.sameScopeDevelopment ? 'green' : 'neutral'}>
            {form.considerations.sameScopeDevelopment
              ? t('cab.applicationDraft.sitesFacilities.multiSiteRule.yes')
              : t('cab.applicationDraft.sitesFacilities.multiSiteRule.no')}
          </Badge>
        </Card>

        <Card title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.rule')}>
          <p className="text-[15px] font-bold text-neutral-900">
            {enumLabel(t, (APPLICABLE_RULE_OPTIONS.find((option) => option.value === form.applicableRule)?.label ?? form.applicableRule).split(' (')[0])}
          </p>
          <p className="text-[12px] text-neutral-500">{t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.ruleHint')}</p>
        </Card>

        <Card title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.model')}>
          <p className="text-[15px] font-bold text-neutral-900">
            {enumLabel(t, MANDAYS_MODEL_OPTIONS.find((option) => option.value === form.mandaysModel)?.label ?? form.mandaysModel)}
          </p>
        </Card>

        <Card title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.totalSites')}>
          <p className="text-[24px] font-bold leading-none text-neutral-900">{totalSites}</p>
          <p className="mt-1 text-[12px] text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.totalSitesHint', {
              headOffice: headOfficeRow ? 1 : 0,
              others: satelliteRows.length,
            })}
          </p>
        </Card>

        <Card title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.sitesSampled')}>
          <p className="text-[24px] font-bold leading-none text-neutral-900">{includedRows.length}</p>
          <p className="mt-1 text-[12px] text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.sitesSampledHint', { percent: sampledPercent })}
          </p>
        </Card>

        <Card title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.totalMandays')} highlight>
          <p className="text-[24px] font-bold leading-none text-primary">
            {multiSiteRule.totalEstimatedMandays.toFixed(1)}{' '}
            <span className="text-[13px] font-normal text-neutral-500">
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.mandaysUnit')}
            </span>
          </p>
        </Card>
      </div>

      {/* Sites table + calculation sidebar */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <SectionCard title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.title')} className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-neutral-600">
            <span className="flex items-center gap-1.5">
              <AirplaneIcon size={16} />
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.legend.airplane')}
            </span>
            <span className="flex items-center gap-1.5">
              <TrainIcon size={16} />
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.legend.train')}
            </span>
            <span className="flex items-center gap-1.5">
              <RoadIcon size={16} />
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.legend.both')}
            </span>
            <span className="flex items-center gap-1.5">
              <Badge tone="green">{t('cab.applicationDraft.sitesFacilities.multiSiteRule.yes')}</Badge>
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.legend.included')}
            </span>
            <span className="flex items-center gap-1.5">
              <Badge tone="red">{t('cab.applicationDraft.sitesFacilities.multiSiteRule.no')}</Badge>
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.legend.notIncluded')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-center">
              <thead className="bg-primary text-white">
                <tr className="bg-primary text-white">
                  <th className="w-10 p-3 text-center text-[13px] font-medium">#</th>
                  <th className="p-3 text-start text-[13px] font-medium">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.siteNameLocation')}
                  </th>
                  <th className="p-3 text-center text-[13px] font-medium">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.roleMultiSite')}
                  </th>
                  <th className="p-3 text-center text-[13px] font-medium">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.travelAccess')}
                  </th>
                  <th className="p-3 text-center text-[13px] font-medium">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.permitRequired')}
                  </th>
                  <th className="p-3 text-center text-[13px] font-medium">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.columns.includedInSampling')}
                  </th>
                  <th className="p-3 text-center text-[13px] font-medium">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.columns.samplingFactor')}
                  </th>
                  <th className="p-3 text-center text-[13px] font-medium">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.columns.mandays')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <Fragment key={row.site.id}>
                    <tr className={index % 2 === 1 ? 'bg-neutral-25' : 'bg-white'}>
                      <td className="w-10 px-3 py-3 text-[13px] text-neutral-500">{pageStart + index + 1}</td>
                      <td className="px-3 py-3 text-start">
                        <p className="text-[14px] font-medium text-neutral-900">{row.site.name}</p>
                        <span className="mt-0.5 inline-block rounded-[6px] bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {row.isHeadOffice
                            ? t('cab.applicationDraft.sitesFacilities.multiSiteRule.role.centralFunction')
                            : enumLabel(t, row.site.siteType)}
                        </span>
                        <p className="mt-0.5 text-[12px] text-neutral-500">
                          {[row.site.country, row.site.address].filter(Boolean).join(', ')}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-neutral-700">{t(row.role)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1.5 text-neutral-500">
                          {row.travelRequirements.length === 0 ? (
                            <RoadIcon size={18} />
                          ) : (
                            row.travelRequirements.map((req) => {
                              const Icon = TRAVEL_ICON_BY_OPTION[req] ?? RoadIcon
                              return <Icon key={req} size={18} />
                            })
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={row.permitRequired ? 'red' : 'green'}>
                          {row.permitRequired
                            ? t('cab.applicationDraft.sitesFacilities.multiSiteRule.yes')
                            : t('cab.applicationDraft.sitesFacilities.multiSiteRule.no')}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={row.sampledThisCycle ? 'green' : 'red'}>
                          {row.sampledThisCycle
                            ? t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.includedThisCycle')
                            : t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.notIncludedThisCycle')}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-[13px] font-medium text-neutral-900">
                        {row.included ? row.samplingFactor.toFixed(1) : '--'}
                      </td>
                      <td className="px-3 py-3 text-[13px] font-semibold text-neutral-900">
                        {(rowMandaysById.get(row.site.id) ?? 0).toFixed(1)}
                      </td>
                    </tr>
                    <tr className={index % 2 === 1 ? 'bg-neutral-25' : 'bg-white'}>
                      <td colSpan={8} className="px-3 pb-3 text-start text-[12px] text-neutral-500">
                        {row.isHeadOffice
                          ? t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.centralFunctionsApplicable', {
                              functions: form.centralFunctions.length > 0 ? form.centralFunctions.map((fn) => enumLabel(t, fn)).join(', ') : '--',
                            })
                          : t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.scope', {
                              activities: row.site.activities.length > 0 ? row.site.activities.join(', ') : '--',
                            })}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-neutral-500">
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.showing', {
                from: pageStart + 1,
                to: pageStart + pageRows.length,
                total: rows.length,
              })}
            </p>
            <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </SectionCard>

        <SectionCard
          title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.title')}
          className="w-full shrink-0 lg:w-[320px]"
        >
          <div className="space-y-2.5 text-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">
                {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.baseMandays')}
              </span>
              <span className="font-medium text-neutral-900">{multiSiteRule.totalBaseMandays.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">
                {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.samplingAdjustment')}
              </span>
              <span className="font-medium text-success-600">{multiSiteRule.samplingAdjustment.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">
                {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.travelAdjustment')}
              </span>
              <span className="font-medium text-neutral-900">
                {multiSiteRule.travelAdjustment > 0 ? '+' : ''}
                {multiSiteRule.travelAdjustment.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">
                {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.permitAdjustment')}
              </span>
              <span className="font-medium text-neutral-900">
                {multiSiteRule.permitAdjustment > 0 ? '+' : ''}
                {multiSiteRule.permitAdjustment.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="my-4 h-px bg-alabaster-150" />

          <div className="space-y-2 text-[13px]">
            <p className="font-medium text-neutral-700">
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.totalEstimatedMandays')}
            </p>
            {headOfficeRow && (
              <div className="flex items-center justify-between text-neutral-600">
                <span>
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.siteStatus.headOfficeIncluded', {
                    name: headOfficeRow.site.name,
                  })}
                </span>
                <span className="font-medium text-neutral-900">{(rowMandaysById.get(headOfficeRow.site.id) ?? 0).toFixed(1)} MD</span>
              </div>
            )}
            {satelliteRows.map((row) => (
              <div key={row.site.id} className="flex items-center justify-between text-neutral-600">
                <span>
                  {t(
                    row.included
                      ? 'cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.siteStatus.siteIncludedSampled'
                      : 'cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.siteStatus.siteNotIncluded',
                    { name: row.site.name }
                  )}
                </span>
                <span className="font-medium text-neutral-900">{(rowMandaysById.get(row.site.id) ?? 0).toFixed(1)} MD</span>
              </div>
            ))}
          </div>

          <div className="my-4 h-px border-t border-dashed border-alabaster-150" />

          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-neutral-900">
              {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.calculationDetails.total')}
            </span>
            <span className="text-[18px] font-bold text-primary">
              {multiSiteRule.totalEstimatedMandays.toFixed(1)}{' '}
              <span className="text-[12px] font-normal text-neutral-500">
                {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.stats.mandaysUnit')}
              </span>
            </span>
          </div>
        </SectionCard>
      </div>

      {/* Callouts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CalloutCard
          tone="blue"
          icon={<AppIcon icon={InfoIcon} size={20} className="text-primary" />}
          title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.samplingMethodApplied.title')}
        >
          {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.samplingMethodApplied.description', {
            sampled: includedRows.length,
            total: totalSites,
            percent: sampledPercent,
          })}
        </CalloutCard>

        <CalloutCard
          tone="amber"
          icon={<AppIcon icon={CorrectiveActionIcon} size={20} className="text-warning-500" />}
          title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.note.title')}
        >
          {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.note.description')}
        </CalloutCard>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.travelAccessSummary.title')}>
          <div className="space-y-3">
            {(
              [
                { key: 'airplane' as const, Icon: AirplaneIcon, rows: travelGroups.airplane },
                { key: 'train' as const, Icon: TrainIcon, rows: travelGroups.train },
                { key: 'both' as const, Icon: RoadIcon, rows: travelGroups.both },
              ] as const
            )
              .filter((group) => group.rows.length > 0)
              .map(({ key, Icon, rows: groupRows }) => (
                <div key={key} className="flex items-start gap-2.5 text-[13px]">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">
                      {t(`cab.applicationDraft.sitesFacilities.multiSiteRule.preview.sitesSummary.legend.${key}`)}
                    </p>
                    <p className="text-neutral-500">
                      {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.travelAccessSummary.siteCount', {
                        count: groupRows.length,
                      })}{' '}
                      ({groupRows.map((row) => row.site.name).join(', ')})
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] font-medium text-primary">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.travelAccessSummary.impact', {
                      value: (groupRows.length * 0.5).toFixed(1),
                    })}
                  </span>
                </div>
              ))}
            {travelGroups.airplane.length + travelGroups.train.length + travelGroups.both.length === 0 && (
              <p className="text-[13px] text-neutral-500">--</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.permitAccessSummary.title')}>
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-[13px]">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-success-100 text-success-600">
                <AppIcon icon={UserIcon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.permitAccessSummary.permitRequired')}
                </p>
                <p className="text-neutral-500">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.permitAccessSummary.siteCount', {
                    count: permitRequiredRows.length,
                  })}{' '}
                  ({permitRequiredRows.map((row) => row.site.name).join(', ') || '--'})
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-[13px]">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-neutral-50 text-neutral-500">
                <AppIcon icon={ErrorCircleIcon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.permitAccessSummary.permitNotRequired')}
                </p>
                <p className="text-neutral-500">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.permitAccessSummary.siteCount', {
                    count: permitNotRequiredRows.length,
                  })}{' '}
                  ({permitNotRequiredRows.map((row) => row.site.name).join(', ') || '--'})
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.samplingCoverage.title')}>
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-[13px]">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#ede9fe] text-[#6d28d9]">
                <AppIcon icon={RefreshIcon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.samplingCoverage.randomSites')}
                </p>
                <p className="text-neutral-500">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.samplingCoverage.randomSitesHint')}
                </p>
                <p className="mt-0.5 font-medium text-primary">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.samplingCoverage.randomSitesValue', {
                    sampled: sampledSatelliteSiteIds.length,
                    total: satelliteRows.length,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-[13px]">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary-hover">
                <AppIcon icon={HistoryIcon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.samplingCoverage.cycleCoverage')}
                </p>
                <p className="text-neutral-500">
                  {t('cab.applicationDraft.sitesFacilities.multiSiteRule.preview.samplingCoverage.cycleCoverageHint')}
                </p>
                <p className="mt-0.5 font-medium text-primary">{sampledPercent}%</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}