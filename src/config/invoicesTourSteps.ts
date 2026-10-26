import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useInvoicesTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'invoices-header',
      step: 1,
      totalSteps: 5,
      title: t('invoices.register.tour.header.title', 'Invoices Register Overview'),
      description: t(
        'invoices.register.tour.header.description',
        'Track and manage billing operations, view balances, and handle payments for all client certification services.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'invoices-search-filters',
      step: 2,
      totalSteps: 5,
      title: t('invoices.register.tour.filters.title', 'Search & Filtering'),
      description: t(
        'invoices.register.tour.filters.description',
        'Find invoices by number or client name, and filter by country and payment status (Paid, Unpaid, Partially Paid, Draft).'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'invoices-actions-btn',
      step: 3,
      totalSteps: 5,
      title: t('invoices.register.tour.actionsBtn.title', 'Create & Export Invoices'),
      description: t(
        'invoices.register.tour.actionsBtn.description',
        'Create new invoice drafts and export records in bulk to Excel (.xlsx) or PDF formats.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'invoices-table',
      step: 4,
      totalSteps: 5,
      title: t('invoices.register.tour.table.title', 'Invoices List Table'),
      description: t(
        'invoices.register.tour.table.description',
        'Detailed view of invoice numbers, client names, issue and due dates, amounts, payments, and remaining balances.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'invoices-row-actions',
      step: 5,
      totalSteps: 5,
      title: t('invoices.register.tour.rowActions.title', 'Payment & Credit Notes'),
      description: t(
        'invoices.register.tour.rowActions.description',
        'Record client payments, issue linked credit notes, view full details, and download individual invoice PDFs.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
