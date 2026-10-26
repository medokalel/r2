/**
 * Guided-tour copy per screen: route → i18n prefix whose children are { title, description }
 * pairs (the bilingual text the page's tour shows). Auto-generated stub articles list these
 * steps, so even a screen without a written article has real, translated guidance.
 */
export const TOUR_PREFIXES: Record<string, string> = {
  '/workspace': 'cab.workspace.tour',
  '/cab/company-profile': 'cab.companyProfile.tour',
  '/cab/competence': 'cab.competence.tour',
  '/cab/audit-clients': 'cab.clientRegister.tour',
  '/cab/clients/new': 'cab.clientRegistration.tour',
  '/cab/contacts': 'cab.contacts.tour',
  '/cab/applications': 'cab.applicationRegister.tour',
  '/cab/applications/receipt': 'cab.applications.receipt.tour',
  '/cab/applications/review': 'cab.applications.review.tour',
  '/cab/applications/information-required': 'cab.applications.informationRequired.tour',
  '/cab/applications/technical-feasibility': 'cab.applications.technicalFeasibility.tour',
  '/cab/applications/quotation': 'cab.applications.quotation.tour',
  '/cab/quotations/approval': 'cab.applications.quotationApproval.tour',
  '/cab/offers': 'cab.offersPage.tour',
  '/cab/invoices': 'invoices.register.tour',
  '/cab/audit-planning': 'cab.auditSchedule.tour',
  '/cab/audit-reporting': 'cab.auditReporting.tour',
  '/cab/nonconformities': 'cab.nonconformities.tour',
  '/cab/decisions': 'cab.decisions.tour',
  '/cab/certificates': 'cab.certificateRegister.tour',
  '/cab/certification': 'cab.certification.tour',
  '/portal/home': 'portal.home.tour',
  '/portal/company-profile': 'portal.companyProfile.tour',
  '/certification-request/new': 'certificationRequestForm.tour',
}

export interface TourStepText {
  title: string
  description: string
}

/** Reads the { title, description } pairs under a prefix from an i18n resource object. */
export function tourStepsFromResource(resource: unknown): TourStepText[] {
  if (!resource || typeof resource !== 'object') return []
  const steps: TourStepText[] = []
  for (const value of Object.values(resource as Record<string, unknown>)) {
    if (value && typeof value === 'object') {
      const { title, description } = value as Record<string, unknown>
      if (typeof title === 'string' && typeof description === 'string') steps.push({ title, description })
    }
  }
  return steps
}
