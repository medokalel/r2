import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AppIcon, CertificateBadgeIcon, SearchIcon } from '@/components/icons'
import { listMyCertificates, type CertificateRegisterItem, type CertificateStatus } from '@/lib/api/cabCertificatesApi'
import { CERTIFICATE_STATUS_LABEL_KEYS, CERTIFICATE_STATUS_STYLES } from '@/lib/certificateStatus'
import { ROUTES } from '@/lib/routes'
import { matchesSearch } from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

const PAGE_SIZE = 10

/** Client portal (/portal/certificates): the signed-in audit client's issued, suspended and withdrawn certificates. */
export function PortalCertificatesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [certificates, setCertificates] = useState<CertificateRegisterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    listMyCertificates()
      .then((rows) => {
        if (!cancelled) setCertificates(rows)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const retry = () => {
    setLoading(true)
    setLoadError(false)
    setReloadKey((key) => key + 1)
  }

  const formatDate = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
      : notSet()
  const statusLabel = (status: CertificateStatus) =>
    t(`cab.certificateRegister.status.${CERTIFICATE_STATUS_LABEL_KEYS[status]}`)
  const badge = (status: CertificateStatus) => (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
        CERTIFICATE_STATUS_STYLES[status],
      )}
    >
      {statusLabel(status)}
    </span>
  )

  const filtered = certificates.filter((cert) =>
    matchesSearch([cert.certificateNumber, cert.standard, cert.scope, statusLabel(cert.status)], search),
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasNone = !loading && !loadError && certificates.length === 0
  const noMatch = !loading && !loadError && certificates.length > 0 && filtered.length === 0

  return (
    <PortalLayout
      title={t('portal.certificates.title', 'Certificates')}
      subtitle={t('portal.certificates.subtitle', 'Certificates the certification body has issued to your organization.')}
    >
      <div className="flex min-w-0 flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
              <AppIcon icon={SearchIcon} size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              aria-label={t('portal.certificates.searchPlaceholder', 'Search by number, standard or scope...')}
              placeholder={t('portal.certificates.searchPlaceholder', 'Search by number, standard or scope...')}
              className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
            />
          </div>
          {!loading && !loadError ? (
            <p className="text-body-sm text-neutral-600">
              {t('cab.certificateRegister.resultCount', { count: filtered.length })}
            </p>
          ) : null}
        </div>

        {loadError ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-body-sm text-error-600">{t('common.loadFailed', 'Failed to load. Please try again.')}</p>
            <button
              type="button"
              onClick={retry}
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : hasNone ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary-25 text-primary">
              <AppIcon icon={CertificateBadgeIcon} size={28} />
            </span>
            <p className="text-body font-semibold text-neutral-900">{t('portal.certificates.empty', 'No certificates yet')}</p>
            <p className="max-w-md text-body-sm text-neutral-600">
              {t(
                'portal.certificates.emptyHint',
                'Your certificate appears here once the certification body issues it after a positive certification decision.',
              )}
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.portalApplications)}
              className="mt-1 rounded-md border border-primary px-4 py-2 text-body-sm font-medium text-primary hover:bg-primary-25"
            >
              {t('portal.certificates.viewApplications', 'View applications')}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] border-collapse text-center">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-5 text-body-sm font-medium">{t('cab.certificateRegister.table.number', 'Number')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('cab.certificateRegister.table.standard', 'Standard')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('cab.certificateRegister.table.scope', 'Scope')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('portal.certificates.issueDate', 'Issue date')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('portal.certificates.expiryDate', 'Expiry date')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('cab.certificateRegister.table.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-neutral-600">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : noMatch ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-neutral-600">
                        {t('portal.certificates.noMatch', 'No certificates match your search.')}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((cert, index) => (
                      <tr key={cert.id} className={cn(index % 2 === 1 && 'bg-neutral-25')}>
                        <td className="px-4 py-4 text-body font-semibold text-primary" dir="ltr">
                          {cert.certificateNumber}
                        </td>
                        <td className="px-4 py-4 text-body text-neutral-800">{cert.standard}</td>
                        <td className="max-w-[320px] px-4 py-4 text-start text-body-sm text-neutral-700">{cert.scope}</td>
                        <td className="px-4 py-4 text-body-sm text-neutral-800">{formatDate(cert.issuedAt)}</td>
                        <td className="px-4 py-4 text-body-sm text-neutral-800">{formatDate(cert.validUntil)}</td>
                        <td className="px-4 py-4">{badge(cert.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {loading ? <p className="py-6 text-center text-neutral-600">{t('common.loading', 'Loading...')}</p> : null}
              {noMatch ? (
                <p className="py-6 text-center text-neutral-600">
                  {t('portal.certificates.noMatch', 'No certificates match your search.')}
                </p>
              ) : null}
              {!loading &&
                paginated.map((cert) => (
                  <div key={cert.id} className="w-full rounded-lg border border-neutral-100 bg-white p-4 text-start">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-body font-bold text-primary" dir="ltr">
                        {cert.certificateNumber}
                      </span>
                      {badge(cert.status)}
                    </div>
                    <p className="text-body font-semibold text-neutral-900">{cert.standard}</p>
                    <p className="text-body-sm text-neutral-600">{cert.scope}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-2 text-body-sm">
                      <div>
                        <p className="text-neutral-600">{t('portal.certificates.issueDate', 'Issue date')}</p>
                        <p className="font-medium text-neutral-900">{formatDate(cert.issuedAt)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">{t('portal.certificates.expiryDate', 'Expiry date')}</p>
                        <p className="font-medium text-neutral-900">{formatDate(cert.validUntil)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </PortalLayout>
  )
}
