import { typedSignatureDataUrl } from '@/components/ui/SignaturePad'
import {
  SPEC_QUESTIONS,
  createEmptyBranch,
  type ApplicationFormValues,
  type BranchFormValues,
} from '@/components/dashboard/entityData/applicationTypes'
import {
  codesForStandardSector,
  sectorsForStandard,
  type StandardKey,
} from '@/components/dashboard/entityData/fieldTypes'

const SAMPLE_SPEC_TEXT: Record<string, string> = {
  'iso9001.productsServicesScope': 'Packaged food products, processing, and distribution',
  'iso9001.outsourcedProcessesList': 'Laboratory testing and waste collection',
  'iso9001.notApplicableDetails': 'Clause 8.3 Design and development is excluded; products are manufactured to customer specifications',
  'iso9001.certifyingBody': 'CASCO Certification Body',
  'iso50001.energyConsumers': 'Boilers, refrigeration, and compressed air systems',
  'iso50001.enpi': 'kWh per ton of finished product',
  'iso50001.monitoringTools': 'Utility meters and monthly energy dashboard',
  'iso45001.criticalRisks': 'Working at height, forklift traffic, and chemical handling',
  'iso45001.complianceLaws': 'Occupational Health and Safety Law and factory regulations',
  'iso45001.certifyingBody': 'CASCO Certification Body',
  'iso22000.foodCategoriesScope': 'Ready-to-eat packaged foods and dry mixes',
  'iso22000.allergensList': 'Gluten, milk, and soy',
  'iso22000.productionSeasonality': 'Year-round production',
  'iso22301.mtpd': '24 hours',
  'iso13485.deviceClasses': 'Class I and Class IIa devices',
  'iso13485.regulatoryMarkets': 'Saudi Arabia, UAE, and Egypt',
}

export function sampleAnswerForQuestion(questionKey: string, questionType: string): string {
  if (questionType === 'BOOLEAN') return 'yes'
  if (questionType === 'DATE') return '2024-01-15'
  if (questionType === 'NUMBER') return '2'
  return SAMPLE_SPEC_TEXT[questionKey] ?? 'Documented and available for review'
}

export function displaySpecAnswer(questionKey: string | undefined, answer: unknown): unknown {
  if (typeof answer !== 'string') return answer
  const trimmed = answer.trim()
  if (trimmed.toLowerCase() !== 'sample response') return answer
  return questionKey ? SAMPLE_SPEC_TEXT[questionKey] ?? 'Documented and available for review' : 'Documented and available for review'
}

function fillBranch(branch: BranchFormValues, index: number): BranchFormValues {
  return {
    ...branch,
    branchName: branch.branchName.trim() || (index === 0 ? 'Head office' : `Site ${index + 1}`),
    address: branch.address.trim() || 'King Fahd Road, Riyadh',
    employees: branch.employees.trim() || '45',
    employeesInScope: branch.employeesInScope.trim() || '30',
    shifts: branch.shifts.trim() || '2',
    workingHours: branch.workingHours.trim() || '8',
    productionLines: branch.productionLines.trim() || '2',
    weeklyHoliday: branch.weeklyHoliday || 'Friday',
    phase1ExpectedDate: branch.phase1ExpectedDate ?? new Date(Date.now() + 45 * 86_400_000),
    integratedSystem: branch.integratedSystem || 'yes',
    centralManagement: branch.centralManagement || 'yes',
    activities: branch.activities.trim() || 'Manufacturing and quality control',
    products: branch.products.trim() || 'Packaged food products',
    technicalCommunication: branch.technicalCommunication.trim() || 'English',
  }
}

/** Completes every application field with sample values so submit can be tested. */
export function fillApplicationForm(form: ApplicationFormValues): ApplicationFormValues {
  const selectedStandards: StandardKey[] =
    form.selectedStandards.length > 0 ? form.selectedStandards : ['iso9001']
  const selectedSectors = { ...form.selectedSectors }
  const selectedCodes = { ...form.selectedCodes }

  for (const standard of selectedStandards) {
    const sectors = selectedSectors[standard]?.length
      ? selectedSectors[standard]
      : [sectorsForStandard(standard)[0]].filter(Boolean)
    selectedSectors[standard] = sectors
    for (const sector of sectors) {
      const key = `${standard}:${sector}`
      if ((selectedCodes[key] ?? []).length > 0) continue
      const firstCode = codesForStandardSector(standard, sector)[0]?.code
      if (firstCode) selectedCodes[key] = [firstCode]
    }
  }

  const specAnswers = { ...form.specAnswers }
  const selectedCodesUpper = new Set(selectedStandards.map((standard) => standard.toUpperCase()))
  for (const question of SPEC_QUESTIONS) {
    if (!selectedCodesUpper.has(question.certificateCode)) continue
    const current = specAnswers[question.questionKey]
    if (current && current.trim().toLowerCase() !== 'sample response') continue
    specAnswers[question.questionKey] = sampleAnswerForQuestion(question.questionKey, question.questionType)
  }

  const sourceBranches = form.branches.length > 0 ? form.branches : [createEmptyBranch(1)]
  const branches = sourceBranches.map((branch, index) => fillBranch(branch, index))

  return {
    ...form,
    selectedStandards,
    organizationName: form.organizationName.trim() || 'Sample Food Industries',
    website: form.website.trim() || 'https://example.com',
    headOfficeAddress: form.headOfficeAddress.trim() || 'King Fahd Road, Riyadh',
    auditSiteAddress: form.auditSiteAddress.trim() || 'Industrial City, Riyadh',
    commercialRegisterNumber: form.commercialRegisterNumber.trim() || '1010123456',
    allProductionLinesIncluded: form.allProductionLinesIncluded || 'yes',
    excludedReason: form.allProductionLinesIncluded === 'no' ? form.excludedReason || 'N/A' : form.excludedReason,
    email: form.email.trim() || 'quality@example.com',
    country: form.country ?? 'SA',
    city: form.city.trim() || 'Riyadh',
    representativeName: form.representativeName.trim() || 'Ahmed Al Saud',
    jobTitle: form.jobTitle.trim() || 'Quality Manager',
    organizationNature: form.organizationNature || 'private',
    mobileNumber: form.mobileNumber.trim() || '512345678',
    mainActivity: form.mainActivity.trim() || 'Food manufacturing',
    fieldOfWork: form.fieldOfWork.trim() || 'Food processing',
    economicFields: form.economicFields.length > 0 ? form.economicFields : ['Food manufacturing'],
    productsServices: form.productsServices.trim() || 'Packaged food products',
    annualCapacity: form.annualCapacity.trim() || '12000 tons',
    technicalSpecifications: form.technicalSpecifications.trim() || 'ISO-aligned production controls',
    hasBranches: 'yes',
    branches,
    usedConsultant: form.usedConsultant || 'no',
    consultantName: form.usedConsultant === 'yes' ? form.consultantName.trim() || 'Sample Consultant' : form.consultantName,
    consultantCvAttached: form.consultantCvAttached || 'no',
    consultancyMonths: form.usedConsultant === 'yes' ? form.consultancyMonths.trim() || '6' : form.consultancyMonths,
    qualificationRate: form.qualificationRate ?? 4,
    recommendationRate: form.recommendationRate ?? 4,
    systemLanguage: form.systemLanguage || 'en',
    easyAccess: form.easyAccess || 'yes',
    safetyProcedures: form.safetyProcedures || 'yes',
    usesSubcontractors: form.usesSubcontractors || 'no',
    previousGrants: form.previousGrants || 'no',
    currentSystems: form.currentSystems.length > 0 ? form.currentSystems : ['iso9001'],
    designActivity: form.designActivity || 'yes',
    designException:
      (form.designActivity || 'yes') === 'no'
        ? form.designException.trim() || 'Design is outsourced'
        : form.designException,
    specAnswers,
    selectedSectors,
    selectedCodes,
    signatoryName: form.signatoryName.trim() || form.representativeName.trim() || 'Ahmed Al Saud',
    declarationDate: form.declarationDate ?? new Date(),
    signature: form.signature || typedSignatureDataUrl(form.signatoryName.trim() || form.representativeName.trim() || 'Ahmed Al Saud'),
    certificateNameAr: form.certificateNameAr.trim() || 'صناعات الأغذية النموذجية',
    certificateNameEn: form.certificateNameEn.trim() || 'Sample Food Industries',
    certificateAddressAr: form.certificateAddressAr.trim() || 'الرياض، المملكة العربية السعودية',
    certificateAddressEn: form.certificateAddressEn.trim() || 'Riyadh, Saudi Arabia',
    certificateScopeAr: form.certificateScopeAr.trim() || 'تصنيع وتعبئة المنتجات الغذائية',
    certificateScopeEn: form.certificateScopeEn.trim() || 'Manufacture and packing of food products',
    agreed: true,
  }
}
