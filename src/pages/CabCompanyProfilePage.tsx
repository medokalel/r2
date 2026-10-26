import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabProfileStep } from '@/components/auth/cab/setup/CabProfileStep'
import { CabLocationsStep } from '@/components/auth/cab/setup/CabLocationsStep'
import { CabAccreditationStatusStep } from '@/components/auth/cab/setup/CabAccreditationStatusStep'
import { CabAccreditationRecordsStep } from '@/components/auth/cab/setup/CabAccreditationRecordsStep'
import { CabSchemesServicesStep } from '@/components/auth/cab/setup/CabSchemesServicesStep'
import { CabScopeStep } from '@/components/auth/cab/setup/CabScopeStep'
import { CabMarksStep } from '@/components/auth/cab/setup/CabMarksStep'
import { CabCertificateStep } from '@/components/auth/cab/setup/CabCertificateStep'
import { OnboardingStepTransition } from '@/components/auth/OnboardingStepTransition'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { PricingConfigSection } from '@/components/dashboard/cab/PricingConfigSection'
import { CabTaxIdentitySection } from '@/components/dashboard/cab/CabTaxIdentitySection'
import { AppIcon, ArrowRightIcon, CheckIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui'
import { ErrorSummary } from '@/components/ui/ErrorSummary'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import { getCabProfileIssues } from '@/lib/cabProfileIssues'
import { FIELD_PARAM, RETURN_TO_PARAM, focusField, returnToLabel, safeReturnTo } from '@/lib/fieldNavigation'
import { useCabCompanyProfileTourSteps } from '@/config/cabCompanyProfileTourSteps'
import { getCabProfile, saveCabSetupDraft, type CabProfile } from '@/lib/api/cabApi'
import {
  EMPTY_CAB_TAX_PROFILE,
  getCabTaxProfile,
  isSaudiCountry,
  saveCabTaxProfile,
  validateCabTaxProfile,
  type CabTaxField,
  type CabTaxProfile,
} from '@/lib/api/cabTaxProfileApi'
import { getAuthSession } from '@/lib/authStorage'
import { mapFormToCabSetupDraft, mergeCabProfileIntoForm } from '@/lib/cabSetupMapper'
import type { CabSetupForm } from '@/lib/cabSetupForm'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { emptyUnifiedOnboardingForm, type UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'
import { cn } from '@/lib/utils'

/** CAB Profile pages, in the order the body is built: who you are → where → accreditation → what you certify → price → brand → certificate. */
const PAGES = [
  'identity',
  'locations',
  'accreditationStatus',
  'accreditationRecords',
  'schemes',
  'scope',
  'pricing',
  'marks',
  'certificate',
] as const
type PageKey = (typeof PAGES)[number]

const SAVED_KEY = 'icasco_cab_profile_saved_pages'

function readSavedPages(): PageKey[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as PageKey[]
  } catch {
    return []
  }
}

export function CabCompanyProfilePage() {
  const { t } = useTranslation()
  const tourSteps = useCabCompanyProfileTourSteps()
  const session = getAuthSession()
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState<UnifiedOnboardingForm | null>(null)
  const [cab, setCab] = useState<CabProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [savedPages, setSavedPages] = useState<PageKey[]>(readSavedPages)
  const topRef = useRef<HTMLDivElement>(null)
  // Seller identity on tax invoices (ZATCA): saved with the identity page through PATCH /cab-profile.
  const [tax, setTax] = useState<CabTaxProfile>(EMPTY_CAB_TAX_PROFILE)
  const [savedTax, setSavedTax] = useState<CabTaxProfile>(EMPTY_CAB_TAX_PROFILE)
  const [taxCountry, setTaxCountry] = useState('')
  const [taxErrors, setTaxErrors] = useState<Partial<Record<CabTaxField, string>>>({})
  // Clickable list of what is missing on this page, shown after "Save and next".
  const [issuesPage, setIssuesPage] = useState<PageKey | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const returnTo = safeReturnTo(params.get(RETURN_TO_PARAM))

  const requested = PAGES.indexOf(params.get('page') as PageKey)
  const index = requested >= 0 ? requested : 0
  const page = PAGES[index]
  const isLast = index === PAGES.length - 1

  const hydrate = (profile: CabProfile) => {
    setCab(profile)
    setForm(mergeCabProfileIntoForm(emptyUnifiedOnboardingForm, profile))
  }

  useEffect(() => {
    let cancelled = false
    getCabProfile()
      .then(({ cab: profile }) => {
        if (!cancelled) hydrate(profile)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getUserErrorMessage(loadError, t))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    getCabTaxProfile()
      .then(({ value, country }) => {
        if (cancelled) return
        setTax(value)
        setSavedTax(value)
        setTaxCountry(country)
      })
      .catch(() => undefined) // the profile request above already reports a failed load
    return () => {
      cancelled = true
    }
  }, [t])

  /** Saves the tax identity when it changed; false when it is invalid or the request failed. */
  const saveTax = async (): Promise<boolean> => {
    const errors = validateCabTaxProfile(t, tax)
    setTaxErrors(errors)
    if (Object.keys(errors).length) {
      toast.error(t('cab.companyProfile.tax.fixErrors', 'Check the tax invoice details before saving.'))
      return false
    }
    if ((Object.keys(tax) as CabTaxField[]).every((k) => tax[k].trim() === savedTax[k])) return true
    const saved = await saveCabTaxProfile(tax)
    setTax(saved)
    setSavedTax(saved)
    return true
  }

  const onPatch = (fields: Partial<UnifiedOnboardingForm>) => setForm((prev) => (prev ? { ...prev, ...fields } : prev))
  const onPatchSetup = (fields: Partial<CabSetupForm>) =>
    setForm((prev) => (prev ? { ...prev, cabSetup: { ...prev.cabSetup, ...fields } } : prev))

  const markSaved = (key: PageKey) =>
    setSavedPages((prev) => {
      const next = prev.includes(key) ? prev : [...prev, key]
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next))
      } catch {
        // per-browser convenience only
      }
      return next
    })

  const goTo = (target: number) => {
    if (target < 0 || target >= PAGES.length || target === index) return
    setDirection(target > index ? 'forward' : 'back')
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', PAGES[target])
      return next
    }, { replace: true })
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /** Saves the profile draft (pricing saves itself inside its section). */
  const save = async (): Promise<boolean> => {
    if (!form || saving) return false
    if (page === 'pricing') return true
    setSaving(true)
    try {
      if (page === 'identity' && !(await saveTax())) return false
      await saveCabSetupDraft(mapFormToCabSetupDraft(form, cab))
      const { cab: profile } = await getCabProfile()
      hydrate(profile)
      return true
    } catch (saveError) {
      toast.error(getUserErrorMessage(saveError, t))
      return false
    } finally {
      setSaving(false)
    }
  }

  const next = async () => {
    if (!(await save())) return
    markSaved(page)
    if (pageIssues.length > 0) {
      setIssuesPage(page)
      window.setTimeout(() => summaryRef.current?.focus(), 50)
      return
    }
    if (isLast) {
      toast.success(t('cab.companyProfile.saved'), { description: t('cab.companyProfile.savedDetail') })
      if (returnTo) navigate(returnTo)
      return
    }
    goTo(index + 1)
  }

  const pageIssues = form ? getCabProfileIssues(t, form).filter((issue) => issue.page === page) : []
  const showIssues = issuesPage === page && pageIssues.length > 0

  // Deep link from an error elsewhere (?page=…&field=…): focus the field once the page is ready.
  const deepLinkField = params.get(FIELD_PARAM)
  useEffect(() => {
    if (loading || !form || !deepLinkField) return
    focusField(deepLinkField)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete(FIELD_PARAM)
      return next
    }, { replace: true })
  }, [deepLinkField, form, loading, setParams])

  /** Saves this page, then returns to the page that sent the user here. */
  const saveAndReturn = async () => {
    if (!returnTo || !(await save())) return
    markSaved(page)
    toast.success(t('cab.companyProfile.pageSaved', { page: t(`cab.companyProfile.pages.${page}.title`) }))
    navigate(returnTo)
  }

  const setupProps = form ? { form, onPatch, onPatchSetup } : null
  const progress = useMemo(() => Math.round((savedPages.filter((p) => PAGES.includes(p)).length / PAGES.length) * 100), [savedPages])

  return (
    <CabLayout tourId="cab-company-profile" tourSteps={tourSteps}>
      <CabHeader title={t('cab.companyProfile.title')} />
      <main className="cab-setup cab-profile flex flex-1 flex-col gap-5 overflow-auto page-main">
        <div ref={topRef} className="scroll-mt-4" />
        <CabTourStep steps={tourSteps} stepId="cab-company-profile-header">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-page-title text-text-primary">{t('cab.companyProfile.title')}</h1>
              <p className="mt-1 text-body text-text-secondary">{t('cab.companyProfile.subtitle')}</p>
            </div>
            <div className="w-full sm:max-w-[320px]">
              <div className="mb-2 flex items-baseline justify-between text-body-sm text-text-secondary">
                <span>{t('cab.companyProfile.progress', 'Profile completed')}</span>
                <span className="font-semibold text-primary tabular-nums">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-primary-50" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </CabTourStep>

        <ReturnToBanner />

        {loading ? (
          <p className="text-body-sm text-text-secondary">{t('common.loading')}</p>
        ) : !form || !setupProps ? (
          <p className="text-body-sm text-error-700">{error ?? t('errors.generic')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* Page list: a numbered rail on desktop, a scrollable strip on small screens */}
            <CabTourStep steps={tourSteps} stepId="cab-company-profile-steps">
              <nav aria-label={t('cab.companyProfile.pagesLabel', 'Profile pages')} className="min-w-0 xl:sticky xl:top-0 xl:self-start">
                <ol className="flex gap-1 overflow-x-auto scrollbar-hide rounded-lg border border-border-default bg-white p-2 shadow-card xl:flex-col xl:overflow-visible xl:p-3">
                  {PAGES.map((key, i) => {
                    const active = i === index
                    const done = savedPages.includes(key)
                    return (
                      <li key={key} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          aria-current={active ? 'step' : undefined}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start transition-colors',
                            active ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-bg-brand-light',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-7 shrink-0 items-center justify-center rounded-full text-body-sm font-bold tabular-nums',
                              active ? 'bg-white text-primary' : done ? 'bg-success-500 text-white' : 'bg-primary-50 text-primary',
                            )}
                          >
                            {done && !active ? <AppIcon icon={CheckIcon} size={14} /> : i + 1}
                          </span>
                          <span className="whitespace-nowrap text-body-sm font-semibold xl:whitespace-normal">{t(`cab.companyProfile.pages.${key}.title`)}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </nav>
            </CabTourStep>

            <div className="flex min-w-0 flex-col gap-5">
              <CabTourStep steps={tourSteps} stepId="cab-company-profile-body">
                <section className="rounded-lg border border-border-default bg-white p-4 shadow-card sm:p-6">
                  <OnboardingStepTransition key={page} direction={direction}>
                    <header className="mb-6 border-b border-border-default pb-4">
                      <p className="text-overline-caps text-text-brand">
                        {t('cab.companyProfile.pageOf', { current: index + 1, total: PAGES.length, defaultValue: 'Page {{current}} of {{total}}' })}
                      </p>
                      <h2 className="mt-1 text-section-title text-text-primary">{t(`cab.companyProfile.pages.${page}.title`)}</h2>
                      <p className="mt-1 text-body-sm text-text-secondary">{t(`cab.companyProfile.pages.${page}.hint`)}</p>
                    </header>

                    {page === 'identity' && (
                      <div className="space-y-6">
                        <div className="rounded-lg border border-border-default bg-bg-secondary p-4 sm:p-6">
                          <p className="mb-4 text-body-1-semibold text-text-primary">{t('cab.companyProfile.sections.account')}</p>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <TextField id="cab-profile-email" label={t('cab.companyProfile.email')} type="email" value={session?.user?.email ?? ''} disabled />
                            <TextField id="cab-profile-phone" label={t('cab.companyProfile.phone')} type="text" value={session?.user?.phone ?? ''} disabled />
                          </div>
                          <p className="mt-3 text-caption text-text-secondary">{t('cab.companyProfile.accountNote')}</p>
                        </div>
                        <CabProfileStep {...setupProps} />
                        <CabTaxIdentitySection
                          value={tax}
                          onChange={(next) => {
                            setTax(next)
                            setTaxErrors(validateCabTaxProfile(t, next))
                          }}
                          errors={taxErrors}
                          required={isSaudiCountry(taxCountry)}
                        />
                      </div>
                    )}
                    {page === 'locations' && <CabLocationsStep {...setupProps} />}
                    {page === 'accreditationStatus' && <CabAccreditationStatusStep {...setupProps} />}
                    {page === 'accreditationRecords' && <CabAccreditationRecordsStep {...setupProps} />}
                    {page === 'schemes' && <CabSchemesServicesStep {...setupProps} />}
                    {page === 'scope' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-end">
                          <ImportMenuButton
                            definitionKey="accreditation_scope"
                            size="sm"
                            onImported={() => {
                              getCabProfile()
                                .then(({ cab: profile }) => hydrate(profile))
                                .catch(() => undefined)
                            }}
                          />
                        </div>
                        <CabScopeStep {...setupProps} />
                      </div>
                    )}
                    {page === 'pricing' && <PricingConfigSection />}
                    {page === 'marks' && <CabMarksStep {...setupProps} />}
                    {page === 'certificate' && <CabCertificateStep {...setupProps} />}
                  </OnboardingStepTransition>
                </section>
              </CabTourStep>

              {showIssues && (
                <ErrorSummary
                  ref={summaryRef}
                  issues={pageIssues.map((issue) => ({ key: issue.fieldId, message: issue.message, fieldId: issue.fieldId }))}
                  footer={
                    !isLast && (
                      <button
                        type="button"
                        onClick={() => {
                          setIssuesPage(null)
                          goTo(index + 1)
                        }}
                        className="text-caption font-semibold text-error-700 underline underline-offset-2 hover:text-error-800"
                      >
                        {t('ui.errorSummary.continueAnyway')}
                      </button>
                    )
                  }
                />
              )}

              <CabTourStep steps={tourSteps} stepId="cab-company-profile-actions">
                <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-white/95 p-3 shadow-card backdrop-blur-sm sm:p-4">
                  <Button
                    variant="secondary"
                    onClick={() => goTo(index - 1)}
                    disabled={index === 0 || saving}
                    className="min-w-[120px]"
                    icon={<span className="inline-flex -scale-x-100"><AppIcon icon={ArrowRightIcon} size={20} className="rtl-flip" /></span>}
                  >
                    {t('common.back', 'Back')}
                  </Button>
                  {returnTo ? (
                    <Button variant="secondary" onClick={() => void saveAndReturn()} disabled={saving} className="order-last w-full sm:order-none sm:w-auto">
                      {t('ui.returnTo.saveAndBack')}
                      <span className="sr-only"> {returnToLabel(t, returnTo)}</span>
                    </Button>
                  ) : (
                  <span className="hidden text-body-sm text-text-secondary sm:block">
                    {isLast
                      ? t('cab.companyProfile.lastPageHint', 'Last page: finish to save the whole profile.')
                      : t('cab.companyProfile.nextHint', { page: t(`cab.companyProfile.pages.${PAGES[index + 1]}.title`), defaultValue: 'Next: {{page}}' })}
                  </span>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => void next()}
                    disabled={saving}
                    className="min-w-[180px]"
                    icon={!isLast && !saving ? <AppIcon icon={ArrowRightIcon} size={20} className="rtl-flip" /> : undefined}
                    iconPosition="end"
                  >
                    {saving
                      ? t('common.saving')
                      : isLast
                        ? t('cab.companyProfile.finish', 'Save and finish')
                        : t('cab.companyProfile.saveNext', 'Save and next')}
                  </Button>
                </div>
              </CabTourStep>
            </div>
          </div>
        )}
      </main>
    </CabLayout>
  )
}
