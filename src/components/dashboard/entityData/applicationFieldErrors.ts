import type { TFunction } from 'i18next'
import { ApiError } from '@/lib/api/client'
import { describeRule, getUserErrorMessage, parseValidationIssues } from '@/lib/errorMessages'
import {
  subSections,
  type EntityDataSubSection,
} from '@/components/dashboard/entityDataNavSections'
import {
  SPEC_QUESTIONS,
  type ApplicationFormValues,
} from '@/components/dashboard/entityData/applicationTypes'
import { isSectionComplete } from '@/components/dashboard/entityData/applicationValidation'
import {
  sectorsForStandard,
} from '@/components/dashboard/entityData/fieldTypes'

const filled = (value: string) => value.trim().length > 0

const FIELD_LABELS: Record<string, string> = {
  'legalInfo.organizationName': 'accreditation.form.organizationName',
  'legalInfo.website': 'accreditation.form.website',
  'legalInfo.auditSiteAddress': 'accreditation.form.auditPlaceAddress',
  'legalInfo.headOfficeAddress': 'accreditation.form.headOfficeAddress',
  'legalInfo.city': 'accreditation.form.city',
  'legalInfo.commercialRegisterNumber': 'accreditation.form.commercialRegistrationNo',
  'legalInfo.commercialRegisterFile': 'accreditation.form.commercialRegistrationNo',
  'legalInfo.allProductionLinesIncluded': 'accreditation.form.productionLinesActive',
  'legalInfo.excludedReason': 'accreditation.form.ifNoStateWhy',
  'legalInfo.country': 'accreditation.form.country',
  'legalInfo.email': 'accreditation.form.email',
  'legalInfo.representativeName': 'accreditation.form.representativeName',
  'legalInfo.jobTitle': 'accreditation.form.representativeTitle',
  'legalInfo.organizationNature': 'accreditation.form.organizationType',
  'legalInfo.mobile': 'accreditation.form.mobileNumber',
  'legalInfo.mainActivity': 'accreditation.form.mainActivity',
  'operationalInfo.fieldOfWork': 'accreditation.entityData.fields.scope.scopeOfWork',
  'operationalInfo.economicActivity': 'accreditation.entityData.fields.scope.economicField',
  'operationalInfo.productsServices': 'accreditation.entityData.fields.scope.productsServicesNature',
  'operationalInfo.annualCapacity': 'accreditation.entityData.fields.scope.annualProductionCapacity',
  'operationalInfo.technicalSpecifications':
    'accreditation.entityData.fields.scope.technicalSpecifications',
  'consultantInfo.usedConsultant': 'accreditation.entityData.fields.consulting.qualifiedByConsultant',
  'consultantInfo.consultantName': 'accreditation.entityData.fields.consulting.consultantName',
  'consultantInfo.consultantCvAttached': 'accreditation.entityData.fields.consulting.cvAttached',
  'consultantInfo.consultancyMonths': 'accreditation.entityData.fields.consulting.consultationPeriod',
  'consultantInfo.systemLanguage': 'accreditation.entityData.fields.readiness.systemLanguage',
  'consultantInfo.easyAccess': 'accreditation.entityData.fields.readiness.easySiteAccess',
  'consultantInfo.usesSubcontractors': 'accreditation.entityData.fields.readiness.subcontracting',
  'consultantInfo.safetyProcedures': 'accreditation.entityData.fields.readiness.safetyProcedures',
  'consultantInfo.designActivity': 'accreditation.entityData.fields.readiness.designActivity',
  'consultantInfo.designException':
    'accreditation.entityData.fields.readiness.designExceptionReason',
  'declarationInfo.certificateNameEn': 'accreditation.entityData.fields.declarations.certificateNameEn',
  'declarationInfo.certificateNameAr': 'accreditation.entityData.fields.declarations.certificateNameAr',
  'declarationInfo.certificateAddressEn':
    'accreditation.entityData.fields.declarations.certificateAddressEn',
  'declarationInfo.certificateAddressAr':
    'accreditation.entityData.fields.declarations.certificateAddressAr',
  'declarationInfo.certificateScopeEn': 'accreditation.entityData.fields.declarations.certificateFieldEn',
  'declarationInfo.certificateScopeAr': 'accreditation.entityData.fields.declarations.certificateFieldAr',
  'declarationInfo.agreed': 'accreditation.entityData.fields.declarations.acknowledgement',
  branchName: 'accreditation.entityData.fields.scope.branchName',
  address: 'accreditation.entityData.fields.scope.branchAddress',
  employees: 'accreditation.entityData.fields.scope.branchEmployees',
  employeesInScope: 'accreditation.entityData.fields.scope.auditScopeEmployees',
  shifts: 'accreditation.entityData.fields.scope.shiftCount',
  productionLines: 'accreditation.entityData.fields.scope.productionLines',
  integratedSystem: 'accreditation.entityData.fields.scope.integratedSystem',
  centralManagement: 'accreditation.entityData.fields.scope.centralAdministration',
  activities: 'accreditation.entityData.fields.scope.activitiesToAudit',
  products: 'accreditation.entityData.fields.scope.productsServices',
  technicalCommunication: 'accreditation.entityData.fields.scope.technicalCommunication',
  phase1ExpectedDate: 'accreditation.entityData.fields.scope.firstPhaseDate',
  workingHours: 'accreditation.entityData.fields.scope.openingHours',
  branches: 'cab.applicationSubmission.fieldErrors.branches',
  certificates: 'cab.applicationSubmission.fieldErrors.certificates',
  documents: 'cab.applicationSubmission.fieldErrors.documents',
}

const SECTION_LABELS: Record<EntityDataSubSection, string> = {
  legalIdentity: 'accreditation.entityData.sections.legalIdentity',
  scopeOfActivity: 'accreditation.entityData.sections.scopeOfActivity',
  consultingReadiness: 'accreditation.entityData.sections.consultingReadiness',
  specificationQuestions: 'accreditation.entityData.sections.specificationQuestions',
  legalDeclarations: 'accreditation.entityData.sections.legalDeclarations',
}

function labelForPath(path: string, t: TFunction): string {
  const branchMatch = path.match(/^branches\[(\d+)\](?:\.(.+))?$/)
  if (branchMatch) {
    const index = Number(branchMatch[1]) + 1
    const leaf = branchMatch[2]
    const field = leaf
      ? t(FIELD_LABELS[leaf] ?? FIELD_LABELS[`branches.${leaf}`] ?? leaf, { defaultValue: leaf })
      : t('cab.applicationRegister.table.clientName')
    return t('cab.applicationSubmission.fieldErrors.branchField', {
      index,
      field,
    })
  }
  const certificateMatch = path.match(/^certificates\[(\d+)\](?:\.(.+))?$/)
  if (certificateMatch) {
    const leaf = certificateMatch[2] ?? 'certificate'
    return t('cab.applicationSubmission.fieldErrors.certificateField', {
      index: Number(certificateMatch[1]) + 1,
      field: leaf,
    })
  }
  if (FIELD_LABELS[path]) return t(FIELD_LABELS[path])
  const leaf = path.split('.').pop() ?? path
  if (FIELD_LABELS[leaf]) return t(FIELD_LABELS[leaf])
  return path.replace(/"/g, '')
}

function reasonForRule(rule: string, t: TFunction): string {
  const normalized = rule.trim().toLowerCase()
  if (normalized.includes('is required') || normalized.includes('is not allowed to be empty')) {
    return t('cab.applicationSubmission.fieldErrors.missing')
  }
  if (normalized.includes('must be a number') || normalized.includes('must be a valid number')) {
    return t('cab.applicationSubmission.fieldErrors.mustBeNumber')
  }
  if (normalized.includes('must be a valid email')) {
    return t('cab.applicationSubmission.fieldErrors.invalidEmail')
  }
  if (normalized.includes('must be a valid uri') || normalized.includes('must be a valid url')) {
    return t('cab.applicationSubmission.fieldErrors.invalidUrl')
  }
  if (normalized.includes('must be [true]') || normalized.includes('must be true')) {
    return t('cab.applicationSubmission.fieldErrors.mustBeAccepted')
  }
  const minItems = normalized.match(/must contain at least (\d+)/)
  if (minItems) return t('errors.reasons.minItems', { count: Number(minItems[1]) })
  return describeRule(rule, t)
}

export function listMissingApplicationFields(
  form: ApplicationFormValues,
  t: TFunction,
): string[] {
  const missing: string[] = []

  for (const section of subSections) {
    if (!isSectionComplete(section, form)) {
      missing.push(t(SECTION_LABELS[section]))
    }
  }

  if (form.selectedStandards.length === 0) {
    missing.push(t('accreditation.form.requiredStandard'))
  }

  for (const standard of form.selectedStandards) {
    const sectors = (form.selectedSectors[standard] ?? []).filter((sector) =>
      sectorsForStandard(standard).includes(sector),
    )
    const hasCode = sectors.some(
      (sector) => (form.selectedCodes[`${standard}:${sector}`] ?? []).length > 0,
    )
    if (sectors.length === 0 || !hasCode) {
      missing.push(
        t('cab.applicationSubmission.fieldErrors.standardScope', {
          standard: standard.toUpperCase(),
        }),
      )
    }
  }

  const selectedCodesUpper = new Set(
    form.selectedStandards.map((standard) => standard.toUpperCase()),
  )
  const unansweredSpecs = SPEC_QUESTIONS.some(
    (question) =>
      selectedCodesUpper.has(question.certificateCode) &&
      !filled(form.specAnswers[question.questionKey] ?? ''),
  )
  if (unansweredSpecs && !missing.includes(t(SECTION_LABELS.specificationQuestions))) {
    missing.push(t(SECTION_LABELS.specificationQuestions))
  }

  return [...new Set(missing)]
}

export function formatCertificationSubmitError(error: unknown, t: TFunction): string {
  // Only validation failures (400/422) carry per-field details; everything else gets a plain message.
  if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 422)) {
    return getUserErrorMessage(error, t)
  }

  const issues = parseValidationIssues(error)
  if (issues.length === 0) return getUserErrorMessage(error, t)

  const lines = [
    ...new Set(
      issues.map(({ path, rule }) =>
        t('cab.applicationSubmission.fieldErrors.line', {
          field: labelForPath(path, t),
          reason: reasonForRule(rule, t),
        }),
      ),
    ),
  ]
  return [t('cab.applicationSubmission.fieldErrors.title'), ...lines.map((line) => `• ${line}`)].join('\n')
}
