export type OrgScopeCategory =
  | 'ACCREDITATION_BODY'
  | 'CONFORMITY_ASSESSMENT_BODY'
  | 'SCHEME_OWNER'
  | 'INTERNAL_AUDITS'
  | 'SUPPLIER_AUDITS'

export interface OrgScopeCategoryOption {
  value: OrgScopeCategory
  titleKey: string
  descriptionKey: string
}

export interface OrgScopeSubOption {
  value: string
  labelKey: string
}

export const ORG_SCOPE_CATEGORY_OPTIONS: OrgScopeCategoryOption[] = [
  {
    value: 'ACCREDITATION_BODY',
    titleKey: 'onboarding.orgType.options.accreditationBody.title',
    descriptionKey: 'onboarding.orgType.options.accreditationBody.description',
  },
  {
    value: 'CONFORMITY_ASSESSMENT_BODY',
    titleKey: 'onboarding.orgType.options.conformityAssessmentBody.title',
    descriptionKey: 'onboarding.orgType.options.conformityAssessmentBody.description',
  },
  {
    value: 'SCHEME_OWNER',
    titleKey: 'onboarding.orgType.options.schemeOwner.title',
    descriptionKey: 'onboarding.orgType.options.schemeOwner.description',
  },
  {
    value: 'INTERNAL_AUDITS',
    titleKey: 'onboarding.orgType.options.internalAudits.title',
    descriptionKey: 'onboarding.orgType.options.internalAudits.description',
  },
  {
    value: 'SUPPLIER_AUDITS',
    titleKey: 'onboarding.orgType.options.supplierAudits.title',
    descriptionKey: 'onboarding.orgType.options.supplierAudits.description',
  },
]

export const ORG_SCOPE_SUB_OPTIONS: Record<OrgScopeCategory, OrgScopeSubOption[]> = {
  ACCREDITATION_BODY: [
    { value: 'MS_CERTIFICATION_BODIES', labelKey: 'onboarding.orgType.subOptions.msCertificationBodies' },
    { value: 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODIES', labelKey: 'onboarding.orgType.subOptions.productProcessServiceCertificationBodies' },
    { value: 'PERSONNEL_CERTIFICATION_BODIES', labelKey: 'onboarding.orgType.subOptions.personnelCertificationBodies' },
    { value: 'INSPECTION_BODIES', labelKey: 'onboarding.orgType.subOptions.inspectionBodies' },
    { value: 'TESTING_LABORATORIES', labelKey: 'onboarding.orgType.subOptions.testingLaboratories' },
    { value: 'CALIBRATION_LABORATORIES', labelKey: 'onboarding.orgType.subOptions.calibrationLaboratories' },
    { value: 'MEDICAL_LABORATORIES', labelKey: 'onboarding.orgType.subOptions.medicalLaboratories' },
    { value: 'VALIDATION_VERIFICATION_BODIES', labelKey: 'onboarding.orgType.subOptions.validationVerificationBodies' },
    { value: 'PROFICIENCY_TESTING_PROVIDERS', labelKey: 'onboarding.orgType.subOptions.proficiencyTestingProviders' },
    { value: 'REFERENCE_MATERIAL_PRODUCERS', labelKey: 'onboarding.orgType.subOptions.referenceMaterialProducers' },
    { value: 'BIOBANKS', labelKey: 'onboarding.orgType.subOptions.biobanks' },
  ],
  CONFORMITY_ASSESSMENT_BODY: [
    { value: 'MS_CERTIFICATION_BODY', labelKey: 'onboarding.orgType.subOptions.msCertificationBody' },
    { value: 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY', labelKey: 'onboarding.orgType.subOptions.productProcessServiceCertificationBody' },
    { value: 'PERSONNEL_CERTIFICATION_BODY', labelKey: 'onboarding.orgType.subOptions.personnelCertificationBody' },
    { value: 'INSPECTION_BODY', labelKey: 'onboarding.orgType.subOptions.inspectionBody' },
    { value: 'TESTING_LABORATORY', labelKey: 'onboarding.orgType.subOptions.testingLaboratory' },
    { value: 'CALIBRATION_LABORATORY', labelKey: 'onboarding.orgType.subOptions.calibrationLaboratory' },
    { value: 'MEDICAL_LABORATORY', labelKey: 'onboarding.orgType.subOptions.medicalLaboratory' },
    { value: 'VALIDATION_VERIFICATION_BODY', labelKey: 'onboarding.orgType.subOptions.validationVerificationBody' },
    { value: 'PROFICIENCY_TESTING_PROVIDER', labelKey: 'onboarding.orgType.subOptions.proficiencyTestingProvider' },
    { value: 'REFERENCE_MATERIAL_PRODUCER', labelKey: 'onboarding.orgType.subOptions.referenceMaterialProducer' },
  ],
  SCHEME_OWNER: [
    { value: 'REGULATORY_SCHEME_OWNER', labelKey: 'onboarding.orgType.subOptions.regulatorySchemeOwner' },
    { value: 'GOVERNMENT_SCHEME_OWNER', labelKey: 'onboarding.orgType.subOptions.governmentSchemeOwner' },
    { value: 'INDUSTRY_ASSOCIATION_SCHEME_OWNER', labelKey: 'onboarding.orgType.subOptions.industryAssociationSchemeOwner' },
    { value: 'PRIVATE_CERTIFICATION_SCHEME_OWNER', labelKey: 'onboarding.orgType.subOptions.privateCertificationSchemeOwner' },
    { value: 'SUSTAINABILITY_ESG_SCHEME_OWNER', labelKey: 'onboarding.orgType.subOptions.sustainabilityEsgSchemeOwner' },
    { value: 'TRAINING_PERSONNEL_SCHEME_OWNER', labelKey: 'onboarding.orgType.subOptions.trainingPersonnelSchemeOwner' },
    { value: 'OTHER_SCHEME_OWNER', labelKey: 'onboarding.orgType.subOptions.otherSchemeOwner' },
  ],
  INTERNAL_AUDITS: [
    { value: 'MS_INTERNAL_AUDIT', labelKey: 'onboarding.orgType.subOptions.msInternalAudit' },
    { value: 'PROCESS_AUDIT', labelKey: 'onboarding.orgType.subOptions.processAudit' },
    { value: 'PRODUCT_AUDIT', labelKey: 'onboarding.orgType.subOptions.productAudit' },
    { value: 'COMPLIANCE_AUDIT', labelKey: 'onboarding.orgType.subOptions.complianceAudit' },
  ],
  SUPPLIER_AUDITS: [
    { value: 'SUPPLIER_QUALIFICATION_AUDIT', labelKey: 'onboarding.orgType.subOptions.supplierQualificationAudit' },
    { value: 'SUPPLIER_PERFORMANCE_AUDIT', labelKey: 'onboarding.orgType.subOptions.supplierPerformanceAudit' },
    { value: 'SUPPLIER_COMPLIANCE_AUDIT', labelKey: 'onboarding.orgType.subOptions.supplierComplianceAudit' },
    { value: 'PRODUCT_OR_PROCESS_AUDIT', labelKey: 'onboarding.orgType.subOptions.productOrProcessAudit' },
    { value: 'SOCIAL_COMPLIANCE_AUDIT', labelKey: 'onboarding.orgType.subOptions.socialComplianceAudit' },
    { value: 'SUSTAINABILITY_ESG_AUDIT', labelKey: 'onboarding.orgType.subOptions.sustainabilityEsgAudit' },
    { value: 'FOOD_SAFETY_SUPPLIER_AUDIT', labelKey: 'onboarding.orgType.subOptions.foodSafetySupplierAudit' },
  ],
}

export function getOrgScopeSubOptions(category: OrgScopeCategory): OrgScopeSubOption[] {
  return ORG_SCOPE_SUB_OPTIONS[category] ?? []
}
