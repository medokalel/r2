import { useTranslation } from 'react-i18next'

export function ApprovedStep() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
      <img src="/icon-approved.svg" alt="" width={186} height={186} aria-hidden />
      <div className="space-y-3">
        <h2 className="text-h2 font-semibold leading-[1.6] text-[#64d90b]">
          {t('accreditation.status.approved.title')}
        </h2>
        <p className="text-body-2 leading-[1.6] text-neutral-600">
          {t('accreditation.status.approved.subtitle')}
        </p>
      </div>
    </div>
  )
}
