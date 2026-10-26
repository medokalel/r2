import { useTranslation } from 'react-i18next'

export function UnderReviewStep() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
      <img src="/icon-hourglass.svg" alt="" width={213} height={247} aria-hidden />
      <div className="max-w-[600px] space-y-3">
        <h2 className="text-h2 font-semibold leading-[1.6] text-warning-700">
          {t('accreditation.status.underReview.title')}
        </h2>
        <p className="text-body-2 leading-[1.6] text-neutral-600">
          {t('accreditation.status.underReview.subtitle')}
        </p>
      </div>
    </div>
  )
}
