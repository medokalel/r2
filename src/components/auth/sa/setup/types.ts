import type { SaSetupForm } from '@/lib/saSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

/**
 * Every Supplier Audit setup screen reads the whole onboarding form but writes
 * through two patchers: `onPatch` for fields shared with the other flows and
 * `onPatchSetup` for the Supplier Audit-only block.
 */
export interface SaSetupStepProps {
  form: UnifiedOnboardingForm
  onPatch: (fields: Partial<UnifiedOnboardingForm>) => void
  onPatchSetup: (fields: Partial<SaSetupForm>) => void
}
