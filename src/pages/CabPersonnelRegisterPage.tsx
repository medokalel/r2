import { useState, useMemo, useEffect, useCallback } from 'react'
import { schemeDisplayName } from '@/lib/standardsCatalog'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePersonnelTourSteps } from '@/config/personnelTourSteps'
import { useDirection } from '@/context/DirectionContext'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import {
  AddCircleIcon,
  AppIcon,
  EditIcon,
  EyeIcon,
  MoreIcon,
  SearchIcon,
} from '@/components/icons'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { Toggle } from '@/components/ui/Toggle'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  type TableColumn,
} from '@/lib/tableTools'
import {
  listCompetencePersons,
  setPersonActive,
  type CompetencePerson,
} from '@/lib/api/cabCompetenceApi'
import { formatIafCodesToSectorNames } from '@/lib/iafCodes'
import { IafSectorChips } from '@/components/dashboard/cab/IafSectorChips'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PAGE_SIZE = 10

export function CabPersonnelRegisterPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { dir } = useDirection()
  const tourSteps = usePersonnelTourSteps()
  const [personnel, setPersonnel] = useState<CompetencePerson[]>([])
  const [loadError, setLoadError] = useState(false)
  const [page, setPage] = useState(1)
  // Bumped after an Excel import so the register reloads from the server.
  const [reloadKey, setReloadKey] = useState(0)

  const formatDate = useCallback(
    (iso?: string | null) => {
      if (!iso) return notSet()
      const clean = iso.split('T')[0]
      const parsed = new Date(`${clean}T00:00:00`)
      if (Number.isNaN(parsed.getTime())) return clean || notSet()
      return new Intl.DateTimeFormat(i18n.language, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(parsed)
    },
    [i18n.language],
  )

  useEffect(() => {
    let cancelled = false
    listCompetencePersons(i18n.language)
      .then((list) => {
        if (!cancelled) {
          setPersonnel(list)
          setLoadError(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [i18n.language, reloadKey])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedExpiry, setSelectedExpiry] = useState('ALL')
  const [selectedRole, setSelectedRole] = useState('ALL')

  // Roles present in the register (Lead Auditor, Auditor, Technical Expert…)
  const roles = useMemo(() => Array.from(new Set(personnel.map((p) => p.role).filter(Boolean))).sort(), [personnel])

  // Unique country list
  const countries = useMemo(() => {
    const set = new Set<string>()
    personnel.forEach((p) => {
      if (p.country) set.add(p.country)
    })
    return Array.from(set)
  }, [personnel])

  // Filtered personnel
  const filteredPersonnel = useMemo(() => {
    return personnel.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchCode = p.code.toLowerCase().includes(q)
        const scopeText = formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language)
        const matchScope = scopeText.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchScope) return false
      }
      if (selectedCountry !== 'ALL' && p.country !== selectedCountry) return false
      if (selectedRole !== 'ALL' && p.role !== selectedRole) return false
      if (selectedStatus !== 'ALL') {
        const isActive = p.statusDot !== 'Inactive'
        if (selectedStatus === 'Active' && !isActive) return false
        if (selectedStatus === 'Inactive' && isActive) return false
        if (selectedStatus !== 'Active' && selectedStatus !== 'Inactive' && p.status !== selectedStatus) {
          return false
        }
      }
      if (selectedExpiry !== 'ALL') {
        const exp = new Date(p.expiryDate).getTime()
        if (!Number.isFinite(exp)) return false
        const now = new Date().getTime()
        if (selectedExpiry === '30' && exp - now > 30 * 86400000) return false
        if (selectedExpiry === '90' && exp - now > 90 * 86400000) return false
      }
      return true
    })
  }, [personnel, searchQuery, selectedCountry, selectedRole, selectedStatus, selectedExpiry, i18n.language])

  const totalPages = Math.max(1, Math.ceil(filteredPersonnel.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedPersonnel = filteredPersonnel.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedCountry !== 'ALL' ||
      selectedRole !== 'ALL' ||
      selectedStatus !== 'ALL' ||
      selectedExpiry !== 'ALL',
  )

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCountry('ALL')
    setSelectedRole('ALL')
    setSelectedStatus('ALL')
    setSelectedExpiry('ALL')
    setPage(1)
  }

  const [exporting, setExporting] = useState(false)

  const exportColumns: TableColumn<CompetencePerson>[] = useMemo(
    () => [
      { header: t('cab.competence.columns.code', 'Code'), value: (p) => p.code },
      { header: t('cab.competence.columns.name', 'Name'), value: (p) => p.name },
      { header: t('cab.competence.columns.role', 'Role'), value: (p) => enumLabel(t, p.role) },
      { header: t('cab.competence.columns.country', 'Country'), value: (p) => p.country },
      {
        header: t('cab.competence.columns.schemes', 'Schemes'),
        value: (p) => (p.schemes?.length ? p.schemes.map((s) => schemeDisplayName(s)).join(', ') : notSet()),
      },
      {
        header: t('cab.competence.columns.scope', 'Authorized scope'),
        value: (p) => formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language) || notSet(),
      },
      {
        header: t('cab.competence.columns.startDate', 'Start date'),
        value: (p) => formatDate(p.employmentStartDate),
      },
      {
        header: t('cab.competence.columns.expiry', 'Expiry (optional)'),
        value: (p) => formatDate(p.expiryDate),
      },
      {
        header: t('cab.competence.columns.status', 'Status'),
        value: (p) =>
          p.statusDot !== 'Inactive'
            ? t('cab.competence.statuses.active', 'Active')
            : t('cab.competence.statuses.notActive', 'Not Active'),
      },
    ],
    [t, i18n.language, formatDate],
  )

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      downloadExcelCsv('personnel-register.xlsx', exportColumns, filteredPersonnel)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      downloadPdfFromTable(
        'personnel-register.pdf',
        t('cab.competence.personnelRegister', 'Personnel register'),
        exportColumns,
        filteredPersonnel,
      )
    } finally {
      setExporting(false)
    }
  }

  const handleToggleStatus = (person: CompetencePerson, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const activate = person.statusDot === 'Inactive'
    const patch = (fields: Pick<CompetencePerson, 'status' | 'statusDot'>) =>
      setPersonnel((prev) => prev.map((item) => (item.id === person.id ? { ...item, ...fields } : item)))
    // Optimistic; the saved status replaces it, a failure restores the previous one.
    patch(activate ? { status: 'Authorized', statusDot: 'Active' } : { status: 'Suspended', statusDot: 'Inactive' })
    setPersonActive(person.id, activate)
      .then(patch)
      .catch(() => patch({ status: person.status, statusDot: person.statusDot }))
  }

  const renderStatusToggle = (p: CompetencePerson) => {
    const isActive = p.statusDot !== 'Inactive'
    return (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Toggle
          checked={isActive}
          label={
            isActive
              ? t('users.status.active', 'Active')
              : t('users.status.inactive', 'Inactive')
          }
          onChange={() => handleToggleStatus(p)}
        />
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <CabLayout sidebarVariant="competence" tourId="personnel-register-tour" tourSteps={tourSteps}>
      <CabHeader title={t('cab.competence.title', 'Competence Register')} notificationCount={3} />

      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('common.breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-500 hover:text-primary">
            {t('cab.competence.title', 'Competence Register')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-800">
            {t('cab.competence.personnelRegister', 'Personnel register')}
          </span>
        </nav>

        {/* Header Row: title on the start side; Import, Export and the primary "Add person" on the end side */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <CabTourStep steps={tourSteps} stepId="personnel-header">
            <div>
              <h1 className="text-page-title text-text-primary">
                {t('cab.competence.personnelRegister', 'Personnel register')}
              </h1>
              <p className="mt-1 text-body-3 text-text-secondary">
                {t('cab.competence.subtitle', 'Manage personnel, their roles, scheme authorizations and expiry dates.')}
              </p>
            </div>
          </CabTourStep>

          <CabTourStep steps={tourSteps} stepId="personnel-actions">
            <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <ImportMenuButton definitionKey="personnel" size="default" className="whitespace-nowrap" onImported={() => setReloadKey((k) => k + 1)} />
              <ExportMenuButton
                exporting={exporting}
                disabled={filteredPersonnel.length === 0}
                onExportExcel={handleExportExcel}
                onExportPdf={handleExportPdf}
                label={t('common.export', 'Export')}
                excelLabel={t('common.exportExcel', 'Export as Excel')}
                pdfLabel={t('common.exportPdf', 'Export as PDF')}
              />
              <Button
                variant="primary"
                icon={<AppIcon icon={AddCircleIcon} size={20} />}
                onClick={() => navigate(ROUTES.cabPersonnelNew)}
                className="col-span-2 whitespace-nowrap sm:col-span-1"
              >
                {t('cab.competence.addPerson', 'Add person')}
              </Button>
            </div>
          </CabTourStep>
        </div>

        {/* Filter Bar Card */}
        <CabTourStep steps={tourSteps} stepId="personnel-filters">
          <section className="rounded-lg border border-neutral-100 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
              {/* Search */}
              <div className="flex flex-col gap-2">
                <label htmlFor="personnel-search" className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.competence.fullName', 'Name / Personnel code')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    id="personnel-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setPage(1)
                      setSearchQuery(e.target.value)
                    }}
                    placeholder={t('cab.competence.searchPlaceholder', 'Search by name or code...')}
                    className="h-14 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body text-neutral-900 placeholder:text-text-secondary focus:border-focus focus:outline-none"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.competence.columns.role', 'Role')}
                </span>
                <SelectField
                  value={selectedRole}
                  onChange={(val) => {
                    setPage(1)
                    setSelectedRole(val)
                  }}
                  options={[
                    { value: 'ALL', label: t('cab.competence.allRoles', 'All roles') },
                    ...roles.map((role) => ({ value: role, label: enumLabel(t, role) })),
                  ]}
                />
              </div>

              {/* Country */}
              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.competence.country', 'Country')}
                </span>
                <SelectField
                  value={selectedCountry}
                  onChange={(val) => {
                    setPage(1)
                    setSelectedCountry(val)
                  }}
                  options={[
                    { value: 'ALL', label: t('cab.competence.allCountries', 'All countries') },
                    ...countries.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>

              {/* Authorization Status */}
              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.competence.authorizationStatus', 'Authorization status')}
                </span>
                <SelectField
                  value={selectedStatus}
                  onChange={(val) => {
                    setPage(1)
                    setSelectedStatus(val)
                  }}
                  options={[
                    { value: 'ALL', label: t('cab.competence.allStatuses', 'All statuses') },
                    { value: 'Active', label: t('cab.competence.statuses.active', 'Active') },
                    { value: 'Inactive', label: t('cab.competence.statuses.notActive', 'Not Active') },
                  ]}
                />
              </div>

              {/* Expiry Period */}
              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.competence.expiryPeriod', 'Expiry period')}
                </span>
                <SelectField
                  value={selectedExpiry}
                  onChange={(val) => {
                    setPage(1)
                    setSelectedExpiry(val)
                  }}
                  options={[
                    { value: 'ALL', label: t('cab.competence.allPeriods', 'All periods') },
                    { value: '30', label: t('cab.competence.expiring30', 'Expiring in 30 days') },
                    { value: '90', label: t('cab.competence.expiring90', 'Expiring in 90 days') },
                  ]}
                />
              </div>

              {/* Clear */}
              <div className="flex items-end justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                  className="h-14 whitespace-nowrap text-body-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
                >
                  {t('common.clear', 'Clear')}
                </button>
              </div>
            </div>
          </section>
        </CabTourStep>

        {/* Personnel Table & Mobile Card View */}
        <CabTourStep steps={tourSteps} stepId="personnel-table">
          <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-5">
            {loadError ? (
              <div role="alert" className="mx-5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-body-sm text-error-700">
                <span>{t('cab.competence.loadError', 'The personnel register could not be loaded.')}</span>
                <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                  {t('common.retry', 'Retry')}
                </Button>
              </div>
            ) : null}
            <p className="mb-4 px-5 text-body-sm text-neutral-600">
              {t('cab.competence.personnelCount', { count: filteredPersonnel.length })}
            </p>

            {/* Desktop / Tablet Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[960px] border-collapse text-center">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="px-4 py-4 text-center text-body-sm font-medium whitespace-nowrap">
                      {t('cab.competence.columns.person', 'Person')}
                    </th>
                    <th className="px-4 py-4 text-center text-body-sm font-medium whitespace-nowrap">
                      {t('cab.competence.columns.role', 'Role')}
                    </th>
                    <th className="px-4 py-4 text-center text-body-sm font-medium whitespace-nowrap">
                      {t('cab.competence.columns.schemes', 'Schemes')}
                    </th>
                    <th className="px-4 py-4 text-center text-body-sm font-medium whitespace-nowrap">
                      {t('cab.competence.columns.scope', 'Authorized scope')}
                    </th>
                    <th className="px-4 py-4 text-center text-body-sm font-medium whitespace-nowrap">
                      {t('cab.competence.columns.startDate', 'Start date')}
                    </th>
                    <th className="px-4 py-4 text-center text-body-sm font-medium whitespace-nowrap">
                      {t('cab.competence.columns.expiry', 'Expiry (optional)')}
                    </th>
                    <th className="px-4 py-4 text-center text-body-sm font-medium whitespace-nowrap">
                      {t('cab.competence.columns.status', 'Status')}
                    </th>
                    <th className="px-4 py-4 text-center text-body-sm font-medium whitespace-nowrap">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPersonnel.length > 0 ? (
                    paginatedPersonnel.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={cn(idx % 2 === 1 ? 'bg-neutral-25' : 'bg-white')}
                      >
                        {/* Person Column */}
                        <td className="px-5 py-4 text-start">
                          <div className="flex items-center gap-3.5">
                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-body-sm font-bold text-white shadow-sm">
                              {p.avatarUrl ? (
                                <img src={p.avatarUrl} alt={p.name} className="size-full rounded-full object-cover" />
                              ) : (
                                getInitials(p.name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                className="cursor-pointer text-start text-body font-semibold text-neutral-900 transition-colors hover:text-primary hover:underline"
                              >
                                {p.name}
                              </button>
                              <div className="text-caption text-neutral-600">
                                <span dir="ltr">{p.code}</span>
                                {p.country ? (
                                  <>
                                    <span className="mx-1">|</span>
                                    <span>{displayCountry(p.country)}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="px-4 py-4 text-center text-body text-neutral-800 whitespace-nowrap">
                          {p.role ? enumLabel(t, p.role) : notSet()}
                        </td>

                        {/* Schemes Column */}
                        <td className="px-4 py-4 text-center text-body text-neutral-800">
                          {p.schemes.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {p.schemes.map((s) => (
                                <span
                                  key={s}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm bg-primary-50 px-3 py-1 text-caption font-medium text-primary"
                                >
                                  {schemeDisplayName(s)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            notSet()
                          )}
                        </td>

                        {/* Scope Column */}
                        <td className="min-w-[220px] max-w-[320px] px-4 py-4 text-start text-body-sm">
                          <IafSectorChips codes={p.iafCodes} fallback={p.authorizedScope} />
                        </td>

                        {/* Start Date Column */}
                        <td className="px-4 py-4 text-center text-body-sm text-neutral-800 whitespace-nowrap" dir="ltr">
                          {formatDate(p.employmentStartDate)}
                        </td>

                        {/* Expiry Column */}
                        <td className="px-4 py-4 text-center text-body-sm text-neutral-800 whitespace-nowrap" dir="ltr">
                          {formatDate(p.expiryDate)}
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {renderStatusToggle(p)}
                        </td>

                        {/* Actions Column */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <CabTourStep
                              steps={tourSteps}
                              stepId={idx === 0 ? 'personnel-eval-action' : undefined}
                            >
                              <DropdownMenu.Root dir={dir}>
                                <DropdownMenu.Trigger asChild>
                                  <button
                                    type="button"
                                    className="flex size-9 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-primary focus:outline-none"
                                    aria-label={t('common.actions', 'Actions')}
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
                                      onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                      className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                    >
                                      <AppIcon icon={EyeIcon} size={16} />
                                      {t('cab.competence.evaluation.pageTitle', 'Competence Profile')}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      onSelect={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                                      className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                    >
                                      <AppIcon icon={EditIcon} size={16} />
                                      {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                                    </DropdownMenu.Item>
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </CabTourStep>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-body text-neutral-600">
                        {t('cab.competence.noPersonnel', 'No personnel records match the current filters.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="space-y-3 px-5 md:hidden">
              {paginatedPersonnel.length > 0 ? (
                paginatedPersonnel.map((p) => (
                  <div
                    key={p.id}
                    className="w-full space-y-3 rounded-lg border border-neutral-100 bg-white p-4"
                  >
                    {/* Top Row: Avatar, Name, Code & Dropdown */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-body-sm font-bold text-white shadow-sm">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt={p.name} className="size-full rounded-full object-cover" />
                          ) : (
                            getInitials(p.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                            className="block cursor-pointer truncate text-start font-semibold text-neutral-900 hover:text-primary hover:underline"
                          >
                            {p.name}
                          </button>
                          <p className="text-caption text-neutral-600" dir="ltr">
                            {p.code}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {renderStatusToggle(p)}
                        <DropdownMenu.Root dir={dir}>
                          <DropdownMenu.Trigger asChild>
                            <button
                              type="button"
                              className="flex size-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-50 hover:text-primary focus:outline-none"
                              aria-label={t('common.actions', 'Actions')}
                            >
                              <AppIcon icon={MoreIcon} size={18} className="rotate-90" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              sideOffset={4}
                              className="z-50 min-w-[180px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg"
                            >
                              <DropdownMenu.Item
                                onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                              >
                                <AppIcon icon={EyeIcon} size={16} />
                                {t('cab.competence.evaluation.pageTitle', 'Competence Profile')}
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onSelect={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                              >
                                <AppIcon icon={EditIcon} size={16} />
                                {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>
                    </div>

                    {/* Role, Start Date & Expiry */}
                    <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 pt-2 text-body-sm">
                      <div>
                        <span className="block text-caption font-medium text-neutral-500">
                          {t('cab.competence.columns.role', 'Role')}
                        </span>
                        <span className="font-medium text-neutral-800">{p.role ? enumLabel(t, p.role) : notSet()}</span>
                      </div>
                      <div>
                        <span className="block text-caption font-medium text-neutral-500">
                          {t('cab.competence.columns.startDate', 'Start date')}
                        </span>
                        <span className="font-medium text-neutral-800 whitespace-nowrap" dir="ltr">
                          {formatDate(p.employmentStartDate)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-caption font-medium text-neutral-500">
                          {t('cab.competence.columns.expiry', 'Expiry (optional)')}
                        </span>
                        <span className="font-medium text-neutral-800 whitespace-nowrap" dir="ltr">
                          {formatDate(p.expiryDate)}
                        </span>
                      </div>
                    </div>

                    {/* Schemes & Scope */}
                    <div className="space-y-1.5 text-body-sm">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="me-1 text-caption font-medium text-neutral-500">
                          {t('cab.competence.columns.schemes', 'Schemes')}:
                        </span>
                        {p.schemes.length > 0 ? (
                          p.schemes.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm bg-primary-50 px-2.5 py-0.5 text-caption font-medium text-primary"
                            >
                              {schemeDisplayName(s)}
                            </span>
                          ))
                        ) : (
                          <span className="text-neutral-600">{notSet()}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 text-caption">
                        <span className="font-medium text-neutral-800">{t('cab.competence.columns.scope', 'Scope')}</span>
                        <IafSectorChips codes={p.iafCodes} fallback={p.authorizedScope} max={4} />
                      </div>
                    </div>

                    {/* Mobile Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      icon={<AppIcon icon={EditIcon} size={15} />}
                      onClick={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                    >
                      {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-body-sm text-neutral-600">
                  {t('cab.competence.noPersonnel', 'No personnel records match the current filters.')}
                </p>
              )}
            </div>

            {filteredPersonnel.length > 0 && (
              <div className="mt-5 flex justify-end border-t border-neutral-100 px-5 pt-4">
                <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </section>
        </CabTourStep>
      </main>
    </CabLayout>
  )
}
