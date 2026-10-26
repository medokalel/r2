import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

/**
 * Tour steps for the general Auditee dashboard, translated live via i18n
 * (unlike CAB_DASHBOARD_TOUR_STEPS, which is still English-only) — a hook
 * instead of a plain constant so the copy re-translates on language switch.
 */
export function useAuditeeDashboardTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'dashboard-header',
      step: 1,
      totalSteps: 4,
      title: t('dashboard.tour.dashboardHeader.title'),
      description: t('dashboard.tour.dashboardHeader.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'key-metrics',
      step: 2,
      totalSteps: 4,
      title: t('dashboard.tour.keyMetrics.title'),
      description: t('dashboard.tour.keyMetrics.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'pending-tasks',
      step: 3,
      totalSteps: 4,
      title: t('dashboard.tour.pendingTasks.title'),
      description: t('dashboard.tour.pendingTasks.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'recent-activity',
      step: 4,
      totalSteps: 4,
      title: t('dashboard.tour.recentActivity.title'),
      description: t('dashboard.tour.recentActivity.description'),
      side: 'top',
      align: 'end',
    },
  ]
}

/**
 * Tour steps for the Certification Requests page. Same hook-per-page
 * pattern as useAuditeeDashboardTourSteps, kept separate since the two
 * pages run independent tours (own tourId, own storage key).
 */
export function useCertificationRequestsTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'requests-header',
      step: 1,
      totalSteps: 3,
      title: t('certificationRequests.tour.header.title'),
      description: t('certificationRequests.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'new-request-actions',
      step: 2,
      totalSteps: 3,
      title: t('certificationRequests.tour.actions.title'),
      description: t('certificationRequests.tour.actions.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'requests-list',
      step: 3,
      totalSteps: 3,
      title: t('certificationRequests.tour.requestsList.title'),
      description: t('certificationRequests.tour.requestsList.description'),
      side: 'top',
      align: 'start',
    },
  ]
}

/**
 * Tour steps for the Users page. Same hook-per-page pattern as the other
 * auditee tours, kept separate since it runs its own tourId/storage key.
 */
export function useUsersTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'users-header',
      step: 1,
      totalSteps: 3,
      title: t('users.tour.header.title'),
      description: t('users.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'users-stats',
      step: 2,
      totalSteps: 3,
      title: t('users.tour.stats.title'),
      description: t('users.tour.stats.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'users-table',
      step: 3,
      totalSteps: 3,
      title: t('users.tour.table.title'),
      description: t('users.tour.table.description'),
      side: 'top',
      align: 'start',
    },
  ]
}

/**
 * Tour steps for the Digital Wallet page. Same hook-per-page pattern as the
 * other auditee tours, kept separate since it runs its own tourId/storage key.
 */
export function useWalletTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'wallet-header',
      step: 1,
      totalSteps: 3,
      title: t('wallet.tour.header.title'),
      description: t('wallet.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'wallet-balance',
      step: 2,
      totalSteps: 3,
      title: t('wallet.tour.balance.title'),
      description: t('wallet.tour.balance.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'wallet-transactions',
      step: 3,
      totalSteps: 3,
      title: t('wallet.tour.transactions.title'),
      description: t('wallet.tour.transactions.description'),
      side: 'top',
      align: 'start',
    },
  ]
}

/**
 * Tour steps for the Periodic Visits page. Same hook-per-page pattern as the
 * other auditee tours, kept separate since it runs its own tourId/storage key.
 */
export function usePeriodicVisitsTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'visits-header',
      step: 1,
      totalSteps: 3,
      title: t('periodicVisits.tour.header.title'),
      description: t('periodicVisits.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'visits-toolbar',
      step: 2,
      totalSteps: 3,
      title: t('periodicVisits.tour.toolbar.title'),
      description: t('periodicVisits.tour.toolbar.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'visits-table',
      step: 3,
      totalSteps: 3,
      title: t('periodicVisits.tour.table.title'),
      description: t('periodicVisits.tour.table.description'),
      side: 'top',
      align: 'start',
    },
  ]
}

/**
 * Tour steps for the Invoices page. Same hook-per-page pattern as the other
 * auditee tours, kept separate since it runs its own tourId/storage key.
 */
export function useInvoicesTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'invoices-header',
      step: 1,
      totalSteps: 3,
      title: t('invoices.tour.header.title'),
      description: t('invoices.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'invoices-toolbar',
      step: 2,
      totalSteps: 3,
      title: t('invoices.tour.toolbar.title'),
      description: t('invoices.tour.toolbar.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'invoices-table',
      step: 3,
      totalSteps: 3,
      title: t('invoices.tour.table.title'),
      description: t('invoices.tour.table.description'),
      side: 'top',
      align: 'start',
    },
  ]
}

/**
 * Tour steps for the Certification Request form page. Same hook-per-page
 * pattern as the other auditee tours, kept separate since it runs its own
 * tourId/storage key.
 *
 * Steps 3–11 walk through the Entity Data sub-steps in order: Legal Identity
 * (Main Data, Regulatory Data), Scope of Activity & Branches, Consulting &
 * Management System Readiness (Consultation, Management System & Site
 * Readiness), Specification Questions, and Legal Declarations (Declaration
 * Letter, Confidentiality, Certificate Data). Content that's user-generated
 * and variable in count — branch cards, and specification-question groups
 * that depend on which standards were picked — isn't given its own fixed
 * tour step; those sub-steps get one step covering their fixed container
 * instead.
 */
export function useCertificationRequestFormTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'form-header',
      step: 1,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.header.title'),
      description: t('certificationRequestForm.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'entity-data-tab',
      step: 2,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.entityData.title'),
      description: t('certificationRequestForm.tour.entityData.description'),
      side: 'right',
      align: 'start',
    },
    {
      id: 'legal-identity-main-data',
      step: 3,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.legalIdentityMainData.title'),
      description: t('certificationRequestForm.tour.legalIdentityMainData.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'legal-identity-regulatory-data',
      step: 4,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.legalIdentityRegulatoryData.title'),
      description: t('certificationRequestForm.tour.legalIdentityRegulatoryData.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'scope-of-activity',
      step: 5,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.scopeOfActivity.title'),
      description: t('certificationRequestForm.tour.scopeOfActivity.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'consulting-readiness-consultation',
      step: 6,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.consultingReadinessConsultation.title'),
      description: t('certificationRequestForm.tour.consultingReadinessConsultation.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'consulting-readiness-management-system',
      step: 7,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.consultingReadinessManagementSystem.title'),
      description: t('certificationRequestForm.tour.consultingReadinessManagementSystem.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'specification-questions',
      step: 8,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.specificationQuestions.title'),
      description: t('certificationRequestForm.tour.specificationQuestions.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'legal-declarations-letter',
      step: 9,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.legalDeclarationsLetter.title'),
      description: t('certificationRequestForm.tour.legalDeclarationsLetter.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'legal-declarations-confidentiality',
      step: 10,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.legalDeclarationsConfidentiality.title'),
      description: t('certificationRequestForm.tour.legalDeclarationsConfidentiality.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'legal-declarations-certificate-data',
      step: 11,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.legalDeclarationsCertificateData.title'),
      description: t('certificationRequestForm.tour.legalDeclarationsCertificateData.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'field-tab',
      step: 12,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.field.title'),
      description: t('certificationRequestForm.tour.field.description'),
      side: 'right',
      align: 'start',
    },
    {
      id: 'documents-tab',
      step: 13,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.documents.title'),
      description: t('certificationRequestForm.tour.documents.description'),
      side: 'right',
      align: 'start',
    },
    {
      id: 'feedback-tab',
      step: 14,
      totalSteps: 14,
      title: t('certificationRequestForm.tour.feedback.title'),
      description: t('certificationRequestForm.tour.feedback.description'),
      side: 'right',
      align: 'start',
    },
  ]
}

/**
 * Tour steps for the Company Profile wizard. Same hook-per-page pattern as
 * the other auditee tours, kept separate since it runs its own
 * tourId/storage key.
 */
export function useCompanyProfileTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'profile-header',
      step: 1,
      totalSteps: 4,
      title: t('companyProfile.tour.header.title'),
      description: t('companyProfile.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'profile-stepper',
      step: 2,
      totalSteps: 4,
      title: t('companyProfile.tour.stepper.title'),
      description: t('companyProfile.tour.stepper.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'profile-content',
      step: 3,
      totalSteps: 4,
      title: t('companyProfile.tour.content.title'),
      description: t('companyProfile.tour.content.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'profile-footer',
      step: 4,
      totalSteps: 4,
      title: t('companyProfile.tour.footer.title'),
      description: t('companyProfile.tour.footer.description'),
      side: 'top',
      align: 'end',
    },
  ]
}