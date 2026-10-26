import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { getCabSetupReviewSections, requiresAccreditationRecords } from '@/lib/cabSetupForm'
import { cn } from '@/lib/utils'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

type RowStatus = 'READY' | 'REVIEW' | 'MISSING'

interface CabReviewActivateStepProps {
  form: UnifiedOnboardingForm
  onGoToStep: (step: number, fieldId?: string) => void
}

const STATUS_STYLES: Record<RowStatus, string> = {
  READY: 'bg-success-50 text-success-600',
  REVIEW: 'bg-warning-50 text-warning-700',
  MISSING: 'bg-error-50 text-error-500',
}

export function CabReviewActivateStep({ form, onGoToStep }: CabReviewActivateStepProps) {
  const { t } = useTranslation()
  const setup = form.cabSetup

  const sections = useMemo(
    () =>
      getCabSetupReviewSections(setup, {
        legalEntityName: form.legalEntityName,
        tradingName: form.tradingName,
        registrationNumber: form.registrationNumber,
        website: form.website,
        country: form.country,
        city: form.city,
        address: form.address,
        languages: form.languages,
      }),
    [form.address, form.city, form.country, form.languages, form.legalEntityName, form.registrationNumber, form.tradingName, form.website, setup],
  )

  const readyDetails: Record<string, string> = {
    identity: form.legalEntityName.trim() || t('cab.setup.review.notProvided'),
    locations: t('cab.setup.review.locationsDetail', {
      count: setup.hasAdditionalLocations ? setup.locations.length : 0,
    }),
    accreditation: requiresAccreditationRecords(setup)
      ? t('cab.setup.review.accreditationDetail', { count: setup.accreditationRecords.length })
      : t('cab.setup.review.unaccredited'),
    schemes: t('cab.setup.review.schemesCount', {
      count: setup.schemes.length + setup.customSchemes.filter((scheme) => scheme.name.trim()).length,
    }),
    scope: t('cab.setup.review.scopesCount', { count: setup.scopes.length }),
    marks: t('cab.setup.review.configured'),
    certificate: t('cab.setup.review.configured'),
  }

  return (
    <div className="w-full space-y-6">
      <div className="overflow-hidden rounded-md border border-neutral-300 bg-white shadow-sm">
        {sections.map((section) => {
          const requiredMissing = section.issues.some((issue) => issue.kind === 'required')
          const status: RowStatus = section.issues.length === 0 ? 'READY' : requiredMissing ? 'MISSING' : 'REVIEW'
          const detail =
            status === 'READY'
              ? readyDetails[section.key]
              : requiredMissing
                ? t('cab.setup.review.issues.required')
                : t('cab.setup.review.issues.invalid')
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => onGoToStep(section.step, section.issues[0]?.fieldId)}
              className="group flex w-full items-center justify-between gap-4 border-b border-neutral-300 px-5 py-4 text-start transition-all last:border-b-0 hover:bg-neutral-50/80 active:bg-neutral-100"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-body font-bold text-[var(--cab-ink)] group-hover:text-[var(--cab-primary)]">
                    {t(`cab.setup.review.rows.${section.key}`)}
                  </p>
                  <span className="text-caption text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
                    ✎
                  </span>
                </div>
                <p className="truncate text-caption text-[var(--cab-muted)]">{detail}</p>
                {status !== 'READY' && (
                  <p className="mt-1 text-caption font-medium text-[var(--cab-primary)]">
                    {t('cab.setup.review.issues.fixHint')}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-caption font-semibold',
                  STATUS_STYLES[status],
                )}
              >
                {t(`cab.setup.review.status.${status}`)}
              </span>
            </button>
          )
        })}
      </div>

      <SetupNote>{t('cab.setup.review.nextStepNote')}</SetupNote>
    </div>
  )
}
