import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FIELD_PARAM, focusField } from '@/lib/fieldNavigation'

/** Extra candidates (`?fields=a,b`): the other missing fields, tried when `field` is not on the page. */
export const FIELDS_PARAM = 'fields'

/**
 * Deep link to a field (`?field=<dom id>`, e.g. from "Complete" in the import wizard): once the
 * page is `ready`, scrolls to the field, focuses and highlights it, then drops the params so a
 * reload does not jump again. `returnTo` stays for the ReturnToBanner. When the field is not on
 * this page, the next candidate of `?fields=` that is, then `fallbackId`, is focused instead.
 */
export function useDeepLinkField(ready: boolean, fallbackId?: string): void {
  const [params, setParams] = useSearchParams()
  const field = params.get(FIELD_PARAM)
  const extra = params.get(FIELDS_PARAM)
  useEffect(() => {
    if (!ready || !field) return
    const candidates = [field, ...(extra ? extra.split(',') : []), ...(fallbackId ? [fallbackId] : [])].filter(Boolean)
    // Not cancelled on re-render: dropping the params below re-runs this effect.
    let tries = 0
    const tick = () => {
      const found = candidates.find((id) => document.getElementById(id))
      if (found) focusField(found)
      else if (++tries < 15) window.setTimeout(tick, 150)
    }
    window.setTimeout(tick, 60)
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(FIELD_PARAM)
        next.delete(FIELDS_PARAM)
        return next
      },
      { replace: true },
    )
  }, [ready, field, extra, fallbackId, setParams])
}
