import { Airplane, DocumentText1, DocumentUpload, MessageQuestion, SecuritySafe, Setting4 } from 'iconsax-reactjs'
import {
  AccreditationFieldIcon,
  BuildingsIcon,
  CertificateBadgeIcon,
  CorrectiveActionIcon,
  DashboardIcon,
  ExportIcon,
  FileReviewIcon,
  FileTextIcon,
  MailIcon,
  ReportIcon,
  ReceiptIcon,
  SettingsIcon,
  ShieldIcon,
  SuccessCircleIcon,
  TaskSquareIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  type AppIconComponent,
} from '@/components/icons'
import { ROUTES } from '@/lib/routes'

/**
 * Tiles of the CAB application hub (/workspace). The workspace renders them, and iHelp
 * builds its CAB sections from them, so a tile added here appears in the help center
 * automatically (with an auto-generated article until a written one exists).
 */
export interface WorkspaceAppConfig {
  key: string
  titleKey: string
  descriptionKey: string
  route?: string
  icon: AppIconComponent
  comingSoon?: boolean
}

export interface WorkspacePhaseConfig {
  key: string
  titleKey: string
  titleFallback: string
  hintKey: string
  hintFallback: string
  apps: string[]
}

const tile = (key: string, route: string, icon: AppIconComponent): WorkspaceAppConfig => ({
  key,
  titleKey: `cab.workspace.apps.${key}`,
  descriptionKey: `cab.workspace.appDesc.${key}`,
  route,
  icon,
})

export const IHELP_TILE_KEY = 'iHelp'

export const WORKSPACE_APPS: WorkspaceAppConfig[] = [
  tile('applications', ROUTES.cabApplicationRegister, FileTextIcon),
  tile('auditClients', ROUTES.cabAuditClients, UsersIcon),
  tile('applicationReview', '/cab/applications/review', FileReviewIcon),
  tile('contacts', ROUTES.cabContacts, MailIcon),
  tile('offers', ROUTES.cabOffers, ExportIcon),
  tile('invoices', ROUTES.cabInvoices, ReceiptIcon),
  tile('auditPlanning', ROUTES.cabAuditPlanning, TaskSquareIcon),
  tile('auditReporting', ROUTES.cabAuditReporting, ReportIcon),
  tile('decisions', ROUTES.cabDecisions, SuccessCircleIcon),
  tile('certificates', ROUTES.cabCertificates, CertificateBadgeIcon),
  tile('nonconformities', ROUTES.cabNonconformities, CorrectiveActionIcon),
  tile('certification', ROUTES.cabCertificationCycles, ShieldIcon),
  tile('reportsAnalytics', ROUTES.cabDashboard, DashboardIcon),
  tile('clientPortal', ROUTES.portal, UserIcon),
  tile('competence', ROUTES.cabCompetence, AccreditationFieldIcon),
  tile('companyProfile', ROUTES.cabCompanyProfile, BuildingsIcon),
  tile('settings', ROUTES.cabCompanyProfile, SettingsIcon),
  tile('migration', ROUTES.cabMigration, DocumentUpload),
  { key: 'sso', titleKey: 'sso.workspace.title', descriptionKey: 'sso.workspace.description', route: ROUTES.cabSso, icon: SecuritySafe },
  { key: 'agreements', titleKey: 'agreements.workspace.title', descriptionKey: 'agreements.workspace.description', route: ROUTES.cabAgreements, icon: DocumentText1 },
  { key: 'agreementTerms', titleKey: 'agreements.workspace.termsTitle', descriptionKey: 'agreements.workspace.termsDescription', route: ROUTES.cabAgreementTerms, icon: Setting4 },
  { key: 'travelPolicy', titleKey: 'travel.workspace.title', descriptionKey: 'travel.workspace.description', route: ROUTES.cabTravelPolicy, icon: Airplane },
  tile('applicationReceipt', '/cab/applications/receipt', ReceiptIcon),
  tile('informationRequired', ROUTES.cabApplicationInformationRequired, CorrectiveActionIcon),
  tile('technicalFeasibility', ROUTES.cabApplicationTechnicalFeasibility, SettingsIcon),
  tile('quotation', ROUTES.cabApplicationQuotation, WalletIcon),
  tile('quotationApproval', ROUTES.cabQuotationApproval, SuccessCircleIcon),
  {
    key: IHELP_TILE_KEY,
    titleKey: 'help.workspace.title',
    descriptionKey: 'help.workspace.description',
    route: ROUTES.help,
    icon: MessageQuestion,
  },
]

// Ordered as the certification flow runs, so a CAB knows where to start and where it ends:
// set up the body → register clients → receive and review the application → quote and contract →
// plan and run the audit → decide and certify → follow up (surveillance, money, analytics).
// iHelp sits in its own last group so it never shifts the step numbers of the flow.
export const WORKSPACE_PHASES: WorkspacePhaseConfig[] = [
  { key: 'setup', titleKey: 'cab.workspace.phases.setup', titleFallback: 'Set up your body', hintKey: 'cab.workspace.phases.setupHint', hintFallback: 'Start here: profile, schemes, people and competence.', apps: ['companyProfile', 'competence', 'settings', 'migration', 'sso', 'agreementTerms', 'travelPolicy'] },
  { key: 'clients', titleKey: 'cab.workspace.phases.clients', titleFallback: 'Clients', hintKey: 'cab.workspace.phases.clientsHint', hintFallback: 'Register the organisations you certify and their contacts.', apps: ['auditClients', 'contacts', 'clientPortal'] },
  { key: 'application', titleKey: 'cab.workspace.phases.application', titleFallback: 'Application', hintKey: 'cab.workspace.phases.applicationHint', hintFallback: 'Receive the application and confirm you can certify it.', apps: ['applications', 'applicationReceipt', 'applicationReview', 'informationRequired', 'technicalFeasibility'] },
  { key: 'contract', titleKey: 'cab.workspace.phases.contract', titleFallback: 'Quotation & contract', hintKey: 'cab.workspace.phases.contractHint', hintFallback: 'Price the audit, approve it and send the offer.', apps: ['quotation', 'quotationApproval', 'offers', 'agreements'] },
  { key: 'audit', titleKey: 'cab.workspace.phases.audit', titleFallback: 'Audit', hintKey: 'cab.workspace.phases.auditHint', hintFallback: 'Plan the audit, report findings and close nonconformities.', apps: ['auditPlanning', 'auditReporting', 'nonconformities'] },
  { key: 'certification', titleKey: 'cab.workspace.phases.certification', titleFallback: 'Decision & certification', hintKey: 'cab.workspace.phases.certificationHint', hintFallback: 'Decide, issue the certificate and run the cycle.', apps: ['decisions', 'certificates', 'certification'] },
  { key: 'followUp', titleKey: 'cab.workspace.phases.followUp', titleFallback: 'Finance & insight', hintKey: 'cab.workspace.phases.followUpHint', hintFallback: 'Invoice the work and follow performance.', apps: ['invoices', 'reportsAnalytics'] },
  { key: 'help', titleKey: 'help.workspace.phase', titleFallback: 'Help', hintKey: 'help.workspace.phaseHint', hintFallback: 'Guides for every screen, what is new and answers to common questions.', apps: [IHELP_TILE_KEY] },
]
