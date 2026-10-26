import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useCabCompanyProfileTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()
  const step = (id: string, n: number, key: string, title: string, description: string, side: 'top' | 'bottom' = 'bottom'): TourStepConfig => ({
    id,
    step: n,
    totalSteps: 4,
    title: t(`cab.companyProfile.tour.${key}.title`, title),
    description: t(`cab.companyProfile.tour.${key}.description`, description),
    side,
    align: 'start',
  })
  return [
    step('cab-company-profile-header', 1, 'header', 'CAB Profile', 'Your certification body’s identity, accreditation and certificate settings, one page at a time.'),
    step('cab-company-profile-steps', 2, 'steps', 'The pages', 'Nine short pages in a logical order. Jump to any page; a tick shows the pages you have saved.'),
    step('cab-company-profile-body', 3, 'body', 'Current page', 'Fill or update this page only. Everything else waits on its own page.', 'top'),
    step('cab-company-profile-actions', 4, 'actions', 'Next saves as you go', 'Next saves this page and opens the next one. On the last page, finish to save the whole profile.', 'top'),
  ]
}
