import { Airplane, Crown1, DocumentText1, DocumentUpload, SecuritySafe, Setting4 } from 'iconsax-reactjs'
import {
  AccreditationFieldIcon,
  BuildingsIcon,
  CertificateBadgeIcon,
  CorrectiveActionIcon,
  DashboardIcon,
  ExportIcon,
  FileTextIcon,
  MailIcon,
  ReceiptIcon,
  ReportIcon,
  SettingsIcon,
  ShieldIcon,
  SuccessCircleIcon,
  TaskSquareIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/icons'
import { ROUTES } from '@/lib/routes'

/**
 * Navigation of the CAB sidebar. The sidebar renders it, and iHelp builds its CAB sections
 * from it, so a module added here appears in the help center automatically.
 */
export interface CabNavItem {
  icon?: typeof DashboardIcon
  labelKey: string
  href?: string
  disabled?: boolean
  stepId?: string
  children?: CabNavItem[]
}

export interface CabNavGroup {
  id: string
  labelKey: string
  items: CabNavItem[]
}

export const CAB_NAV_HOME: CabNavItem = {
  icon: DashboardIcon,
  labelKey: 'nav.home',
  href: ROUTES.workspace,
  stepId: 'sidebar-navigation',
}

// Same order as the certification flow used across the platform (workspace phases and
// the pipeline): set up the body → clients → application → quotation & contract → audit →
// decision & certification → finance & insight.
export const CAB_NAV_GROUPS: CabNavGroup[] = [
  {
    id: 'setup',
    labelKey: 'cab.workspace.phases.setup',
    items: [
      { icon: BuildingsIcon, labelKey: 'cab.sidebar.companyProfile', href: ROUTES.cabCompanyProfile },
      { icon: AccreditationFieldIcon, labelKey: 'cab.sidebar.competence', href: ROUTES.cabCompetence },
      { icon: ShieldIcon, labelKey: 'team.nav.impartiality', href: ROUTES.cabImpartiality },
      { icon: SettingsIcon, labelKey: 'cab.sidebar.settings', href: ROUTES.cabCompanyProfile },
      { icon: DocumentUpload, labelKey: 'cab.sidebar.migration', href: ROUTES.cabMigration },
      { icon: SecuritySafe, labelKey: 'sso.nav', href: ROUTES.cabSso },
      { icon: Setting4, labelKey: 'agreements.nav.terms', href: ROUTES.cabAgreementTerms },
      { icon: Airplane, labelKey: 'travel.nav.policy', href: ROUTES.cabTravelPolicy },
    ],
  },
  {
    id: 'clients',
    labelKey: 'cab.workspace.phases.clients',
    items: [
      {
        icon: UsersIcon,
        labelKey: 'cab.sidebar.auditClients',
        href: ROUTES.cabAuditClients,
        stepId: 'sidebar-clients-new',
      },
      { icon: MailIcon, labelKey: 'cab.sidebar.contacts', href: ROUTES.cabContacts },
      { icon: UserIcon, labelKey: 'cab.sidebar.clientPortal', href: ROUTES.portal },
    ],
  },
  {
    id: 'application',
    labelKey: 'cab.workspace.phases.application',
    items: [
      {
        icon: FileTextIcon,
        labelKey: 'cab.sidebar.applications',
        href: ROUTES.cabApplicationRegister,
        children: [
          { labelKey: 'cab.sidebar.applicationSubmission', href: '/cab/applications/submission', stepId: 'sidebar-app-submission' },
          { labelKey: 'cab.sidebar.applicationReceipt', href: '/cab/applications/receipt', stepId: 'sidebar-app-receipt' },
          { labelKey: 'cab.sidebar.applicationReview', href: '/cab/applications/review', stepId: 'sidebar-app-review' },
        ],
      },
      {
        icon: CorrectiveActionIcon,
        labelKey: 'cab.sidebar.informationRequired',
        href: ROUTES.cabApplicationInformationRequired,
        stepId: 'sidebar-app-info',
      },
      {
        icon: SettingsIcon,
        labelKey: 'cab.sidebar.technicalFeasibility',
        href: ROUTES.cabApplicationTechnicalFeasibility,
        stepId: 'sidebar-app-feasibility',
      },
    ],
  },
  {
    id: 'contract',
    labelKey: 'cab.workspace.phases.contract',
    items: [
      { icon: WalletIcon, labelKey: 'cab.sidebar.quotation', href: ROUTES.cabApplicationQuotation, stepId: 'sidebar-app-quotation' },
      {
        icon: SuccessCircleIcon,
        labelKey: 'cab.sidebar.quotationApproval',
        href: ROUTES.cabQuotationApproval,
        stepId: 'sidebar-quotation-approval',
      },
      { icon: ExportIcon, labelKey: 'cab.sidebar.offers', href: ROUTES.cabOffers },
      { icon: DocumentText1, labelKey: 'agreements.nav.cab', href: ROUTES.cabAgreements },
    ],
  },
  {
    id: 'audit',
    labelKey: 'cab.workspace.phases.audit',
    items: [
      { icon: TaskSquareIcon, labelKey: 'cab.sidebar.auditPlanning', href: ROUTES.cabAuditPlanning },
      { icon: ReportIcon, labelKey: 'cab.sidebar.auditReporting', href: ROUTES.cabAuditReporting },
      { icon: TaskSquareIcon, labelKey: 'execution.nav.checklists', href: ROUTES.cabChecklists },
      { icon: CorrectiveActionIcon, labelKey: 'cab.sidebar.nonconformities', href: ROUTES.cabNonconformities },
    ],
  },
  {
    id: 'certification',
    labelKey: 'cab.workspace.phases.certification',
    items: [
      { icon: SuccessCircleIcon, labelKey: 'cab.sidebar.decisions', href: ROUTES.cabDecisions },
      { icon: CertificateBadgeIcon, labelKey: 'cab.sidebar.certificates', href: ROUTES.cabCertificates },
      { icon: ShieldIcon, labelKey: 'cab.sidebar.certification', href: ROUTES.cabCertificationCycles },
    ],
  },
  {
    id: 'followUp',
    labelKey: 'cab.workspace.phases.followUp',
    items: [
      { icon: ReceiptIcon, labelKey: 'cab.sidebar.invoices', href: ROUTES.cabInvoices },
      { icon: DashboardIcon, labelKey: 'cab.sidebar.reportsAnalytics', href: ROUTES.cabDashboard },
      { icon: Crown1, labelKey: 'subscription.menuItem', href: ROUTES.cabSubscription },
    ],
  },
]
