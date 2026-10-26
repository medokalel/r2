import { useTranslation } from 'react-i18next'
import { AppIcon, CalendarIcon, FileTextIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

function ClientIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3.5 7.5L12 3l8.5 4.5V16.5L12 21l-8.5-4.5V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13.5a7.5 7.5 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.4 7.4 0 0 0-2.6-1.5L14 2h-4l-.4 2.3a7.4 7.4 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.5 7.5 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7c.75.66 1.63 1.17 2.6 1.5L10 22h4l.4-2.3a7.4 7.4 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChecklistDocIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6.5 3h8l4 4v13.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12.5l1.8 1.8 3.7-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SummaryField({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-caption font-semibold text-text-primary">{label}</p>
        <div className="text-body-sm font-bold leading-snug text-text-primary">{value}</div>
      </div>
    </div>
  )
}

interface ApplicationSummaryCardProps {
  applicationNumber: string
  clientName: string
  applicationType: string
  certificationBody: string
  primaryStandard: string
  receivedOn?: string | null
  statusLabel: string
  statusClassName?: string
}

export function ApplicationSummaryCard({
  applicationNumber, clientName, applicationType, certificationBody, primaryStandard,
  receivedOn, statusLabel, statusClassName = 'bg-primary-50 text-primary',
}: ApplicationSummaryCardProps) {
  const { t, i18n } = useTranslation()
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-neutral-100 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary">
          <AppIcon icon={FileTextIcon} size={28} />
        </span>
        <h2 className="break-words text-[24px] font-bold leading-none text-text-primary sm:text-[28px]">{applicationNumber}</h2>
        <span className={cn('rounded-full px-2.5 py-0.5 text-caption font-semibold', statusClassName)}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-6 flex min-w-0 flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <SummaryField icon={<ClientIcon />} label={t('cab.applications.review.summary.client')} value={clientName} />
        <SummaryField icon={<BoxIcon />} label={t('cab.applications.review.summary.applicationType')} value={applicationType} />
        <SummaryField icon={<GearIcon />} label={t('cab.applications.review.summary.certificationBody')} value={certificationBody} />
        <SummaryField icon={<ChecklistDocIcon />} label={t('cab.applications.review.summary.primaryStandard')} value={primaryStandard} />
        <SummaryField
          icon={<AppIcon icon={CalendarIcon} size={18} />}
          label={t('cab.applications.review.summary.receivedOn')}
          value={receivedOn ? new Date(receivedOn).toLocaleString(i18n.language) : notSet()}
        />
      </div>
    </section>
  )
}
