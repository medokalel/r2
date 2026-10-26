import type { CabSetupForm } from '@/lib/cabSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

/**
 * Every CAB setup screen reads the whole onboarding form but writes through
 * two patchers: `onPatch` for fields shared with the other entity flows
 * (legal name, country, logo…) and `onPatchSetup` for the CAB-only block.
 */
export interface CabSetupStepProps {
  form: UnifiedOnboardingForm
  onPatch: (fields: Partial<UnifiedOnboardingForm>) => void
  onPatchSetup: (fields: Partial<CabSetupForm>) => void
}
