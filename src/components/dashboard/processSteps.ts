import type { ReactNode, SVGProps } from 'react'
import {
  AccreditationFieldStepIcon,
  AssessmentVisitStepIcon,
  CertificateStepIcon,
  ChecklistsStepIcon,
  CorrectiveActionStepIcon,
  DocumentReviewStepIcon,
  FileReviewStepIcon,
  FinalReportStepIcon,
  GrantApplicationStepIcon,
  PlanningStepIcon,
  QuotationStepIcon,
  SurveillanceStepIcon,
} from '@/components/dashboard/processStepIcons'
import { ROUTES } from '@/lib/routes'

export type StepIcon = (props: SVGProps<SVGSVGElement>) => ReactNode

export interface Step {
  key: string
  icon: StepIcon
  /** Module that handles this stage; makes the step a link. */
  href?: string
  /** Fallback label until the locale files carry the key. */
  fallback?: string
}

/** Accreditation-body flow (applicant → AB). */
export const accreditationSteps: Step[] = [
  { key: 'accreditation.steps.grantApplication', icon: GrantApplicationStepIcon },
  { key: 'accreditation.steps.accreditationField', icon: AccreditationFieldStepIcon },
  { key: 'accreditation.steps.checklists', icon: ChecklistsStepIcon },
  { key: 'accreditation.steps.fileReview', icon: FileReviewStepIcon },
  { key: 'accreditation.steps.documentReview', icon: DocumentReviewStepIcon },
  { key: 'accreditation.steps.assessmentVisit', icon: AssessmentVisitStepIcon },
  { key: 'accreditation.steps.correctiveAction', icon: CorrectiveActionStepIcon },
  { key: 'accreditation.steps.finalReport', icon: FinalReportStepIcon },
]

/**
 * Certification-body flow (client → CAB), ISO/IEC 17021-1 clause 9 order:
 * application → review → quotation/contract → audit programme & planning →
 * stage 1 / stage 2 audit → nonconformities & corrections → decision →
 * certificate → surveillance / recertification. Each stage links to its module.
 */
export const certificationSteps: Step[] = [
  { key: 'cab.pipeline.application', icon: GrantApplicationStepIcon, href: ROUTES.cabApplicationRegister, fallback: 'Certification application' },
  { key: 'cab.pipeline.review', icon: FileReviewStepIcon, href: ROUTES.cabApplicationReviewQueue, fallback: 'Application review' },
  { key: 'cab.pipeline.quotation', icon: QuotationStepIcon, href: ROUTES.cabOffers, fallback: 'Quotation & contract' },
  { key: 'cab.pipeline.planning', icon: PlanningStepIcon, href: ROUTES.cabAuditPlanning, fallback: 'Audit planning' },
  { key: 'cab.pipeline.audit', icon: AssessmentVisitStepIcon, href: ROUTES.cabAuditReporting, fallback: 'Stage 1 & 2 audit' },
  { key: 'cab.pipeline.nonconformities', icon: CorrectiveActionStepIcon, href: ROUTES.cabNonconformities, fallback: 'Nonconformities & corrective action' },
  { key: 'cab.pipeline.decision', icon: FinalReportStepIcon, href: ROUTES.cabDecisions, fallback: 'Certification decision' },
  { key: 'cab.pipeline.certificate', icon: CertificateStepIcon, href: ROUTES.cabCertificates, fallback: 'Certificate issued' },
  { key: 'cab.pipeline.surveillance', icon: SurveillanceStepIcon, href: ROUTES.cabCertificationCycles, fallback: 'Surveillance & recertification' },
]

/** Which certification stage a CAB route belongs to (for highlighting "you are here"). */
export function certificationStageForPath(pathname: string): number {
  const rules: Array<[RegExp, number]> = [
    [/^\/cab\/certification/, 8],
    [/^\/cab\/certificates/, 7],
    [/^\/cab\/decisions/, 6],
    [/^\/cab\/nonconformities/, 5],
    [/^\/cab\/audit-reporting/, 4],
    [/^\/cab\/audit-planning/, 3],
    [/^\/cab\/(applications\/[^/]*\/?quotation|applications\/quotation|quotations|offers)/, 2],
    [/^\/cab\/applications\/(.*\/)?(receipt|review|review-queue|information-required|technical-feasibility)/, 1],
  ]
  return rules.find(([re]) => re.test(pathname))?.[1] ?? 0
}
