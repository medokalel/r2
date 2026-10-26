import { useState } from 'react'

/**
 * Returns `true` during the render in which any of `values` differs
 * (`Object.is`) from the values seen on the previous render, and `false`
 * otherwise (always `false` on the first render).
 *
 * This is React's "store the previous value in state and compare during
 * render" pattern, packaged so a component can reset or prime state right
 * when its inputs change instead of doing it in an effect:
 *
 *   const requestChanged = useValuesChanged([id, reloadKey])
 *   if (requestChanged) setLoading(true)
 */
export function useValuesChanged(values: readonly unknown[]): boolean {
  const [previous, setPrevious] = useState(values)
  const changed =
    previous.length !== values.length || values.some((value, index) => !Object.is(value, previous[index]))
  if (changed) setPrevious(values)
  return changed
}
