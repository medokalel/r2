import type { AbSetupForm } from '@/lib/abSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

/**
 * Every AB setup screen reads the whole onboarding form but writes through two
 * patchers: `onPatch` for fields shared with the other entity flows (legal
 * name, country, logo…) and `onPatchSetup` for the AB-only block.
 */
export interface AbSetupStepProps {
  form: UnifiedOnboardingForm
  onPatch: (fields: Partial<UnifiedOnboardingForm>) => void
  onPatchSetup: (fields: Partial<AbSetupForm>) => void
}
