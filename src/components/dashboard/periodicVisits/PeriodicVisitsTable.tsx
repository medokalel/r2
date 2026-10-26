import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AppIcon, ExcelFileIcon, FilterFunnelIcon, MoreIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import {
  formatVisitDate,
  sectorBadgeVariant,
  type PeriodicVisit,
} from '@/lib/api/periodicVisitsApi'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  type TableColumn,
} from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

interface PeriodicVisitsTableProps {
  visits: PeriodicVisit[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  procedureFilter: string
  onProcedureFilterChange: (value: string) => void
  specificationFilter: string
  onSpecificationFilterChange: (value: string) => void
  onExportAll: () => Promise<PeriodicVisit[]>
  /** Confirms a visit the CAB sent (POST /billing/periodic-visits/:id/confirm). */
  onConfirm: (visit: PeriodicVisit) => void
  /** Id of the visit whose confirmation is in flight. */
  confirmingId: string | null
}

const thClass =
  'overflow-hidden px-2 py-2.5 text-center text-caption font-normal leading-[1.3] break-words text-white'
const tdClass = 'overflow-hidden px-2 py-2.5 text-caption font-semibold leading-snug align-middle'
const tdTextClass = cn(tdClass, 'text-neutral-800')
const tdActionsClass = 'overflow-hidden px-2 py-2.5 align-middle'
const periodicBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm border border-orange-200 bg-orange-50 px-3 py-1.5 text-overline font-medium leading-none text-orange-700'
const expandingBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm border border-primary-200 bg-primary-50 px-3 py-1.5 text-overline font-medium leading-none text-[#0D55D2]'

function SectorBadge({ code }: { code: string }) {
  const variant = sectorBadgeVariant(code)
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-overline font-semibold leading-none tabular-nums',
        variant === 'red' ? 'bg-error-50 text-error-500' : 'bg-success-50 text-success-500'
      )}
    >
      {code}
    </span>
  )
}

/** "Confirm visit" for a visit sent from an audit plan, "Confirmed" once done, nothing otherwise. */
function VisitConfirmation({
  visit,
  onConfirm,
  confirming,
}: {
  visit: PeriodicVisit
  onConfirm: (visit: PeriodicVisit) => void
  confirming: boolean
}) {
  const { t } = useTranslation()
  if (visit.confirmedAt) {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-sm bg-success-50 px-3 py-1.5 text-overline font-medium leading-none text-success-500">
        {t('periodicVisits.confirmed', 'Confirmed')}
      </span>
    )
  }
  if (!visit.auditPlanId) return <span className="text-neutral-500">{notSet()}</span>
  return (
    <button
      type="button"
      onClick={() => onConfirm(visit)}
      disabled={confirming}
      aria-busy={confirming || undefined}
      className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'justify-center')}
    >
      {t('periodicVisits.confirm', 'Confirm visit')}
    </button>
  )
}

function SpecificationTag({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-[88px] max-w-full items-center justify-center whitespace-nowrap rounded-sm bg-primary-50 px-3.5 py-2 font-sans text-sm font-medium leading-none text-primary sm:w-[108px]">
      {name}
    </span>
  )
}

export function PeriodicVisitsTable({
  visits,
  loading,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  onSearch,
  procedureFilter,
  onProcedureFilterChange,
  specificationFilter,
  onSpecificationFilterChange,
  onExportAll,
  onConfirm,
  confirmingId,
}: PeriodicVisitsTableProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleAll = () => {
    if (selected.size === visits.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visits.map((visit) => visit.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exportColumns: TableColumn<PeriodicVisit>[] = useMemo(
    () => [
      { header: '#', value: (_, index) => index + 1 },
      { header: t('periodicVisits.columns.certificateNumber'), value: (row) => row.certificateNumber },
      { header: t('periodicVisits.columns.specificationName'), value: (row) => row.specificationName },
      {
        header: t('periodicVisits.columns.economicSector'),
        value: (row) => row.economicSectors.join(', '),
      },
      { header: t('periodicVisits.columns.visitingDate'), value: (row) => formatVisitDate(row.visitingDate) },
      {
        header: t('periodicVisits.columns.procedures'),
        value: (row) =>
          row.procedure === 'PERIODIC_AND_EXPANDING'
            ? t('periodicVisits.procedurePeriodicExpanding')
            : t('periodicVisits.procedurePeriodic'),
      },
    ],
    [t]
  )

  const getExportRows = async () => {
    const selectedRows = visits.filter((visit) => selected.has(visit.id))
    if (selectedRows.length > 0) return selectedRows
    return onExportAll()
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      const rows = await getExportRows()
      downloadPdfFromTable('periodic-visits.pdf', t('periodicVisits.pageTitle'), exportColumns, rows)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const rows = await getExportRows()
      downloadExcelCsv('periodic-visits.csv', exportColumns, rows)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
      <DashboardTourStep stepId="visits-toolbar">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
              <AppIcon icon={SearchIcon} size={18} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={t('periodicVisits.searchPlaceholder')}
              className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSearch}
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'flex-1 sm:flex-none')}
            >
              {t('common.search')}
            </button>
            <button
              type="button"
              aria-label={t('common.filter')}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-md text-primary transition-colors',
                filtersOpen ? 'bg-primary-50' : 'bg-primary-25 hover:bg-primary-50'
              )}
            >
              <AppIcon icon={FilterFunnelIcon} size={20} />
            </button>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
          {/* Desktop / tablet: the two export buttons, as before */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || loading}
            className="hidden h-10 items-center justify-center gap-1.5 rounded-md border border-neutral-100 bg-white px-3 text-caption font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 min-[950px]:flex"
          >
            <AppIcon icon={PdfFileIcon} size={20} />
            {t('periodicVisits.downloadPdf')}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="hidden h-10 items-center justify-center gap-1.5 rounded-md border border-neutral-100 bg-white px-3 text-caption font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 min-[950px]:flex"
          >
            <AppIcon icon={ExcelFileIcon} size={20} />
            {t('periodicVisits.exportExcel')}
          </button>

          {/* Mobile: a single "⋮" button that opens a dropdown with the export options */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                disabled={exporting || loading}
                aria-label={t('periodicVisits.downloadOptions')}
                className="flex size-10 shrink-0 items-center justify-center rounded-md border border-neutral-100 bg-white text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 min-[950px]:hidden"
              >
                <AppIcon icon={MoreIcon} size={20} className="rotate-90" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[180px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg"
              >
                <DropdownMenu.Item
                  onSelect={handleExportPdf}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                >
                  <AppIcon icon={PdfFileIcon} size={18} />
                  {t('periodicVisits.downloadPdf')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={handleExportExcel}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                >
                  <AppIcon icon={ExcelFileIcon} size={18} />
                  {t('periodicVisits.exportExcel')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      </DashboardTourStep>

      {filtersOpen && (
        <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4">
          <TableFilterSelect
            label={t('periodicVisits.filters.specification')}
            value={specificationFilter}
            onChange={onSpecificationFilterChange}
            options={[
              { value: 'all', label: t('periodicVisits.filters.allSpecifications') },
              { value: 'ISO 45001', label: 'ISO 45001' },
              { value: 'ISO 14001', label: 'ISO 14001' },
              { value: 'ISO 9001', label: 'ISO 9001' },
            ]}
          />
          <TableFilterSelect
            label={t('periodicVisits.filters.procedure')}
            value={procedureFilter}
            onChange={onProcedureFilterChange}
            options={[
              { value: 'all', label: t('periodicVisits.filters.allProcedures') },
              { value: 'PERIODIC', label: t('periodicVisits.procedurePeriodic') },
              { value: 'PERIODIC_AND_EXPANDING', label: t('periodicVisits.procedurePeriodicExpanding') },
            ]}
          />
        </div>
      )}

      {/* Desktop: table */}
      <DashboardTourStep stepId="visits-table">
      <div className="hidden min-w-0 overflow-x-auto md:block">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-center">
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '4%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr className="bg-primary text-white">
              <th className={thClass}>
                <input
                  type="checkbox"
                  checked={visits.length > 0 && selected.size === visits.length}
                  onChange={toggleAll}
                  className="size-3 accent-white"
                  aria-label={t('common.selectAll')}
                />
              </th>
              <th className={thClass}>{t('periodicVisits.columns.index')}</th>
              <th className={thClass}>{t('periodicVisits.columns.certificateNumber')}</th>
              <th className={thClass}>{t('periodicVisits.columns.specificationName')}</th>
              <th className={thClass}>{t('periodicVisits.columns.economicSector')}</th>
              <th className={thClass}>{t('periodicVisits.columns.visitingDate')}</th>
              <th className={thClass}>{t('periodicVisits.columns.procedures')}</th>
              <th className={thClass}>{t('periodicVisits.columns.confirmation', 'Confirmation')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-caption font-semibold text-neutral-600">
                  {t('common.loading')}
                </td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-caption font-semibold text-neutral-600">
                  {notSet()}
                </td>
              </tr>
            ) : (
              visits.map((visit, index) => {
                const rowBgClass =
                  ((page - 1) * 10 + index) % 2 === 1 ? 'bg-neutral-25' : 'bg-white'

                return (
                <tr key={visit.id}>
                  <td className={cn(tdClass, rowBgClass)}>
                    <input
                      type="checkbox"
                      checked={selected.has(visit.id)}
                      onChange={() => toggleOne(visit.id)}
                      className="size-3 accent-primary"
                    />
                  </td>
                  <td className={cn(tdTextClass, rowBgClass)}>{(page - 1) * 10 + index + 1}</td>
                  <td className={cn(tdClass, rowBgClass, 'text-neutral-900')} dir="ltr">
                    {visit.certificateNumber}
                  </td>
                  <td className={cn(tdClass, rowBgClass)}>
                    <SpecificationTag name={visit.specificationName} />
                  </td>
                  <td className={cn(tdClass, rowBgClass)}>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {visit.economicSectors.map((sector) => (
                        <SectorBadge key={sector} code={sector} />
                      ))}
                    </div>
                  </td>
                  <td className={cn(tdTextClass, rowBgClass)} dir="ltr">
                    {formatVisitDate(visit.visitingDate)}
                  </td>
                  <td className={cn(tdActionsClass, rowBgClass)}>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className={periodicBtnClass}>{t('periodicVisits.procedurePeriodic')}</span>
                      <span className={expandingBtnClass}>
                        {t('periodicVisits.procedurePeriodicExpanding')}
                      </span>
                    </div>
                  </td>
                  <td className={cn(tdActionsClass, rowBgClass)}>
                    <VisitConfirmation visit={visit} onConfirm={onConfirm} confirming={confirmingId === visit.id} />
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="rounded-lg border border-neutral-100 bg-neutral-25 p-3 md:hidden">
        {loading ? (
          <p className="py-6 text-center text-body-sm font-semibold text-neutral-600">
            {t('common.loading')}
          </p>
        ) : visits.length === 0 ? (
          <p className="py-6 text-center text-body-sm font-semibold text-neutral-600">{notSet()}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 px-1 text-caption font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={visits.length > 0 && selected.size === visits.length}
                onChange={toggleAll}
                className="size-3.5 accent-primary"
              />
              {t('common.selectAll')}
            </label>

            {visits.map((visit, index) => (
              <div key={visit.id} className="rounded-lg border border-neutral-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(visit.id)}
                      onChange={() => toggleOne(visit.id)}
                      className="size-3.5 accent-primary"
                    />
                    <span className="text-caption text-neutral-600">
                      #{(page - 1) * 10 + index + 1}
                    </span>
                  </label>
                  <SpecificationTag name={visit.specificationName} />
                </div>

                <p className="mt-3 text-body-sm font-semibold text-neutral-900" dir="ltr">
                  {visit.certificateNumber}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {visit.economicSectors.map((sector) => (
                    <SectorBadge key={sector} code={sector} />
                  ))}
                </div>

                <p className="mt-2 text-body-sm text-neutral-600" dir="ltr">
                  {formatVisitDate(visit.visitingDate)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={periodicBtnClass}>{t('periodicVisits.procedurePeriodic')}</span>
                  <span className={expandingBtnClass}>
                    {t('periodicVisits.procedurePeriodicExpanding')}
                  </span>
                </div>

                {visit.auditPlanId || visit.confirmedAt ? (
                  <div className="mt-3">
                    <VisitConfirmation visit={visit} onConfirm={onConfirm} confirming={confirmingId === visit.id} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      </DashboardTourStep>

      {!loading && visits.length > 0 && (
        <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </section>
  )
}
