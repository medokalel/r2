import type { CountryCode } from '@/lib/countries'
import type { ApplicationSiteDetails, QuestionType } from '@/lib/api/certificationApplicationApi'
import type { SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'

/** Tri-state radio value: empty string means "not answered yet". */
export type YesNo = '' | 'yes' | 'no'

export function yesNoFromBool(value?: boolean | null): YesNo {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  return ''
}

export function boolFromYesNo(value: YesNo): boolean | undefined {
  if (value === 'yes') return true
  if (value === 'no') return false
  return undefined
}

export interface BranchFormValues {
  localId: number
  /** Organization-profile branch this application branch is copied from. */
  sourceBranchId?: string
  branchName: string
  address: string
  employees: string
  employeesInScope: string
  shifts: string
  workingHours: string
  productionLines: string
  weeklyHoliday: string
  phase1ExpectedDate?: Date
  integratedSystem: YesNo
  centralManagement: YesNo
  activities: string
  products: string
  technicalCommunication: string
  /** Full site details from the CAB "Add site" page — carried through unchanged on save. */
  siteDetails?: ApplicationSiteDetails | null
}

export interface ApplicationDocumentEntry {
  localId: string
  /** UI slot the file was uploaded from (requiredDocuments ids or 'other'). */
  slotId: string
  documentType: string
  fileUrl: string
  filePath: string
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
}

export interface ApplicationFormValues {
  // Legal identity
  selectedStandards: StandardKey[]
  otherStandardSelected: boolean
  otherStandard: string
  organizationName: string
  website: string
  headOfficeAddress: string
  auditSiteAddress: string
  commercialRegisterNumber: string
  commercialRegisterFile: string
  allProductionLinesIncluded: YesNo
  excludedReason: string
  email: string
  country: CountryCode | null
  city: string
  representativeName: string
  jobTitle: string
  organizationNature: string
  mobileCountryCode: CountryCode
  mobileNumber: string
  mainActivity: string

  // Scope of activity
  fieldOfWork: string
  economicFields: string[]
  productsServices: string
  annualCapacity: string
  technicalSpecifications: string
  hasBranches: YesNo
  branches: BranchFormValues[]

  // Consulting & readiness
  usedConsultant: YesNo
  consultantName: string
  consultantCvAttached: YesNo
  consultancyMonths: string
  qualificationRate: number | null
  recommendationRate: number | null
  systemLanguage: string
  easyAccess: YesNo
  safetyProcedures: YesNo
  usesSubcontractors: YesNo
  previousGrants: YesNo
  currentSystems: string[]
  otherSystemSelected: boolean
  otherSpecification: string
  designActivity: YesNo
  designException: string

  // Specification questions ('yes'/'no', ISO date string, or free text per question)
  specAnswers: Record<string, string>

  // Field (sectors & IAF codes) — each standard keeps its own sector list;
  // codes keyed by `${standard}:${sector}`
  selectedSectors: Record<string, SectorKey[]>
  selectedCodes: Record<string, string[]>

  // Legal declarations
  signatoryName: string
  declarationDate?: Date
  /** Signature image (PNG/JPEG data URL) of the authorized signatory. */
  signature: string
  certificateNameAr: string
  certificateNameEn: string
  certificateAddressAr: string
  certificateAddressEn: string
  certificateScopeAr: string
  certificateScopeEn: string
  agreed: boolean

  // Documents
  documents: ApplicationDocumentEntry[]
}

export function createEmptyBranch(localId: number): BranchFormValues {
  return {
    localId,
    branchName: '',
    address: '',
    employees: '',
    employeesInScope: '',
    shifts: '',
    workingHours: '',
    productionLines: '',
    weeklyHoliday: '',
    integratedSystem: '',
    centralManagement: '',
    activities: '',
    products: '',
    technicalCommunication: '',
  }
}

export const EMPTY_APPLICATION_FORM: ApplicationFormValues = {
  selectedStandards: [],
  otherStandardSelected: false,
  otherStandard: '',
  organizationName: '',
  website: '',
  headOfficeAddress: '',
  auditSiteAddress: '',
  commercialRegisterNumber: '',
  commercialRegisterFile: '',
  allProductionLinesIncluded: '',
  excludedReason: '',
  email: '',
  country: null,
  city: '',
  representativeName: '',
  jobTitle: '',
  organizationNature: '',
  mobileCountryCode: 'SA',
  mobileNumber: '',
  mainActivity: '',

  fieldOfWork: '',
  economicFields: [],
  productsServices: '',
  annualCapacity: '',
  technicalSpecifications: '',
  hasBranches: '',
  branches: [],

  usedConsultant: '',
  consultantName: '',
  consultantCvAttached: '',
  consultancyMonths: '',
  qualificationRate: null,
  recommendationRate: null,
  systemLanguage: '',
  easyAccess: '',
  safetyProcedures: '',
  usesSubcontractors: '',
  previousGrants: '',
  currentSystems: [],
  otherSystemSelected: false,
  otherSpecification: '',
  designActivity: '',
  designException: '',

  specAnswers: {},

  selectedSectors: {},
  selectedCodes: {},

  signatoryName: '',
  signature: '',
  certificateNameAr: '',
  certificateNameEn: '',
  certificateAddressAr: '',
  certificateAddressEn: '',
  certificateScopeAr: '',
  certificateScopeEn: '',
  agreed: false,

  documents: [],
}

export interface ApplicationNotification {
  type: 'success' | 'error'
  message: string
}

export interface SpecQuestionDef {
  /** Stable key persisted to the API, e.g. "iso45001.ohsSystemInPlace". */
  questionKey: string
  /** Certificate code the answer belongs to, e.g. "ISO45001". */
  certificateCode: string
  /** i18n key under accreditation.entityData.fields.spec. */
  labelKey: string
  questionType: QuestionType
  /** Key of the yes/no question this one follows up on; hidden while that answer is "no". */
  dependsOn?: string
}

export const SPEC_QUESTIONS: SpecQuestionDef[] = [
  // ISO 9001:2015 — Quality Management Systems
  { questionKey: 'iso9001.qmsSystemInPlace', certificateCode: 'ISO9001', labelKey: 'iso9001.qmsSystemInPlace', questionType: 'BOOLEAN' },
  { questionKey: 'iso9001.qmsStartDate', certificateCode: 'ISO9001', labelKey: 'iso9001.qmsStartDate', questionType: 'DATE', dependsOn: 'iso9001.qmsSystemInPlace' },
  { questionKey: 'iso9001.sitesCount', certificateCode: 'ISO9001', labelKey: 'iso9001.sitesCount', questionType: 'NUMBER' },
  { questionKey: 'iso9001.productsServicesScope', certificateCode: 'ISO9001', labelKey: 'iso9001.productsServicesScope', questionType: 'TEXT' },
  { questionKey: 'iso9001.outsourcedKeyProcesses', certificateCode: 'ISO9001', labelKey: 'iso9001.outsourcedKeyProcesses', questionType: 'BOOLEAN' },
  { questionKey: 'iso9001.outsourcedProcessesList', certificateCode: 'ISO9001', labelKey: 'iso9001.outsourcedProcessesList', questionType: 'TEXT', dependsOn: 'iso9001.outsourcedKeyProcesses' },
  { questionKey: 'iso9001.requirementsNotApplicable', certificateCode: 'ISO9001', labelKey: 'iso9001.requirementsNotApplicable', questionType: 'BOOLEAN' },
  { questionKey: 'iso9001.notApplicableDetails', certificateCode: 'ISO9001', labelKey: 'iso9001.notApplicableDetails', questionType: 'TEXT', dependsOn: 'iso9001.requirementsNotApplicable' },
  { questionKey: 'iso9001.priorCertification', certificateCode: 'ISO9001', labelKey: 'iso9001.priorCertification', questionType: 'BOOLEAN' },
  { questionKey: 'iso9001.certifyingBody', certificateCode: 'ISO9001', labelKey: 'iso9001.certifyingBody', questionType: 'TEXT', dependsOn: 'iso9001.priorCertification' },

  // ISO 14001:2026 — Environmental Management Systems
  { questionKey: 'iso14001.permitsCount', certificateCode: 'ISO14001', labelKey: 'iso14001.permitsCount', questionType: 'NUMBER' },
  { questionKey: 'iso14001.hazardousMaterials', certificateCode: 'ISO14001', labelKey: 'iso14001.hazardousMaterials', questionType: 'BOOLEAN' },
  { questionKey: 'iso14001.emissionsMonitoring', certificateCode: 'ISO14001', labelKey: 'iso14001.emissionsMonitoring', questionType: 'BOOLEAN' },
  { questionKey: 'iso14001.environmentalViolations', certificateCode: 'ISO14001', labelKey: 'iso14001.environmentalViolations', questionType: 'BOOLEAN' },
  { questionKey: 'iso14001.outsourcedEnvironmentalActivities', certificateCode: 'ISO14001', labelKey: 'iso14001.outsourcedEnvironmentalActivities', questionType: 'BOOLEAN' },
  { questionKey: 'iso14001.sensitiveAreasNearby', certificateCode: 'ISO14001', labelKey: 'iso14001.sensitiveAreasNearby', questionType: 'BOOLEAN' },
  { questionKey: 'iso50001.energyConsumers', certificateCode: 'ISO50001', labelKey: 'iso50001.energyConsumers', questionType: 'TEXT' },
  { questionKey: 'iso50001.enpi', certificateCode: 'ISO50001', labelKey: 'iso50001.enpi', questionType: 'TEXT' },
  { questionKey: 'iso50001.energyBaseline', certificateCode: 'ISO50001', labelKey: 'iso50001.energyBaseline', questionType: 'BOOLEAN' },
  { questionKey: 'iso50001.baselineUpdated', certificateCode: 'ISO50001', labelKey: 'iso50001.baselineUpdated', questionType: 'DATE', dependsOn: 'iso50001.energyBaseline' },
  { questionKey: 'iso50001.monitoringTools', certificateCode: 'ISO50001', labelKey: 'iso50001.monitoringTools', questionType: 'TEXT' },
  { questionKey: 'iso50001.seuCount', certificateCode: 'ISO50001', labelKey: 'iso50001.seuCount', questionType: 'NUMBER' },
  { questionKey: 'iso50001.monitoringAutomated', certificateCode: 'ISO50001', labelKey: 'iso50001.monitoringAutomated', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.ohsSystemInPlace', certificateCode: 'ISO45001', labelKey: 'iso45001.ohsSystemInPlace', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.ohsStartDate', certificateCode: 'ISO45001', labelKey: 'iso45001.ohsStartDate', questionType: 'DATE', dependsOn: 'iso45001.ohsSystemInPlace' },
  { questionKey: 'iso45001.risksIdentified', certificateCode: 'ISO45001', labelKey: 'iso45001.risksIdentified', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.criticalRisks', certificateCode: 'ISO45001', labelKey: 'iso45001.criticalRisks', questionType: 'TEXT' },
  { questionKey: 'iso45001.complianceLaws', certificateCode: 'ISO45001', labelKey: 'iso45001.complianceLaws', questionType: 'TEXT' },
  { questionKey: 'iso45001.legalViolations', certificateCode: 'ISO45001', labelKey: 'iso45001.legalViolations', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.ohsCertification', certificateCode: 'ISO45001', labelKey: 'iso45001.ohsCertification', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.certifyingBody', certificateCode: 'ISO45001', labelKey: 'iso45001.certifyingBody', questionType: 'TEXT', dependsOn: 'iso45001.ohsCertification' },
  { questionKey: 'iso45001.internalAudits', certificateCode: 'ISO45001', labelKey: 'iso45001.internalAudits', questionType: 'BOOLEAN' },

  // ISO 22000:2022 — Food Safety Management
  { questionKey: 'iso22000.haccpPlansCount', certificateCode: 'ISO22000', labelKey: 'iso22000.haccpPlansCount', questionType: 'NUMBER' },
  { questionKey: 'iso22000.ccpCount', certificateCode: 'ISO22000', labelKey: 'iso22000.ccpCount', questionType: 'NUMBER' },
  { questionKey: 'iso22000.foodCategoriesScope', certificateCode: 'ISO22000', labelKey: 'iso22000.foodCategoriesScope', questionType: 'TEXT' },
  { questionKey: 'iso22000.allergensHandled', certificateCode: 'ISO22000', labelKey: 'iso22000.allergensHandled', questionType: 'BOOLEAN' },
  { questionKey: 'iso22000.allergensList', certificateCode: 'ISO22000', labelKey: 'iso22000.allergensList', questionType: 'TEXT', dependsOn: 'iso22000.allergensHandled' },
  { questionKey: 'iso22000.outsourcedFoodSafety', certificateCode: 'ISO22000', labelKey: 'iso22000.outsourcedFoodSafety', questionType: 'BOOLEAN' },
  { questionKey: 'iso22000.foodSafetyIncidents', certificateCode: 'ISO22000', labelKey: 'iso22000.foodSafetyIncidents', questionType: 'BOOLEAN' },
  // TEMPORARY: Single Select in the source doc, rendered as free text until the option list is provided
  { questionKey: 'iso22000.productionSeasonality', certificateCode: 'ISO22000', labelKey: 'iso22000.productionSeasonality', questionType: 'TEXT' },

  // ISO 22301:2019 — Business Continuity Management
  { questionKey: 'iso22301.criticalActivitiesCount', certificateCode: 'ISO22301', labelKey: 'iso22301.criticalActivitiesCount', questionType: 'NUMBER' },
  { questionKey: 'iso22301.mtpd', certificateCode: 'ISO22301', labelKey: 'iso22301.mtpd', questionType: 'TEXT' },
  { questionKey: 'iso22301.biaCompleted', certificateCode: 'ISO22301', labelKey: 'iso22301.biaCompleted', questionType: 'BOOLEAN' },
  { questionKey: 'iso22301.biaDate', certificateCode: 'ISO22301', labelKey: 'iso22301.biaDate', questionType: 'DATE', dependsOn: 'iso22301.biaCompleted' },
  { questionKey: 'iso22301.planTested', certificateCode: 'ISO22301', labelKey: 'iso22301.planTested', questionType: 'BOOLEAN' },
  { questionKey: 'iso22301.singleCriticalSupplier', certificateCode: 'ISO22301', labelKey: 'iso22301.singleCriticalSupplier', questionType: 'BOOLEAN' },
  { questionKey: 'iso22301.majorDisruptions', certificateCode: 'ISO22301', labelKey: 'iso22301.majorDisruptions', questionType: 'BOOLEAN' },

  // ISO/IEC 27001:2022 — Information Security Management
  { questionKey: 'iso27001.criticalAssetsCount', certificateCode: 'ISO27001', labelKey: 'iso27001.criticalAssetsCount', questionType: 'NUMBER' },
  { questionKey: 'iso27001.annexAControlsCount', certificateCode: 'ISO27001', labelKey: 'iso27001.annexAControlsCount', questionType: 'NUMBER' },
  { questionKey: 'iso27001.processesRegulatedData', certificateCode: 'ISO27001', labelKey: 'iso27001.processesRegulatedData', questionType: 'BOOLEAN' },
  { questionKey: 'iso27001.securityIncidents', certificateCode: 'ISO27001', labelKey: 'iso27001.securityIncidents', questionType: 'BOOLEAN' },
  { questionKey: 'iso27001.outsourcedIT', certificateCode: 'ISO27001', labelKey: 'iso27001.outsourcedIT', questionType: 'BOOLEAN' },
  { questionKey: 'iso27001.locationsCount', certificateCode: 'ISO27001', labelKey: 'iso27001.locationsCount', questionType: 'NUMBER' },

  // ISO 13485:2016 — Medical Devices Quality Management
  { questionKey: 'iso13485.deviceFamiliesCount', certificateCode: 'ISO13485', labelKey: 'iso13485.deviceFamiliesCount', questionType: 'NUMBER' },
  // TEMPORARY: Multi Select in the source doc, rendered as free text until the option list is provided
  { questionKey: 'iso13485.deviceClasses', certificateCode: 'ISO13485', labelKey: 'iso13485.deviceClasses', questionType: 'TEXT' },
  { questionKey: 'iso13485.designOrManufacture', certificateCode: 'ISO13485', labelKey: 'iso13485.designOrManufacture', questionType: 'BOOLEAN' },
  { questionKey: 'iso13485.sterilizationInHouse', certificateCode: 'ISO13485', labelKey: 'iso13485.sterilizationInHouse', questionType: 'BOOLEAN' },
  { questionKey: 'iso13485.recallsOrEvents', certificateCode: 'ISO13485', labelKey: 'iso13485.recallsOrEvents', questionType: 'BOOLEAN' },
  // TEMPORARY: Multi Select in the source doc, rendered as free text until the option list is provided
  { questionKey: 'iso13485.regulatoryMarkets', certificateCode: 'ISO13485', labelKey: 'iso13485.regulatoryMarkets', questionType: 'TEXT' },
]

/** A follow-up ("If yes, …") is shown unless its yes/no parent was answered "no". */
export function isSpecQuestionVisible(question: SpecQuestionDef, answers: Record<string, string>): boolean {
  return !question.dependsOn || answers[question.dependsOn] !== 'no'
}

/** Upload slots on the documents step → API document types. */
export const DOCUMENT_SLOT_TYPES: Record<string, string> = {
  documentarySystem: 'QUALITY_MANUAL',
  organizationalStructure: 'ORGANIZATION_CHART',
  commercialRegistry: 'COMMERCIAL_REGISTER',
  vatCertificate: 'OTHER',
  brandImage: 'OTHER',
  nationalAddress: 'OTHER',
  qualityPolicy: 'QUALITY_MANUAL',
  consultantCv: 'CONSULTANT_CV',
  other: 'OTHER',
}