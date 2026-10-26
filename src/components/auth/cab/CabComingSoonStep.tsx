import { useTranslation } from 'react-i18next'

interface CabComingSoonStepProps {
  titleKey: string
}

/** Steps 2-4 of the CAB flow are being built one page at a time — this placeholder
 * holds their spot in the nav until each is designed. */
export function CabComingSoonStep({ titleKey }: CabComingSoonStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-300 py-16 text-center">
      <p className="text-body-1-medium text-neutral-800">{t(titleKey)}</p>
      <p className="text-body-2 text-neutral-600">{t('register.cab.comingSoon')}</p>
    </div>
  )
}