export const subSections = [
  'legalIdentity',
  'scopeOfActivity',
  'consultingReadiness',
  'specificationQuestions',
  'legalDeclarations',
] as const

export type EntityDataSubSection = (typeof subSections)[number]

export type EntityDataViewTab = 'entityData' | 'field' | 'documents' | 'feedback' | 'approved' | 'underReview' | 'rejected'
