import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NeedHelpCard } from '@/components/dashboard/cab/NeedHelpCard'
import { getCurrentDraftApplication } from '@/lib/api/applicationDraftApi'
import { type ApplicationDraftForm, isApplicationDraftComplete } from '@/lib/applicationDraftForm'
import { type StandardsScopeForm, isStandardsScopeComplete } from '@/lib/standardsScopeForm'
import { type SitesFacilitiesForm, isSitesFacilitiesComplete } from '@/lib/sitesFacilitiesForm'
import { type DocumentsForm, isDocumentsComplete } from '@/lib/documentsForm'
import { cn } from '@/lib/utils'

interface ReviewConfirmSidebarProps {
  form: ApplicationDraftForm
  standardsScopeForm: StandardsScopeForm
  sitesFacilitiesForm: SitesFacilitiesForm
  documentsForm: DocumentsForm
}

function ReadinessRing({ percent }: { percent: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)
  const { t } = useTranslation()

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <g transform="rotate(-90 70 70)">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef1f6" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </g>
      <text x="70" y="64" textAnchor="middle" style={{ fill: '#1a1a1a', fontSize: 26, fontWeight: 700 }}>
        {percent}%
      </text>
      <text x="70" y="86" textAnchor="middle" style={{ fill: '#8a96a8', fontSize: 12, fontWeight: 500 }}>
        {t('cab.applicationDraft.review.readiness.ready')}
      </text>
    </svg>
  )
}

function ReadinessChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[13px]">
      <span className={cn('size-1.5 shrink-0 rounded-full', done ? 'bg-success-500' : 'bg-[#d1d5db]')} aria-hidden />
      <span className={done ? 'text-neutral-700' : 'text-neutral-400'}>{label}</span>
    </li>
  )
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-neutral-500">{label}</span>
      <span className="max-w-[60%] truncate text-end font-semibold text-neutral-900">{value}</span>
    </div>
  )
}

/**
 * Replaces WorkflowProgressCard in the page's sidebar slot while on the
 * Review & Confirm step — same card width/style as the other step sidebars
 * (DocumentsSidebar etc.), stacked readiness + details + next steps +
 * support sections instead of the workflow timeline.
 */
export function ReviewConfirmSidebar({
  form,
  standardsScopeForm,
  sitesFacilitiesForm,
  documentsForm,
}: ReviewConfirmSidebarProps) {
  const { t } = useTranslation()
  // Reference of the draft being edited (order number once submitted).
  const [applicationReference, setApplicationReference] = useState('—')
  useEffect(() => {
    let cancelled = false
    getCurrentDraftApplication()
      .then((draft) => {
        if (!cancelled && draft) setApplicationReference(draft.reference)
      })
      .catch(() => {
        // Keep the placeholder.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const clientInfoComplete = isApplicationDraftComplete(form)
  const standardsComplete = isStandardsScopeComplete(standardsScopeForm)
  const sitesComplete = isSitesFacilitiesComplete(sitesFacilitiesForm)
  const documentsComplete = isDocumentsComplete(documentsForm)
  const allSectionsCompleted = clientInfoComplete && standardsComplete && sitesComplete && documentsComplete
  const multiSiteRuleApplied = Boolean(sitesFacilitiesForm.multiSiteRule)
  const readyForSubmission = allSectionsCompleted && multiSiteRuleApplied

  const readinessItems = [
    { key: 'allSectionsCompleted', done: allSectionsCompleted },
    { key: 'allDocumentsUploaded', done: documentsComplete },
    { key: 'multiSiteRuleApplied', done: multiSiteRuleApplied },
    { key: 'mandaysCalculated', done: multiSiteRuleApplied },
    { key: 'readyForSubmission', done: readyForSubmission },
  ] as const
  const readinessPercent = Math.round(
    (readinessItems.filter((item) => item.done).length / readinessItems.length) * 100
  )

  const standardsCount = standardsScopeForm.standards.length
  const totalSites = sitesFacilitiesForm.sites.length
  const estimatedMandays = sitesFacilitiesForm.multiSiteRule?.totalEstimatedMandays ?? 0
  // `form.applicationDate` is typed as `Date`, but after a sessionStorage
  // round trip (ApplicationDraftPage snapshot save/restore) it actually
  // comes back as a plain ISO string, and `Intl.DateTimeFormat.format()`
  // doesn't parse date strings the way `new Date(string)` does — so we
  // normalize through `new Date(...)` and guard against an invalid result
  // instead of trusting the declared type.
  const parsedApplicationDate = form.applicationDate ? new Date(form.applicationDate) : null
  const applicationDateLabel =
    parsedApplicationDate && !Number.isNaN(parsedApplicationDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'long', year: 'numeric' }).format(
          parsedApplicationDate
        )
      : '—'

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
      <div className="rounded-[var(--radius-md)] border border-alabaster-150 bg-white p-5">
        <h3 className="mb-4 text-[16px] font-semibold text-neutral-900">
          {t('cab.applicationDraft.review.readiness.title')}
        </h3>
        <div className="flex justify-center">
          <ReadinessRing percent={readinessPercent} />
        </div>
        <ul className="mt-5 space-y-2.5">
          {readinessItems.map((item) => (
            <ReadinessChecklistItem
              key={item.key}
              done={item.done}
              label={t(`cab.applicationDraft.review.readiness.checklist.${item.key}`)}
            />
          ))}
        </ul>
      </div>

      <div className="rounded-[var(--radius-md)] border border-alabaster-150 bg-white p-5">
        <h3 className="mb-4 text-[16px] font-semibold text-neutral-900">
          {t('cab.applicationDraft.review.details.title')}
        </h3>
        <div className="space-y-3">
          <DetailField label={t('cab.applicationDraft.review.details.applicationId')} value={applicationReference} />
          <DetailField
            label={t('cab.applicationDraft.review.details.applicationType')}
            value={form.applicationType || '—'}
          />
          <DetailField
            label={t('cab.applicationDraft.review.details.standardsApplied')}
            value={t('cab.applicationDraft.review.details.standardsCount', { count: standardsCount })}
          />
          <DetailField label={t('cab.applicationDraft.review.details.totalSites')} value={totalSites} />
          <DetailField
            label={t('cab.applicationDraft.review.details.estimatedMandays')}
            value={`${estimatedMandays.toFixed(1)} ${t('cab.applicationDraft.review.summary.mandaysUnit')}`}
          />
          <DetailField label={t('cab.applicationDraft.review.details.applicationDate')} value={applicationDateLabel} />
          <DetailField
            label={t('cab.applicationDraft.review.details.status')}
            value={
              <span className="inline-flex items-center rounded-[6px] bg-neutral-50 px-2 py-0.5 text-[12px] font-semibold text-neutral-600">
                {t('cab.applicationDraft.review.details.draft')}
              </span>
            }
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-alabaster-150 bg-white p-5">
        <h3 className="mb-3 text-[16px] font-semibold text-neutral-900">
          {t('cab.applicationDraft.review.nextSteps.title')}
        </h3>
        <ol className="space-y-2.5">
          {['item1', 'item2', 'item3', 'item4'].map((item, index) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px] text-neutral-600">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-25 text-[11px] font-semibold text-primary">
                {index + 1}
              </span>
              <span className="pt-px">{t(`cab.applicationDraft.review.nextSteps.${item}`)}</span>
            </li>
          ))}
        </ol>
      </div>

      <NeedHelpCard
        title={t('cab.applicationDraft.review.needHelp.title')}
        description={t('cab.applicationDraft.review.needHelp.description')}
        contactSupportLabel={t('cab.applicationDraft.review.needHelp.contactSupport')}
      />
    </aside>
  )
}