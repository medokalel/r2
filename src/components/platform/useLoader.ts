import { useCallback, useEffect, useRef, useState } from 'react'

interface LoaderState<T> {
  /** Request key the data/error belong to. */
  key: string | null
  data: T | null
  error: unknown
}

/**
 * Loads data for a console page. `deps` are the values the loader reads; a change refetches,
 * `reload()` refetches on demand. While a request runs the previous data stays on screen and
 * `loading` is true; responses of superseded requests are ignored.
 */
export function useLoader<T>(loader: () => Promise<T>, deps: readonly unknown[]) {
  const [reloads, setReloads] = useState(0)
  const [state, setState] = useState<LoaderState<T>>({ key: null, data: null, error: null })
  const loaderRef = useRef(loader)
  const key = `${JSON.stringify(deps)}#${reloads}`

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let current = true
    loaderRef
      .current()
      .then((data) => {
        if (current) setState({ key, data, error: null })
      })
      .catch((error: unknown) => {
        if (current) setState((prev) => ({ key, data: prev.data, error }))
      })
    return () => {
      current = false
    }
  }, [key])

  const setData = useCallback((data: T | null) => setState((prev) => ({ ...prev, data })), [])
  const reload = useCallback(() => setReloads((n) => n + 1), [])

  return {
    data: state.data,
    setData,
    loading: state.key !== key,
    error: state.key === key ? state.error : null,
    reload,
  }
}
