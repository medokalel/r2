import { useTranslation } from 'react-i18next'
import { AppIcon, TourGuideIcon } from '@/components/icons'
import { Tooltip } from '@/components/ui/Tooltip'
import { useOptionalTour } from '@/context/tour/useTour'

export function StartTourButton() {
  const { t } = useTranslation()
  const tour = useOptionalTour()

  if (!tour) return null

  return (
    <Tooltip label={t('cab.header.takeTour')}>
      <button
        type="button"
        onClick={tour.startTour}
        className="flex size-9 items-center justify-center rounded-full border border-neutral-100 text-primary transition hover:bg-primary-50 hover:border-primary"
        aria-label={t('cab.header.takeTour')}
      >
        <AppIcon icon={TourGuideIcon} size={20} />
      </button>
    </Tooltip>
  )
}
