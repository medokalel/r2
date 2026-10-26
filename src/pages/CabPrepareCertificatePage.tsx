import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Badge, CalloutCard, ReadOnlyField, SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { CertificatePreview, type CertificatePreviewData } from '@/components/dashboard/cab/certificate/CertificatePreview'
import { ConfigureMarksModal } from '@/components/dashboard/cab/certificate/ConfigureMarksModal'
import { WalletModalBody, WalletModalShell } from '@/components/dashboard/wallet/WalletModalShell'
import { toIsoDate } from '@/components/dashboard/companyProfile/mappers'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormField, FormLabel } from '@/components/ui/FormField'
import { SelectField } from '@/components/ui/Select'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePrepareCertificateTourSteps } from '@/config/prepareCertificateTourSteps'
import {
  AppIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ExpandIcon,
  EyeIcon,
  FileTextIcon,
  InfoIcon,
  SettingsIcon,
  SuccessCircleIcon,
} from '@/components/icons'
import {
  getCertificatePreparation,
  issueCertificate,
  type CertificateLanguage,
  type CertificatePreparation,
  type IssueCertificatePayload,
  type LocalizedText,
} from '@/lib/api/cabCertificatesApi'
import { CERTIFICATE_STATUS_LABEL_KEYS } from '@/lib/certificateStatus'
import {
  CERTIFICATE_LANGUAGES,
  buildInitialCertificateForm,
  defaultExpiryDate,
  formatCertificateDate,
  getCertificateFormErrors,
  getSurveillanceDates,
  isCertificateFormComplete,
  parseIsoDate,
  type CertificatePreparationForm,
} from '@/lib/certificatePreparationForm'
import { getCountryOptions } from '@/lib/countries'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const fieldErrorClassName = 'text-small-light text-error-700'
const fieldHintClassName = 'text-small-light text-neutral-600'

function PageTitle({
  actions,
  tourSteps,
}: {
  actions?: ReactNode
  tourSteps?: ReturnType<typeof usePrepareCertificateTourSteps>
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-page-title text-text-primary">{t('cab.certificatePrepare.title')}</h1>
        <p className="mt-1 text-body-sm text-neutral-600">{t('cab.certificatePrepare.subtitle')}</p>
      </div>
      {actions && (
        <div className="flex w-full items-center gap-3 sm:w-auto">
          {tourSteps ? (
            <CabTourStep steps={tourSteps} stepId="prepare-certificate-actions">
              <div className="flex w-full items-center gap-3 sm:w-auto">{actions}</div>
            </CabTourStep>
          ) : (
            actions
          )}
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]" aria-busy>
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-lg border border-neutral-100 bg-white p-5">
            <div className="skeleton h-5 w-44" />
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-neutral-100 bg-white p-5">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton mt-5 aspect-[210/297] w-full" />
      </div>
    </div>
  )
}

function PrepareCertificateWorkspace({
  preparation,
  tourSteps,
}: {
  preparation: CertificatePreparation
  tourSteps: ReturnType<typeof usePrepareCertificateTourSteps>
}) {
  const { t, i18n } = useTranslation()
  const { application, decision, options, content, issuer } = preparation

  const [form, setForm] = useState<CertificatePreparationForm>(() => buildInitialCertificateForm(preparation))
  // Until the user edits the expiry date themselves, it keeps following the effective date.
  const [expiryTouched, setExpiryTouched] = useState(false)
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [marksOpen, setMarksOpen] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [issued, setIssued] = useState(false)
  const [issueFailed, setIssueFailed] = useState(false)

  const uiLanguage: CertificateLanguage = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const uiCountries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const countryName =
    uiCountries.find((country) => country.code === application.countryCode)?.name ?? application.countryCode

  const isDraft = preparation.status === 'DRAFT'
  const errors = getCertificateFormErrors(form)
  // Once issued (or if it was never a draft) the certificate content is frozen.
  const readOnly = !isDraft || issued || issuing
  const canIssue = !readOnly && isCertificateFormComplete(form)

  const signatory = options.signatories.find((option) => option.id === form.signatoryId)
  const selectedMarks = options.marks.filter((mark) => form.markIds.includes(mark.id))

  const patch = (partial: Partial<CertificatePreparationForm>) => setForm((previous) => ({ ...previous, ...partial }))

  const handleEffectiveDateChange = (effectiveDate: Date) =>
    patch({
      effectiveDate,
      ...(expiryTouched ? {} : { expiryDate: defaultExpiryDate(effectiveDate) }),
    })

  const handleExpiryDateChange = (expiryDate: Date) => {
    setExpiryTouched(true)
    patch({ expiryDate })
  }

  const handleIssue = async () => {
    if (!canIssue) return

    const payload: IssueCertificatePayload = {
      issueDate: toIsoDate(form.issueDate),
      effectiveDate: toIsoDate(form.effectiveDate),
      expiryDate: toIsoDate(form.expiryDate),
      templateId: form.templateId,
      language: form.language,
      signatoryId: form.signatoryId,
      markIds: form.markIds,
      includeQrCode: form.includeQrCode,
    }

    setIssuing(true)
    setIssueFailed(false)
    try {
      await issueCertificate(preparation.certificateId, payload)
      setIssued(true)
    } catch {
      setIssueFailed(true)
    } finally {
      setIssuing(false)
    }
  }

  const inCertificateLanguage = (text: LocalizedText) => text[form.language]

  const previewData: CertificatePreviewData = {
    language: form.language,
    issuer: {
      shortName: issuer.shortName,
      name: inCertificateLanguage(issuer.name),
      logoUrl: issuer.logoUrl,
      watermarkUrl: issuer.watermarkUrl,
      tagline: issuer.tagline,
      addressLines: issuer.addressLines.map(inCertificateLanguage),
      website: issuer.website,
      email: issuer.email,
      phone: issuer.phone,
      workingHours: inCertificateLanguage(issuer.workingHours),
      formCode: issuer.formCode,
      version: issuer.version,
      accreditationName: inCertificateLanguage(issuer.accreditation.name),
      accreditationAddress: inCertificateLanguage(issuer.accreditation.address),
    },
    client: {
      tradeName: inCertificateLanguage(content.tradeName),
      name: inCertificateLanguage(content.clientName),
      address: inCertificateLanguage(content.clientAddress),
      logoUrl: content.clientLogoUrl,
    },
    standardCode: preparation.standard.code,
    systemName: inCertificateLanguage(preparation.standard.systemNames),
    scope: inCertificateLanguage(content.scope),
    certificateNumber: preparation.certificateNumber,
    // The certification cycle starts on the effective date; surveillance follows from it.
    initialCertificationDate: form.effectiveDate,
    validUntil: form.expiryDate,
    surveillanceDates: getSurveillanceDates(form.effectiveDate),
    includeQrCode: form.includeQrCode,
    signatory: {
      title: signatory ? inCertificateLanguage(signatory.title) : '',
      signatureUrl: signatory?.signatureUrl ?? null,
    },
    marks: selectedMarks,
  }

  return (
    <>
      <PageTitle
        tourSteps={tourSteps}
        actions={
          <>
            <Button
              variant="outline"
              icon={<AppIcon icon={EyeIcon} size={20} />}
              onClick={() => setPreviewOpen(true)}
              className="flex-1 sm:flex-none"
            >
              {t('cab.certificatePrepare.actions.preview')}
            </Button>
            <Button
              icon={<AppIcon icon={FileTextIcon} size={20} />}
              onClick={() => void handleIssue()}
              disabled={!canIssue}
              className="flex-1 sm:flex-none"
            >
              {issuing ? t('cab.certificatePrepare.actions.issuing') : t('cab.certificatePrepare.actions.issue')}
            </Button>
          </>
        }
      />

      {issued && (
        <CalloutCard
          tone="green"
          icon={<AppIcon icon={SuccessCircleIcon} size={20} />}
          title={t('cab.certificatePrepare.notices.issuedTitle')}
        >
          {t('cab.certificatePrepare.notices.issuedBody', { number: preparation.certificateNumber })}{' '}
          <Link to={ROUTES.cabCertificates} className="font-semibold text-primary hover:underline">
            {t('cab.certificatePrepare.notices.backToRegister')}
          </Link>
        </CalloutCard>
      )}

      {!isDraft && (
        <CalloutCard
          tone="amber"
          icon={<AppIcon icon={InfoIcon} size={20} />}
          title={t('cab.certificatePrepare.notices.notDraftTitle')}
        >
          {t('cab.certificatePrepare.notices.notDraftBody', {
            status: t(`cab.certificateRegister.status.${CERTIFICATE_STATUS_LABEL_KEYS[preparation.status]}`),
          })}
        </CalloutCard>
      )}

      {issueFailed && (
        <CalloutCard
          tone="red"
          icon={<AppIcon icon={InfoIcon} size={20} />}
          title={t('cab.certificatePrepare.notices.issueFailedTitle')}
        >
          {t('cab.certificatePrepare.notices.issueFailedBody')}
        </CalloutCard>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]">
        <div className="flex min-w-0 flex-col gap-5">
          <CabTourStep steps={tourSteps} stepId="prepare-certificate-client-section">
            <SectionCard title={t('cab.certificatePrepare.sections.applicationAndClient')}>
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <ReadOnlyField label={t('cab.certificatePrepare.fields.applicationNumber')}>
                  <span dir="ltr">{application.number}</span>
                </ReadOnlyField>
                <ReadOnlyField label={t('cab.certificatePrepare.fields.clientNumber')}>
                  <span dir="ltr">{application.clientNumber}</span>
                </ReadOnlyField>
                <ReadOnlyField label={t('cab.certificatePrepare.fields.legalName')}>{application.legalName}</ReadOnlyField>
                <ReadOnlyField label={t('cab.certificatePrepare.fields.country')}>
                  {countryName}
                </ReadOnlyField>
                <ReadOnlyField label={t('cab.certificatePrepare.fields.primaryContact')}>
                  {application.primaryContact}
                </ReadOnlyField>
                <ReadOnlyField label={t('cab.certificatePrepare.fields.email')} className="sm:col-span-2">
                  <span dir="ltr">{application.email}</span>
                </ReadOnlyField>
              </div>
            </SectionCard>
          </CabTourStep>

          <CabTourStep steps={tourSteps} stepId="prepare-certificate-decision-section">
            <SectionCard title={t('cab.certificatePrepare.sections.authorizedDecision')}>
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <ReadOnlyField label={t('cab.certificatePrepare.fields.decisionNumber')}>
                  <span dir="ltr">{decision.number}</span>
                </ReadOnlyField>
                <ReadOnlyField label={t('cab.certificatePrepare.fields.decisionDate')}>
                  {formatCertificateDate(parseIsoDate(decision.date), i18n.language)}
                </ReadOnlyField>
                <ReadOnlyField label={t('cab.certificatePrepare.fields.decision')}>
                  <Badge tone="green">{t('cab.certificatePrepare.decisionOutcome.granted')}</Badge>
                </ReadOnlyField>
                <ReadOnlyField label={t('cab.certificatePrepare.fields.approvedScope')}>
                  {decision.approvedScope}
                  {decision.approvedScopeDescription && (
                    <span className="mt-0.5 block text-body-sm font-normal text-neutral-600">
                      {decision.approvedScopeDescription}
                    </span>
                  )}
                </ReadOnlyField>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-caption font-medium text-neutral-600">
                  {t('cab.certificatePrepare.fields.includedSites')}
                </p>
                <div className="overflow-x-auto rounded-md border border-neutral-100">
                  <table className="w-full min-w-[560px] border-collapse text-start">
                    <thead>
                      <tr className="bg-primary text-body-sm font-medium text-white">
                        <th className="px-4 py-3 text-start">{t('cab.certificatePrepare.sites.siteId')}</th>
                        <th className="px-4 py-3 text-start">{t('cab.certificatePrepare.sites.siteName')}</th>
                        <th className="px-4 py-3 text-start">{t('cab.certificatePrepare.sites.address')}</th>
                        <th className="px-4 py-3 text-start">{t('cab.certificatePrepare.sites.scope')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decision.sites.map((site, index) => (
                        <tr key={site.id} className={cn('text-body-sm text-neutral-800', index % 2 && 'bg-neutral-25')}>
                          <td className="px-4 py-3" dir="ltr">
                            <span className="block text-start">{site.id}</span>
                          </td>
                          <td className="px-4 py-3">{site.name}</td>
                          <td className="px-4 py-3">{site.address}</td>
                          <td className="px-4 py-3">{site.scope}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>
          </CabTourStep>

          <CabTourStep steps={tourSteps} stepId="prepare-certificate-details-section">
            <SectionCard title={t('cab.certificatePrepare.sections.certificateDetails')}>
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <ReadOnlyField label={t('cab.certificatePrepare.fields.certificateNumber')}>
                  <span dir="ltr">{preparation.certificateNumber}</span>
                </ReadOnlyField>
                <FormField variant="compact" label={t('cab.certificatePrepare.fields.issueDate')}>
                  <DatePicker value={form.issueDate} onChange={(issueDate) => patch({ issueDate })} disabled={readOnly} />
                </FormField>
                <FormField variant="compact" label={t('cab.certificatePrepare.fields.effectiveDate')}>
                  <DatePicker value={form.effectiveDate} onChange={handleEffectiveDateChange} disabled={readOnly} />
                </FormField>
                <FormField variant="compact" label={t('cab.certificatePrepare.fields.expiryDate')}>
                  <DatePicker value={form.expiryDate} onChange={handleExpiryDateChange} disabled={readOnly} />
                  {errors.expiryDate && (
                    <p role="alert" className={fieldErrorClassName}>
                      {t(`cab.certificatePrepare.errors.${errors.expiryDate}`)}
                    </p>
                  )}
                </FormField>
                <div className="sm:col-span-2">
                  <SelectField
                    labelVariant="compact"
                    id="certificate-template"
                    disabled={readOnly}
                    label={t('cab.certificatePrepare.fields.template')}
                    value={form.templateId}
                    onChange={(templateId) => patch({ templateId })}
                    options={options.templates.map((template) => ({ value: template.id, label: template.name }))}
                  />
                </div>
              </div>

              <div className="mt-5 border-t border-neutral-100 pt-3">
                <Button
                  variant="tertiary"
                  size="sm"
                  aria-expanded={moreDetailsOpen}
                  aria-controls="certificate-more-details"
                  icon={
                    <AppIcon
                      icon={ChevronDownIcon}
                      size={16}
                      className={cn('transition-transform', !moreDetailsOpen && '-rotate-90 rtl:rotate-90')}
                    />
                  }
                  onClick={() => setMoreDetailsOpen((open) => !open)}
                  className="px-0 text-neutral-900 hover:text-primary"
                >
                  {t('cab.certificatePrepare.fields.moreDetails')}
                </Button>

                {moreDetailsOpen && (
                  <div id="certificate-more-details" className="mt-4 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                    <SelectField
                      labelVariant="compact"
                      id="certificate-language"
                      disabled={readOnly}
                      label={t('cab.certificatePrepare.fields.language')}
                      value={form.language}
                      onChange={(language) => patch({ language: language as CertificatePreparationForm['language'] })}
                      options={CERTIFICATE_LANGUAGES.map((language) => ({
                        value: language,
                        label: t(`cab.certificatePrepare.languages.${language}`),
                      }))}
                    />

                    <div className="flex flex-col gap-2">
                      <SelectField
                        labelVariant="compact"
                        id="certificate-signatory"
                        disabled={readOnly}
                        label={t('cab.certificatePrepare.fields.signatory')}
                        value={form.signatoryId}
                        onChange={(signatoryId) => patch({ signatoryId })}
                        options={options.signatories.map((option) => ({ value: option.id, label: option.name }))}
                      />
                      {signatory && <p className={fieldHintClassName}>{signatory.title[uiLanguage]}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                      <FormLabel variant="compact">{t('cab.certificatePrepare.fields.applicableMarks')}</FormLabel>
                      <p className={cn('text-body-sm', selectedMarks.length ? 'font-medium text-neutral-900' : 'text-neutral-600')}>
                        {selectedMarks.length
                          ? selectedMarks.map((mark) => mark.name).join(', ')
                          : t('cab.certificatePrepare.marks.none')}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<AppIcon icon={SettingsIcon} size={16} />}
                        onClick={() => setMarksOpen(true)}
                        disabled={readOnly}
                        className="self-start"
                      >
                        {t('cab.certificatePrepare.marks.configure')}
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <FormLabel variant="compact">{t('cab.certificatePrepare.fields.verificationQr')}</FormLabel>
                      <label className="flex cursor-pointer items-center gap-3">
                        <Checkbox
                          checked={form.includeQrCode}
                          disabled={readOnly}
                          onChange={() => patch({ includeQrCode: !form.includeQrCode })}
                        />
                        <span className="text-body-sm text-neutral-900">{t('cab.certificatePrepare.qr.include')}</span>
                      </label>
                      <p className={fieldHintClassName}>{t('cab.certificatePrepare.qr.hint')}</p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </CabTourStep>
        </div>

        <CabTourStep steps={tourSteps} stepId="prepare-certificate-preview-section" className="min-w-0 xl:sticky xl:top-6">
          <SectionCard
            title={t('cab.certificatePrepare.preview.title')}
            action={
              <Button
                variant="tertiary"
                size="icon-sm"
                aria-label={t('cab.certificatePrepare.actions.expandPreview')}
                onClick={() => setPreviewOpen(true)}
                className="bg-primary-subtle text-primary hover:bg-primary-100 hover:text-primary"
              >
                <AppIcon icon={ExpandIcon} size={16} />
              </Button>
            }
          >
            <CertificatePreview data={previewData} />
          </SectionCard>
        </CabTourStep>
      </div>

      <WalletModalShell
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t('cab.certificatePrepare.preview.title')}
        wide
        className="w-[min(1280px,calc(100vw-32px))]"
      >
        {/* Full-width certificate that scrolls inside the dialog, so every detail is legible. */}
        <WalletModalBody className="min-h-0 overflow-y-auto">
          <CertificatePreview data={previewData} />
        </WalletModalBody>
      </WalletModalShell>

      <ConfigureMarksModal
        open={marksOpen}
        onClose={() => setMarksOpen(false)}
        marks={options.marks}
        selectedIds={form.markIds}
        onApply={(markIds) => {
          patch({ markIds })
          setMarksOpen(false)
        }}
      />
    </>
  )
}

type LoadState = 'loading' | 'ready' | 'notFound' | 'error'

interface LoadResult {
  /** Which request produced this result, so a stale one is never shown for a newer certificate/retry. */
  requestKey: string
  status: Exclude<LoadState, 'loading'>
  preparation: CertificatePreparation | null
}

export function CabPrepareCertificatePage() {
  const { certificateId = '' } = useParams<{ certificateId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = usePrepareCertificateTourSteps()

  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState<LoadResult | null>(null)

  const requestKey = `${certificateId}:${reloadCount}`
  const state: LoadState = result?.requestKey === requestKey ? result.status : 'loading'
  const preparation = result?.requestKey === requestKey ? result.preparation : null

  useEffect(() => {
    let cancelled = false
    getCertificatePreparation(certificateId)
      .then((data) => {
        if (!cancelled) setResult({ requestKey, status: data ? 'ready' : 'notFound', preparation: data })
      })
      .catch(() => {
        if (!cancelled) setResult({ requestKey, status: 'error', preparation: null })
      })
    return () => {
      cancelled = true
    }
  }, [certificateId, requestKey])

  return (
    <CabLayout
      sidebarVariant="certificates"
      tourId="cab-prepare-certificate"
      tourSteps={tourSteps}
    >
      <CabHeader title={t('cab.certificatePrepare.title')} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <CabTourStep steps={tourSteps} stepId="prepare-certificate-header">
          <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('cab.certificatePrepare.breadcrumbLabel')}>
            <Link to={ROUTES.cabCertificates} className="font-light text-neutral-500 hover:text-primary">
              {t('cab.sidebar.certificates')}
            </Link>
            <AppIcon icon={ArrowRightIcon} size={14} className="rtl-flip shrink-0 text-neutral-500" />
            <span className="font-medium text-neutral-800" aria-current="page">
              {t('cab.certificatePrepare.title')}
            </span>
          </nav>
        </CabTourStep>

        {state === 'loading' && (
          <>
            <PageTitle tourSteps={tourSteps} />
            <LoadingSkeleton />
          </>
        )}

        {state === 'error' && <ErrorState onRetry={() => setReloadCount((count) => count + 1)} />}

        {state === 'notFound' && (
          <ErrorState
            title={t('cab.certificatePrepare.notFound.title')}
            description={t('cab.certificatePrepare.notFound.description')}
            retryLabel={t('cab.certificatePrepare.notFound.back')}
            onRetry={() => navigate(ROUTES.cabCertificates)}
          />
        )}

        {state === 'ready' && preparation && (
          <PrepareCertificateWorkspace
            key={preparation.certificateId}
            preparation={preparation}
            tourSteps={tourSteps}
          />
        )}
      </main>
    </CabLayout>
  )
}