# iCASCO Frontend — handoff (October 2026 release)

Same stack and conventions as before: React 19 · TypeScript · Vite · Tailwind v4 tokens · Radix ·
i18next (`src/i18n/locales/{en,ar}.json`, full Arabic RTL) · data layer in `src/lib/api/*`.

## 1. Run it

```bash
npm ci
cp .env.example .env     # VITE_API_BASE_URL → the iCASCO API (…/api/v1)
npm run dev
npm run build            # tsc -b && vite build
npm run lint             # 0 errors, 0 warnings at handoff
npm test                 # node:test unit tests (57)
```

## 2. Real API everywhere

Every data-layer module now calls the API. The demo store (`src/lib/api/demo/*`) is only used when
the app runs in demo mode (`isDemoMode()` — true only when a preview build sets
`window.__ICASCO_DEMO__`); production builds never enter those branches.

```ts
export async function listX(params) {
  if (!isDemoMode()) return authorizedRequest<X[]>(`/cab/x?${qs}`)
  // demo branch
}
```

| Area | Screens | API module |
|---|---|---|
| CAB dashboard | stats, insights, pipeline, audits chart, decisions, work queue, activity | `cabDashboardApi.ts` |
| Client dashboard | stats, tasks (deep links), activity | `dashboardApi.ts` |
| Offers & invoices | offer register (client accept / reject), invoice register, payments | `cabOffersApi.ts`, `cabInvoiceRegisterApi.ts` |
| Wallet | balance, transactions; top-up disabled until a payment gateway exists | `walletApi.ts` |
| Audit planning | build plan, schedule, calendar, periodic visits (client confirm) | `cabAuditPlanningApi.ts`, `auditCalendarApi.ts`, `periodicVisitsApi.ts` |
| Audit reporting | workspace, evidence, findings | `cabAuditReportingApi.ts` |
| Nonconformities | CAB register + details page; client response page `/portal/findings/:ncId/respond` | `cabNonconformitiesApi.ts`, `cabNonconformityResponseApi.ts` |
| Decisions | queue, details, technical review | `cabDecisionsApi.ts` |
| Certificates | register, prepare / issue, suspend / withdraw (reason dialog) | `cabCertificatesApi.ts` |
| Certification cycles | list, manage page, schedule next audit | `cabCertificationApi.ts` |
| Personnel & competence | register, profile, evaluation, quotation pickers (no localStorage) | `cabCompetenceApi.ts`, `cabEmployeesApi.ts`, `competenceMatrixApi.ts` |
| Contacts | CAB contacts | `cabContactsApi.ts` |
| Account | "My profile" for every account type, avatar, password change | `accountApi.ts` |
| Client portal | home, company profile | `portalApi.ts` |
| Notifications & feedback | bell, page feedback | `notificationsApi.ts`, `pageFeedbackApi.ts` |
| Smart assistant | floating helper on every page (page guide + `/assistant/ask`) | `assistantApi.ts`, `lib/assistant/knowledge.ts` |

## 3. UI work in this release

- **CAB Profile** (renamed from Company profile): 9-page wizard with progress and "Save and next".
- **Quotation view**: one programme card per standard (Initial, Surveillance 1 & 2, Recertification).
- **Audit Client Register**: redesign (filters, import / export, mobile cards, row click).
- **Application declaration**: signature pad (draw, type, upload).
- **Personnel profile**: "Currently employed (Present)" option.
- **Breadcrumbs** on the application flow pages; shared header actions (user menu, notifications).
- **Nonconformity details** page (open or closed).
- **Account menu**: "My profile", "CAB profile", sign out — on every account type.
- Arabic and English strings for everything above (keys identical in both files).

## 3b. Phase D (platform admin, subscriptions, workflow gaps, Saudi integrations)

| Area | Screens | Main files |
|---|---|---|
| **Platform console** `/platform/*` | Dashboard, Tenants (list, create, detail: Overview / Subscription / Features / Users / Invoices / History), Plans + editor, Invoices & payments, Announcements, Staff, Audit log, Settings, Impersonate | `pages/platform/*`, `components/platform/*`, `lib/api/platformApi.ts`, `platformTypes.ts`, `demo/platformDemo.ts` |
| Platform sign-in | Platform users (`platform: true` in the login response) land on `/platform` and are kept out of CAB / portal routes; roles Admin / Support / Finance hide actions | `lib/authStorage.ts`, `components/auth/RequireAuth.tsx`, `lib/platformRoutes.ts` |
| **CAB subscription** | `/cab/subscription` (plan, usage meters, features, iCASCO invoices, upgrade request); locks in sidebar, mobile nav, workspace tiles and routes; banners (read-only, support session, announcements); friendly toasts for `FEATURE_NOT_IN_PLAN`, `SUBSCRIPTION_READ_ONLY`, `USER_LIMIT_REACHED`, `CERTIFICATE_LIMIT_REACHED`, `SUBSCRIPTION_ENDED` | `hooks/useSubscription.ts`, `components/subscription/*`, `lib/subscriptionFeatures.ts`, `lib/impersonation.ts`, `pages/ImpersonationStartPage.tsx` |
| Workflow gaps | Audit plan lifecycle buttons + blank `/cab/audit-planning/new`; offers view / revise / approve / issue / PDF; quotation approval queue; receipt PDF / print / acknowledgement; information-request reminder; feasibility team editing; contact detail drawer; competence trainings / witnessing / audit-log tabs; certificate reissue / reinstate / extend / history; manual certification cycles + every manage tab | `components/dashboard/cab/workflow/*`, `auditPlanning/*`, `offers/*`, `cycles/*`, `competence/*`, `contacts/*`, `lib/pdf/*` |
| Audit time | "How these days were calculated" per standard and stage, IMS / multi-site inputs, justified overrides, per-currency daily rates on CAB Profile → Pricing; demo uses the same calculator as the API | `lib/auditTime/*`, `AuditTimeBreakdown.tsx`, `QuotationCalculationPanel.tsx`, `PricingConfigSection.tsx` |
| Integrations | Notification preferences on My profile; National Address look-up (Saudi Post); ZATCA QR / status / XML on invoices; CAB tax identity (VAT + seller address); buyer VAT on client profiles | `notificationPreferencesApi.ts`, `nationalAddressApi.ts`, `zatcaApi.ts`, `lib/qrCode.ts`, `ZatcaPanel.tsx`, `CabTaxIdentitySection.tsx` |
| Invoices & data | Create CAB invoice, fee catalog ("Manage catalog"), AED, attachments, PO / currency, "Use client address"; portal company-profile row actions | `CreateCabInvoiceDialog.tsx`, `FeeCatalogManagerDialog.tsx`, `feeItemsApi.ts`, `ProfileRowActions.tsx` |
| Arabic | Whole `ar.json` reviewed for Modern Standard Arabic (Saudi audience); English leftovers moved to i18n; dates follow the UI language (`lib/format/dates.ts`, Latin digits); country names localized (`lib/localizeCountry.ts`) | `src/i18n/locales/*`, platform strings in `platform.{en,ar}.json` |
| Removed | Legacy 5-step "Application draft" (duplicate of the submission flow): `/cab/applications/draft` now redirects to the submission flow; `/cab/applications/draft/sites/new` works on the real application | — |

## 3c. October 2026 updates (phases E to G)

| Area | What it does | Main files |
|---|---|---|
| Rebrand | CASCO renamed iCASCO everywhere (logos, favicon, titles, emails, iHelp) | `public/icasco-*`, `index.html` |
| Design system | Figma design-system tokens and components | `src/styles/design-system.css`, `components/ui/*` |
| CAB Profile polish | Accreditation bodies of the world with logos, full standard names and companion standards, all world currencies, upload tiles, new toast, clickable error summary with "return to" | `lib/accreditationBodies.ts`, `components/accreditation/*`, `lib/standardsCatalog.ts`, `lib/currencies.ts`, `lib/fieldNavigation.ts` |
| iHelp | Bilingual help center, articles per screen, changelog; `tests/help.test.mjs` fails when a route has no article | `pages/help/*`, `lib/help/*`, `src/content/help/*`, `docs/IHELP.md` |
| Excel import | Template download, upload, completeness %, import, "records to complete"; Data migration hub `/cab/migration` | `lib/imports/*`, `components/imports/*`, `lib/api/importsApi.ts` |
| Single sign-on | OIDC and SAML connections, domains, test, Require SSO, break-glass account | `pages/sso/*`, `components/sso/*`, `lib/sso.ts`, `lib/api/ssoApi.ts` |
| Certification agreement | Template editor, register, detail, send, countersign; client portal signing with email code | `pages/agreements/*`, `components/agreements/*`, `lib/api/agreementsApi.ts` |
| Checklists, execution, stage reports | Checklist library (15 approved checklists), six-step execution workspace (mobile first, offline queue), stage report review / issue, client acknowledgement | `pages/execution/*`, `components/execution/*`, `components/checklists/*`, `lib/execution/*`, `lib/checklists/*`, `executionApi.ts`, `checklistsApi.ts`, `stageReportApi.ts` |
| Audit time | IAF code to MD 5 category per standard (confirmed), IAF MD 1 sampling, full breakdown, "Recalculate audit time" on a quotation | `lib/auditTime/*`, `SectorClassificationPanel.tsx`, `AuditTimeBreakdown.tsx`, `QuotationRecalculatePanel.tsx` |
| Team selection and impartiality | Recommendations, validation (competence, availability, impartiality), exceptions (second approver optional), impartiality register | `components/teamSelection/*`, `pages/impartiality/*`, `lib/teamSelection/*`, `teamSelectionApi.ts`, `impartialityApi.ts` |
| Travel costs | Travel estimate on the quotation and the plan, travel policy; prices are estimates until providers are connected (phase 2) | `pages/travel/*`, `components/travel/*`, `lib/api/travelApi.ts` |

**Routing:** the app uses `HashRouter` (`src/App.tsx`). The SSO return URLs built by the API (`APP_BASE_URL/#/sso/complete`) and the support impersonation tab (`#/impersonate`) rely on it. To move to clean URLs, change `App.tsx`, `lib/impersonation.ts`, `lib/sso.ts` and the backend `src/modules/sso/sso.urls.js` together.

**Demo mode:** the `src/lib/api/demo/*` branches run only when `window.__ICASCO_DEMO__` is set. The preview bootstrap that sets it is not part of this package, so a normal build always calls the API.

## 4. Code quality

- `tsc -b`: 0 errors · `eslint src tests`: 0 errors, 0 warnings — fixed by restructuring code, no
  `eslint-disable` comments and no rule changes.
- Fast-Refresh rule: providers, hooks and helpers live in their own modules
  (`src/context/tour/*`, `src/context/direction/*`, `src/context/cabSidebar/*`, `components/ui/datePicker/*` …);
  `src/context/TourContext.ts`, `DirectionContext.ts`, `CabSidebarContext.ts` and `components/ui/DatePicker.ts`
  are the public entry points, so existing imports keep working.
- Effects only fetch; state is set in the async callbacks. Reset-on-input-change uses
  `src/hooks/useValuesChanged.ts`; effect callbacks that must read the latest props use React 19.2
  `useEffectEvent`.

## 5. Product decisions to confirm

See the API handoff (`docs/HANDOFF.md` in the backend): section 5 lists the rules chosen in the first
release, section 12 the Phase D decisions confirmed on 24 Oct 2026, and section 20 the decisions confirmed on 25 Oct 2026.
Still open: who on the client side may sign the agreement, and a legal review of the default agreement text.
Phase 2: travel pricing providers (flights, hotels, exchange rates) and the CAB's confirmed travel rates.
