import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useInvoiceDetailsTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'inv-details-header',
      step: 1,
      totalSteps: 5,
      title: t('invoices.details.tour.header.title', 'Invoice Details Overview'),
      description: t(
        'invoices.details.tour.header.description',
        'Review comprehensive invoice details, connected certification orders, client info, and current billing lifecycle status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'inv-details-actions',
      step: 2,
      totalSteps: 5,
      title: t('invoices.details.tour.actions.title', 'Issuance & Tax Configuration'),
      description: t(
        'invoices.details.tour.actions.description',
        'Configure statutory tax rates (e.g. VAT 15%), save drafts, issue finalized invoices, and record incoming payments.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'inv-details-info-grid',
      step: 3,
      totalSteps: 5,
      title: t('invoices.details.tour.infoGrid.title', 'Client & Billing Snapshot'),
      description: t(
        'invoices.details.tour.infoGrid.description',
        'Verify issue/due dates, client legal address snapshot, primary contact details, currency, and PO references.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'inv-details-amounts',
      step: 4,
      totalSteps: 5,
      title: t('invoices.details.tour.amounts.title', 'Financial Totals & Balance'),
      description: t(
        'invoices.details.tour.amounts.description',
        'Track line item subtotals, calculated taxes, total billed amount, client payments, and remaining balance due.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'inv-details-tabs-breakdown',
      step: 5,
      totalSteps: 5,
      title: t('invoices.details.tour.breakdown.title', 'Line Items & Installments'),
      description: t(
        'invoices.details.tour.breakdown.description',
        'Break down audited services line items, schedule installment due dates, and manage supporting attachments.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
