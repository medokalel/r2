/**
 * Matching app paths against react-router style route patterns ('/cab/invoices/:invoiceId').
 * Pure functions: shared by the registry, the context help button and the coverage test.
 */

function stripPath(path: string): string {
  const bare = path.split('?')[0].split('#')[0]
  return bare.length > 1 ? bare.replace(/\/+$/, '') : bare
}

/** True when `pathname` is exactly the route described by `pattern` (params match one segment). */
export function matchRoute(pattern: string, pathname: string): boolean {
  const a = stripPath(pattern).split('/')
  const b = stripPath(pathname).split('/')
  if (a.length !== b.length) return false
  return a.every((segment, index) => segment.startsWith(':') ? b[index].length > 0 : segment === b[index])
}

/** Higher is more specific: literal segments count more than params. */
export function routeSpecificity(pattern: string): number {
  return stripPath(pattern)
    .split('/')
    .filter(Boolean)
    .reduce((score, segment) => score + (segment.startsWith(':') ? 1 : 3), 0)
}

/** True when the pattern has no `:param` segment, so it can be opened as is. */
export function isConcreteRoute(pattern: string): boolean {
  return !stripPath(pattern).split('/').some((segment) => segment.startsWith(':') || segment === '*')
}

/** Normalises a path for comparisons ('/cab/offers/?x=1' → '/cab/offers'). */
export function normalizePath(path: string): string {
  return stripPath(path)
}
