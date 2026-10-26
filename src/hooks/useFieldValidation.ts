import { useCallback, useMemo, useState } from 'react'

/**
 * A rule receives the current field value and the full form values (in case a
 * field's validity depends on another field, e.g. phone number depending on
 * the selected country code). Return an error message to show it, or
 * `undefined`/falsy when the value is valid.
 */
export type ValidationRules<Form> = Partial<{
  [K in keyof Form]: (value: Form[K], form: Form) => string | undefined
}>

/** Every current error for `form`, ignoring touched state — for gating saves/steps. */
export function collectErrors<Form extends object>(
  form: Form,
  rules: ValidationRules<Form>
): Partial<Record<keyof Form, string>> {
  const result: Partial<Record<keyof Form, string>> = {}
  for (const key of Object.keys(rules) as (keyof Form)[]) {
    const message = rules[key]?.(form[key], form)
    if (message) result[key] = message
  }
  return result
}

/**
 * Reusable "template" for wiring format validation onto any form field.
 *
 * Usage:
 *   const { fieldProps } = useFieldValidation(form, {
 *     email: (value) => (value && !isValidEmail(value) ? t('validation.invalidEmail') : undefined),
 *   })
 *   <TextField value={form.email} onChange={...} {...fieldProps('email')} />
 *
 * Behavior (matches standard form-validation UX practice):
 * - Nothing is validated until the user leaves the field once (onBlur).
 * - Once a field has been touched, it re-validates on every change so the
 *   error clears the moment the value becomes valid again.
 * - `validateAll()` marks every field touched and returns whether the whole
 *   form is currently valid — call this on submit as a final safety net.
 */
export function useFieldValidation<Form extends object>(
  form: Form,
  rules: ValidationRules<Form>
) {
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({})

  const errorFor = useCallback(
    <K extends keyof Form>(key: K): string | undefined => {
      const rule = rules[key]
      if (!rule) return undefined
      return rule(form[key], form)
    },
    [form, rules]
  )

  const errors = useMemo(() => {
    const result: Partial<Record<keyof Form, string>> = {}
    for (const key of Object.keys(touched) as (keyof Form)[]) {
      if (!touched[key]) continue
      const message = errorFor(key)
      if (message) result[key] = message
    }
    return result
  }, [touched, errorFor])

  const markTouched = useCallback((key: keyof Form) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }, [])

  /** Spread onto any field: `<TextField {...fieldProps('email')} />` */
  const fieldProps = useCallback(
    (key: keyof Form) => ({
      error: touched[key] ? errorFor(key) : undefined,
      onBlur: () => markTouched(key),
    }),
    [touched, errorFor, markTouched]
  )

  /** Call on submit — marks everything touched and reports overall validity. */
  const validateAll = useCallback((): boolean => {
    const keys = Object.keys(rules) as (keyof Form)[]
    setTouched((prev) => {
      const next = { ...prev }
      for (const key of keys) next[key] = true
      return next
    })
    return keys.every((key) => !errorFor(key))
  }, [rules, errorFor])

  return { errors, fieldProps, validateAll }
}