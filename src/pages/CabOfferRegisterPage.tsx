import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabOrPortalLayout } from '@/components/layout/CabOrPortalLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useOffersTourSteps } from '@/config/offersTourSteps'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AddCircleIcon, AppIcon, FilterFunnelIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import { ROUTES } from '@/lib/routes'
import {
  acceptOffer,
  getOffers,
  isQuotationOffer,
  rejectOffer,
  updateOfferStatus,
  type OfferItem,
  type OfferFilterParams,
} from '@/lib/api/cabOffersApi'
import { OfferDetailDrawer } from '@/components/dashboard/cab/offers/OfferDetailDrawer'
import { ActionMenu, type ActionMenuItem } from '@/components/dashboard/cab/workflow/ActionMenu'
import { WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { downloadOfferPdf, offerTotals } from '@/lib/offers/offerPdf'
import { downloadExcelCsv } from '@/lib/tableTools'
import { cabApplicationQuotationPath } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { isAuditClientSession } from '@/lib/authStorage'
import { usePortalMode } from '@/hooks/usePortalMode'
import { ConfirmActionDialog } from '@/components/dashboard/ConfirmActionDialog'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

const PAGE_SIZE = 10

export function CabOfferRegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useOffersTourSteps()
  // ?offer=<number|id> (e.g. from a notification) opens that offer's detail view.
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedKey, setSelectedKey] = useState<string | null>(() => searchParams.get('offer'))
  const [voiding, setVoiding] = useState<OfferItem | null>(null)
  const [voidBusy, setVoidBusy] = useState(false)
  const [voidError, setVoidError] = useState<string | null>(null)

  const [offers, setOffers] = useState<OfferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  // Client portal (/portal/offers): the client answers issued offers instead of managing them.
  const isClient = isAuditClientSession()
  // Portal mode (/portal/offers or a client session): portal shell, no CAB-only controls (new / revise / void, bulk select, country).
  const portal = usePortalMode()
  const [response, setResponse] = useState<{ offer: OfferItem; action: 'accept' | 'reject' } | null>(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [country, setCountry] = useState('all')
  const [status, setStatus] = useState('all')

  // Pagination state
  const [page, setPage] = useState(1)

  const loadOffers = async (overrideFilters?: OfferFilterParams) => {
    setLoading(true)
    const filters: OfferFilterParams = overrideFilters || {
      searchQuery,
      country: country === 'all' ? undefined : country,
      status: status === 'all' ? undefined : status,
    }
    const data = await getOffers(filters)
    setOffers(data)
    setLoading(false)
  }

  // First load with the default (empty) filters; later loads come from search / actions.
  useEffect(() => {
    let cancelled = false
    getOffers({ searchQuery: '' })
      .then((data) => {
        if (!cancelled) setOffers(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPage(1)
    loadOffers()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setCheckedIds(offers.map((o) => o.id))
    } else {
      setCheckedIds([])
    }
  }

  const handleToggleCheck = (id: string, checked: boolean) => {
    if (checked) {
      setCheckedIds([...checkedIds, id])
    } else {
      setCheckedIds(checkedIds.filter((item) => item !== id))
    }
  }

  const selectedOffer = selectedKey
    ? offers.find((o) => o.id === selectedKey || o.offerNumber.toLowerCase() === selectedKey.toLowerCase()) ?? null
    : null

  const openOffer = (offer: OfferItem) => setSelectedKey(offer.id)
  const closeOffer = () => {
    setSelectedKey(null)
    if (searchParams.has('offer')) {
      const next = new URLSearchParams(searchParams)
      next.delete('offer')
      setSearchParams(next, { replace: true })
    }
  }

  const confirmVoid = async () => {
    if (!voiding) return
    setVoidBusy(true)
    setVoidError(null)
    try {
      if (!(await updateOfferStatus(voiding.id, 'void'))) throw new Error(t('cab.offerDetail.voidFailed', 'This offer can no longer be voided.'))
      toast.success(t('cab.offerDetail.updated', { defaultValue: 'Offer {{number}} updated.', number: voiding.offerNumber }))
      setVoiding(null)
      await loadOffers()
    } catch (err) {
      setVoidError(workflowErrorMessage(err, t))
    } finally {
      setVoidBusy(false)
    }
  }

  const downloadPdf = async (offer: OfferItem) => {
    try {
      await downloadOfferPdf(offer, t, i18n.language)
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    }
  }

  const exportList = () =>
    downloadExcelCsv(
      'offers',
      [
        { header: t('cab.offersPage.table.offer', 'Offer'), value: (o: OfferItem) => o.offerNumber },
        { header: t('cab.offersPage.table.client', 'Client'), value: (o: OfferItem) => o.clientName },
        { header: t('cab.offersPage.table.amount', 'Amount'), value: (o: OfferItem) => offerTotals(o).total },
        { header: t('cab.offersPage.table.currency', 'Currency'), value: (o: OfferItem) => o.currency },
        { header: t('cab.offersPage.table.validUntil', 'Valid until'), value: (o: OfferItem) => o.validUntil },
        { header: t('cab.offersPage.table.status', 'Status'), value: (o: OfferItem) => t(`cab.offersPage.status.${o.status}`, o.statusLabel) },
      ],
      checkedIds.length ? offers.filter((o) => checkedIds.includes(o.id)) : offers,
    )

  /** Row menu (CAB): view, revise, PDF, void. Approve / issue are in the detail view. */
  const rowActions = (offer: OfferItem): ActionMenuItem[] => {
    const final = offer.status === 'void' || offer.status === 'rejected' || Boolean(offer.acceptedAt)
    const fromQuotation = isQuotationOffer(offer)
    return [
      { key: 'view', label: t('cab.offersPage.actions.view', 'View offer'), onSelect: () => openOffer(offer) },
      fromQuotation
        ? {
            key: 'revise',
            label: t('cab.offerDetail.actions.openQuotation', 'Revise in quotation'),
            disabled: !offer.applicationId,
            onSelect: () => offer.applicationId && navigate(cabApplicationQuotationPath(offer.applicationId)),
          }
        : {
            key: 'revise',
            label: t('cab.offersPage.actions.revise', 'Revise (new version)'),
            disabled: final,
            hint: t('cab.offersPage.actions.reviseFinal', 'Accepted, rejected or void offers cannot be revised.'),
            onSelect: () => navigate(`${ROUTES.cabOfferNew}?revise=${encodeURIComponent(offer.id)}`),
          },
      { key: 'pdf', label: t('cab.offersPage.actions.downloadPdf', 'Download PDF'), onSelect: () => void downloadPdf(offer) },
      {
        key: 'void',
        label: t('cab.offersPage.actions.voidOffer', 'Void offer'),
        tone: 'destructive',
        disabled: final,
        hint: t('cab.offersPage.actions.voidFinal', 'This offer is already closed.'),
        onSelect: () => setVoiding(offer),
      },
    ]
  }

  const openResponse = (offer: OfferItem, action: 'accept' | 'reject') => {
    setResponse({ offer, action })
  }

  const submitResponse = async (note: string) => {
    if (!response) return
    const respond = response.action === 'accept' ? acceptOffer : rejectOffer
    await respond(response.offer.id, note || undefined)
    await loadOffers()
  }

  /** Accept / reject buttons for an issued offer (client portal only). */
  const renderClientResponse = (offer: OfferItem, className?: string) =>
    isClient && offer.status === 'issued' ? (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <button
          type="button"
          onClick={() => openResponse(offer, 'accept')}
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
        >
          {t('cab.offersPage.actions.accept', 'Accept offer')}
        </button>
        <button
          type="button"
          onClick={() => openResponse(offer, 'reject')}
          className="rounded-sm border border-error-500 bg-white px-3 py-1.5 text-caption font-medium text-error-500 transition-colors hover:bg-error-50"
        >
          {t('cab.offersPage.actions.reject', 'Reject offer')}
        </button>
      </div>
    ) : null

  const getStatusBadge = (offerStatus: string, label: string) => {
    const s = offerStatus.toLowerCase()
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap transition-colors',
          s === 'issued' && 'bg-primary-50 text-primary',
          s === 'approved' && 'bg-success-100 text-success-700',
          s === 'pending_approval' && 'bg-warning-100 text-warning-700',
          (s === 'void' || s === 'rejected') && 'bg-error-100 text-error-600',
          s === 'draft' && 'bg-neutral-50 text-slate-600'
        )}
      >
        {t(`cab.offersPage.status.${s}`, label || offerStatus)}
      </span>
    )
  }

  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE))
  const paginated = offers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <CabOrPortalLayout
      portal={portal}
      sidebarVariant="offers"
      tourId="cab-offers-register"
      tourSteps={tourSteps}
    >
      <CabTourStep steps={tourSteps} stepId="offers-header">
        <div>
          {portal ? (
            <CabHeader
              title={t('portal.offers.title', 'Offers')}
              subtitle={t('portal.offers.subtitle', 'Quotations sent to you by the certification body.')}
              notificationCount={3}
            />
          ) : (
            <CabHeader title={t('cab.offersPage.title', 'Offer Register')} notificationCount={3} />
          )}
        </div>
      </CabTourStep>

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto page-main">
        {/* Main Card Container */}
        <div className="flex min-w-0 flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
          {/* Top Bar: Search, Filters & Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <CabTourStep steps={tourSteps} stepId="offers-search-filters">
              <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
                {/* Search Input */}
                <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={
                      portal
                        ? t('portal.offers.searchPlaceholder', 'Search by offer number...')
                        : t('cab.offersPage.searchPlaceholder', 'Search offer or client...')
                    }
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'flex-1 shrink-0 sm:flex-none')}
                  >
                    {t('cab.offersPage.search', 'Search')}
                  </button>
                  {portal ? null : (
                    <TableFilterSelect
                      label={t('cab.offersPage.filters.country', 'Country')}
                      value={country}
                      onChange={(val) => {
                        setPage(1)
                        setCountry(val)
                      }}
                      options={[
                        { value: 'all', label: t('cab.offersPage.filters.allCountries', 'All countries') },
                        { value: 'Saudi Arabia', label: 'Saudi Arabia' },
                        { value: 'United Arab Emirates', label: 'United Arab Emirates' },
                        { value: 'Egypt', label: 'Egypt' },
                      ]}
                    />
                  )}
                  <TableFilterSelect
                    label={t('cab.offersPage.filters.status', 'Status')}
                    value={status}
                    onChange={(val) => {
                      setPage(1)
                      setStatus(val)
                    }}
                    options={[
                      { value: 'all', label: t('cab.offersPage.filters.allStatuses', 'All statuses') },
                      { value: 'issued', label: t('cab.offersPage.status.issued', 'Issued') },
                      ...(portal
                        ? [{ value: 'rejected', label: t('cab.offersPage.status.rejected', 'Rejected') }]
                        : [{ value: 'pending_approval', label: t('cab.offersPage.status.pending_approval', 'Pending approval') }]),
                      { value: 'approved', label: t('cab.offersPage.status.approved', 'Approved') },
                      ...(portal ? [] : [{ value: 'draft', label: t('cab.offersPage.status.draft', 'Draft') }]),
                      { value: 'void', label: t('cab.offersPage.status.void', 'Void') },
                    ]}
                  />
                  <button
                    type="button"
                    aria-label={t('common.filter', 'Filter')}
                    className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-25 text-primary hover:bg-primary-50"
                    onClick={handleSearch}
                  >
                    <AppIcon icon={FilterFunnelIcon} size={20} />
                  </button>
                </div>
              </div>
            </CabTourStep>

            {/* Action Buttons */}
            <CabTourStep steps={tourSteps} stepId="offers-new-btn">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={exportList}
                  className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                >
                  <AppIcon icon={DownloadTrayIcon} size={18} />
                  <span>{t('cab.offersPage.export', 'Export')}</span>
                </button>
                {portal ? null : (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.cabOfferNew)}
                    className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                  >
                    <AppIcon icon={AddCircleIcon} size={18} />
                    <span>{t('cab.offersPage.newOffer', 'New offer')}</span>
                  </button>
                )}
              </div>
            </CabTourStep>
          </div>

          {/* Desktop Table View */}
          <CabTourStep steps={tourSteps} stepId="offers-table">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-center">
                <thead className="bg-primary text-white">
                  <tr className="rounded-md bg-primary text-white">
                    {portal ? null : (
                      <th className="w-10 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={offers.length > 0 && checkedIds.length === offers.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="size-4 rounded border-white/30 bg-white/10 focus:ring-0"
                        />
                      </th>
                    )}
                    <th className="p-5 text-center text-body-sm font-medium">{t('cab.offersPage.table.offer', 'Offer')}</th>
                    {portal ? null : (
                      <th className="p-5 text-center text-body-sm font-medium">{t('cab.offersPage.table.client', 'Client')}</th>
                    )}
                    <th className="p-5 text-center text-body-sm font-medium">{t('cab.offersPage.table.amount', 'Amount')}</th>
                    <th className="p-5 text-center text-body-sm font-medium">{t('cab.offersPage.table.currency', 'Currency')}</th>
                    <th className="p-5 text-center text-body-sm font-medium">{t('cab.offersPage.table.validUntil', 'Valid until')}</th>
                    <th className="p-5 text-center text-body-sm font-medium">{t('cab.offersPage.table.status', 'Status')}</th>
                    <th className="p-5 text-center text-body-sm font-medium">{t('cab.offersPage.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={portal ? 6 : 8} className="px-4 py-6 text-center text-neutral-600">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={portal ? 6 : 8} className="px-4 py-6 text-center text-neutral-600">
                        {portal ? t('portal.offers.empty', 'No offers yet.') : notSet()}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((offer, index) => {
                      const isChecked = checkedIds.includes(offer.id)
                      const totalAmount = offer.fees.reduce((acc, f) => acc + f.amount, 0) - (offer.optionalDiscount || 0)

                      return (
                        <tr
                          key={offer.id}
                          className={cn(index % 2 === 1 && 'bg-neutral-25')}
                        >
                          {portal ? null : (
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleToggleCheck(offer.id, e.target.checked)}
                                className="size-4 rounded border-neutral-200 text-primary focus:ring-primary"
                              />
                            </td>
                          )}
                          <td className="px-4 py-4">
                            <button type="button" onClick={() => openOffer(offer)} className="text-body font-semibold text-primary hover:underline">
                              {offer.offerNumber}
                            </button>
                          </td>
                          {portal ? null : (
                            <td className="px-4 py-4">
                              <p className="text-body font-medium text-neutral-900">{offer.clientName}</p>
                              <p className="text-body-sm text-neutral-600">{offer.clientCode} · {displayCountry(offer.country)}</p>
                            </td>
                          )}
                          <td className="px-4 py-4 text-body font-medium text-neutral-900">
                            {totalAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-body text-neutral-800">{offer.currency}</td>
                          <td className="px-4 py-4 text-body-sm text-neutral-800">{offer.validUntil}</td>
                          <td className="px-4 py-4">
                            {index === 0 ? (
                              <CabTourStep steps={tourSteps} stepId="offers-status-actions">
                                {getStatusBadge(offer.status, offer.statusLabel)}
                              </CabTourStep>
                            ) : (
                              getStatusBadge(offer.status, offer.statusLabel)
                            )}
                          </td>
                          <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                            {portal ? (
                              // Portal: actions inline (accept / reject an issued offer, download the PDF).
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {renderClientResponse(offer)}
                                <button
                                  type="button"
                                  onClick={() => openOffer(offer)}
                                  className="rounded-sm px-2 py-1.5 text-caption font-medium text-primary hover:bg-primary-50"
                                >
                                  {t('cab.offersPage.actions.view', 'View offer')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void downloadPdf(offer)}
                                  className="inline-flex size-8 items-center justify-center rounded-sm text-primary hover:bg-primary-50 transition-colors"
                                  aria-label={t('cab.offersPage.actions.downloadPdf', 'Download PDF')}
                                  title={t('cab.offersPage.actions.downloadPdf', 'Download PDF')}
                                >
                                  <AppIcon icon={DownloadTrayIcon} size={18} />
                                </button>
                              </div>
                            ) : (
                              <ActionMenu
                                ariaLabel={t('cab.offersPage.actions.menu', { defaultValue: 'Actions for {{number}}', number: offer.offerNumber })}
                                items={rowActions(offer)}
                              />
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CabTourStep>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {!loading && paginated.map((offer) => (
              <div
                key={offer.id}
                className="w-full rounded-lg border border-neutral-100 bg-white p-4 text-start"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <button type="button" onClick={() => openOffer(offer)} className="text-body font-bold text-primary">
                    {offer.offerNumber}
                  </button>
                  <div className="flex items-center gap-1">
                    {getStatusBadge(offer.status, offer.statusLabel)}
                    {portal ? (
                      <button
                        type="button"
                        onClick={() => void downloadPdf(offer)}
                        className="inline-flex size-8 items-center justify-center rounded-sm text-primary hover:bg-primary-50"
                        aria-label={t('cab.offersPage.actions.downloadPdf', 'Download PDF')}
                      >
                        <AppIcon icon={DownloadTrayIcon} size={18} />
                      </button>
                    ) : (
                      <ActionMenu
                        ariaLabel={t('cab.offersPage.actions.menu', { defaultValue: 'Actions for {{number}}', number: offer.offerNumber })}
                        items={rowActions(offer)}
                      />
                    )}
                  </div>
                </div>
                {portal ? null : (
                  <>
                    <p className="text-body font-semibold text-neutral-900">{offer.clientName}</p>
                    <p className="text-body-sm text-neutral-600">{offer.clientCode} · {displayCountry(offer.country)}</p>
                  </>
                )}
                <div className="mt-2 flex items-center justify-between text-body-sm border-t border-neutral-100 pt-2">
                  <span className="text-neutral-600">{t('ui.validLabel')} {offer.validUntil}</span>
                  <span className="font-bold text-neutral-900">
                    {(offer.fees.reduce((acc, f) => acc + f.amount, 0) - (offer.optionalDiscount || 0)).toLocaleString()} {offer.currency}
                  </span>
                </div>
                {renderClientResponse(offer, 'mt-3 border-t border-neutral-100 pt-3')}
              </div>
            ))}
            {loading && <p className="py-6 text-center text-neutral-600">{t('common.loading', 'Loading...')}</p>}
            {!loading && !offers.length && (
              <p className="py-6 text-center text-neutral-600">{portal ? t('portal.offers.empty', 'No offers yet.') : notSet()}</p>
            )}
          </div>

          {/* Pagination */}
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      </div>

      <ConfirmActionDialog
        open={response !== null}
        title={
          response?.action === 'reject'
            ? t('cab.offersPage.respond.rejectTitle', 'Reject offer {{number}}?', { number: response.offer.offerNumber })
            : t('cab.offersPage.respond.acceptTitle', 'Accept offer {{number}}?', { number: response?.offer.offerNumber ?? '' })
        }
        description={
          response?.action === 'reject'
            ? t('cab.offersPage.respond.rejectBody', 'The certification body is told that you rejected this offer.')
            : t('cab.offersPage.respond.acceptBody', 'Accepting confirms the quotation; the certification body then plans your audit and issues the advance invoice.')
        }
        confirmLabel={
          response?.action === 'reject'
            ? t('cab.offersPage.actions.reject', 'Reject offer')
            : t('cab.offersPage.actions.accept', 'Accept offer')
        }
        destructive={response?.action === 'reject'}
        reason={{ label: t('cab.offersPage.respond.note', 'Note to the certification body (optional)') }}
        onClose={() => setResponse(null)}
        onConfirm={submitResponse}
      />

      <OfferDetailDrawer offer={selectedOffer} portal={portal} onClose={closeOffer} onChanged={() => void loadOffers()} />

      <WorkflowDialog
        open={voiding !== null}
        title={t('cab.offersPage.actions.voidOffer', 'Void offer')}
        description={t('cab.offerDetail.confirm.void', 'Void this offer? It can no longer be issued or accepted.')}
        confirmLabel={t('cab.offersPage.actions.voidOffer', 'Void offer')}
        tone="destructive"
        busy={voidBusy}
        error={voidError}
        onConfirm={() => void confirmVoid()}
        onClose={() => {
          setVoiding(null)
          setVoidError(null)
        }}
      />
    </CabOrPortalLayout>
  )
}
