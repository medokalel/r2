export type DocumentCategory = 'legalOrganizational' | 'managementSystem' | 'complianceOther'

export type DocumentRequirement = 'mandatory' | 'optional' | 'notApplicable'

export type DocumentUploadStatus = 'uploaded' | 'pending' | 'notUploaded'

/** Which sites/functions a document applies to — set from the Upload Document modal. */
export type DocumentApplicableTo = 'entireOrganization' | 'headOfficeOnly' | 'singleSite' | 'multipleSites'

export interface DocumentRecord {
  id: string
  category: DocumentCategory
  /** Suffix used with `cab.applicationDraft.documents.items.<nameKey>` */
  nameKey: string
  requirement: DocumentRequirement
  status: DocumentUploadStatus
  fileName?: string
  fileUrl?: string
  uploadedDate?: string
  applicableTo?: DocumentApplicableTo
  /** Free-text note captured from the Upload Document modal; falls back to the item's default note. */
  description?: string
  /** Set for ad-hoc documents added via the modal that don't match a checklist item. */
  customName?: string
}

export interface DocumentsForm {
  documents: DocumentRecord[]
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'legalOrganizational',
  'managementSystem',
  'complianceOther',
]

export const APPLICABLE_TO_OPTIONS: DocumentApplicableTo[] = [
  'entireOrganization',
  'headOfficeOnly',
  'singleSite',
  'multipleSites',
]

/** Draft seed list — mirrors the standard document checklist required to submit a certification application. */
export const emptyDocumentsForm: DocumentsForm = {
  documents: [
    { id: 'incorporationCertificate', category: 'legalOrganizational', nameKey: 'incorporationCertificate', requirement: 'mandatory', status: 'notUploaded' },
    { id: 'memorandumOfAssociation', category: 'legalOrganizational', nameKey: 'memorandumOfAssociation', requirement: 'mandatory', status: 'notUploaded' },
    { id: 'organizationChart', category: 'legalOrganizational', nameKey: 'organizationChart', requirement: 'mandatory', status: 'notUploaded' },
    { id: 'keyManagementList', category: 'legalOrganizational', nameKey: 'keyManagementList', requirement: 'mandatory', status: 'notUploaded' },

    { id: 'managementSystemManual', category: 'managementSystem', nameKey: 'managementSystemManual', requirement: 'mandatory', status: 'notUploaded' },
    { id: 'documentedProcedures', category: 'managementSystem', nameKey: 'documentedProcedures', requirement: 'mandatory', status: 'notUploaded' },
    { id: 'scopeDocument', category: 'managementSystem', nameKey: 'scopeDocument', requirement: 'mandatory', status: 'notUploaded' },
    { id: 'internalAuditReports', category: 'managementSystem', nameKey: 'internalAuditReports', requirement: 'mandatory', status: 'notUploaded' },
    { id: 'managementReviewReports', category: 'managementSystem', nameKey: 'managementReviewReports', requirement: 'mandatory', status: 'notUploaded' },

    { id: 'legalRegulatoryRequirements', category: 'complianceOther', nameKey: 'legalRegulatoryRequirements', requirement: 'mandatory', status: 'notUploaded' },
    { id: 'previousCertificate', category: 'complianceOther', nameKey: 'previousCertificate', requirement: 'optional', status: 'notUploaded' },
    { id: 'otherSupportingDocuments', category: 'complianceOther', nameKey: 'otherSupportingDocuments', requirement: 'optional', status: 'notUploaded' },
  ],
}

export function isDocumentsComplete(form: DocumentsForm): boolean {
  return form.documents
    .filter((doc) => doc.requirement === 'mandatory')
    .every((doc) => doc.status === 'uploaded')
}

export function documentCompletionCounts(form: DocumentsForm) {
  const mandatory = form.documents.filter((doc) => doc.requirement === 'mandatory')
  return {
    uploaded: form.documents.filter((doc) => doc.status === 'uploaded').length,
    pending: form.documents.filter((doc) => doc.status === 'pending').length,
    notUploaded: form.documents.filter((doc) => doc.status === 'notUploaded').length,
    mandatoryTotal: mandatory.length,
    mandatoryUploaded: mandatory.filter((doc) => doc.status === 'uploaded').length,
  }
}