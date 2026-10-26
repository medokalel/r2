import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AppIcon, ExcelFileIcon, FilterFunnelIcon, MoreIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { certificationRequestFormPath } from '@/lib/routes'
import { getDashboardTasks } from '@/lib/api/dashboardApi'
import type { DashboardTask, DashboardTaskStatus } from '@/lib/api/dashboardApi'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  matchesSearch,
  type TableColumn,
} from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

const statusStyles: Record<DashboardTaskStatus, string> = {
  urgent: 'bg-warning-50 text-warning-700',
  underReview: 'bg-neutral-50 text-neutral-700',
  pending: 'bg-primary-50 text-primary',
}

const procedureLabelKeys: Record<DashboardTask['taskType'], string> = {
  documentReview: 'dashboard.tasks.openDocument',
  contractProcessing: 'dashboard.tasks.sendContract',
  feeCollection: 'dashboard.tasks.sendMessage',
}

const PAGE_SIZE = 10

export function DashboardTasksPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [taskTypeFilter, setTaskTypeFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    getDashboardTasks()
      .then((result) => {
        if (!cancelled) setTasks(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const matchesQuery = matchesSearch(
        [task.applicantName, task.companyCode, t(`dashboard.tasks.type.${task.taskType}`)],
        appliedQuery
      )
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesType = taskTypeFilter === 'all' || task.taskType === taskTypeFilter
      return matchesQuery && matchesStatus && matchesType
    })
  }, [tasks, appliedQuery, statusFilter, taskTypeFilter, t])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const exportColumns: TableColumn<DashboardTask>[] = [
    { header: t('dashboard.tasks.applicantName'), value: (row) => row.applicantName },
    { header: t('dashboard.tasks.companyCode'), value: (row) => row.companyCode },
    { header: t('dashboard.tasks.taskType'), value: (row) => t(`dashboard.tasks.type.${row.taskType}`) },
    { header: t('dashboard.tasks.statusHeader'), value: (row) => t(`dashboard.tasks.status.${row.status}`) },
    {
      header: t('dashboard.tasks.procedures'),
      value: (row) => t(procedureLabelKeys[row.taskType]),
    },
  ]

  const handleProcedureClick = (task: DashboardTask) => {
    // The backend names the page of each task; demo document-review tasks open the feedback view.
    if (task.href) navigate(task.href)
    else if (task.taskType === 'documentReview') {
      navigate(certificationRequestFormPath(task.id, 'feedback'))
    }
  }

  const handleSearch = () => {
    setPage(1)
    setAppliedQuery(query)
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="dashboard.tasks.title" />

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto page-main">
        <div className="flex min-w-0 flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('dashboard.tasks.searchPlaceholder')}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSearch}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'flex-1 shrink-0 sm:flex-none')}
                >
                  {t('dashboard.tasks.search')}
                </button>
                <TableFilterSelect
                  label={t('dashboard.tasks.filters.status')}
                  value={statusFilter}
                  onChange={(value) => {
                    setPage(1)
                    setStatusFilter(value)
                  }}
                  options={[
                    { value: 'all', label: t('dashboard.tasks.filters.allStatuses') },
                    { value: 'urgent', label: t('dashboard.tasks.status.urgent') },
                    { value: 'underReview', label: t('dashboard.tasks.status.underReview') },
                    { value: 'pending', label: t('dashboard.tasks.status.pending') },
                  ]}
                />
                <TableFilterSelect
                  label={t('dashboard.tasks.filters.taskType')}
                  value={taskTypeFilter}
                  onChange={(value) => {
                    setPage(1)
                    setTaskTypeFilter(value)
                  }}
                  options={[
                    { value: 'all', label: t('dashboard.tasks.filters.allTypes') },
                    { value: 'documentReview', label: t('dashboard.tasks.type.documentReview') },
                    { value: 'contractProcessing', label: t('dashboard.tasks.type.contractProcessing') },
                    { value: 'feeCollection', label: t('dashboard.tasks.type.feeCollection') },
                  ]}
                />
                <button
                  type="button"
                  aria-label={t('common.filter')}
                  className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-25 text-primary hover:bg-primary-50"
                  onClick={handleSearch}
                >
                  <AppIcon icon={FilterFunnelIcon} size={20} />
                </button>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
              {/* Desktop / tablet: the two export buttons, as before */}
              <button
                type="button"
                disabled={filtered.length === 0}
                onClick={() =>
                  downloadPdfFromTable(
                    'dashboard-tasks.pdf',
                    t('dashboard.tasks.title'),
                    exportColumns,
                    filtered
                  )
                }
                className="hidden h-11 items-center gap-2 rounded-md border-2 border-primary px-4 text-body-sm font-medium disabled:opacity-50 min-[950px]:flex"
              >
                <AppIcon icon={PdfFileIcon} size={22} />
                {t('dashboard.tasks.downloadPdf')}
              </button>
              <button
                type="button"
                disabled={filtered.length === 0}
                onClick={() => downloadExcelCsv('dashboard-tasks.csv', exportColumns, filtered)}
                className="hidden h-11 items-center gap-2 rounded-md border-2 border-primary px-4 text-body-sm font-medium disabled:opacity-50 min-[950px]:flex"
              >
                <AppIcon icon={ExcelFileIcon} size={22} />
                {t('dashboard.tasks.exportExcel')}
              </button>

              {/* Mobile: a single "⋮" button that opens a dropdown with the export options */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    disabled={filtered.length === 0}
                    aria-label={t('dashboard.tasks.downloadOptions')}
                    className="flex size-11 shrink-0 items-center justify-center rounded-md border border-neutral-100 bg-white text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 min-[950px]:hidden"
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
                      onSelect={() =>
                        downloadPdfFromTable(
                          'dashboard-tasks.pdf',
                          t('dashboard.tasks.title'),
                          exportColumns,
                          filtered
                        )
                      }
                      className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                    >
                      <AppIcon icon={PdfFileIcon} size={18} />
                      {t('dashboard.tasks.downloadPdf')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => downloadExcelCsv('dashboard-tasks.csv', exportColumns, filtered)}
                      className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                    >
                      <AppIcon icon={ExcelFileIcon} size={18} />
                      {t('dashboard.tasks.exportExcel')}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse text-center">
              <thead className="bg-primary text-white">
                <tr className="rounded-md bg-primary text-white">
                  <th className="p-5 text-center text-body-sm font-medium">
                    {t('dashboard.tasks.applicantName')}
                  </th>
                  <th className="p-5 text-center text-body-sm font-medium">
                    {t('dashboard.tasks.taskType')}
                  </th>
                  <th className="p-5 text-center text-body-sm font-medium">
                    {t('dashboard.tasks.statusHeader')}
                  </th>
                  <th className="p-5 text-center text-body-sm font-medium">
                    {t('dashboard.tasks.procedures')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-600">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-neutral-600">
                      {notSet()}
                    </td>
                  </tr>
                ) : (
                  paginated.map((task, index) => (
                    <tr key={task.id} className={cn(index % 2 === 1 && 'bg-neutral-25')}>
                      <td className="px-4 py-4">
                        <p className="text-body font-medium text-neutral-900">
                          {task.applicantName}
                        </p>
                        <p className="text-body-sm text-neutral-600">
                          {t('dashboard.tasks.companyCode')} {task.companyCode}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-body text-neutral-800">
                        {t(`dashboard.tasks.type.${task.taskType}`)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                            statusStyles[task.status]
                          )}
                        >
                          {t(`dashboard.tasks.status.${task.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleProcedureClick(task)}
                          className="text-body-sm font-medium text-primary hover:underline"
                        >
                          {t(procedureLabelKeys[task.taskType])}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="rounded-lg border border-neutral-100 bg-neutral-25 p-3 md:hidden">
            {loading ? (
              <p className="py-6 text-center text-neutral-600">{t('common.loading')}</p>
            ) : paginated.length === 0 ? (
              <p className="py-6 text-center text-neutral-600">{notSet()}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {paginated.map((task) => (
                  <div key={task.id} className="rounded-lg border border-neutral-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-body font-medium text-neutral-900">
                          {task.applicantName}
                        </p>
                        <p className="text-body-sm text-neutral-600">
                          {t('dashboard.tasks.companyCode')} {task.companyCode}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                          statusStyles[task.status]
                        )}
                      >
                        {t(`dashboard.tasks.status.${task.status}`)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-body-sm text-neutral-800">
                        {t(`dashboard.tasks.type.${task.taskType}`)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleProcedureClick(task)}
                        className="text-body-sm font-medium text-primary hover:underline"
                      >
                        {t(procedureLabelKeys[task.taskType])}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && filtered.length > 0 && (
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </AppLayout>
  )
}