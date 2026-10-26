/**
 * App routes that intentionally have no iHelp article, with the reason. Every other route in
 * App.tsx, ROUTES and PLATFORM_ROUTES must be documented by an article (its `routes`) or be a
 * navigation item (which gets an auto-generated article). tests/help.test.mjs enforces this,
 * so a new screen cannot ship undocumented: document it, or add it here with a reason.
 */
export const HELP_UNDOCUMENTED_ROUTES: Record<string, string> = {
  '/': 'Redirects to the user’s home page.',
  '*': 'Fallback redirect.',
  '/privacy-policy': 'Public legal page, not a workflow screen.',
  '/certification-request': 'Legacy URL, redirects to /dashboard.',
  '/onboarding': 'First-run onboarding wizard (organisation type), shown once before any guide applies.',
  '/cab/onboarding': 'First-run CAB body setup wizard; the same data is documented in the CAB Profile article.',
  '/ab/onboarding': 'Accreditation-body onboarding: not an iHelp audience yet.',
  '/ab/dashboard': 'Accreditation-body dashboard: not an iHelp audience yet.',
  '/auditee/onboarding': 'Legacy auditee onboarding (replaced by client registration).',
  '/dashboard': 'Legacy auditee dashboard (audit clients use the portal).',
  '/dashboard/tasks': 'Legacy auditee dashboard (audit clients use the portal).',
  '/settings/company-profile': 'Legacy auditee settings (audit clients use the portal company profile).',
  '/users': 'Legacy auditee users page.',
  '/wallet': 'Legacy auditee wallet (portal wallet is documented).',
  '/periodic-visits': 'Legacy auditee visits (portal audits are documented).',
  '/invoices': 'Legacy auditee invoices (portal invoices are documented).',
}
