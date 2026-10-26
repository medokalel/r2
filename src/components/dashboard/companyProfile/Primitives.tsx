import { useTranslation } from 'react-i18next'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { SectionTitle } from '@/components/dashboard/SectionTitle'
import { AppIcon, SuccessCircleIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { STEPS, STEP_NUMBERS, type StepKey } from './types'

export function CardHeader({ title }: { title: string }) {
  return <SectionTitle title={title} />
}

export function Breadcrumb() {
  const { t } = useTranslation()
  return (
    <nav className="flex items-center gap-2 py-1" aria-label={t('common.breadcrumb')}>
      <span className="text-body-sm font-normal leading-none text-neutral-500">
        {t('companyProfile.breadcrumb.settings')}
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="rtl-flip shrink-0 text-neutral-500">
        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-body-sm font-bold leading-none text-neutral-800">
        {t('companyProfile.breadcrumb.current')}
      </span>
    </nav>
  )
}

interface StepperProps {
  activeStep: StepKey
  onStepClick: (step: StepKey) => void
}

export function Stepper({ activeStep, onStepClick }: StepperProps) {
  const { t } = useTranslation()
  const activeIndex = STEPS.indexOf(activeStep)
  return (
    <div className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto scrollbar-hide sm:justify-center sm:gap-3">
      {STEPS.map((step, index) => {
        // Completed steps stay highlighted like the active one
        const highlighted = index <= activeIndex
        return (
          <div key={step} className="flex shrink-0 items-center gap-2 sm:gap-3">
            {index > 0 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className={cn(
                  'rtl-flip shrink-0',
                  highlighted ? 'text-primary' : 'text-neutral-500'
                )}
                aria-hidden
              >
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <button
              type="button"
              onClick={() => onStepClick(step)}
              className={cn(
                'flex shrink-0 items-center justify-center gap-2 rounded-full px-3 py-2.5 transition-colors sm:gap-3 sm:px-5 sm:py-4',
                highlighted
                  ? 'border border-primary bg-primary-50'
                  : 'border border-neutral-100 bg-neutral-25 hover:border-primary/40 hover:bg-primary-25'
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-body-sm font-medium rtl:order-first sm:size-8 sm:text-body',
                  highlighted ? 'bg-white text-primary' : 'bg-primary-25 text-neutral-700'
                )}
              >
                {STEP_NUMBERS[step]}
              </span>
              <span className={cn('whitespace-nowrap text-body font-medium leading-[1.6] rtl:order-last sm:text-body-lg', highlighted ? 'text-primary' : 'text-neutral-700')}>
                {t(`companyProfile.steps.${step}`)}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function CompletedStepRow({ label }: { label: string }) {
  return (
    <div className="flex h-14 items-center justify-between rounded-lg border border-success-500 bg-success-25 px-4">
      <div className="flex items-center gap-2">
        <AppIcon icon={SuccessCircleIcon} size={20} className="text-success-600" />
        <span className="text-body font-medium leading-[1.6] text-success-600">{label}</span>
      </div>
      <SelectDropdownIcon className="text-success-600" />
    </div>
  )
}

export function GoogleMapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.0396 17.8408C12.6813 17.8408 12.3229 17.7658 12.0312 17.6242L7.65625 15.4325C7.40625 15.3075 6.91458 15.3158 6.67292 15.4575L4.70625 16.5825C3.85625 17.0658 2.98125 17.1325 2.32292 16.7408C1.65625 16.3575 1.28125 15.5742 1.28125 14.5908V6.49082C1.28125 5.73249 1.78125 4.87415 2.43958 4.49915L6.04792 2.43249C6.65625 2.08249 7.58125 2.05749 8.20625 2.37415L12.5813 4.56582C12.8313 4.69082 13.3146 4.67415 13.5646 4.54082L15.5229 3.42415C16.3729 2.94082 17.2479 2.87415 17.9063 3.26582C18.5729 3.64915 18.9479 4.43249 18.9479 5.41582V13.5242C18.9479 14.2825 18.4479 15.1408 17.7896 15.5158L14.1813 17.5825C13.8646 17.7492 13.4479 17.8408 13.0396 17.8408ZM7.19792 14.0992C7.55625 14.0992 7.91458 14.1742 8.20625 14.3158L12.5813 16.5075C12.8313 16.6325 13.3146 16.6158 13.5646 16.4825L17.1729 14.4158C17.4396 14.2658 17.6979 13.8158 17.6979 13.5158V5.40749C17.6979 4.88249 17.5479 4.49082 17.2729 4.34082C17.0062 4.19082 16.5896 4.24915 16.1396 4.50749L14.1813 5.62415C13.5729 5.97415 12.6479 5.99915 12.0229 5.68249L7.64792 3.49082C7.39792 3.36582 6.91458 3.38249 6.66458 3.51582L3.05625 5.58249C2.78958 5.73249 2.53125 6.18249 2.53125 6.49082V14.5992C2.53125 15.1242 2.68125 15.5158 2.94792 15.6658C3.21458 15.8242 3.63125 15.7575 4.08958 15.4992L6.04792 14.3825C6.37292 14.1908 6.78958 14.0992 7.19792 14.0992Z" fill="#1236A3"/>
      <path d="M7.13281 14.7923C6.79115 14.7923 6.50781 14.509 6.50781 14.1673V3.33398C6.50781 2.99232 6.79115 2.70898 7.13281 2.70898C7.47448 2.70898 7.75781 2.99232 7.75781 3.33398V14.1673C7.75781 14.509 7.47448 14.7923 7.13281 14.7923Z" fill="#1236A3"/>
      <path d="M13.1094 17.2926C12.7677 17.2926 12.4844 17.0092 12.4844 16.6676V5.51758C12.4844 5.17591 12.7677 4.89258 13.1094 4.89258C13.451 4.89258 13.7344 5.17591 13.7344 5.51758V16.6676C13.7344 17.0092 13.451 17.2926 13.1094 17.2926Z" fill="#1236A3"/>
    </svg>
  )
}