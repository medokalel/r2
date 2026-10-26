import { useEffect, useState } from 'react'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { HeaderActions } from '@/components/dashboard/cab/CabHeader'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import {
  AppIcon,
  BuildingsIcon,
  CertificateBadgeIcon,
  DocumentTextOutlineIcon,
  DownloadIcon,
  ExternalLinkArrowIcon,
  FileTextIcon,
  GlobeIcon,
  MailIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationPicker } from '@/components/dashboard/cab/ApplicationPicker'
import {
  getCabApplicationReceipt,
  type CabApplicationReceipt,
} from '@/lib/api/cabApplicationReceiptApi'
import { useCabSidebar } from '@/context/cabSidebar/useCabSidebar'
import {
  ROUTES,
  cabApplicationInformationRequiredPath,
  cabApplicationReceiptPath,
  cabApplicationReviewPath,
  cabApplicationTechnicalFeasibilityPath,
} from '@/lib/routes'
import { ActionMenu } from '@/components/dashboard/cab/workflow/ActionMenu'
import { WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { listAcknowledgements, resendAcknowledgement, type ApplicationAcknowledgement } from '@/lib/api/cabApplicationReceiptApi'
import { downloadReceiptPdf, printReceiptPdf } from '@/lib/pdf/receiptPdf'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { cn } from '@/lib/utils'
import { useFitScale } from '@/lib/useFitScale'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { markTourPending } from '@/context/tour/tourStorage'
import { useApplicationReceiptTourSteps } from '@/config/applicationReceiptTourSteps'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'

const cardClassName = 'rounded-lg border border-neutral-100 bg-white'

function StatusBadge({
  label,
  variant,
  className,
}: {
  label: string
  variant: 'received' | 'inProgress' | 'pending' | 'completed'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold leading-none',
        variant === 'received' && 'bg-success-50 text-success-500',
        variant === 'inProgress' && 'bg-primary-50 text-primary',
        variant === 'pending' && 'bg-neutral-50 text-neutral-700',
        variant === 'completed' && 'bg-success-50 text-success-500',
        className
      )}
    >
      {label}
    </span>
  )
}

function ClientSummaryRowField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-x-2 sm:gap-x-3">
      <span className="w-[96px] shrink-0 text-caption font-bold leading-snug text-slate-400 sm:w-[112px]">
        {label}
      </span>
      <div className="min-w-0 break-words text-caption font-bold leading-snug text-neutral-800">{value}</div>
    </div>
  )
}

function ClientSummaryStackField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-caption font-bold leading-tight text-slate-400">{label}</span>
      <div className="text-caption font-bold leading-snug text-neutral-800">{value}</div>
    </div>
  )
}

function DetailField({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  variant?: 'default' | 'applicationDetails'
}) {
  const isApplicationDetails = variant === 'applicationDetails'

  if (isApplicationDetails && icon) {
    return (
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
        <div className="min-w-0">
          <span className="text-caption font-bold text-slate-400">{label}</span>
          <div className="mt-1.5 text-body-sm font-bold leading-snug text-neutral-800">{value}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', isApplicationDetails ? 'gap-1.5' : 'gap-1')}>
      <span
        className={cn(
          isApplicationDetails ? 'text-caption font-bold text-slate-400' : 'text-caption font-normal text-neutral-500'
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          'text-neutral-800',
          isApplicationDetails ? 'text-body-sm font-bold leading-snug' : 'text-body-sm font-semibold'
        )}
      >
        {value}
      </div>
    </div>
  )
}

function SummaryMetaItem({
  icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  iconClassName?: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className={cn('mt-0.5 shrink-0 text-primary', iconClassName)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-caption font-bold leading-none text-neutral-700">{label}</p>
        <div className="mt-1 break-words text-body-sm font-semibold leading-snug text-neutral-800">{value}</div>
      </div>
    </div>
  )
}

function PrimaryStandardsTags({ standards }: { standards: string[] }) {
  const { expanded } = useCabSidebar()

  return (
    <div
      className={cn(
        'flex min-w-0 max-w-full items-center gap-1.5',
        expanded ? 'flex-wrap' : 'flex-nowrap'
      )}
    >
      {standards.map((standard) => (
        <span
          key={standard}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-sm bg-primary-25 font-semibold text-primary',
            expanded ? 'px-2 py-1 text-caption' : 'shrink-0 px-1.5 py-1 text-overline'
          )}
        >
          {standard}
        </span>
      ))}
    </div>
  )
}

function ReceiptSummaryCard({ receipt }: { receipt: CabApplicationReceipt }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-3 sm:p-5')}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary">
          <ReceiptDocIcon />
        </span>
        <span className="text-body-lg font-bold leading-none text-neutral-800 sm:text-body-lg">
          {receipt.applicationId}
        </span>
        <StatusBadge
          label={t('cab.applications.receipt.status.received')}
          variant="received"
        />
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-5">
        <SummaryMetaItem
          icon={<UsersOutlineIcon />}
          label={t('cab.applications.receipt.summary.client')}
          value={receipt.clientName}
        />
        <SummaryMetaItem
          icon={<ClipboardOutlineIcon />}
          label={t('cab.applications.receipt.summary.applicationType')}
          value={receipt.applicationType}
        />
        <SummaryMetaItem
          icon={<GearOutlineIcon />}
          label={t('cab.applications.receipt.summary.certificationBody')}
          value={receipt.certificationBody}
        />
        <SummaryMetaItem
          iconClassName="mt-1.5"
          icon={
            <span className="flex size-7 items-center justify-center rounded-full bg-violet-600 text-overline font-bold text-white">
              {receipt.receivedByInitials}
            </span>
          }
          label={t('cab.applications.receipt.summary.receivedBy')}
          value={receipt.receivedBy}
        />
        <SummaryMetaItem
          icon={<CalendarOutlineIcon />}
          label={t('cab.applications.receipt.summary.receivedOn')}
          value={
            <>
              <span className="block font-bold">{receipt.receivedOnDate}</span>
              <span className="block text-caption font-semibold text-neutral-800">
                {receipt.receivedOnTime}
              </span>
            </>
          }
        />
      </div>
    </section>
  )
}

export function CabApplicationReceiptPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const scale = useFitScale()
  const { applicationId } = useParams()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId') ?? undefined
  const [receipt, setReceipt] = useState<CabApplicationReceipt | null>(null)
  const [loading, setLoading] = useState(Boolean(applicationId))

  const tourSteps = useApplicationReceiptTourSteps()
  const [pdfBusy, setPdfBusy] = useState(false)
  const [ackOpen, setAckOpen] = useState(false)
  const [ackBusy, setAckBusy] = useState(false)
  const [ackError, setAckError] = useState<string | null>(null)
  const [acks, setAcks] = useState<ApplicationAcknowledgement[]>([])
  const [scopeOpen, setScopeOpen] = useState(false)

  // Reset in the render where the requested application changes; the effect
  // below only sets state once the receipt arrives.
  const requestChanged = useValuesChanged([applicationId, clientId])
  if (requestChanged) {
    if (applicationId) {
      setLoading(true)
    } else {
      setReceipt(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!applicationId) return
    let cancelled = false
    getCabApplicationReceipt(applicationId, clientId).then((data) => {
      if (!cancelled) {
        setReceipt(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [applicationId, clientId])

  if (!applicationId) {
    return (
      <CabLayout>
        <CabHeader title={t('cab.applications.receipt.title')} notificationCount={2} />
        <div className="flex flex-1 flex-col gap-5 overflow-auto page-main">
          <ApplicationPicker
            title={t('cab.applications.receipt.selectApplication')}
            hint={t('cab.applications.receipt.selectApplicationHint')}
            actionLabel={t('cab.applications.receipt.openSelected')}
            allowedStatuses={['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']}
            onSelect={(application) =>
              navigate(cabApplicationReceiptPath(application.id, application.clientId || undefined))
            }
          />
        </div>
      </CabLayout>
    )
  }

  const withPdf = async (make: () => Promise<void>) => {
    setPdfBusy(true)
    try {
      await make()
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    } finally {
      setPdfBusy(false)
    }
  }

  const openAcknowledgement = () => {
    setAckError(null)
    setAckOpen(true)
    if (applicationId) listAcknowledgements(applicationId).then(setAcks).catch(() => setAcks([]))
  }

  const sendAcknowledgement = async () => {
    if (!applicationId || !receipt) return
    setAckBusy(true)
    setAckError(null)
    try {
      const sent = await resendAcknowledgement(applicationId, receipt.confirmationEmails)
      toast.success(t('cab.applications.receipt.ack.sent', { defaultValue: 'Acknowledgement sent to {{emails}}.', emails: sent.recipients.join(', ') }))
      setAckOpen(false)
    } catch (err) {
      setAckError(workflowErrorMessage(err, t))
    } finally {
      setAckBusy(false)
    }
  }

  if (loading || !receipt) {
    return (
      <CabLayout className="bg-white">
        <div className="flex flex-1 items-center justify-center p-6 text-body-sm text-neutral-600">
          {t('common.loading')}
        </div>
      </CabLayout>
    )
  }

  return (
    <CabLayout
      className="bg-white"
      tourId="cab-application-receipt"
      tourSteps={tourSteps}
      onTourComplete={() => {
        markTourPending('cab-application-review')
        navigate(cabApplicationReviewPath(applicationId ?? receipt.applicationId, clientId))
      }}
    >
        <DashboardTourStep steps={tourSteps} stepId="header">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-white px-3 py-3 sm:gap-4 sm:px-5">
            <Breadcrumbs
              items={[
                { label: t('cab.applications.receipt.breadcrumb.home'), to: ROUTES.workspace },
                { label: t('cab.applications.receipt.breadcrumb.applications'), to: ROUTES.cabApplicationRegister },
                { label: String(receipt.applicationId ?? ''), to: `${ROUTES.cabApplicationRegister}?q=${encodeURIComponent(String(receipt.applicationId ?? ''))}` },
                { label: t('cab.applications.receipt.breadcrumb.current') },
              ]}
            />

            <HeaderActions />
          </header>
        </DashboardTourStep>

      <div className="flex min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white">
          <div className="flex min-w-0 flex-col gap-4 p-3 sm:gap-5 sm:p-5 lg:p-6">
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5" style={{ zoom: scale }}>
            <DashboardTourStep steps={tourSteps} stepId="page-header">
              <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-section-title text-text-primary">
                      {t('cab.applications.receipt.title')}
                    </h1>
                    <StatusBadge
                      label={t('cab.applications.receipt.status.received')}
                      variant="received"
                    />
                  </div>
                  <p className="mt-1 text-body-sm text-neutral-500">
                    {t('cab.applications.receipt.subtitle')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pdfBusy}
                    onClick={() => void withPdf(() => downloadReceiptPdf(receipt, t, i18n.language))}
                    className="h-9 gap-1.5 rounded-md border-neutral-100 px-3 text-caption font-medium text-neutral-800"
                  >
                    <AppIcon icon={DownloadIcon} size={16} />
                    {t('cab.applications.receipt.actions.downloadReceipt')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pdfBusy}
                    onClick={() => void withPdf(() => printReceiptPdf(receipt, t, i18n.language))}
                    className="h-9 gap-1.5 rounded-md border-neutral-100 px-3 text-caption font-medium text-neutral-800"
                  >
                    <PrintIcon />
                    {t('cab.applications.receipt.actions.printReceipt')}
                  </Button>
                  <ActionMenu
                    label={t('cab.applications.receipt.actions.moreActions')}
                    triggerClassName="h-9 text-caption"
                    items={[
                      {
                        key: 'ack',
                        label: t('cab.applications.receipt.ack.resend', 'Resend acknowledgement e-mail'),
                        onSelect: openAcknowledgement,
                      },
                      {
                        key: 'review',
                        label: t('cab.applications.receipt.ack.viewApplication', 'View application'),
                        onSelect: () => navigate(cabApplicationReviewPath(applicationId, clientId)),
                      },
                      {
                        key: 'information',
                        label: t('cab.applications.receipt.ack.requestInformation', 'Request information'),
                        onSelect: () => navigate(cabApplicationInformationRequiredPath(applicationId, clientId)),
                      },
                      {
                        key: 'feasibility',
                        label: t('cab.applications.receipt.ack.feasibility', 'Technical feasibility'),
                        onSelect: () => navigate(cabApplicationTechnicalFeasibilityPath(applicationId, clientId)),
                      },
                    ]}
                  />
                </div>
              </div>
            </DashboardTourStep>

            <DashboardTourStep steps={tourSteps} stepId="receipt-summary">
              <ReceiptSummaryCard receipt={receipt} />
            </DashboardTourStep>

            <div className="flex items-start gap-3 rounded-md bg-success-50 px-5 py-4">
              <SuccessAlertCheckIcon />
              <div className="min-w-0">
                <p className="text-body-sm font-bold leading-snug text-neutral-800">
                  {t('cab.applications.receipt.successTitle')}
                </p>
                <p className="mt-0.5 text-body-sm font-normal leading-snug text-neutral-700">
                  {t('cab.applications.receipt.successDescription')}
                </p>
              </div>
            </div>

            <DashboardTourStep steps={tourSteps} stepId="application-details">
              <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-3 sm:p-5')}>
                <h2 className="mb-5 text-body font-bold text-neutral-800">
                  {t('cab.applications.receipt.sections.applicationDetails')}
                </h2>
                <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)] lg:gap-0">
                  <div className="flex min-w-0 max-w-full flex-col gap-5 overflow-hidden lg:pe-4 xl:pe-8">
                    <DetailField
                      variant="applicationDetails"
                      icon={<ClipboardOutlineIcon />}
                      label={t('cab.applications.receipt.fields.applicationType')}
                      value={receipt.applicationType}
                    />
                    <div className="flex min-w-0 max-w-full items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 text-primary">
                        <AppIcon icon={DocumentTextOutlineIcon} size={18} />
                      </span>
                      <div className="flex min-w-0 max-w-full flex-col gap-1.5">
                        <span className="text-caption font-bold text-slate-400">
                          {t('cab.applications.receipt.fields.primaryStandard')}
                        </span>
                        <div className="mt-1.5">
                          <PrimaryStandardsTags standards={receipt.primaryStandards} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <DetailField
                        variant="applicationDetails"
                        icon={<CalendarOutlineIcon />}
                        label={t('cab.applications.receipt.fields.requestedCertificationDate')}
                        value={receipt.requestedCertificationDate}
                      />
                      <DetailField
                        variant="applicationDetails"
                        icon={<AppIcon icon={BuildingsIcon} size={18} />}
                        label={t('cab.applications.receipt.fields.numberOfSites')}
                        value={receipt.numberOfSites}
                      />
                    </div>
                  </div>

                  <div className="hidden bg-neutral-100 lg:block" aria-hidden />

                  <div className="flex min-w-0 flex-col gap-5 lg:px-4 xl:px-8">
                    <DetailField
                      variant="applicationDetails"
                      icon={<GearOutlineIcon />}
                      label={t('cab.applications.receipt.fields.certificationBody')}
                      value={receipt.certificationBody}
                    />
                    <DetailField
                      variant="applicationDetails"
                      icon={<AppIcon icon={CertificateBadgeIcon} size={18} />}
                      label={t('cab.applications.receipt.fields.accreditationBody')}
                      value={receipt.accreditationBody}
                    />
                    <DetailField
                      variant="applicationDetails"
                      icon={<AppIcon icon={GlobeIcon} size={18} />}
                      label={t('cab.applications.receipt.fields.auditLanguage')}
                      value={receipt.auditLanguage}
                    />
                  </div>

                  <div className="hidden bg-neutral-100 lg:block" aria-hidden />

                  <div className="flex min-w-0 flex-col gap-5 lg:ps-4 xl:ps-8">
                    <DetailField
                      variant="applicationDetails"
                      icon={<CalendarOutlineIcon />}
                      label={t('cab.applications.receipt.fields.applicationDate')}
                      value={receipt.applicationDate}
                    />
                    <DetailField
                      variant="applicationDetails"
                      icon={<CalendarOutlineIcon />}
                      label={t('cab.applications.receipt.fields.applicationReceivedDate')}
                      value={receipt.applicationReceivedDate}
                    />
                    <DetailField
                      variant="applicationDetails"
                      icon={<AppIcon icon={FileTextIcon} size={18} />}
                      label={t('cab.applications.receipt.fields.referenceNo')}
                      value={receipt.referenceNo}
                    />
                  </div>
                </div>
              </section>
            </DashboardTourStep>

            <DashboardTourStep steps={tourSteps} stepId="client-summary">
              <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
                <section className={cn(cardClassName, 'min-w-0 p-4')}>
                  <h2 className="mb-3 text-body font-bold text-neutral-800">
                    {t('cab.applications.receipt.sections.clientSummary')}
                  </h2>

                  <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:gap-0">
                    <div className="min-w-0 md:pe-5">
                      <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white">
                          <AppIcon icon={BuildingsIcon} size={26} className="text-primary" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-body font-semibold text-neutral-900">{receipt.client.name}</p>
                          <span className="inline-flex items-center rounded-sm bg-success-25 px-2 py-0.5 text-caption font-medium text-success-600">
                            {t('cab.applications.receipt.client.registeredClient')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-2.5">
                        <ClientSummaryRowField
                          label={t('cab.applications.receipt.client.clientId')}
                          value={receipt.client.clientId}
                        />
                        <ClientSummaryRowField
                          label={t('cab.applications.receipt.client.organizationType')}
                          value={receipt.client.organizationType}
                        />
                        <ClientSummaryRowField
                          label={t('cab.applications.receipt.client.country')}
                          value={
                            <span className="inline-flex items-center gap-1.5">
                              <img
                                src={`https://flagcdn.com/w40/${receipt.client.countryCode.toLowerCase()}.png`}
                                alt=""
                                className="h-3.5 w-[21px] shrink-0 rounded-xs object-cover"
                                aria-hidden
                              />
                              {displayCountry(receipt.client.country)}
                            </span>
                          }
                        />
                      </div>
                    </div>

                    <div className="hidden bg-neutral-100 md:block" aria-hidden />

                    <div className="flex min-w-0 flex-col gap-3.5 md:ps-5">
                      <ClientSummaryStackField
                        label={t('cab.applications.receipt.client.legalEntityName')}
                        value={receipt.client.legalEntityName}
                      />
                      <ClientSummaryStackField
                        label={t('cab.applications.receipt.client.registrationLicenseNo')}
                        value={receipt.client.registrationLicenseNo}
                      />
                      <ClientSummaryStackField
                        label={t('cab.applications.receipt.client.industry')}
                        value={receipt.client.industry}
                      />
                    </div>
                  </div>
                </section>

                <section className={cn(cardClassName, 'flex h-full min-w-0 flex-col p-5')}>
                  <h2 className="mb-3 text-body font-bold text-neutral-900">
                    {t('cab.applications.receipt.sections.scopeOfCertification')}
                  </h2>
                  <p className="text-caption font-normal leading-[1.5] text-neutral-800">
                    {receipt.scopeSummary}
                  </p>
                  <button
                    type="button"
                    onClick={() => setScopeOpen(true)}
                    className="mt-5 inline-flex items-center gap-1.5 self-start rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-caption font-medium text-primary transition-colors hover:bg-neutral-25"
                  >
                    {t('cab.applications.receipt.actions.viewFullScope')}
                    <AppIcon icon={ExternalLinkArrowIcon} size={12} className="text-primary" />
                  </button>
                </section>
              </div>
            </DashboardTourStep>

            <DashboardTourStep steps={tourSteps} stepId="documents-summary">
              <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex min-w-0 items-start gap-3 rounded-md border border-primary-200 bg-primary-50 px-4 py-3">
                    <AppIcon icon={MailIcon} size={18} className="mt-0.5 shrink-0 text-primary" />
                    <p className="min-w-0 text-caption font-medium leading-snug text-primary sm:text-body-sm">
                      {t('cab.applications.receipt.emailConfirmation', {
                        email1: receipt.confirmationEmails[0],
                        email2: receipt.confirmationEmails[1],
                      })}
                    </p>
                  </div>
                </div>

                <DocumentsSummaryCard receipt={receipt} onViewAll={() => navigate(cabApplicationReviewPath(applicationId, clientId))} />
              </div>
            </DashboardTourStep>
            </div>

            <div className="hidden min-h-0 xl:flex xl:h-full xl:flex-col xl:w-[340px] xl:shrink-0">
              <ReceiptSidebarPanels receipt={receipt} />
            </div>
            <div className="xl:hidden">
              <ReceiptSidebarPanels receipt={receipt} />
            </div>
          </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-white px-3 py-3 sm:px-6">
            <p className="text-caption text-neutral-500">
              {t('cab.applications.receipt.footer.copyright')}
            </p>
            <div className="flex items-center gap-4 text-caption">
              <Link to={ROUTES.privacyPolicy} className="text-primary hover:underline">
                {t('cab.applications.receipt.footer.privacyPolicy')}
              </Link>
              <span className="text-neutral-500">{t('cab.applications.receipt.footer.termsOfUse')}</span>
            </div>
          </footer>
        </div>
      </div>

      <WorkflowDialog
        open={ackOpen}
        title={t('cab.applications.receipt.ack.resend', 'Resend acknowledgement e-mail')}
        description={
          receipt.confirmationEmails.length
            ? t('cab.applications.receipt.ack.confirm', {
                defaultValue: 'The acknowledgement of application {{ref}} is e-mailed again to {{emails}}.',
                ref: receipt.applicationId,
                emails: receipt.confirmationEmails.join(', '),
              })
            : t('cab.applications.receipt.ack.noEmail', 'The client has no e-mail address on file.')
        }
        confirmLabel={t('cab.applications.receipt.ack.send', 'Send e-mail')}
        confirmDisabled={!receipt.confirmationEmails.length}
        busy={ackBusy}
        error={ackError}
        onConfirm={() => void sendAcknowledgement()}
        onClose={() => setAckOpen(false)}
      >
        {acks.length > 0 && (
          <div>
            <p className="mb-1 text-caption font-semibold text-neutral-600">{t('cab.applications.receipt.ack.history', 'Sent before')}</p>
            <ul className="space-y-1 text-caption text-neutral-700">
              {acks.map((a) => (
                <li key={a.id}>
                  {new Date(a.sentAt).toLocaleString(i18n.language)} · {a.sentBy} · <span dir="ltr">{a.recipients.join(', ')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </WorkflowDialog>

      <WorkflowDialog
        open={scopeOpen}
        title={t('cab.applications.receipt.sections.scopeOfCertification')}
        description={<p className="whitespace-pre-line">{receipt.scopeSummary || notSet()}</p>}
        confirmLabel={t('common.close', 'Close')}
        onConfirm={() => setScopeOpen(false)}
        onClose={() => setScopeOpen(false)}
      />
    </CabLayout>
  )
}


function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9V2H18V9M6 18H4C3.45 18 3 17.55 3 17V11C3 10.45 3.45 10 4 10H20C20.55 10 21 10.45 21 11V17C21 17.55 20.55 18 20 18H18M6 14H18V22H6V14Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReceiptSidebarPanels({ receipt }: { receipt: CabApplicationReceipt }) {
  const { t } = useTranslation()

  return (
    <WorkflowProgressCard
      steps={receipt.workflowSteps.map((step) => ({
        key: step.key,
        status: step.status,
        label: t(`cab.applications.receipt.workflowSteps.${step.key}`),
        description: t(`cab.applications.receipt.workflowStepDescriptions.${step.key}`),
      }))}
      title={t('cab.applications.receipt.sections.workflowProgress')}
      viewFullLabel={t('cab.applications.receipt.actions.viewFullWorkflow')}
      statusLabels={{
        completed: t('cab.applications.receipt.workflow.completed'),
        inProgress: t('cab.applications.receipt.workflow.inProgress'),
        pending: t('cab.applications.receipt.workflow.pending'),
      }}
    />
  )
}

function DocumentsSummaryCard({ receipt, onViewAll }: { receipt: CabApplicationReceipt; onViewAll: () => void }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'flex h-full min-w-0 flex-col p-4 shadow-sm')}>
      <h2 className="mb-4 text-body-sm font-bold text-neutral-800">
        {t('cab.applications.receipt.sections.documentsSummary')}
      </h2>
      <div className="flex flex-1 flex-col gap-3.5">
        <DocumentRow
          label={t('cab.applications.receipt.documents.total')}
          value={receipt.documents.total}
          icon="total"
        />
        <DocumentRow
          label={t('cab.applications.receipt.documents.uploaded')}
          value={receipt.documents.uploaded}
          icon="uploaded"
        />
        <DocumentRow
          label={t('cab.applications.receipt.documents.pending')}
          value={receipt.documents.pending}
          icon="pending"
        />
        <DocumentRow
          label={t('cab.applications.receipt.documents.rejected')}
          value={receipt.documents.rejected}
          icon="rejected"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onViewAll}
        className="mt-4 h-9 w-full gap-1.5 rounded-md border-primary text-caption font-semibold text-primary"
      >
        <AppIcon icon={FileTextIcon} size={14} className="text-primary" />
        {t('cab.applications.receipt.actions.viewAllDocuments')}
      </Button>
    </section>
  )
}

function SuccessAlertCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#22c55e" />
      <path
        d="M6 10.5L8.5 13L14 7.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReceiptDocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6C5.45 2 5 2.45 5 3V21C5 21.55 5.45 22 6 22H18C18.55 22 19 21.55 19 21V8L14 2Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H19" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13H15M9 17H13" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  )
}

function UsersOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21V19C17 17.34 15.66 16 14 16H6C4.34 16 3 17.34 3 19V21M13 7C13 9.21 11.21 11 9 11C6.79 11 5 9.21 5 7C5 4.79 6.79 3 9 3C11.21 3 13 4.79 13 7ZM23 21V19C22.99 17.64 22.12 16.43 20.8 16.04M16 3.13C17.44 3.5 18.5 4.78 18.5 6.3C18.5 7.82 17.44 9.1 16 9.47"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClipboardOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H15M9 5C9 6.1 9.9 7 11 7H13C14.1 7 15 6.1 15 5M9 5C9 3.9 9.9 3 11 3H13C14.1 3 15 3.9 15 5M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GearOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01131 9.77251C4.28062 9.5799 4.48568 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 2V5M16 2V5M3 9H21M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DocumentRow({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: 'total' | 'uploaded' | 'pending' | 'rejected'
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-body-sm font-medium text-neutral-700">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="min-w-[1ch] text-end text-body-sm font-bold text-neutral-800">{value}</span>
        {icon !== 'total' ? (
          <span
            className={cn(
              'flex size-5 items-center justify-center rounded-full text-overline font-bold',
              icon === 'uploaded' && 'bg-success-50 text-success-500',
              icon === 'pending' && 'bg-warning-50 text-warning-700',
              icon === 'rejected' && 'bg-error-50 text-error-500'
            )}
            aria-hidden
          >
            {icon === 'uploaded' ? '✓' : icon === 'rejected' ? '✕' : '◷'}
          </span>
        ) : (
          <span className="size-5 shrink-0" aria-hidden />
        )}
      </div>
    </div>
  )
}
