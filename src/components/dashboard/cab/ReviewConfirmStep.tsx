import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { SectionTitle } from '@/components/dashboard/SectionTitle'
import { Card } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, AirplaneIcon, CorrectiveActionIcon, EditIcon, RoadIcon, ShieldIcon, TrainIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { type ApplicationDraftForm, isApplicationDraftComplete } from '@/lib/applicationDraftForm'
import { type StandardsScopeForm, isStandardsScopeComplete } from '@/lib/standardsScopeForm'
import { type SitesFacilitiesForm, isSitesFacilitiesComplete } from '@/lib/sitesFacilitiesForm'
import { type DocumentsForm, documentCompletionCounts, isDocumentsComplete } from '@/lib/documentsForm'
import { STANDARD_SCHEMA_OPTIONS } from '@/lib/api/applicationDraftApi'
import { APPLICABLE_RULE_OPTIONS } from '@/lib/multiSiteRuleForm'
import { cn } from '@/lib/utils'

const TRAVEL_ICON_BY_REQUIREMENT: Record<string, typeof AirplaneIcon> = {
  'Airplane Required': AirplaneIcon,
  'Train Required': TrainIcon,
  'Airplane & Train Required': RoadIcon,
}

interface ReviewConfirmStepProps {
  form: ApplicationDraftForm
  standardsScopeForm: StandardsScopeForm
  sitesFacilitiesForm: SitesFacilitiesForm
  documentsForm: DocumentsForm
  /** Jumps the wizard back to one of the earlier steps — reuses the same setStep the stepper tabs use. */
  onEditStep: (step: 1 | 2 | 3 | 4) => void
}

type ChecklistSectionKey =
  | 'clientInformation'
  | 'standardsScope'
  | 'sitesFacilities'
  | 'documents'
  | 'reviewConfirm'

/** Small inline status indicator for the checklist table — same dot+label
 *  language as the internal CAB reviewer's checklist pill, kept local since
 *  it only needs the two states this step can be in. */
function ChecklistStatusLabel({ complete, label }: { complete: boolean; label: string }) {
  const color = complete ? '#22c55e' : '#d97706'
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color }}>
      <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0" aria-hidden>
        <circle cx="7" cy="7" r="6" fill={complete ? color : 'none'} stroke={color} strokeWidth="1.5" />
        {complete && (
          <path d="M4.2 7.1l1.8 1.8 3.8-3.9" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {label}
    </span>
  )
}

function OverviewPanel({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-[var(--radius-md)] border border-alabaster-150 bg-white p-4">
      <h3 className="mb-3 text-[14px] font-bold text-neutral-900">{title}</h3>
      <div className="flex-1 space-y-2.5">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="flex min-w-0 items-center gap-2 text-neutral-500">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-semibold text-neutral-900">{value}</span>
    </div>
  )
}

export function ReviewConfirmStep({
  form,
  standardsScopeForm,
  sitesFacilitiesForm,
  documentsForm,
  onEditStep,
}: ReviewConfirmStepProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const multiSiteRule = sitesFacilitiesForm.multiSiteRule
  const totalSites = sitesFacilitiesForm.sites.length
  const headOfficeCount = multiSiteRule ? multiSiteRule.rows.filter((row) => row.isHeadOffice).length : 0
  const includedRows = multiSiteRule ? multiSiteRule.rows.filter((row) => row.included) : []
  const headOfficeRow = multiSiteRule?.rows.find((row) => row.isHeadOffice)

  const docCounts = documentCompletionCounts(documentsForm)
  const totalDocuments = documentsForm.documents.length
  const notApplicableDocuments = documentsForm.documents.filter((d) => d.requirement === 'notApplicable').length
  const pendingDocuments = Math.max(0, totalDocuments - docCounts.uploaded - notApplicableDocuments)
  const percent = (count: number) => (totalDocuments > 0 ? Math.round((count / totalDocuments) * 100) : 0)

  const checklist: { key: ChecklistSectionKey; step?: 1 | 2 | 3 | 4; complete: boolean }[] = [
    { key: 'clientInformation', step: 1, complete: isApplicationDraftComplete(form) },
    { key: 'standardsScope', step: 2, complete: isStandardsScopeComplete(standardsScopeForm) },
    { key: 'sitesFacilities', step: 3, complete: isSitesFacilitiesComplete(sitesFacilitiesForm) },
    { key: 'documents', step: 4, complete: isDocumentsComplete(documentsForm) },
    { key: 'reviewConfirm', complete: false },
  ]
  const completedCount = checklist.filter((row) => row.complete).length

  const standardNames = standardsScopeForm.standards.map((s) => {
    const option = STANDARD_SCHEMA_OPTIONS.find((o) => o.value === s.standard)
    return option ? option.name.split(':')[0] : s.standard
  })

  const structureShortLabel = multiSiteRule
    ? t(`cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptions.${multiSiteRule.form.structureType}`)
        .replace(/^Multi-site \((.+) System\)$/, '$1')
        .replace(/^Multi-site \((.+)\)$/, '$1')
    : t('cab.applicationDraft.review.summary.singleSite')
  const ruleShortLabel = multiSiteRule
    ? (APPLICABLE_RULE_OPTIONS.find((o) => o.value === multiSiteRule.form.applicableRule)?.label ?? '')
        .split(' (')[0]
        .split(':')[0]
    : ''

  const openMultiSiteRulePreview = () => {
    if (!multiSiteRule) return
    navigate('/cab/applications/draft/sites/multi-site-rule/preview', { state: { multiSiteRule } })
  }

  const travelSitesCount = (requirement: string) =>
    includedRows.filter((row) => row.travelRequirements.includes(requirement)).length
  const permitRequiredCount = includedRows.filter((row) => row.permitRequired).length

  return (
    <div className="space-y-5">
      {/* Review Checklist */}
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-alabaster-150 bg-white">
        <div className="flex items-center gap-3 p-5">
          <SectionTitle
            title={t('cab.applicationDraft.review.checklist.title')}
            subtitle={t('cab.applicationDraft.review.checklist.subtitle')}
            className="flex-1"
          />
          <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-success-500">
            {t('cab.applicationDraft.review.checklist.completedBadge', {
              completed: completedCount,
              total: checklist.length,
            })}
          </span>
        </div>
        <div className="h-px bg-alabaster-150" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-start">
            <thead>
              <tr className="bg-primary text-[13px] font-medium text-white">
                <th className="w-12 p-4 text-center">{t('cab.applicationDraft.review.checklist.columns.number')}</th>
                <th className="p-4 text-start">{t('cab.applicationDraft.review.checklist.columns.section')}</th>
                <th className="p-4 text-start">{t('cab.applicationDraft.review.checklist.columns.description')}</th>
                <th className="p-4 text-center">{t('cab.applicationDraft.review.checklist.columns.status')}</th>
                <th className="w-24 p-4 text-center">{t('cab.applicationDraft.review.checklist.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((row, index) => (
                <tr
                  key={row.key}
                  className={cn('border-b border-alabaster-150 text-[14px]', index % 2 === 1 ? 'bg-neutral-25' : 'bg-white')}
                >
                  <td className="p-4 text-center text-neutral-500">{index + 1}</td>
                  <td className="p-4 font-semibold text-neutral-900">
                    {t(`cab.applicationDraft.review.checklist.sections.${row.key}.title`)}
                  </td>
                  <td className="p-4 text-neutral-500">
                    {t(`cab.applicationDraft.review.checklist.sections.${row.key}.description`)}
                  </td>
                  <td className="p-4 text-center">
                    <ChecklistStatusLabel
                      complete={row.complete}
                      label={t(
                        `cab.applicationDraft.review.checklist.status.${row.complete ? 'complete' : 'inProgress'}`
                      )}
                    />
                  </td>
                  <td className="p-4 text-center">
                    {row.step ? (
                      <button
                        type="button"
                        onClick={() => onEditStep(row.step!)}
                        className="mx-auto flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-alabaster-150 text-neutral-500 hover:bg-neutral-50 hover:text-primary"
                        aria-label={t('common.edit')}
                      >
                        <AppIcon icon={EditIcon} size={16} />
                      </button>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Information Summary */}
      <div className="rounded-[var(--radius-md)] border border-alabaster-150 bg-white p-5">
        <SectionTitle title={t('cab.applicationDraft.review.summary.title')} className="mb-4" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card title={t('cab.applicationDraft.review.summary.standardsApplied', { count: standardNames.length })}>
            <p className="text-[15px] font-bold text-neutral-900">
              {standardNames.length > 0 ? standardNames.join(', ') : '—'}
            </p>
          </Card>

          <Card title={t('cab.applicationDraft.review.summary.totalSites')}>
            <p className="text-[24px] font-bold leading-none text-neutral-900">{totalSites}</p>
            {multiSiteRule && (
              <p className="mt-1 text-[12px] text-neutral-500">
                {t('cab.applicationDraft.review.summary.totalSitesHint', {
                  headOffice: headOfficeCount,
                  others: totalSites - headOfficeCount,
                })}
              </p>
            )}
          </Card>

          <Card title={t('cab.applicationDraft.review.summary.multiSiteStructure')}>
            <p className="text-[15px] font-bold text-neutral-900">
              {structureShortLabel}
              {ruleShortLabel ? `, ${ruleShortLabel}` : ''}
            </p>
          </Card>

          <Card title={t('cab.applicationDraft.review.summary.totalEstimatedMandays')} highlight>
            <p className="text-[24px] font-bold leading-none text-primary">
              {(multiSiteRule?.totalEstimatedMandays ?? 0).toFixed(1)}{' '}
              <span className="text-[13px] font-normal text-neutral-500">
                {t('cab.applicationDraft.review.summary.mandaysUnit')}
              </span>
            </p>
            <p className="mt-1 text-[12px] text-neutral-500">{t('cab.applicationDraft.review.summary.calculated')}</p>
          </Card>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <OverviewPanel
            title={t('cab.applicationDraft.review.sitesSampling.title')}
            footer={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full rounded-[8px] text-[12px] font-semibold"
                disabled={!multiSiteRule}
                onClick={openMultiSiteRulePreview}
              >
                {t('cab.applicationDraft.review.sitesSampling.viewDetails')}
              </Button>
            }
          >
            <InfoRow label={t('cab.applicationDraft.review.sitesSampling.totalSites')} value={totalSites} />
            <InfoRow
              label={t('cab.applicationDraft.review.sitesSampling.sitesToBeSampled')}
              value={t('cab.applicationDraft.review.documentsOverview.percentValue', {
                count: includedRows.length,
                percent: totalSites > 0 ? Math.round((includedRows.length / totalSites) * 100) : 0,
              })}
            />
            <InfoRow
              label={t('cab.applicationDraft.review.sitesSampling.samplingMethod')}
              value={ruleShortLabel || '—'}
            />
            <InfoRow
              label={t('cab.applicationDraft.review.sitesSampling.samplingFactor')}
              value={(headOfficeRow?.samplingFactor ?? 1).toFixed(1)}
            />
          </OverviewPanel>

          <OverviewPanel
            title={t('cab.applicationDraft.review.travelAccess.title')}
            footer={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full rounded-[8px] text-[12px] font-semibold"
                disabled={!multiSiteRule}
                onClick={openMultiSiteRulePreview}
              >
                {t('cab.applicationDraft.review.travelAccess.viewDetails')}
              </Button>
            }
          >
            <InfoRow
              icon={<AppIcon icon={TRAVEL_ICON_BY_REQUIREMENT['Airplane Required']} size={16} className="text-neutral-400" />}
              label={t('cab.applicationDraft.review.travelAccess.airplaneRequired')}
              value={t('cab.applicationDraft.review.travelAccess.sitesCount', { count: travelSitesCount('Airplane Required') })}
            />
            <InfoRow
              icon={<AppIcon icon={TRAVEL_ICON_BY_REQUIREMENT['Train Required']} size={16} className="text-neutral-400" />}
              label={t('cab.applicationDraft.review.travelAccess.trainRequired')}
              value={t('cab.applicationDraft.review.travelAccess.sitesCount', { count: travelSitesCount('Train Required') })}
            />
            <InfoRow
              icon={<AppIcon icon={TRAVEL_ICON_BY_REQUIREMENT['Airplane & Train Required']} size={16} className="text-neutral-400" />}
              label={t('cab.applicationDraft.review.travelAccess.airplaneAndTrainRequired')}
              value={t('cab.applicationDraft.review.travelAccess.sitesCount', { count: travelSitesCount('Airplane & Train Required') })}
            />
            <InfoRow
              icon={<AppIcon icon={ShieldIcon} size={16} className="text-neutral-400" />}
              label={t('cab.applicationDraft.review.travelAccess.permitRequired')}
              value={t('cab.applicationDraft.review.travelAccess.sitesCount', { count: permitRequiredCount })}
            />
          </OverviewPanel>

          <OverviewPanel
            title={t('cab.applicationDraft.review.documentsOverview.title')}
            footer={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full rounded-[8px] text-[12px] font-semibold"
                onClick={() => onEditStep(4)}
              >
                {t('cab.applicationDraft.review.documentsOverview.viewDocuments')}
              </Button>
            }
          >
            <InfoRow label={t('cab.applicationDraft.review.documentsOverview.totalRequired')} value={totalDocuments} />
            <InfoRow
              label={t('cab.applicationDraft.review.documentsOverview.uploaded')}
              value={
                <span className="text-success-600">
                  {t('cab.applicationDraft.review.documentsOverview.percentValue', {
                    count: docCounts.uploaded,
                    percent: percent(docCounts.uploaded),
                  })}
                </span>
              }
            />
            <InfoRow
              label={t('cab.applicationDraft.review.documentsOverview.pending')}
              value={
                <span className="text-warning-500">
                  {t('cab.applicationDraft.review.documentsOverview.percentValue', {
                    count: pendingDocuments,
                    percent: percent(pendingDocuments),
                  })}
                </span>
              }
            />
            <InfoRow
              label={t('cab.applicationDraft.review.documentsOverview.notApplicable')}
              value={notApplicableDocuments}
            />
          </OverviewPanel>
        </div>
      </div>

      {/* Important Notes */}
      <div className="flex items-start gap-3 rounded-[12px] border border-[#fde3a7] bg-warning-50 p-4">
        <AppIcon icon={CorrectiveActionIcon} size={20} className="mt-0.5 shrink-0 text-warning-500" />
        <div>
          <p className="text-[14px] font-bold text-neutral-900">{t('cab.applicationDraft.review.importantNotes.title')}</p>
          <ul className="mt-2 space-y-1.5">
            {['item1', 'item2', 'item3', 'item4'].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] leading-relaxed text-neutral-700">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-neutral-500" aria-hidden />
                {t(`cab.applicationDraft.review.importantNotes.${item}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}