import type { SoSetupForm } from '@/lib/soSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

/**
 * Every Scheme Owner setup screen reads the whole onboarding form but writes
 * through two patchers: `onPatch` for fields shared with the other flows and
 * `onPatchSetup` for the Scheme Owner-only block.
 */
export interface SoSetupStepProps {
  form: UnifiedOnboardingForm
  onPatch: (fields: Partial<UnifiedOnboardingForm>) => void
  onPatchSetup: (fields: Partial<SoSetupForm>) => void
}
