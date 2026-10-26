export interface OnboardingModulesFields {
  modules: string[]
}

export function isModulesStepComplete(form: OnboardingModulesFields): boolean {
  return form.modules.length > 0
}
