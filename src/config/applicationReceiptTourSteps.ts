import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useApplicationReceiptTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-app-receipt',
      step: 1,
      totalSteps: 7,
      title: t('cab.tour.sidebarAppReceipt.title', 'Application Receipt Icon'),
      description: t(
        'cab.tour.sidebarAppReceipt.description',
        'View, download, or print the official application receipt.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'header',
      step: 2,
      totalSteps: 7,
      title: t('cab.applications.receipt.tour.header.title', 'Application Receipt Header'),
      description: t(
        'cab.applications.receipt.tour.header.description',
        'Breadcrumbs, notifications, language toggle, and user profile.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'page-header',
      step: 3,
      totalSteps: 7,
      title: t('cab.applications.receipt.tour.pageHeader.title', 'Receipt Actions Bar'),
      description: t(
        'cab.applications.receipt.tour.pageHeader.description',
        'Title, receipt status, download, print, and additional action buttons.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'receipt-summary',
      step: 4,
      totalSteps: 7,
      title: t('cab.applications.receipt.tour.receiptSummary.title', 'Receipt Summary'),
      description: t(
        'cab.applications.receipt.tour.receiptSummary.description',
        'Quick overview of application ID, client, certification body, and receipt date.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'application-details',
      step: 5,
      totalSteps: 7,
      title: t('cab.applications.receipt.tour.applicationDetails.title', 'Application Details'),
      description: t(
        'cab.applications.receipt.tour.applicationDetails.description',
        'Detailed breakdown including standards, sites, dates, and reference numbers.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'client-summary',
      step: 6,
      totalSteps: 7,
      title: t('cab.applications.receipt.tour.clientSummary.title', 'Client & Scope Summary'),
      description: t(
        'cab.applications.receipt.tour.clientSummary.description',
        'View organization information, industry, and certification scope description.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'documents-summary',
      step: 7,
      totalSteps: 7,
      title: t('cab.applications.receipt.tour.documentsSummary.title', 'Documents & Workflow'),
      description: t(
        'cab.applications.receipt.tour.documentsSummary.description',
        'Track uploaded documents count and overall workflow progress stages.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
