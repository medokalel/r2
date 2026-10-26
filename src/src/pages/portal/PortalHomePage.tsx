import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePortalHomeTourSteps } from '@/config/portalHomeTourSteps'
import { PageHeaderWithAction } from '@/components/dashboard/PageHeaderWithAction'
import {
  AppIcon,
  CalendarIcon,
  FileTextIcon,
  EditIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
  UsersIcon,
  CorrectiveActionIcon,
  BuildingsIcon,
  ArrowRightIcon,
} from '@/components/icons'
import { getPortalProfile, getStoredPortalProfile, type ClientProfile } from '@/lib/api/portalApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

const cardClass = 'flex h-full flex-col justify-between space-y-4 rounded-lg border border-neutral-100 bg-white p-5 shadow-card'
const primaryBtn = 'flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-body-sm font-medium text-white transition-colors hover:bg-primary-hover'
const outlineBtn = 'flex h-10 w-full items-center justify-center rounded-md border border-primary bg-white text-body-sm font-medium text-primary transition-colors hover:bg-primary-50'
const ACTIVITY_PREVIEW = 5

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

/** Opens the portal page that holds a referenced record (invoice, certificate, offer, finding or application). */
function routeForReference(ref: string): string {
  if (/^INV/i.test(ref)) return ROUTES.portalInvoices
  if (/^(CAS|CERT)/i.test(ref)) return ROUTES.portalCertificates
  if (/^(OFR|OFF|QT)/i.test(ref)) return ROUTES.portalOffers
  if (/^(NC|FND)/i.test(ref)) return ROUTES.portalFindings
  if (/^(AUD|AP-)/i.test(ref)) return ROUTES.portalAudits
  return ROUTES.portalApplications
}

export function PortalHomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tourSteps = usePortalHomeTourSteps()
  const [profile, setProfile] = useState<ClientProfile>(getStoredPortalProfile)
  useEffect(() => {
    let active = true
    getPortalProfile()
      .then((p) => active && setProfile(p))
      // Keep the cached profile on screen and say why it may be out of date.
      .catch((error: unknown) => active && toast.error(getUserErrorMessage(error, t)))
    return () => {
      active = false
    }
  }, [t])
  const [showAllActivity, setShowAllActivity] = useState(false)
  const app = profile.activeApplication
  const clarification = profile.clarification?.required ? profile.clarification : undefined
  const audit = profile.upcomingAudit
  const docs = profile.documentsSummary

  return (
    <PortalLayout
      tourId="portal-home-tour"
      tourSteps={tourSteps}
      title={t('portal.title', 'Client Portal')}
      subtitle={t('portal.home.subtitle', 'Overview of your certification applications, audits, and documents')}
    >
      <div className="flex flex-col gap-5">
        {/* Page Title & Breadcrumb header */}
        <PageHeaderWithAction
          title={t('portal.home.title', 'Client Portal')}
          subtitle={t('portal.home.subtitle', 'Overview of your certification applications, audits, and documents')}
        />

        {/* Hero Client Summary Card */}
        <CabTourStep steps={tourSteps} stepId="portal-home-header">
          <section className="rounded-lg border border-neutral-100 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left: Logo + Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                {/* Logo Box */}
                <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-primary-100 bg-primary-25 text-[28px] font-bold text-primary sm:size-24">
                  {initialsOf(profile.name)}
                </div>

                {/* Info Details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-section-title text-text-primary">
                      {profile.name}
                    </h1>
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-0.5 text-caption font-medium text-primary">
                      {t('portal.home.clientId', 'Client ID')}: {profile.clientCode}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-success-100 px-3 py-0.5 text-caption font-medium text-success-600">
                      {t(`portal.home.status.${profile.status.toLowerCase()}`, enumLabel(t, profile.status))}
                    </span>
                  </div>

                  {/* Metadata items */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body-sm text-neutral-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <AppIcon icon={MapPinIcon} size={15} className="text-neutral-500" />
                      <span>{displayCountry(profile.country)}</span>
                    </span>

                    <span className="flex items-center gap-1.5 font-medium">
                      <AppIcon icon={UserIcon} size={15} className="text-neutral-500" />
                      <span className="text-neutral-600">{t('portal.home.primaryContact', 'Primary:')}</span>
                      <span className="font-semibold text-neutral-800">{profile.primaryContact.name}</span>
                    </span>

                    <span className="flex items-center gap-1.5 font-medium">
                      <AppIcon icon={MailIcon} size={15} className="text-neutral-500" />
                      <a href={`mailto:${profile.primaryContact.email}`} className="text-primary hover:underline">
                        {profile.primaryContact.email}
                      </a>
                    </span>

                    <span className="flex items-center gap-1.5 font-medium">
                      <AppIcon icon={BuildingsIcon} size={15} className="text-neutral-500" />
                      <span>{profile.industrySector}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Edit profile button */}
              <div className="shrink-0 self-start lg:self-center">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.portalCompanyProfile)}
                  className={cn(buttonVariants({ variant: 'secondary', size: 'md' }))}
                >
                  <AppIcon icon={EditIcon} size={16} />
                  <span>{t('portal.home.editProfile', 'Edit profile')}</span>
                </button>
              </div>
            </div>
          </section>
        </CabTourStep>

        {/* 4-Card Action Grid — live data from the client's records */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <CabTourStep steps={tourSteps} stepId="portal-home-application-card">
            <div className={cardClass}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-hover">
                      <AppIcon icon={FileTextIcon} size={20} />
                    </span>
                    <h3 className="truncate text-body font-bold text-neutral-900">
                      {app ? t('portal.home.applicationCard.titleLive', { id: app.id, defaultValue: 'Application {{id}}' }) : t('portal.home.applicationCard.none', 'No open application')}
                    </h3>
                  </div>
                  {app && (
                    <span className="shrink-0 rounded-full border border-warning-100 bg-warning-50 px-2.5 py-0.5 text-caption font-bold text-warning-700">
                      {enumLabel(t, app.status)}
                    </span>
                  )}
                </div>
                {app ? (
                  <dl className="space-y-2 pt-1 text-body-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-neutral-600">{t('portal.home.applicationCard.scheme', 'Scheme')}</dt>
                      <dd className="text-end font-semibold text-neutral-800">{app.scheme}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-neutral-600">{t('portal.home.applicationCard.submitted', 'Submitted')}</dt>
                      <dd className="font-medium text-neutral-800">{app.submittedDate ?? notSet()}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-neutral-600">{t('portal.home.applicationCard.lastUpdated', 'Last updated')}</dt>
                      <dd className="font-semibold text-neutral-800">{app.lastUpdated}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-body-sm text-text-secondary">{t('portal.home.applicationCard.noneHint', 'Start a new certification application when you are ready.')}</p>
                )}
              </div>
              <div className="space-y-2 pt-2">
                <button type="button" onClick={() => navigate(ROUTES.portalApplications)} className={primaryBtn}>
                  <span>{app?.status === 'Draft' ? t('portal.home.applicationCard.continue', 'Continue application') : t('portal.home.applicationCard.follow', 'Follow application')}</span>
                  <AppIcon icon={ArrowRightIcon} size={15} className="rtl:rotate-180" />
                </button>
                <button type="button" onClick={() => navigate(ROUTES.portalApplications)} className="w-full py-1 text-center text-body-sm font-medium text-primary hover:underline">
                  {t('portal.home.applicationCard.view', 'View application')}
                </button>
              </div>
            </div>
          </CabTourStep>

          <CabTourStep steps={tourSteps} stepId="portal-home-clarification-card">
            <div className={cn(cardClass, clarification ? 'border-error-100' : '')}>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className={cn('flex size-10 items-center justify-center rounded-md', clarification ? 'bg-error-100 text-error-600' : 'bg-success-50 text-success-700')}>
                    <AppIcon icon={CorrectiveActionIcon} size={20} />
                  </span>
                  <h3 className="text-body font-bold text-neutral-900">
                    {clarification ? t('portal.home.clarificationCard.title', 'Clarification required') : t('portal.home.clarificationCard.noneTitle', 'No open requests')}
                  </h3>
                </div>
                <p className="text-body-sm leading-relaxed text-neutral-700">
                  {clarification
                    ? t('portal.home.clarificationCard.descLive', { id: clarification.applicationId, message: clarification.message, defaultValue: '{{id}}: {{message}}' })
                    : t('portal.home.clarificationCard.noneDesc', 'The certification body has not asked for any additional information.')}
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <button type="button" onClick={() => navigate(ROUTES.portalApplications)} className={outlineBtn}>
                  {t('portal.home.clarificationCard.viewBtn', 'View requested info')}
                </button>
                {clarification && (
                  <div className="flex items-center justify-between px-1 text-body-sm">
                    <span className="font-medium text-neutral-600">{t('portal.home.clarificationCard.dueDate', 'Due date')}</span>
                    <span className="font-bold text-error-600">{clarification.dueDate}</span>
                  </div>
                )}
              </div>
            </div>
          </CabTourStep>

          <CabTourStep steps={tourSteps} stepId="portal-home-audit-card">
            <div className={cardClass}>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-md bg-primary-25 text-focus">
                    <AppIcon icon={CalendarIcon} size={20} />
                  </span>
                  <h3 className="text-body font-bold text-neutral-900">{t('portal.home.auditCard.title', 'Upcoming audit')}</h3>
                </div>
                {audit ? (
                  <div className="space-y-1.5 text-body-sm">
                    <p className="font-bold text-neutral-900">{enumLabel(t, audit.stage.replace(/ Audit$/, ''))}</p>
                    <p className="flex items-center gap-1.5 font-medium text-neutral-700">
                      <AppIcon icon={CalendarIcon} size={14} className="text-neutral-500" />
                      <span>{audit.date}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-medium text-neutral-700">
                      <AppIcon icon={MapPinIcon} size={14} className="text-neutral-500" />
                      <span>{audit.location}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-body-sm text-text-secondary">{t('portal.home.auditCard.none', 'No audit scheduled yet.')}</p>
                )}
              </div>
              <div className="pt-2">
                <button type="button" onClick={() => navigate(ROUTES.portalAudits)} className={outlineBtn}>
                  {t('portal.home.auditCard.viewBtn', 'View audit details')}
                </button>
              </div>
            </div>
          </CabTourStep>

          <div className={cardClass}>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary-25 text-primary">
                  <AppIcon icon={FileTextIcon} size={20} />
                </span>
                <h3 className="text-body font-bold text-neutral-900">{t('portal.home.docsCard.title', 'Documents')}</h3>
              </div>
              <div className="space-y-2 text-body-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-700">
                    <AppIcon icon={FileTextIcon} size={14} className="text-neutral-500" />
                    {t('portal.home.docsCard.uploadedByYou', 'Uploaded by you')}
                  </span>
                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-caption font-bold text-primary">{docs.uploadedByYou}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-700">
                    <AppIcon icon={FileTextIcon} size={14} className="text-error-600" />
                    {t('portal.home.docsCard.requestedByUs', 'Requested by us')}
                  </span>
                  <span className="rounded-full bg-error-100 px-2 py-0.5 text-caption font-bold text-error-600">{docs.requestedByUs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-700">
                    <AppIcon icon={UsersIcon} size={14} className="text-neutral-500" />
                    {t('portal.home.docsCard.sharedWithYou', 'Shared with you')}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption font-bold text-neutral-900">{docs.sharedWithYou}</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <button type="button" onClick={() => navigate(ROUTES.portalCompanyProfile)} className={outlineBtn}>
                {t('portal.home.docsCard.viewBtn', 'View all documents')}
              </button>
            </div>
          </div>
        </section>

        {/* Bottom 2-Column Section */}
        <CabTourStep steps={tourSteps} stepId="portal-home-activity-contacts">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 7 cols: Recent activity */}
            <div className="lg:col-span-7 flex flex-col rounded-lg border border-neutral-100 bg-white py-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between px-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-body-lg font-bold text-neutral-900">
                    {t('portal.home.recentActivity.title', 'Recent activity')}
                  </h2>
                </div>
                {profile.recentActivity.length > ACTIVITY_PREVIEW && (
                  <button type="button" onClick={() => setShowAllActivity((v) => !v)} aria-expanded={showAllActivity} className="text-body-sm font-semibold text-primary hover:underline">
                    {showAllActivity ? t('cab.dashboard.showLess', 'Show less') : t('portal.home.recentActivity.viewAll', 'View all')}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-body-sm border-collapse">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="py-3 px-5 font-medium text-start text-body-sm">
                        {t('portal.home.recentActivity.colDate', 'Date')}
                      </th>
                      <th className="py-3 px-5 font-medium text-start text-body-sm">
                        {t('portal.home.recentActivity.colDetails', 'Details')}
                      </th>
                      <th className="py-3 px-5 font-medium text-end text-body-sm">
                        {t('portal.home.recentActivity.colRelatedTo', 'Related to')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(showAllActivity ? profile.recentActivity : profile.recentActivity.slice(0, ACTIVITY_PREVIEW)).map((act, idx) => (
                      <tr key={act.id} className={cn('transition-colors hover:bg-primary-25', idx % 2 === 1 ? 'bg-neutral-25' : 'bg-white')}>
                        <td className="py-3.5 px-5 text-neutral-600 font-medium whitespace-nowrap">
                          {act.date}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <span className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-full text-caption',
                              act.type === 'alert' ? 'bg-error-50 text-error-600' : 'bg-primary-50 text-primary'
                            )}>
                              {act.type === 'edit' && '✏️'}
                              {act.type === 'alert' && '⚠️'}
                              {act.type === 'upload' && '📄'}
                              {act.type === 'create' && '➕'}
                            </span>
                            <span className="font-medium text-neutral-800">{enumLabel(t, act.details)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-end font-semibold text-primary whitespace-nowrap">
                          <button type="button" onClick={() => navigate(routeForReference(act.relatedTo))} className="hover:underline font-bold text-primary" dir="ltr">
                            {act.relatedTo}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 5 cols: Your contacts at CAB */}
            <div className="lg:col-span-5 flex flex-col rounded-lg border border-neutral-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h2 className="text-body-lg font-bold text-neutral-900">
                  {t('portal.home.contacts.title', 'Your contacts at CAB')}
                </h2>
              </div>

              <div className="space-y-3">
                {profile.cabContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start gap-3.5 rounded-lg border border-neutral-100 bg-neutral-25 p-3.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-bold text-white shadow-sm">
                      {contact.initials}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-body-sm font-bold text-neutral-900 leading-tight">
                        {contact.name}
                      </p>
                      <p className="text-caption text-neutral-600 font-medium">
                        {enumLabel(t, contact.role)}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 pt-1 text-caption">
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1.5 text-primary font-medium hover:underline truncate"
                        >
                          <AppIcon icon={MailIcon} size={13} className="shrink-0 text-neutral-500" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1.5 text-neutral-800 hover:text-neutral-900 whitespace-nowrap"
                        >
                          <AppIcon icon={PhoneIcon} size={13} className="text-neutral-500 shrink-0" />
                          <span>{contact.phone}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </CabTourStep>
      </div>
    </PortalLayout>
  )
}
