import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useManageCertificationCycleTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'manage-cycle-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.manageCycle.tour.header.title', 'Cycle Management & Actions'),
      description: t(
        'cab.manageCycle.tour.header.description',
        'Execute critical lifecycle actions including scope modification requests, adding multi-site facilities, initiating transfers, or issuing suspensions.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'manage-cycle-client-card',
      step: 2,
      totalSteps: 5,
      title: t('cab.manageCycle.tour.clientCard.title', 'Active Certificate Snapshot'),
      description: t(
        'cab.manageCycle.tour.clientCard.description',
        'View client organization overview, primary contact person, issued standard reference, active validity period, and quick certificate links.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'manage-cycle-tabs',
      step: 3,
      totalSteps: 5,
      title: t('cab.manageCycle.tour.tabs.title', 'Lifecycle Modules & History'),
      description: t(
        'cab.manageCycle.tour.tabs.description',
        'Navigate between complete audit history, linked sites, scope expansion/reduction records, transfer logs, and document repository.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'manage-cycle-current-status',
      step: 4,
      totalSteps: 5,
      title: t('cab.manageCycle.tour.currentStatus.title', 'Next Event & Surveillance Window'),
      description: t(
        'cab.manageCycle.tour.currentStatus.description',
        'Monitor the active 3-year certification range, target audit surveillance window, countdown days, and assigned coordinator.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'manage-cycle-accordions',
      step: 5,
      totalSteps: 5,
      title: t('cab.manageCycle.tour.accordions.title', 'Lifecycle Events & Requests'),
      description: t(
        'cab.manageCycle.tour.accordions.description',
        'Manage and approve formal scope changes, addition of new site addresses, CAB transfer documentation, and suspension history.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
