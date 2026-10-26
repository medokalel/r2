import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { InteractiveInvoiceModal } from '@/components/dashboard/InteractiveInvoiceModal'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { ErrorState } from '@/components/ui'
import { RequestCardsSkeleton } from '@/components/dashboard/entityData/ApplicationLoadingSkeleton'
import { AddCircle } from 'iconsax-reactjs'
import { AppIcon, ReceiptIcon } from '@/components/icons'
import { useCertificationRequestsTourSteps } from '@/config/auditeeTourSteps'
import { TourProvider } from '@/context/tour/TourProvider'
import { ApiError } from '@/lib/api/client'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import {
  listApplications,
  type ApplicationResponse,
  type ApplicationStatus,
} from '@/lib/api/certificationApplicationApi'
import { clearAuthSession } from '@/lib/authStorage'
import { isPortalPath } from '@/lib/portalNav'
import { certificationRequestFormPath, ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

type RequestStatus = 'underConstruction' | 'underReview' | 'closedByDirector' | 'issued'

interface CertificationRequest {
  id: string
  orderNumber: string
  authorizedPerson: string
  status: RequestStatus
}

const API_STATUS_TO_UI: Record<ApplicationStatus, RequestStatus> = {
  DRAFT: 'underConstruction',
  SUBMITTED: 'underReview',
  UNDER_REVIEW: 'underReview',
  APPROVED: 'issued',
  REJECTED: 'closedByDirector',
  QUOTATION_CREATED: 'underReview',
  QUOTATION_ISSUED: 'underReview',
  QUOTATION_ACCEPTED: 'underReview',
  QUOTATION_REJECTED: 'underReview',
}

const statusConfig: Record<
  RequestStatus,
  { bgColor: string; borderColor: string; textColor: string }
> = {
  underConstruction: {
    bgColor: 'bg-warning-50',
    borderColor: 'border-[#fee685]',
    textColor: 'text-warning-700',
  },
  underReview: {
    bgColor: 'bg-primary-50',
    borderColor: 'border-[#c395ff]',
    textColor: 'text-violet-600',
  },
  closedByDirector: {
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-100',
    textColor: 'text-primary-hover',
  },
  issued: {
    bgColor: 'bg-success-100',
    borderColor: 'border-success-200',
    textColor: 'text-success-700',
  },
}

function StatusIcon({ status }: { status: RequestStatus }) {
  if (status === 'underConstruction') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12.709 17.2789L17.1929 12.719C17.5825 12.3229 18.2202 12.3202 18.6131 12.7131L19.7929 13.8929C20.1834 14.2834 20.1834 14.9166 19.7929 15.3071L15.2934 19.8066C14.9082 20.1917 14.2857 20.1978 13.8931 19.8203L12.7289 18.7009C12.3277 18.315 12.3187 17.6758 12.709 17.2789Z" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11.2988 9.55078C12.2653 9.55078 13.0488 10.3343 13.0488 11.3008C13.0488 12.2673 12.2653 13.0508 11.2988 13.0508C10.3323 13.0508 9.54883 12.2673 9.54883 11.3008C9.54883 10.3343 10.3323 9.55078 11.2988 9.55078Z" stroke="#989898" strokeWidth="1.5"/>
        <path d="M16.8992 12.5004L16.0992 8.20039L15.9395 7.45499C15.8546 7.05888 15.5391 6.75311 15.1406 6.68064L14.6992 6.6004L5.09922 4.00039L4.89854 3.9335C4.83276 3.91157 4.76388 3.90039 4.69454 3.90039C4.56718 3.90039 4.44268 3.93809 4.33671 4.00874L4.19922 4.1004" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12.4491 16.9513L8.14913 16.1513L7.40372 15.9916C7.00761 15.9067 6.70185 15.5913 6.62938 15.1927L6.54913 14.7514L3.94913 5.05135C3.86983 4.78147 3.91211 4.49044 4.06493 4.25429L4.09931 4.20117" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9.89844 9.90039L4.39844 4.40039" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  if (status === 'underReview') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11.0996" cy="11.1992" r="6.75" stroke="#989898" strokeWidth="1.5"/>
        <path d="M15.9004 16.0996L19.6004 19.6996" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  if (status === 'closedByDirector') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5.55078" y="11.3496" width="13" height="8" rx="1.45" stroke="#989898" strokeWidth="1.5"/>
        <path d="M8.40039 10.4992V8.34922C8.40039 6.33338 10.0346 4.69922 12.0504 4.69922C14.0662 4.69922 15.7004 6.33338 15.7004 8.34922V10.4992" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
  // issued
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8.40039 20.2L10.8004 18.4L11.5204 17.86C11.8048 17.6467 12.1959 17.6467 12.4804 17.86L13.2004 18.4L15.6004 20.2" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="8.69922" r="4.75" stroke="#989898" strokeWidth="1.5"/>
      <path d="M9.19591 12.8984L7.99069 19.5966C7.94054 19.8753 8.12269 20.1429 8.40039 20.1984" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14.8945 13L16.0696 19.8547C16.131 20.213 15.6167 20.344 15.4992 20" stroke="#989898" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

interface RequestCardProps {
  request: CertificationRequest
  onFollowUp: () => void
  onOrderStatus: () => void
}

function RequestCard({ request, onFollowUp, onOrderStatus }: RequestCardProps) {
  const { t } = useTranslation()
  const { bgColor, borderColor, textColor } = statusConfig[request.status]

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-lg border border-primary-100 bg-[rgba(243,246,253,0.5)] px-5 py-6">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex h-10 items-center justify-center rounded-md border px-3 py-1 text-caption font-medium leading-[1.6]',
            bgColor,
            borderColor,
            textColor
          )}
        >
          {t(`certificationRequests.status.${request.status}`)}
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-white shadow-card">
          <StatusIcon status={request.status} />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-body-sm leading-[1.6] text-neutral-700">
          {t('certificationRequests.card.orderNumber')}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-body-lg font-medium leading-[1.6] text-text-primary">
          {request.orderNumber}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-primary-100 pt-4 pb-2">
        <div className="flex flex-col items-center">
          <p className="text-body-sm leading-[1.6] text-neutral-700">
            {t('certificationRequests.card.authorizedPerson')}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-body-lg font-medium leading-[1.6] tracking-[-0.6px] text-text-primary">
            {request.authorizedPerson}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onFollowUp}
        className={cn(buttonVariants({ variant: 'primary', size: 'default' }), 'w-full justify-center')}
      >
        {t('certificationRequests.card.followUp')}
      </button>
      <button
        type="button"
        onClick={onOrderStatus}
        className="flex h-12 w-full items-center justify-center rounded-md bg-primary-50 text-body leading-[1.6] text-primary transition-colors hover:bg-primary-100"
      >
        {t('certificationRequests.card.orderStatus')}
      </button>
    </div>
  )
}

export function CertificationRequestsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const tourSteps = useCertificationRequestsTourSteps()
  const [requests, setRequests] = useState<CertificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  // The interactive invoice holds preview line items only; with real data the client's
  // invoices page (issued CAB invoices) is shown instead.
  // Inside the portal the invoices live at /portal/invoices; the legacy page keeps /invoices.
  const invoicesPath = isPortalPath(location.pathname) ? ROUTES.portalInvoices : ROUTES.invoices
  const openInvoice = () => (isDemoMode() ? setIsInvoiceOpen(true) : navigate(invoicesPath))

  // Reset the request flags in the render where a (re)load is triggered; the
  // effect below only sets state from its async callback.
  const requestInputsChanged = useValuesChanged([navigate, reloadKey, t])
  if (requestInputsChanged) {
    setLoading(true)
    setHasError(false)
    setIsRateLimited(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const applications = await listApplications()
        if (cancelled) return
        setRequests(
          applications.map((app: ApplicationResponse) => ({
            id: app.id,
            orderNumber: app.orderNumber ?? t('certificationRequests.card.draftOrderNumber'),
            authorizedPerson:
              app.legalInfo?.representativeName ||
              app.legalInfo?.organizationName ||
              notSet(),
            status: API_STATUS_TO_UI[app.status] ?? 'underConstruction',
          }))
        )
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearAuthSession()
          navigate('/login', { replace: true })
          return
        }
        setIsRateLimited(err instanceof ApiError && err.status === 429)
        setHasError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, reloadKey, t])

  return (
    <TourProvider tourId="auditee-certification-requests" steps={tourSteps}>
      <AppLayout>
        <DashboardTourStep steps={tourSteps} stepId="requests-header">
          <AccreditationHeader titleKey="certificationRequests.title" />
        </DashboardTourStep>
        <div className="mt-4 flex flex-1 flex-col overflow-auto min-[924px]:mt-0">

          {/* Action buttons */}
          <DashboardTourStep
            steps={tourSteps}
            stepId="new-request-actions"
            className="hidden md:block"
          >
            <div className="flex md:items-center md:gap-3 md:px-5 md:py-5 lg:justify-end lg:gap-5">
              <button
                type="button"
                onClick={() => navigate(ROUTES.certificationRequestNew)}
                className={cn(buttonVariants({ variant: 'primary', size: 'default' }), 'flex-1 justify-center lg:flex-none')}
              >
                <AddCircle size={24} color="white" variant="Linear" />
                {t('certificationRequests.newRequest')}
              </button>
              <button
                type="button"
                onClick={openInvoice}
                className={cn(buttonVariants({ variant: 'secondary', size: 'default' }), 'flex-1 justify-center lg:flex-none')}
              >
                {t('certificationRequests.interactiveInvoice')}
              </button>
            </div>
          </DashboardTourStep>

          {/* Mobile floating action buttons */}
          <div className="fixed end-4 top-1/3 z-20 flex flex-col gap-3 md:hidden">
            <button
              type="button"
              onClick={openInvoice}
              className="flex size-15 items-center justify-center rounded-full border-1 border-primary bg-white text-primary shadow-card"
              aria-label={t('certificationRequests.interactiveInvoice')}
            >
              <AppIcon icon={ReceiptIcon} size={26} />
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.certificationRequestNew)}
              className="flex size-15 items-center justify-center rounded-full bg-primary text-white shadow-lg"
              aria-label={t('certificationRequests.newRequest')}
            >
              <AddCircle size={26} color="white" variant="Linear" />
            </button>
          </div>

          {/* Cards grid */}
          <DashboardTourStep steps={tourSteps} stepId="requests-list" className="px-5 pb-8">
            {loading ? (
              <RequestCardsSkeleton />
            ) : hasError ? (
              <ErrorState
                variant={isRateLimited ? 'rateLimit' : 'generic'}
                title={isRateLimited ? t('errors.rateLimit.title') : undefined}
                description={isRateLimited ? t('errors.rateLimit.description') : undefined}
                onRetry={() => setReloadKey((key) => key + 1)}
              />
            ) : requests.length === 0 ? (
              <p className="py-10 text-center text-body text-neutral-700">
                {t('certificationRequests.empty')}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onFollowUp={() =>
                      navigate(certificationRequestFormPath(request.id, 'feedback'))
                    }
                    onOrderStatus={() =>
                      navigate(certificationRequestFormPath(request.id, 'status'))
                    }
                  />
                ))}
              </div>
            )}
          </DashboardTourStep>
        </div>
        {isDemoMode() ? <InteractiveInvoiceModal open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen} /> : null}
      </AppLayout>
    </TourProvider>
  )
}