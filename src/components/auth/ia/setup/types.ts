import type { IaSetupForm } from '@/lib/iaSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

/**
 * Every Internal Audit setup screen reads the whole onboarding form but writes
 * through two patchers: `onPatch` for fields shared with the other flows
 * (legal name, country, city…) and `onPatchSetup` for the IA-only block.
 */
export interface IaSetupStepProps {
  form: UnifiedOnboardingForm
  onPatch: (fields: Partial<UnifiedOnboardingForm>) => void
  onPatchSetup: (fields: Partial<IaSetupForm>) => void
}
