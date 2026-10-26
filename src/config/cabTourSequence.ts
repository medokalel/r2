import { markTourPending, getTourUserKey, getTourStatusKey, setTourStatus } from '@/context/tour/tourStorage'
import { ROUTES } from '@/lib/routes'

/**
 * Workspace / CAB main pages tour sequence in order.
 * Chain transitions seamlessly across all workspace sections.
 */
export const CAB_WORKFLOW_TOUR_IDS = [
  'cab-application-register',
  'cab-audit-clients',
  'cab-application-review-queue',
  'cab-contacts-list',
  'cab-offers-register',
  'invoices-register-tour',
  'audit-schedule-tour',
  'cab-audit-reporting',
  'cab-decisions-queue',
  'cab-certificate-register',
  'cab-nonconformities',
  'cab-certification-cycles',
  'personnel-register-tour',
  'cab-dashboard',
  // Sub-workflows / detail pages can also be chained or mapped if desired
  'cab-client-registration',
  'cab-application-draft',
  'cab-application-receipt',
  'cab-application-review',
  'cab-application-information-required',
  'cab-application-technical-feasibility',
  'cab-application-quotation',
  'cab-quotation-approval',
  'cab-manage-certification-cycle',
  'cab-nonconformity-response',
  'cab-decision-details',
  'cab-add-contact',
  'cab-create-offer',
  'cab-prepare-certificate',
  'cab-client-details',
  'cab-client-company-profile',
  'cab-company-profile',
] as const

export type CabWorkflowTourId = (typeof CAB_WORKFLOW_TOUR_IDS)[number]

/**
 * Mapping from each tourId to its subsequent route destination and next tourId.
 */
export const CAB_TOUR_CHAIN_MAP: Record<string, { nextRoute: string; nextTourId: string }> = {
  // 1. Applications -> Audit Clients
  'cab-application-register': {
    nextRoute: ROUTES.cabAuditClients,
    nextTourId: 'cab-audit-clients',
  },
  // 2. Audit Clients -> Application Review Queue
  'cab-audit-clients': {
    nextRoute: ROUTES.cabApplicationReviewQueue,
    nextTourId: 'cab-application-review-queue',
  },
  // 3. Application Review Queue -> Contacts
  'cab-application-review-queue': {
    nextRoute: ROUTES.cabContacts,
    nextTourId: 'cab-contacts-list',
  },
  // 4. Contacts -> Offers
  'cab-contacts-list': {
    nextRoute: ROUTES.cabOffers,
    nextTourId: 'cab-offers-register',
  },
  // 5. Offers -> Invoices
  'cab-offers-register': {
    nextRoute: ROUTES.cabInvoices,
    nextTourId: 'invoices-register-tour',
  },
  // 6. Invoices -> Audit Planning / Schedule
  'invoices-register-tour': {
    nextRoute: ROUTES.cabAuditPlanning,
    nextTourId: 'audit-schedule-tour',
  },
  // 7. Audit Planning -> Audit Reporting
  'audit-schedule-tour': {
    nextRoute: ROUTES.cabAuditReporting,
    nextTourId: 'cab-audit-reporting',
  },
  // 8. Audit Reporting -> Decisions
  'cab-audit-reporting': {
    nextRoute: ROUTES.cabDecisions,
    nextTourId: 'cab-decisions-queue',
  },
  // 9. Decisions -> Certificates
  'cab-decisions-queue': {
    nextRoute: ROUTES.cabCertificates,
    nextTourId: 'cab-certificate-register',
  },
  // 10. Certificates -> Nonconformities
  'cab-certificate-register': {
    nextRoute: ROUTES.cabNonconformities,
    nextTourId: 'cab-nonconformities',
  },
  // 11. Nonconformities -> Certification Cycles
  'cab-nonconformities': {
    nextRoute: ROUTES.cabCertificationCycles,
    nextTourId: 'cab-certification-cycles',
  },
  // 12. Certification Cycles -> Competence (Personnel)
  'cab-certification-cycles': {
    nextRoute: ROUTES.cabCompetence,
    nextTourId: 'personnel-register-tour',
  },
  // 13. Competence -> Dashboard (Reports & Analytics)
  'personnel-register-tour': {
    nextRoute: ROUTES.cabDashboard,
    nextTourId: 'cab-dashboard',
  },
  // 14. Dashboard -> Applications (or Workspace) to complete full loop if restarted
  'cab-dashboard': {
    nextRoute: ROUTES.cabApplicationRegister,
    nextTourId: 'cab-application-register',
  },

  // Sub-workflows legacy chaining:
  'cab-client-registration': {
    nextRoute: '/cab/applications/draft',
    nextTourId: 'cab-application-draft',
  },
  'cab-application-draft': {
    nextRoute: '/cab/applications/receipt',
    nextTourId: 'cab-application-receipt',
  },
  'cab-application-receipt': {
    nextRoute: '/cab/applications/review',
    nextTourId: 'cab-application-review',
  },
  'cab-application-review': {
    nextRoute: '/cab/applications/information-required',
    nextTourId: 'cab-application-information-required',
  },
  'cab-application-information-required': {
    nextRoute: '/cab/applications/technical-feasibility',
    nextTourId: 'cab-application-technical-feasibility',
  },
  'cab-application-technical-feasibility': {
    nextRoute: '/cab/applications/quotation',
    nextTourId: 'cab-application-quotation',
  },
  'cab-application-quotation': {
    nextRoute: '/cab/quotations/approval',
    nextTourId: 'cab-quotation-approval',
  },
  'cab-prepare-certificate': {
    nextRoute: ROUTES.cabCertificates,
    nextTourId: 'cab-certificate-register',
  },
  'cab-client-details': {
    nextRoute: ROUTES.cabAuditClients,
    nextTourId: 'cab-audit-clients',
  },
  'cab-client-company-profile': {
    nextRoute: ROUTES.cabAuditClients,
    nextTourId: 'cab-audit-clients',
  },
  'cab-company-profile': {
    nextRoute: ROUTES.cabDashboard,
    nextTourId: 'cab-dashboard',
  },
}

export const CAB_TOUR_NEXT_ROUTE: Partial<Record<string, string>> = Object.fromEntries(
  Object.entries(CAB_TOUR_CHAIN_MAP).map(([tourId, target]) => [tourId, target.nextRoute])
)

const TOUR_PENDING_KEY_PREFIX = 'icasco_pending_tour'

export function isCabWorkflowTour(tourId: string): boolean {
  return tourId in CAB_TOUR_CHAIN_MAP || (CAB_WORKFLOW_TOUR_IDS as readonly string[]).includes(tourId)
}

export function getNextCabTourInfo(currentTourId: string): { nextRoute: string; nextTourId: string } | null {
  return CAB_TOUR_CHAIN_MAP[currentTourId] ?? null
}

export function getNextCabTourId(current: string): string | null {
  return CAB_TOUR_CHAIN_MAP[current]?.nextTourId ?? null
}

/** Call when CAB onboarding finishes so the applications tour auto-starts on first visit. */
export function markCabWorkflowTourPending(firstTourId = 'cab-application-register'): void {
  markTourPending(firstTourId)
}

/** Clears all CAB workflow tour progress for the current browser session user. */
export function resetCabWorkflowTour(): void {
  const userKey = getTourUserKey()
  for (const tourId of CAB_WORKFLOW_TOUR_IDS) {
    localStorage.removeItem(`${TOUR_PENDING_KEY_PREFIX}_${tourId}`)
    localStorage.removeItem(getTourStatusKey(tourId))
    if (userKey) {
      localStorage.removeItem(`icasco_tour_status_${tourId}_${userKey}`)
    }
    localStorage.removeItem(`icasco_tour_status_${tourId}`)
  }
}

export function skipRemainingCabWorkflowTours(fromTourId: string): void {
  const startIdx = CAB_WORKFLOW_TOUR_IDS.indexOf(fromTourId as CabWorkflowTourId)
  if (startIdx === -1) {
    localStorage.removeItem(`${TOUR_PENDING_KEY_PREFIX}_${fromTourId}`)
    setTourStatus(fromTourId, 'skipped')
    return
  }
  for (let i = startIdx; i < CAB_WORKFLOW_TOUR_IDS.length; i++) {
    const tourId = CAB_WORKFLOW_TOUR_IDS[i]!
    localStorage.removeItem(`${TOUR_PENDING_KEY_PREFIX}_${tourId}`)
    setTourStatus(tourId, 'skipped')
  }
}

// Re-export for CabTourProvider
export { markTourPending }
