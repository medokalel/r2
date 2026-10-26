import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useNonconformitiesTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'nonconformities-header',
      step: 1,
      totalSteps: 5,
      title: t(
        'cab.nonconformities.tour.header.title',
        'Nonconformities Register'
      ),
      description: t(
        'cab.nonconformities.tour.header.description',
        'Track and manage client corrective actions and nonconformities raised from audit findings.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'nonconformities-export',
      step: 2,
      totalSteps: 5,
      title: t(
        'cab.nonconformities.tour.export.title',
        'Export Data'
      ),
      description: t(
        'cab.nonconformities.tour.export.description',
        'Export your filtered nonconformity list to Excel or PDF documents for reporting and compliance audits.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'nonconformities-filters',
      step: 3,
      totalSteps: 5,
      title: t(
        'cab.nonconformities.tour.filters.title',
        'Filter & Search'
      ),
      description: t(
        'cab.nonconformities.tour.filters.description',
        'Search by finding ID or client name, and filter by raised period, country, or resolution status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'nonconformities-table',
      step: 4,
      totalSteps: 5,
      title: t(
        'cab.nonconformities.tour.table.title',
        'Nonconformities Table'
      ),
      description: t(
        'cab.nonconformities.tour.table.description',
        'Click on any nonconformity record in the table to view its detailed corrective actions, attachments, and history.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'nonconformities-status',
      step: 5,
      totalSteps: 5,
      title: t(
        'cab.nonconformities.tour.status.title',
        'Status & Resolution Tracking'
      ),
      description: t(
        'cab.nonconformities.tour.status.description',
        'Monitor whether corrective actions are open, in progress, submitted for verification, closed, or overdue.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
