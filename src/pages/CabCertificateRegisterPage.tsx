import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCertificateRegisterTourSteps } from '@/config/certificateRegisterTourSteps'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import {
  AddCircleIcon,
  AppIcon,
  CertificateBadgeIcon,
  EditIcon,
  EyeIcon,
  MoreIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
  CheckIcon,
  ErrorCircleIcon,
} from '@/components/icons'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import { useDeepLinkField } from '@/hooks/useDeepLinkField'
import {
  extendCertificate,
  getCertificateHistory,
  listCabCertificates,
  reinstateCertificate,
  reissueCertificate,
  suspendCertificate,
  withdrawCertificate,
  type CertificateHistory,
  type CertificateRegisterItem,
  type CertificateStatus,
} from '@/lib/api/cabCertificatesApi'
import { DialogDateField, DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { ConfirmActionDialog } from '@/components/dashboard/ConfirmActionDialog'
import {
  CERTIFICATE_STATUS_LABEL_KEYS as STATUS_LABEL_KEYS,
  CERTIFICATE_STATUS_STYLES as statusStyles,
} from '@/lib/certificateStatus'
import { getCountryOptions } from '@/lib/countries'
import { downloadExcelCsv, downloadPdfFromTable, matchesSearch, type TableColumn } from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { ROUTES, cabPrepareCertificatePath } from '@/lib/routes'
import { notSet } from '@/lib/emptyValue'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PAGE_SIZE = 10

type CertificateRowAction =
  | 'prepareCertificate'
  | 'view'
  | 'editDraft'
  | 'issue'
  | 'reissue'
  | 'reinstate'
  | 'extend'
  | 'history'
  | 'suspend'
  | 'withdraw'

/** Actions handled in a dialog on this page (reason / date / history). */
type DialogAction = 'reissue' | 'reinstate' | 'extend' | 'history'

const ACTION_FALLBACK: Record<CertificateRowAction, string> = {
  prepareCertificate: 'Prepare certificate',
  view: 'View',
  editDraft: 'Edit draft',
  issue: 'Issue',
  reissue: 'Reissue',
  reinstate: 'Reinstate',
  extend: 'Extend validity',
  history: 'History',
  suspend: 'Suspend',
  withdraw: 'Withdraw',
}

export function CabCertificateRegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useCertificateRegisterTourSteps()

  const [certificates, setCertificates] = useState<CertificateRegisterItem[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null })
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  // Suspend / withdraw confirmation (collects the reason kept on the record).
  const [statusAction, setStatusAction] = useState<{
    cert: CertificateRegisterItem
    action: 'suspend' | 'withdraw'
  } | null>(null)

  // Reissue / reinstate / extend / history dialog.
  const [dialog, setDialog] = useState<{ cert: CertificateRegisterItem; action: DialogAction } | null>(null)
  const [dialogReason, setDialogReason] = useState('')
  const [dialogScope, setDialogScope] = useState('')
  const [dialogDate, setDialogDate] = useState('')
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [history, setHistory] = useState<CertificateHistory | null>(null)

  const countryOptions = useMemo(() => getCountryOptions(i18n.language), [i18n.language])

  const reload = () =>
    listCabCertificates()
      .then(setCertificates)
      .catch((error) => console.error('Failed to load certificates:', error))

  const applyStatusAction = async (reason: string) => {
    if (!statusAction) return
    const { cert, action } = statusAction
    const saved = await (action === 'suspend' ? suspendCertificate : withdrawCertificate)(cert.id, reason)
    setCertificates((prev) => prev.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)))
    await reload()
  }

  const openDialog = (cert: CertificateRegisterItem, action: DialogAction) => {
    setDialog({ cert, action })
    setDialogReason('')
    setDialogScope(cert.scope)
    setDialogDate('')
    setDialogError(null)
    setHistory(null)
    if (action === 'history') {
      getCertificateHistory(cert.id)
        .then(setHistory)
        .catch((err) => setDialogError(workflowErrorMessage(err, t)))
    }
  }

  const runDialog = async () => {
    if (!dialog) return
    if (dialog.action === 'history') {
      setDialog(null)
      return
    }
    setDialogBusy(true)
    setDialogError(null)
    try {
      const { cert, action } = dialog
      const reason = dialogReason.trim()
      const saved =
        action === 'reissue'
          ? await reissueCertificate(cert.id, { reason, scope: dialogScope.trim() !== cert.scope ? dialogScope : undefined, expiryDate: dialogDate || undefined })
          : action === 'reinstate'
            ? await reinstateCertificate(cert.id, reason)
            : await extendCertificate(cert.id, dialogDate, reason)
      toast.success(
        action === 'reissue'
          ? t('cab.certificateRegister.lifecycle.reissued', { defaultValue: 'Certificate {{number}} issued; the previous version is superseded.', number: saved.certificateNumber })
          : action === 'reinstate'
            ? t('cab.certificateRegister.lifecycle.reinstated', { defaultValue: 'Certificate {{number}} reinstated. The client has been notified.', number: saved.certificateNumber })
            : t('cab.certificateRegister.lifecycle.extended', { defaultValue: 'Validity of {{number}} extended.', number: saved.certificateNumber }),
      )
      setDialog(null)
      await reload()
    } catch (err) {
      setDialogError(workflowErrorMessage(err, t))
    } finally {
      setDialogBusy(false)
    }
  }

  const runAction = (cert: CertificateRegisterItem, action: CertificateRowAction) => {
    if (action === 'suspend' || action === 'withdraw') {
      setStatusAction({ cert, action })
      return
    }
    if (action === 'reissue' || action === 'reinstate' || action === 'extend' || action === 'history') {
      openDialog(cert, action)
      return
    }
    // View, edit, issue and prepare all happen on the certificate preparation page.
    navigate(cabPrepareCertificatePath(cert.id))
  }

  useEffect(() => {
    let cancelled = false
    listCabCertificates()
      .then((data) => {
        if (!cancelled) setCertificates(data)
      })
      .catch((error) => console.error('Failed to load certificates:', error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Deep link (?certificate=<id>[&action=extend], from "Complete" after an import): show it, open the dialog.
  const [params, setParams] = useSearchParams()
  const linkedCertificate = params.get('certificate')
  const [handledLink, setHandledLink] = useState<string | null>(null)
  if (linkedCertificate && !loading && handledLink !== linkedCertificate) {
    setHandledLink(linkedCertificate)
    const cert = certificates.find((c) => c.id === linkedCertificate || c.certificateNumber === linkedCertificate)
    const action = params.get('action')
    if (cert) {
      // Show that certificate in the list; open its dialog when an action is given.
      setQuery(cert.certificateNumber)
      if (action === 'extend' || action === 'reissue') openDialog(cert, action)
    }
  }
  useEffect(() => {
    if (!linkedCertificate || handledLink !== linkedCertificate) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('certificate')
        next.delete('action')
        return next
      },
      { replace: true },
    )
  }, [linkedCertificate, handledLink, setParams])
  useDeepLinkField(!loading && (Boolean(dialog) || handledLink !== null))

  const filtered = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesQuery = matchesSearch(
        [cert.certificateNumber, cert.clientName, cert.clientId],
        query,
      )
      const matchesCountry = countryFilter === 'all' || cert.countryCode === countryFilter
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter
      const issuedAt = new Date(cert.issuedAt)
      const matchesFrom = !period.from || issuedAt >= period.from
      const matchesTo = !period.to || issuedAt <= period.to
      return matchesQuery && matchesCountry && matchesStatus && matchesFrom && matchesTo
    })
  }, [certificates, query, countryFilter, statusFilter, period])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasActiveFilters = Boolean(
    query || period.from || period.to || countryFilter !== 'all' || statusFilter !== 'all',
  )

  const clearFilters = () => {
    setQuery('')
    setPeriod({ from: null, to: null })
    setCountryFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const statusLabel = (status: CertificateStatus) =>
    t(`cab.certificateRegister.status.${STATUS_LABEL_KEYS[status]}`, status === 'SUPERSEDED' ? 'Superseded' : status)

  const countryName = (code: string) => countryOptions.find((option) => option.code === code)?.name ?? code

  const formatDate = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }).format(
          new Date(iso),
        )
      : notSet()

  const exportColumns: TableColumn<CertificateRegisterItem>[] = [
    { header: t('cab.certificateRegister.table.number'), value: (row) => row.certificateNumber },
    { header: t('cab.certificateRegister.table.client'), value: (row) => row.clientName },
    { header: t('cab.certificateRegister.table.standard'), value: (row) => row.standard },
    { header: t('cab.certificateRegister.table.scope'), value: (row) => row.scope },
    { header: t('cab.certificateRegister.table.validUntil'), value: (row) => formatDate(row.validUntil) },
    { header: t('cab.certificateRegister.table.status'), value: (row) => statusLabel(row.status) },
  ]

  const handleExportExcel = () => {
    setExporting(true)
    try {
      downloadExcelCsv('certificate-register.xlsx', exportColumns, filtered)
    } finally {
      setExporting(false)
    }
  }
  const handleExportPdf = () => {
    setExporting(true)
    try {
      downloadPdfFromTable('certificate-register.pdf', t('cab.certificateRegister.title'), exportColumns, filtered)
    } finally {
      setExporting(false)
    }
  }

  /** Which row actions are valid for a given status — mirrors the lifecycle
   *  rules in the handoff notes (issue requires a draft, reissue/suspend/
   *  withdraw require an already-issued certificate). */
  function availableActions(cert: CertificateRegisterItem): readonly CertificateRowAction[] {
    if (cert.status === 'DRAFT') {
      return ['prepareCertificate', 'view', 'editDraft', 'issue'] as const
    }
    if (cert.status === 'ISSUED') {
      return ['view', 'reissue', 'extend', 'suspend', 'withdraw', 'history'] as const
    }
    if (cert.status === 'SUSPENDED') {
      // A suspended certificate can be reinstated, extended or withdrawn.
      return ['view', 'reinstate', 'extend', 'withdraw', 'history'] as const
    }
    // Withdrawn and superseded certificates are read-only.
    return ['view', 'history'] as const
  }

  const actionIcon = {
    prepareCertificate: CertificateBadgeIcon,
    view: EyeIcon,
    editDraft: EditIcon,
    issue: CheckIcon,
    reissue: RefreshIcon,
    reinstate: CheckIcon,
    extend: AddCircleIcon,
    history: EyeIcon,
    suspend: ErrorCircleIcon,
    withdraw: TrashIcon,
  } as const

  return (
    <CabLayout tourId="cab-certificate-register" tourSteps={tourSteps}>
      <CabHeader title={t('cab.certificateRegister.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <ReturnToBanner />
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('common.breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-500 hover:text-primary">
            {t('cab.certificateRegister.breadcrumbParent')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-800">{t('cab.certificateRegister.title')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="certificate-register-header">
            <div>
              <h1 className="text-page-title text-text-primary">
                {t('cab.certificateRegister.title')}
              </h1>
              <p className="mt-1 text-body-sm text-neutral-600">{t('cab.certificateRegister.subtitle')}</p>
            </div>
          </CabTourStep>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <CabTourStep steps={tourSteps} stepId="certificate-register-prepare-btn">
              <Button
                variant="primary"
                icon={<AppIcon icon={AddCircleIcon} size={20} />}
                onClick={() => navigate(cabPrepareCertificatePath(certificates.find((c) => c.status === 'DRAFT')?.id ?? certificates[0]?.id ?? '24'))}
                className="w-full sm:w-auto whitespace-nowrap"
              >
                {t('cab.certificateRegister.prepareCertificate')}
              </Button>
            </CabTourStep>
            <ImportMenuButton definitionKey="certificates" size="default" onImported={() => void reload()} />
            <ExportMenuButton
              exporting={exporting}
              disabled={filtered.length === 0}
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              label={t('cab.certificateRegister.export')}
              excelLabel={t('cab.certificateRegister.exportExcel')}
            />
          </div>
        </div>

        {/* Filters */}
        <CabTourStep steps={tourSteps} stepId="certificate-register-filters">
          <section className="rounded-lg border border-neutral-100 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.6fr_1fr_1fr_auto] lg:items-end">
              <div className="flex flex-col gap-2">
                <label htmlFor="certificate-search" className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.certificateRegister.filters.search')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    id="certificate-search"
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setPage(1)
                      setQuery(event.target.value)
                    }}
                    placeholder={t('cab.certificateRegister.filters.searchPlaceholder')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.certificateRegister.filters.issuePeriod')}
                </span>
                <DateRangePicker
                  value={period}
                  onChange={(next) => {
                    setPage(1)
                    setPeriod(next)
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.certificateRegister.filters.country')}
                </span>
                <SelectField
                  value={countryFilter}
                  onChange={(value) => {
                    setPage(1)
                    setCountryFilter(value)
                  }}
                  options={[
                    { value: 'all', label: t('cab.certificateRegister.filters.allCountries') },
                    ...countryOptions.map((option) => ({
                      value: option.code,
                      label: `${option.flag} ${option.name}`,
                      textValue: option.name,
                    })),
                  ]}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.certificateRegister.filters.status')}
                </span>
                <SelectField
                  value={statusFilter}
                  onChange={(value) => {
                    setPage(1)
                    setStatusFilter(value)
                  }}
                  options={[
                    { value: 'all', label: t('cab.certificateRegister.filters.allStatuses') },
                    ...(Object.keys(STATUS_LABEL_KEYS) as CertificateStatus[]).map((status) => ({
                      value: status,
                      label: statusLabel(status),
                    })),
                  ]}
                />
              </div>

              <div className="flex items-end justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="h-11 whitespace-nowrap text-body-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
                >
                  {t('cab.certificateRegister.clearFilters')}
                </button>
              </div>
            </div>
          </section>
        </CabTourStep>

        <CabTourStep steps={tourSteps} stepId="certificate-register-table">
          <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-5">
            <p className="mb-4 px-5 text-body-sm text-neutral-600">
              {loading
                ? t('common.loading')
                : t('cab.certificateRegister.resultCount', { count: filtered.length })}
            </p>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[960px] border-collapse text-center">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.certificateRegister.table.number')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.certificateRegister.table.client')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.certificateRegister.table.standard')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.certificateRegister.table.scope')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.certificateRegister.table.validUntil')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.certificateRegister.table.status')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">
                      <span className="sr-only">{t('cab.certificateRegister.table.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-body text-neutral-600">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-body text-neutral-600">
                        {t('cab.certificateRegister.empty')}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((cert, index) => (
                      <tr key={cert.id} className={cn(index % 2 ? 'bg-neutral-25' : '')}>
                        <td className="px-4 py-4 font-medium text-body text-primary" dir="ltr">
                          {cert.certificateNumber}
                        </td>
                        <td className="px-4 py-4 text-start">
                          <div className="font-medium text-body text-neutral-900">{cert.clientName}</div>
                          <div className="text-caption text-neutral-600">
                            <span dir="ltr">{cert.clientId}</span>
                            <span className="mx-1">|</span>
                            {countryName(cert.countryCode)}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-body text-neutral-800">{cert.standard}</td>
                        <td className="max-w-[280px] px-4 py-4 text-start text-body-sm text-neutral-700">
                          {cert.scope}
                        </td>
                        <td className="px-4 py-4 text-body text-neutral-800" dir="ltr">
                          {formatDate(cert.validUntil)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                              statusStyles[cert.status],
                            )}
                          >
                            {statusLabel(cert.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <CabTourStep
                              steps={tourSteps}
                              stepId={index === 0 ? 'certificate-register-actions' : undefined}
                            >
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <button
                                    type="button"
                                    aria-label={t('cab.certificateRegister.table.actions')}
                                    className="flex size-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-50 hover:text-primary"
                                  >
                                    <AppIcon icon={MoreIcon} size={20} className="rotate-90" />
                                  </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    align="end"
                                    sideOffset={4}
                                    className="z-50 min-w-[170px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg"
                                  >
                                    {availableActions(cert).map((action) => (
                                      <DropdownMenu.Item
                                        key={action}
                                        onSelect={() => runAction(cert, action)}
                                        className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                      >
                                        <AppIcon icon={actionIcon[action]} size={16} />
                                        {t(`cab.certificateRegister.rowActions.${action}`, ACTION_FALLBACK[action])}
                                      </DropdownMenu.Item>
                                    ))}
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </CabTourStep>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 px-5 md:hidden">
              {loading ? (
                <p className="py-6 text-center text-body-sm text-neutral-600">{t('common.loading')}</p>
              ) : paginated.length === 0 ? (
                <p className="py-6 text-center text-body-sm text-neutral-600">{t('cab.certificateRegister.empty')}</p>
              ) : (
                paginated.map((cert) => (
                  <div key={cert.id} className="w-full rounded-lg border border-neutral-100 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-body-sm text-primary" dir="ltr">
                        {cert.certificateNumber}
                      </p>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                          statusStyles[cert.status],
                        )}
                      >
                        {statusLabel(cert.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-body-sm font-medium text-neutral-900">{cert.clientName}</p>
                    <p className="text-body-sm text-neutral-600">
                      <span dir="ltr">{cert.clientId}</span> | {countryName(cert.countryCode)}
                    </p>
                    <p className="mt-2 text-body-sm text-neutral-800">
                      {cert.standard} · {cert.scope}
                    </p>
                    <p className="mt-2 text-body-sm text-neutral-600" dir="ltr">
                      {formatDate(cert.validUntil)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => navigate(cabPrepareCertificatePath(cert.id))}
                    >
                      {t('cab.certificateRegister.prepareCertificate')}
                    </Button>
                  </div>
                ))
              )}
            </div>

          {!loading && filtered.length > 0 && (
            <div className="mt-5 flex justify-end border-t border-neutral-100 px-5 pt-4">
              <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </section>
        </CabTourStep>
      </main>
      <ConfirmActionDialog
        open={statusAction !== null}
        title={
          statusAction?.action === 'withdraw'
            ? t('cab.certificateRegister.statusDialog.withdrawTitle', 'Withdraw certificate {{number}}?', { number: statusAction.cert.certificateNumber })
            : t('cab.certificateRegister.statusDialog.suspendTitle', 'Suspend certificate {{number}}?', { number: statusAction?.cert.certificateNumber ?? '' })
        }
        description={
          statusAction?.action === 'withdraw'
            ? t('cab.certificateRegister.statusDialog.withdrawBody', 'The certificate stops being valid permanently. The reason is kept on the certificate record.')
            : t('cab.certificateRegister.statusDialog.suspendBody', 'The certificate is not valid while suspended. The reason is kept on the certificate record.')
        }
        confirmLabel={
          statusAction?.action === 'withdraw'
            ? t('cab.certificateRegister.rowActions.withdraw')
            : t('cab.certificateRegister.rowActions.suspend')
        }
        destructive
        reason={{ label: t('cab.certificateRegister.statusDialog.reason', 'Reason'), required: true }}
        onClose={() => setStatusAction(null)}
        onConfirm={applyStatusAction}
      />
      <WorkflowDialog
        open={dialog !== null}
        size={dialog?.action === 'history' ? 'lg' : 'md'}
        title={
          dialog
            ? `${t(`cab.certificateRegister.rowActions.${dialog.action}`, ACTION_FALLBACK[dialog.action])} · ${dialog.cert.certificateNumber}`
            : ''
        }
        description={
          dialog?.action === 'reissue'
            ? t('cab.certificateRegister.lifecycle.reissueBody', 'A new version of the certificate is issued with the next revision number; the current version becomes superseded and the client is notified.')
            : dialog?.action === 'reinstate'
              ? t('cab.certificateRegister.lifecycle.reinstateBody', 'The certificate becomes valid again once the cause of the suspension is resolved. The client is notified.')
              : dialog?.action === 'extend'
                ? t('cab.certificateRegister.lifecycle.extendBody', 'Extend the validity by at most six months, for a documented reason (e.g. a delayed recertification audit).')
                : undefined
        }
        confirmLabel={
          dialog?.action === 'history'
            ? t('common.close', 'Close')
            : dialog
              ? t(`cab.certificateRegister.rowActions.${dialog.action}`, ACTION_FALLBACK[dialog.action])
              : ''
        }
        confirmDisabled={
          dialog?.action !== 'history' && (dialogReason.trim().length < 3 || (dialog?.action === 'extend' && !dialogDate))
        }
        busy={dialogBusy}
        error={dialogError}
        onConfirm={() => void runDialog()}
        onClose={() => setDialog(null)}
      >
        {dialog?.action === 'history' ? (
          !history ? (
            <p className="text-body-sm text-neutral-600">{t('common.loading', 'Loading…')}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-body-sm font-semibold text-neutral-900">{t('cab.certificateRegister.lifecycle.versions', 'Versions')}</p>
                <ul className="space-y-1.5 text-body-sm">
                  {history.versions.map((v) => (
                    <li key={v.id} className="rounded-md bg-neutral-25 px-3 py-2">
                      <span className="font-semibold" dir="ltr">{v.certificateNumber}</span> · {statusLabel(v.status)}
                      {v.expiryDate ? ` · ${t('cab.certificateRegister.lifecycle.validUntil', 'valid until')} ${formatDate(v.expiryDate)}` : ''}
                      {v.reissueReason && <span className="block text-caption text-neutral-600">{v.reissueReason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-body-sm font-semibold text-neutral-900">{t('cab.certificateRegister.lifecycle.events', 'Status history')}</p>
                {history.events.length === 0 ? (
                  <p className="text-body-sm text-neutral-600">{t('cab.certificateRegister.lifecycle.noEvents', 'No status changes recorded yet.')}</p>
                ) : (
                  <ol className="space-y-1.5 text-body-sm">
                    {history.events.map((e) => (
                      <li key={e.id} className="border-s-2 border-primary-100 ps-3">
                        <span className="font-semibold">{t(`cab.certificateRegister.lifecycle.event.${e.type}`, e.type)}</span> ·{' '}
                        <span dir="ltr">{e.certificateNumber}</span>
                        <span className="block text-caption text-neutral-600">
                          {new Date(e.at).toLocaleString(i18n.language)} · {e.by}
                          {e.reason ? ` · ${e.reason}` : ''}
                          {e.newExpiryDate ? ` · ${formatDate(e.newExpiryDate)}` : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )
        ) : (
          <>
            {dialog?.action === 'reissue' && (
              <DialogTextArea id="reissue-scope" label={t('cab.certificateRegister.lifecycle.scope', 'Scope on the new version')} rows={3} maxLength={5000} value={dialogScope} onChange={setDialogScope} />
            )}
            {(dialog?.action === 'extend' || dialog?.action === 'reissue') && (
              <DialogDateField
                label={
                  dialog.action === 'extend'
                    ? t('cab.certificateRegister.lifecycle.newExpiry', 'New expiry date')
                    : t('cab.certificateRegister.lifecycle.expiryOptional', 'Expiry date (optional, not later than the current one)')
                }
                required={dialog.action === 'extend'}
                id="certificate-expiry-date"
                value={dialogDate}
                onChange={setDialogDate}
              />
            )}
            <DialogTextArea id="certificate-lifecycle-reason" label={t('cab.certificateRegister.statusDialog.reason', 'Reason')} required value={dialogReason} onChange={setDialogReason} />
          </>
        )}
      </WorkflowDialog>
    </CabLayout>
  )
}