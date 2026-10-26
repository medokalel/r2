import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

function InfoCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="#e74d3c" strokeWidth="1.2" />
      <path d="M8 5.5v.5M8 7v4" stroke="#e74d3c" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MessageMinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5.33 13.33 2 14l.67-3.33A6 6 0 1 1 5.33 13.33Z" stroke="#6b7280" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 8h4" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

const rejectionReasons = [
  { key: 'commercialExpired', num: '01' },
  { key: 'nonCompliance', num: '02' },
] as const

export function RejectedStep() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-5">
      {/* Banner */}
      <div className="flex items-center justify-between gap-5 rounded-lg bg-[rgba(252,234,232,0.5)] px-5 py-6">
        <div className="flex items-center gap-5">
          <img src="/icon-rejected.svg" alt="" width={96} height={96} aria-hidden className="shrink-0" />
          <div>
            <h2 className="text-[24px] font-medium leading-[1.6] tracking-[-0.6px] text-error-500">
              {t('accreditation.status.rejected.title')}
            </h2>
            <p className="text-body-lg font-light leading-[1.6] text-neutral-600">
              {t('accreditation.status.rejected.subtitle')}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="lg" className="shrink-0 rounded-md text-body">
          {t('accreditation.status.rejected.contactUs')}
        </Button>
      </div>

      {/* Rejection file section */}
      <div className="overflow-clip rounded-lg border border-neutral-100 bg-neutral-25">
        {/* Section header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-5 py-6 text-body">
          <p className="font-bold text-neutral-600">
            {t('accreditation.status.rejected.fileTitle')}
          </p>
          <div className="flex items-center gap-1 text-neutral-600">
            <span className="font-bold text-primary">
              {t('accreditation.status.rejected.reviewDate')}
            </span>
            <span className="font-semibold">04 : 24</span>
            <span className="font-semibold">2026 / 01 / 26</span>
          </div>
        </div>

        {/* Rejection items */}
        <div className="flex flex-col gap-10 px-5 pb-10 pt-10">
          {rejectionReasons.map(({ key, num }, index) => (
            <Fragment key={key}>
              {index > 0 && <hr className="border-neutral-100" />}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-[82px] shrink-0 items-center justify-center rounded-md bg-neutral-100 text-body-lg font-medium leading-[1.6] text-neutral-900">
                  {num}
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
                  <p className="text-body-lg font-medium leading-[1.6] tracking-[-0.6px] text-neutral-900">
                    {t(`accreditation.status.rejected.reasons.${key}.title`)}
                  </p>
                  <p className="text-body leading-[1.6] text-neutral-600">
                    {t(`accreditation.status.rejected.reasons.${key}.description`)}
                  </p>
                  <div className="flex items-center gap-1 rounded-md bg-[rgba(252,234,232,0.5)] p-2">
                    <InfoCircleIcon />
                    <span className="text-body-sm leading-[1.6] text-error-700">
                      {t(`accreditation.status.rejected.reasons.${key}.tag`)}
                    </span>
                  </div>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Are you ready for correction? */}
      <div className="overflow-clip rounded-lg border border-neutral-100 bg-neutral-25 py-10">
        <div className="mx-auto flex max-w-[616px] flex-col items-center gap-5 text-center">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-[24px] font-medium leading-[1.6] tracking-[-0.6px] text-neutral-900">
              {t('accreditation.status.rejected.correctionTitle')}
            </h3>
            <p className="whitespace-pre-line text-body font-light leading-[1.6] text-neutral-600">
              {t('accreditation.status.rejected.correctionSubtitle')}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button variant="primary" size="lg" className="w-[293px] rounded-md">
              {t('accreditation.status.rejected.editAndResubmit')}
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-body leading-[1.6] text-neutral-600">
                {t('accreditation.status.rejected.downloadReportSuffix')}
              </span>
              <button type="button" className="text-body-sm font-bold leading-[1.6] text-neutral-600 underline underline-offset-2">
                {t('accreditation.status.rejected.downloadReport')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help footer strip */}
      <div className="flex items-center justify-center gap-4 rounded-lg border border-primary-100 bg-primary-25 py-5">
        <button type="button" className="text-body-sm font-medium leading-[1.6] text-neutral-900 underline underline-offset-2">
          {t('accreditation.status.rejected.talkToSupport')}
        </button>
        <div className="h-[29px] w-px bg-neutral-100" />
        <div className="flex items-center gap-3">
          <p className="text-body-sm font-normal leading-[1.6] text-neutral-600">
            {t('accreditation.status.rejected.helpText')}
          </p>
          <MessageMinusIcon />
        </div>
      </div>
    </div>
  )
}
