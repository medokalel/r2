import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useClientDetailsTourSteps } from '@/config/clientDetailsTourSteps'
import { AppIcon, BuildingIcon } from '@/components/icons'
import { getCabClient, type CabClient } from '@/lib/api/clientRegistrationApi'
import { getCountryName } from '@/lib/countries'
import { ROUTES } from '@/lib/routes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-caption font-medium text-neutral-600">{label}</dt>
      <dd className="mt-1 break-words text-body font-semibold text-neutral-900">{children || notSet()}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-100 bg-white p-5">
      <h2 className="mb-5 text-body-lg font-semibold text-primary">{title}</h2>
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  )
}

export function CabClientDetailsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { clientId = '' } = useParams()
  const tourSteps = useClientDetailsTourSteps()
  const [client, setClient] = useState<CabClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getCabClient(clientId)
      .then((data) => {
        if (!cancelled) setClient(data)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getUserErrorMessage(loadError, t, { fallbackKey: 'cab.clientsPage.loadError' }))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, t])

  const registeredOnLabel = client?.createdAt
    ? new Intl.DateTimeFormat(i18n.language, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(client.createdAt))
    : ''

  return (
    <CabLayout sidebarVariant="clients" tourId="cab-client-details" tourSteps={tourSteps}>
      <CabHeader title={t('cab.clientDetails.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CabTourStep steps={tourSteps} stepId="client-details-header">
            <button type="button" onClick={() => navigate(ROUTES.cabAuditClients)} className="text-body-sm font-medium text-primary">
              {t('cab.clientDetails.backToClients')}
            </button>
          </CabTourStep>
          <CabTourStep steps={tourSteps} stepId="client-details-actions">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(`/cab/clients/${clientId}/profile`)}
                className="rounded-md border border-primary px-4 py-2.5 text-body-sm font-medium text-primary"
              >
                {t('cab.clientDetails.editClient')}
              </button>
              <button type="button" onClick={() => navigate('/cab/clients/new')} className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}>
                {t('cab.clientsPage.addClient')}
              </button>
            </div>
          </CabTourStep>
        </div>

        {loading && <div className="rounded-lg bg-white p-8 text-center text-neutral-600">{t('common.loading')}</div>}
        {error && <div role="alert" className="rounded-lg bg-white p-8 text-center text-error-500">{error}</div>}

        {client && (
          <>
            <CabTourStep steps={tourSteps} stepId="client-details-summary">
              <div className="rounded-lg border border-neutral-100 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                      {client.logoUrl ? (
                        <img src={client.logoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <AppIcon icon={BuildingIcon} size={24} className="text-neutral-500" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-page-title text-text-primary">{client.organizationName || notSet()}</h1>
                      <p className="text-body-sm text-neutral-600">{client.city || notSet()}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-caption font-medium text-primary">
                    {t(`cab.clientsPage.status.${client.status === 'COMPLETED' ? 'registered' : client.status.toLowerCase()}`)}
                  </span>
                </div>
              </div>
            </CabTourStep>

            <CabTourStep steps={tourSteps} stepId="client-details-info-section">
              <div>
                <Section title={t('cab.clientRegistration.sections.clientInformation')}>
                  <Detail label={t('cab.clientDetails.clientNo')}>{client.code}</Detail>
                  <Detail label={t('cab.clientDetails.registeredOn')}>{registeredOnLabel}</Detail>
                  <Detail label={t('cab.clientDetails.registeredBy')}>{client.registeredBy}</Detail>
                  <Detail label={t('cab.clientRegistration.fields.organizationName')}>{client.organizationName}</Detail>
                  <Detail label={t('cab.clientRegistration.fields.legalCapacity')}>{client.legalCapacity}</Detail>
                  <Detail label={t('cab.clientRegistration.fields.administrationName')}>{client.administrationName}</Detail>
                  <Detail label={t('cab.clientRegistration.fields.country')}>
                    {client.country ? getCountryName(client.country, i18n.language) : notSet()}
                  </Detail>
                  <Detail label={t('cab.clientRegistration.fields.city')}>{client.city}</Detail>
                  <Detail label={t('cab.clientRegistration.fields.activity')}>{client.activity}</Detail>
                  <Detail label={t('cab.clientRegistration.fields.facilityOwnerManager')}>{client.facilityOwnerManager}</Detail>
                  <Detail label={t('cab.clientRegistration.fields.email')}>
                    {client.email && (
                      <a className="text-primary" href={`mailto:${client.email}`}>
                        {client.email}
                      </a>
                    )}
                  </Detail>
                  <Detail label={t('cab.clientRegistration.fields.phoneNumber')}>
                    {[client.phoneCountryCode, client.phoneNumber].filter(Boolean).join(' ')}
                  </Detail>
                </Section>
              </div>
            </CabTourStep>
          </>
        )}
      </main>
    </CabLayout>
  )
}