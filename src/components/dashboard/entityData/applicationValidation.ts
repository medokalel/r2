import type { EntityDataSubSection } from '@/components/dashboard/entityDataNavSections'
import {
  SPEC_QUESTIONS,
  isSpecQuestionVisible,
  type ApplicationFormValues,
} from '@/components/dashboard/entityData/applicationTypes'

const filled = (value: string) => value.trim().length > 0

/** Every field marked required on the Legal Identity step. */
function isLegalIdentityComplete(form: ApplicationFormValues): boolean {
  return (
    form.selectedStandards.length > 0 &&
    (!form.otherStandardSelected || filled(form.otherStandard)) &&
    filled(form.organizationName) &&
    filled(form.headOfficeAddress) &&
    filled(form.auditSiteAddress) &&
    filled(form.commercialRegisterNumber) &&
    form.allProductionLinesIncluded !== '' &&
    (form.allProductionLinesIncluded !== 'no' || filled(form.excludedReason)) &&
    form.country !== null &&
    filled(form.city) &&
    filled(form.representativeName) &&
    filled(form.jobTitle) &&
    filled(form.mainActivity)
  )
}

/** Operational data plus every required field of every branch. */
function isScopeComplete(form: ApplicationFormValues): boolean {
  const operationalComplete =
    filled(form.fieldOfWork) &&
    form.economicFields.length > 0 &&
    filled(form.productsServices) &&
    filled(form.annualCapacity) &&
    filled(form.technicalSpecifications) &&
    form.hasBranches !== ''

  // No branches to validate when the user said they don't have any
  if (form.hasBranches === 'no') return operationalComplete

  const branchesComplete = form.branches.every(
    (branch) =>
      filled(branch.employees) &&
      filled(branch.employeesInScope) &&
      filled(branch.shifts) &&
      branch.phase1ExpectedDate !== undefined &&
      (filled(branch.branchName) || Boolean(branch.sourceBranchId)) &&
      filled(branch.address) &&
      branch.integratedSystem !== '' &&
      branch.centralManagement !== '' &&
      filled(branch.activities) &&
      filled(branch.products) &&
      filled(branch.technicalCommunication)
  )

  return operationalComplete && branchesComplete
}

/** Only the design-activity question is marked required on this step. */
function isConsultingComplete(form: ApplicationFormValues): boolean {
  return (
    (form.usedConsultant !== 'yes' || filled(form.consultantName)) &&
    form.designActivity !== '' &&
    (form.designActivity !== 'no' || filled(form.designException))
  )
}

/** All specification questions of the selected standards must be answered. */
function isSpecQuestionsComplete(form: ApplicationFormValues): boolean {
  const relevant = SPEC_QUESTIONS.filter((question) =>
    form.selectedStandards.some(
      (standard) => standard.toUpperCase() === question.certificateCode
    ) && isSpecQuestionVisible(question, form.specAnswers)
  )
  return relevant.every((question) => filled(form.specAnswers[question.questionKey] ?? ''))
}

/** Signatory, date, certificate data and the acknowledgement checkbox. */
function isDeclarationsComplete(form: ApplicationFormValues): boolean {
  return (
    filled(form.signatoryName) &&
    filled(form.signature) &&
    form.declarationDate !== undefined &&
    filled(form.certificateNameAr) &&
    filled(form.certificateNameEn) &&
    filled(form.certificateAddressAr) &&
    filled(form.certificateAddressEn) &&
    filled(form.certificateScopeAr) &&
    filled(form.certificateScopeEn) &&
    form.agreed
  )
}

export function isSectionComplete(
  section: EntityDataSubSection,
  form: ApplicationFormValues
): boolean {
  switch (section) {
    case 'legalIdentity':
      return isLegalIdentityComplete(form)
    case 'scopeOfActivity':
      return isScopeComplete(form)
    case 'consultingReadiness':
      return isConsultingComplete(form)
    case 'specificationQuestions':
      return isSpecQuestionsComplete(form)
    case 'legalDeclarations':
      return isDeclarationsComplete(form)
    default:
      return true
  }
}
