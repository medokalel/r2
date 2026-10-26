import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

const DRAFT_KEY_PREFIX = 'icasco_onboarding_draft_'

export interface OnboardingDraftPayload {
  form: Partial<UnifiedOnboardingForm>
  step?: number
}

export function loadOnboardingDraft(
  key: string,
): { form: Partial<UnifiedOnboardingForm>; step: number } | null {
  const raw = localStorage.getItem(DRAFT_KEY_PREFIX + key)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<UnifiedOnboardingForm> | OnboardingDraftPayload
    // Support backwards compatibility if stored directly as form
    if ('form' in parsed && typeof parsed.form === 'object' && parsed.form !== null) {
      return {
        form: parsed.form,
        step: typeof parsed.step === 'number' ? parsed.step : 0,
      }
    }
    return {
      form: parsed as Partial<UnifiedOnboardingForm>,
      step: 0,
    }
  } catch {
    return null
  }
}

export function saveOnboardingDraft(
  key: string,
  form: UnifiedOnboardingForm,
  step?: number,
): void {
  try {
    const payload: OnboardingDraftPayload = {
      form,
      step: typeof step === 'number' ? step : 0,
    }
    localStorage.setItem(DRAFT_KEY_PREFIX + key, JSON.stringify(payload))
  } catch {
    // Ignore storage quota errors
  }
}

export function clearOnboardingDraft(key: string): void {
  try {
    localStorage.removeItem(DRAFT_KEY_PREFIX + key)
  } catch {
    // Ignore errors
  }
}
