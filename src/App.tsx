import { Suspense } from "react";
import { HashRouter as BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAuthOrPendingRegistration } from "@/components/auth/RequireAuthOrPendingRegistration";
import { RequireCabOnboarded } from "@/components/auth/RequireCabOnboarded";
import { RequireAbDashboard } from "@/components/auth/RequireAbDashboard";
import { RequireAbOnboarded } from "@/components/auth/RequireAbOnboarded";
import { RedirectAbFromGenericDashboard } from "@/components/auth/RedirectAbFromGenericDashboard";
import { RequireAuditeeOnboarded } from "@/components/auth/RequireAuditeeOnboarded";
import { DirectionProvider } from "@/context/DirectionContext";
import { CabSidebarProvider } from "@/context/CabSidebarContext";
import { PageLoadingSkeleton, RouteSkeletonOverlay } from "@/components/routing/PageLoadingSkeleton";
import { ScrollToTop } from "@/components/routing/ScrollToTop";
import { Toaster } from "@/components/ui/Toaster";
import { AccountProfilePage } from '@/pages/AccountProfilePage'
import { CabNonconformityDetailsPage } from '@/pages/CabNonconformityDetailsPage'
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  PrivacyPolicyPage,
  WorkspacePage,
  CabDashboardPage,
  CabApplicationRegisterPage,
  CabApplicationSubmissionPage,
  CabCompanyProfilePage,
  AbDashboardPage,
  OnboardingPage,
  CabOnboardingPage,
  AbOnboardingPage,
  AuditeeOnboardingPage,
  ClientRegistrationPage,
  CabClientCompanyProfilePage,
  CabClientsPage,
  ClientRegisterPage,
  CabClientDetailsPage,
  ApplicationDraftPage,
  AddSitePage,
  CabApplicationReceiptPage,
  CabApplicationReviewPage,
  CabContactsListPage,
  CabAddContactPage,
  CabApplicationInformationRequiredPage,
  CabApplicationTechnicalFeasibilityPage,
  CabApplicationQuotationPage,
  CabQuotationsPage,
  CabOfferRegisterPage,
  CabCreateOfferPage,
  CabInvoiceRegisterPage,
  CabInvoiceDetailsPage,
  CabAuditSchedulePage,
  CabBuildAuditPlanPage,
  CabAuditReportingPage,
  CabAddFindingPage,
  CabDecisionQueuePage,
  CabDecisionDetailsPage,
  CabPersonnelRegisterPage,
  CabPersonnelProfilePage,
  CabCompetenceEvaluationPage,
  PortalHomePage,
  PortalCompanyProfilePage,
  PortalCertificatesPage,
  PortalFindingsPage,
  CabCertificationCyclesPage,
  CabManageCertificationCyclePage,
  CabNonconformitiesPage,
  CabNonconformityResponsePage,
  ClientNonconformityResponsePage,
  CabCertificateRegisterPage,
  CabPrepareCertificatePage,
  CertificationRequestFormPage,
  CertificationRequestsPage,
  CompanyProfilePage,
  DashboardPage,
  DashboardTasksPage,
  UsersPage,
  DigitalWalletPage,
  PeriodicVisitsPage,
  InvoicesPage,
  PlatformApp,
  CabSubscriptionPage,
  ImpersonationStartPage,
  HelpCenterPage,
  CabSsoSettingsPage,
  SsoCompletePage,
  SsoTestResultPage,
  SsoDemoIdpPage,
  CabMigrationPage,
  CabAgreementsPage,
  CabAgreementDetailPage,
  CabAgreementTemplatePage,
  CabTravelPolicyPage,
  CabImpartialityRegisterPage,
  CabTeamAvailabilityPage,
  PortalAgreementsPage,
  PortalAgreementDetailPage,
} from "@/pages/lazyPages";
import {
  getAuthSession,
  getAuthToken,
  getPostLoginRedirect,
} from "@/lib/authStorage";
import { LEGACY_DASHBOARD_PATH, ROUTES, cabApplicationQuotationPath } from "@/lib/routes";
import {
  CabAuditExecutionPage,
  CabChecklistLibraryPage,
  CabStageReportPage,
  PortalAuditDetailPage,
  PortalAuditReportPage,
} from "@/pages/execution/lazyExecutionPages";

// The quotation lifecycle (issue / accept / reject) now lives on the quotation page itself.
function QuotationApprovalRedirect() {
  const { applicationId } = useParams();
  return <Navigate to={cabApplicationQuotationPath(applicationId)} replace />;
}

function HomeRedirect() {
  const session = getAuthSession();
  const target =
    getAuthToken() && session ? getPostLoginRedirect(session) : ROUTES.login;
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
      <DirectionProvider>
        <Toaster />
        <BrowserRouter>
          <ScrollToTop />
          <CabSidebarProvider>
          <RouteSkeletonOverlay>
          <Suspense fallback={<PageLoadingSkeleton />}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
              <Route path={ROUTES.login} element={<LoginPage />} />
              <Route path={ROUTES.register} element={<RegisterPage />} />
              <Route
                path={ROUTES.forgotPassword}
                element={<ForgotPasswordPage />}
              />
              <Route
                path={ROUTES.privacyPolicy}
                element={<PrivacyPolicyPage />}
              />

              <Route
                path={ROUTES.workspace}
                element={
                  <RequireAuth>
                    <WorkspacePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabWorkspace}
                element={<Navigate to={ROUTES.workspace} replace />}
              />

              <Route
                path={ROUTES.cabDashboard}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabDashboardPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.accountProfile}
                element={
                  <RequireAuth>
                    <AccountProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCompanyProfile}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabCompanyProfilePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.abDashboard}
                element={
                  <RequireAuth>
                    <RequireAbDashboard>
                      <AbDashboardPage />
                    </RequireAbDashboard>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.onboarding}
                element={
                  <RequireAuthOrPendingRegistration>
                    <OnboardingPage />
                  </RequireAuthOrPendingRegistration>
                }
              />
              <Route
                path={ROUTES.cabOnboarding}
                element={
                  <RequireAuth>
                    <CabOnboardingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.abOnboarding}
                element={
                  <RequireAuth>
                    <AbOnboardingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.auditeeOnboarding}
                element={
                  <RequireAuth>
                    <AuditeeOnboardingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabApplicationRegister}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabApplicationRegisterPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabApplicationSubmission}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabApplicationSubmissionPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabClientsPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditClients}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <ClientRegisterPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients/new"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <ClientRegistrationPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients/:clientId/edit"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <ClientRegistrationPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients/:clientId/profile"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabClientCompanyProfilePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients/:clientId"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabClientDetailsPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/draft"
                element={
                  <RequireAuth>
                    <ApplicationDraftPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/draft/sites/new"
                element={
                  <RequireAuth>
                    <AddSitePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/review-queue"
                element={
                  <RequireAuth>
                    <Navigate to={ROUTES.cabApplicationRegister} replace />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/contacts"
                element={
                  <RequireAuth>
                    <CabContactsListPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/contacts/new"
                element={
                  <RequireAuth>
                    <CabAddContactPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/receipt"
                element={
                  <RequireAuth>
                    <CabApplicationReceiptPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/receipt"
                element={
                  <RequireAuth>
                    <CabApplicationReceiptPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/review"
                element={
                  <RequireAuth>
                    <CabApplicationReviewPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/review"
                element={
                  <RequireAuth>
                    <CabApplicationReviewPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/information-required"
                element={
                  <RequireAuth>
                    <CabApplicationInformationRequiredPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/information-required"
                element={
                  <RequireAuth>
                    <CabApplicationInformationRequiredPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/technical-feasibility"
                element={
                  <RequireAuth>
                    <CabApplicationTechnicalFeasibilityPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/technical-feasibility"
                element={
                  <RequireAuth>
                    <CabApplicationTechnicalFeasibilityPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/quotation"
                element={
                  <RequireAuth>
                    <CabApplicationQuotationPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/quotation"
                element={
                  <RequireAuth>
                    <CabApplicationQuotationPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabQuotationApproval}
                element={
                  <RequireAuth>
                    <CabQuotationsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/quotations/:applicationId/approval"
                element={
                  <RequireAuth>
                    <QuotationApprovalRedirect />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabOffers}
                element={
                  <RequireAuth>
                    <CabOfferRegisterPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabOfferNew}
                element={
                  <RequireAuth>
                    <CabCreateOfferPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabInvoices}
                element={
                  <RequireAuth>
                    <CabInvoiceRegisterPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabInvoiceDetails}
                element={
                  <RequireAuth>
                    <CabInvoiceDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditPlanning}
                element={
                  <RequireAuth>
                    <CabAuditSchedulePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditSchedule}
                element={
                  <RequireAuth>
                    <CabAuditSchedulePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabBuildAuditPlan}
                element={
                  <RequireAuth>
                    <CabBuildAuditPlanPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditPlanNew}
                element={
                  <RequireAuth>
                    <CabBuildAuditPlanPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditReporting}
                element={
                  <RequireAuth>
                    <CabAuditReportingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditWorkspace}
                element={
                  <RequireAuth>
                    <CabAuditReportingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAddFinding}
                element={
                  <RequireAuth>
                    <CabAddFindingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabNonconformities}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabNonconformitiesPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabNonconformityDetails}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabNonconformityDetailsPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabNonconformityResponse}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabNonconformityResponsePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCertificates}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabCertificateRegisterPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabPrepareCertificate}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabPrepareCertificatePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabDecisions}
                element={
                  <RequireAuth>
                    <CabDecisionQueuePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabDecisionDetails}
                element={
                  <RequireAuth>
                    <CabDecisionDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCertificationCycles}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabCertificationCyclesPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabManageCertificationCycle}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabManageCertificationCyclePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCompetence}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabPersonnelRegisterPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabPersonnelNew}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabPersonnelProfilePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabPersonnelEdit}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabPersonnelProfilePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCompetenceEvaluation}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabCompetenceEvaluationPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
            <Route
                path={ROUTES.dashboard}
              element={
                <RequireAuth>
                    <RequireAbOnboarded>
                      <RedirectAbFromGenericDashboard>
                        <RequireAuditeeOnboarded>
                  <DashboardPage />
                        </RequireAuditeeOnboarded>
                      </RedirectAbFromGenericDashboard>
                    </RequireAbOnboarded>
                </RequireAuth>
              }
            />
            <Route
                path={LEGACY_DASHBOARD_PATH}
                element={<Navigate to={ROUTES.dashboard} replace />}
              />
              <Route
                path={ROUTES.certificationRequestNew}
              element={
                <RequireAuth>
                  <CertificationRequestFormPage />
                </RequireAuth>
              }
            />
            <Route
                path={ROUTES.certificationRequests}
              element={
                <RequireAuth>
                  <CertificationRequestsPage />
                </RequireAuth>
              }
            />
            <Route
                path={ROUTES.dashboardTasks}
              element={
                <RequireAuth>
                  <DashboardTasksPage />
                </RequireAuth>
              }
            />
            <Route
                path={ROUTES.companyProfile}
              element={
                <RequireAuth>
                  <CompanyProfilePage />
                </RequireAuth>
              }
            />
            <Route
                path={ROUTES.users}
              element={
                <RequireAuth>
                  <UsersPage />
                </RequireAuth>
              }
            />
              <Route
                path={ROUTES.wallet}
                element={
                  <RequireAuth>
                    <DigitalWalletPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.periodicVisits}
                element={
                  <RequireAuth>
                    <PeriodicVisitsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.invoices}
                element={
                  <RequireAuth>
                    <InvoicesPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portal}
                element={
                  <RequireAuth>
                    <PortalHomePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalHome}
                element={
                  <RequireAuth>
                    <PortalHomePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalCompanyProfile}
                element={
                  <RequireAuth>
                    <PortalCompanyProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalApplications}
                element={
                  <RequireAuth>
                    <CertificationRequestsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalOffers}
                element={
                  <RequireAuth>
                    <CabOfferRegisterPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalInvoices}
                element={
                  <RequireAuth>
                    <CabInvoiceRegisterPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalInvoiceDetails}
                element={
                  <RequireAuth>
                    <CabInvoiceDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalAudits}
                element={
                  <RequireAuth>
                    <PeriodicVisitsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalFindings}
                element={
                  <RequireAuth>
                    <PortalFindingsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalFindingResponse}
                element={
                  <RequireAuth>
                    <ClientNonconformityResponsePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalCertificates}
                element={
                  <RequireAuth>
                    <PortalCertificatesPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalWallet}
                element={
                  <RequireAuth>
                    <DigitalWalletPage />
                  </RequireAuth>
                }
              />
              <Route
                path={`${ROUTES.platform}/*`}
                element={
                  <RequireAuth>
                    <PlatformApp />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabSubscription}
                element={
                  <RequireAuth>
                    <CabSubscriptionPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabMigration}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabMigrationPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route path={ROUTES.impersonate} element={<ImpersonationStartPage />} />
              {/* iHelp, the in-app help center (overview, topic and article pages). */}
              {[ROUTES.help, `${ROUTES.help}/:section`, `${ROUTES.help}/:section/:article`].map((path) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <RequireAuth>
                      <HelpCenterPage />
                    </RequireAuth>
                  }
                />
              ))}
              {/* Single sign-on: settings (CAB admin, feature `sso`) and the public sign-in round trip. */}
              <Route
                path={ROUTES.cabSso}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabSsoSettingsPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route path={ROUTES.ssoComplete} element={<SsoCompletePage />} />
              <Route path={ROUTES.ssoTestResult} element={<SsoTestResultPage />} />
              <Route path={ROUTES.ssoDemoIdp} element={<SsoDemoIdpPage />} />
              {/* Certification agreements (CAB register, detail, template settings; client portal review and signing). */}
              {[
                [ROUTES.cabAgreements, <CabAgreementsPage key="list" />],
                [ROUTES.cabAgreementDetail, <CabAgreementDetailPage key="detail" />],
                [ROUTES.cabAgreementTerms, <CabAgreementTemplatePage key="terms" />],
                [ROUTES.cabTravelPolicy, <CabTravelPolicyPage key="travel-policy" />],
                [ROUTES.cabImpartiality, <CabImpartialityRegisterPage key="impartiality" />],
                [ROUTES.cabTeamAvailability, <CabTeamAvailabilityPage key="team-availability" />],
              ].map(([path, page]) => (
                <Route
                  key={path as string}
                  path={path as string}
                  element={
                    <RequireAuth>
                      <RequireCabOnboarded>{page}</RequireCabOnboarded>
                    </RequireAuth>
                  }
                />
              ))}
              <Route
                path={ROUTES.portalAgreements}
                element={
                  <RequireAuth>
                    <PortalAgreementsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalAgreementDetail}
                element={
                  <RequireAuth>
                    <PortalAgreementDetailPage />
                  </RequireAuth>
                }
              />
              {/* Audit execution, checklist library and stage reports (CAB). */}
              {[
                [ROUTES.cabAuditExecution, <CabAuditExecutionPage key="execution" />],
                [ROUTES.cabChecklists, <CabChecklistLibraryPage key="checklists" />],
                [ROUTES.cabStageReport, <CabStageReportPage key="stage-report" />],
              ].map(([path, page]) => (
                <Route
                  key={path as string}
                  path={path as string}
                  element={
                    <RequireAuth>
                      <RequireCabOnboarded>{page}</RequireCabOnboarded>
                    </RequireAuth>
                  }
                />
              ))}
              {/* Client portal: one audit (schedule, meetings, findings to answer) and its issued report. */}
              <Route
                path={ROUTES.portalAuditDetail}
                element={
                  <RequireAuth>
                    <PortalAuditDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalAuditReport}
                element={
                  <RequireAuth>
                    <PortalAuditReportPage />
                  </RequireAuth>
                }
              />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
          </Suspense>
          </RouteSkeletonOverlay>
          </CabSidebarProvider>
        </BrowserRouter>
      </DirectionProvider>
  );
}