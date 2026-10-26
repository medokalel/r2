/** Central route paths — keep in sync across navigation, redirects, and guards. */
export const ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  privacyPolicy: "/privacy-policy",
  workspace: "/workspace",
  dashboard: "/dashboard",
  dashboardTasks: "/dashboard/tasks",
  certificationRequestNew: "/certification-request/new",
  certificationRequests: "/certification-requests",
  companyProfile: "/settings/company-profile",
  users: "/users",
  wallet: "/wallet",
  periodicVisits: "/periodic-visits",
  invoices: "/invoices",
  cabDashboard: "/cab/dashboard",
  cabAuditClients: "/cab/audit-clients",
  cabApplicationRegister: "/cab/applications",
  cabApplicationReview: "/cab/applications/review",
  cabApplicationSubmission: "/cab/applications/submission",
  cabCompanyProfile: "/cab/company-profile",
  accountProfile: "/account/profile",
  cabWorkspace: "/cab/workspace",
  cabApplicationReviewQueue: "/cab/applications/review-queue",
  cabContacts: "/cab/contacts",
  cabContactNew: "/cab/contacts/new",
  cabOffers: "/cab/offers",
  cabOfferNew: "/cab/offers/new",
  cabInvoices: "/cab/invoices",
  cabInvoiceDetails: "/cab/invoices/:invoiceId",
  cabAuditPlanning: "/cab/audit-planning",
  cabAuditSchedule: "/cab/audit-planning/schedule",
  cabBuildAuditPlan: "/cab/audit-planning/build/:planId",
  cabAuditPlanNew: "/cab/audit-planning/new",
  cabAuditReporting: "/cab/audit-reporting",
  cabAuditWorkspace: "/cab/audit-reporting/workspace",
  cabAddFinding: "/cab/audit-reporting/findings/new",
  abDashboard: "/ab/dashboard",
  cabOnboarding: "/cab/onboarding",
  abOnboarding: "/ab/onboarding",
  auditeeOnboarding: "/auditee/onboarding",
  onboarding: "/onboarding",
  cabApplicationInformationRequired: "/cab/applications/information-required",
  cabApplicationTechnicalFeasibility: "/cab/applications/technical-feasibility",
  cabApplicationQuotation: "/cab/applications/quotation",
  cabQuotationApproval: "/cab/quotations/approval",
  cabDecisions: "/cab/decisions",
  cabDecisionDetails: "/cab/decisions/:decisionId",
  cabCompetence: "/cab/competence",
  cabPersonnelNew: "/cab/competence/persons/new",
  cabPersonnelEdit: "/cab/competence/persons/:id/edit",
  cabCompetenceEvaluation: "/cab/competence/persons/:id/evaluation",
  portal: "/portal",
  portalHome: "/portal/home",
  portalCompanyProfile: "/portal/company-profile",
  portalApplications: "/portal/applications",
  portalOffers: "/portal/offers",
  portalInvoices: "/portal/invoices",
  portalInvoiceDetails: "/portal/invoices/:invoiceId",
  portalAudits: "/portal/audits",
  portalFindings: "/portal/findings",
  portalFindingResponse: "/portal/findings/:ncId/respond",
  portalCertificates: "/portal/certificates",
  portalWallet: "/portal/wallet",
  cabCertificationCycles: "/cab/certification",
  cabManageCertificationCycle: "/cab/certification/:cycleId",
  cabNonconformities: "/cab/nonconformities",
  cabNonconformityResponse: "/cab/nonconformities/:ncId/response",
  cabNonconformityDetails: "/cab/nonconformities/:ncId",
  cabCertificates: "/cab/certificates",
  cabPrepareCertificate: "/cab/certificates/:certificateId/prepare",
  platform: "/platform",
  cabSubscription: "/cab/subscription",
  /** Data migration hub: Excel templates and imports for every area. */
  cabMigration: "/cab/migration",
  impersonate: "/impersonate",
  /** iHelp, the in-app help center (also /help/:section and /help/:section/:article). */
  help: "/help",
  /** Single sign-on: CAB settings page and the sign-in round trip (code exchange, test result, preview IdP). */
  cabSso: "/cab/settings/sso",
  ssoComplete: "/sso/complete",
  ssoTestResult: "/sso/test-result",
  ssoDemoIdp: "/sso/demo-idp",
  /** Certification agreements (ISO/IEC 17021-1 5.1.2): CAB register, detail, template settings; client portal list and detail. */
  cabAgreements: "/cab/agreements",
  cabAgreementDetail: "/cab/agreements/:agreementId",
  cabAgreementTerms: "/cab/settings/agreement-terms",
  portalAgreements: "/portal/agreements",
  portalAgreementDetail: "/portal/agreements/:agreementId",
  /** Audit execution (six-step workspace of a plan), checklist library, stage report; client view of an audit and its report. */
  cabAuditExecution: "/cab/audit-execution/:planId",
  cabChecklists: "/cab/checklists",
  cabStageReport: "/cab/audit-reporting/report/:reportId",
  portalAuditDetail: "/portal/audits/:planId",
  portalAuditReport: "/portal/audit-reports/:reportId",
  /** Travel cost calculator: CAB travel policy (rules, rates, providers). */
  cabTravelPolicy: "/cab/settings/travel-policy",
  /** Audit team selection: impartiality register (people, relationships, exceptions, rules) and the availability calendar. */
  cabImpartiality: "/cab/impartiality",
  cabTeamAvailability: "/cab/team-availability",
} as const;

function withClientQuery(path: string, clientId?: string): string {
  if (!clientId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}clientId=${encodeURIComponent(clientId)}`;
}

export function cabApplicationInformationRequiredPath(
  applicationId?: string,
  clientId?: string,
): string {
  const base = applicationId
    ? `/cab/applications/${encodeURIComponent(applicationId)}/information-required`
    : ROUTES.cabApplicationInformationRequired;
  return withClientQuery(base, clientId);
}

export function cabApplicationTechnicalFeasibilityPath(
  applicationId?: string,
  clientId?: string,
): string {
  const base = applicationId
    ? `/cab/applications/${encodeURIComponent(applicationId)}/technical-feasibility`
    : ROUTES.cabApplicationTechnicalFeasibility;
  return withClientQuery(base, clientId);
}

export function cabApplicationQuotationPath(
  applicationId?: string,
  clientId?: string,
): string {
  const base = applicationId
    ? `/cab/applications/${encodeURIComponent(applicationId)}/quotation`
    : ROUTES.cabApplicationQuotation;
  return withClientQuery(base, clientId);
}

export function cabApplicationSubmissionPath(
  clientId: string,
  applicationId?: string,
  options?: { fill?: boolean },
): string {
  const params = new URLSearchParams({ clientId });
  if (applicationId) params.set("id", applicationId);
  if (options?.fill) params.set("fill", "1");
  return `${ROUTES.cabApplicationSubmission}?${params.toString()}`;
}

/** CAB "Add site" page for an application draft (returns to the submission flow). */
export function cabApplicationAddSitePath(clientId: string, applicationId: string): string {
  const params = new URLSearchParams({ clientId, id: applicationId });
  return `/cab/applications/draft/sites/new?${params.toString()}`;
}

export function cabApplicationReviewPath(
  applicationId: string,
  clientId?: string,
): string {
  const base = `/cab/applications/${encodeURIComponent(applicationId)}/review`;
  return clientId
    ? `${base}?clientId=${encodeURIComponent(clientId)}`
    : base;
}

export function cabApplicationReceiptPath(
  applicationId: string,
  clientId?: string,
): string {
  const base = `/cab/applications/${encodeURIComponent(applicationId)}/receipt`;
  return clientId
    ? `${base}?clientId=${encodeURIComponent(clientId)}`
    : base;
}

export function cabDecisionPath(decisionId?: string): string {
  return decisionId ? `/cab/decisions/${decisionId}` : ROUTES.cabDecisions;
}

export function cabNonconformityDetailsPath(ncId: string): string {
  return `/cab/nonconformities/${encodeURIComponent(ncId)}`;
}

export function cabNonconformityResponsePath(ncId: string): string {
  return `/cab/nonconformities/${encodeURIComponent(ncId)}/response`;
}

/** Client portal: answer a nonconformity (corrective-action response). */
export function portalFindingResponsePath(ncId: string): string {
  return `/portal/findings/${encodeURIComponent(ncId)}/respond`;
}

/** Client portal: one of the client's invoices (read-only view). */
export function portalInvoiceDetailsPath(invoiceId: string): string {
  return `/portal/invoices/${encodeURIComponent(invoiceId)}`;
}

/** CAB invoice details page. */
export function cabInvoiceDetailsPath(invoiceId: string): string {
  return `/cab/invoices/${encodeURIComponent(invoiceId)}`;
}

export function cabManageCertificationCyclePath(cycleId: string): string {
  return `/cab/certification/${encodeURIComponent(cycleId)}`;
}

export function cabPrepareCertificatePath(certificateId: string): string {
  return `/cab/certificates/${encodeURIComponent(certificateId)}/prepare`;
}

/** CAB breadcrumb / Home link destination (workspace hub). */
export const CAB_HOME = ROUTES.workspace;

/** Default post-login landing page for non-CAB authenticated users. */
export const AUTHENTICATED_HOME = ROUTES.dashboard;

/** Previous dashboard URL — redirect only, do not link to this in new code. */
export const LEGACY_DASHBOARD_PATH = "/certification-request";

export function isDashboardNavActive(pathname: string): boolean {
  return (
    pathname === ROUTES.dashboard || pathname.startsWith(`${ROUTES.dashboard}/`)
  );
}

export function certificationRequestFormPath(
  id: string,
  view: "feedback" | "status",
): string {
  return `${ROUTES.certificationRequestNew}?id=${id}&view=${view}`;
}

/** CAB certification agreement detail. */
export function cabAgreementPath(agreementId: string): string {
  return `/cab/agreements/${encodeURIComponent(agreementId)}`;
}

/** Client portal: review and sign a certification agreement. */
export function portalAgreementPath(agreementId: string): string {
  return `/portal/agreements/${encodeURIComponent(agreementId)}`;
}
