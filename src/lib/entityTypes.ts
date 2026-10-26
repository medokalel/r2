export type EntityType = 'ACCREDITATION_BODY' | 'CERTIFICATION_BODY' | 'CONSULTATION_BODY'

export const ENTITY_TYPE_OPTIONS: { type: EntityType; labelKey: string }[] = [
  { type: 'ACCREDITATION_BODY', labelKey: 'register.accreditationBodies' },
  { type: 'CERTIFICATION_BODY', labelKey: 'register.certificationBodies' },
  { type: 'CONSULTATION_BODY', labelKey: 'register.auditClients' },
]