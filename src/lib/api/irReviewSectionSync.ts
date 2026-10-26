const REVIEW_SECTIONS = [
  'legalInfo',
  'operationalInfo',
  'consultantInfo',
  'declarationInfo',
  'branches',
  'certificates',
  'documents',
] as const

type ReviewSectionKey = (typeof REVIEW_SECTIONS)[number]

const storageKey = (applicationId: string) => `icasco_ir_cleared_sections_${applicationId}`

function readCleared(applicationId: string): ReviewSectionKey[] {
  try {
    const raw = localStorage.getItem(storageKey(applicationId))
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return parsed.filter((key): key is ReviewSectionKey => REVIEW_SECTIONS.includes(key as ReviewSectionKey))
  } catch {
    return []
  }
}

function writeCleared(applicationId: string, keys: ReviewSectionKey[]): void {
  localStorage.setItem(storageKey(applicationId), JSON.stringify(keys))
}

export function syncReviewSectionWithInformationRequired(
  applicationId: string,
  sectionKey: ReviewSectionKey,
  isPartial: boolean,
): void {
  const next = new Set(readCleared(applicationId))
  if (isPartial) next.delete(sectionKey)
  else next.add(sectionKey)
  writeCleared(applicationId, [...next])
}

export function isReviewSectionClearedFromInformationRequired(
  applicationId: string,
  referenceClause: string | null | undefined,
): boolean {
  if (!referenceClause || !REVIEW_SECTIONS.includes(referenceClause as ReviewSectionKey)) return false
  return readCleared(applicationId).includes(referenceClause as ReviewSectionKey)
}

export function filterClearedReviewInformationRequired<T extends { referenceClause?: string | null }>(
  applicationId: string,
  items: T[],
): T[] {
  return items.filter((item) => !isReviewSectionClearedFromInformationRequired(applicationId, item.referenceClause))
}

/** ISO datetime one week after the request timestamp (used as Information Required due date). */
export function dueDateOneWeekFromRequestedOn(requestedOn?: string | null): string {
  const start = requestedOn ? new Date(requestedOn) : new Date()
  const base = Number.isNaN(start.getTime()) ? new Date() : start
  return new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
}

export function dueDateOnlyOneWeekFromRequestedOn(requestedOn?: string | null): string {
  return dueDateOneWeekFromRequestedOn(requestedOn).slice(0, 10)
}

export function withReviewSectionDueDate<T extends { dueDate?: string | null; requestedOn?: string; referenceClause?: string | null }>(
  item: T,
): T {
  if (item.dueDate) return item
  if (!item.referenceClause || !REVIEW_SECTIONS.includes(item.referenceClause as ReviewSectionKey)) return item
  return { ...item, dueDate: dueDateOneWeekFromRequestedOn(item.requestedOn) }
}

export function isReviewSectionKey(value?: string | null): value is ReviewSectionKey {
  return Boolean(value && REVIEW_SECTIONS.includes(value as ReviewSectionKey))
}

function statusFromUnknown(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') return null
  const raw = String(
    (entry as { status?: string; reviewStatus?: string }).status ??
      (entry as { reviewStatus?: string }).reviewStatus ??
      '',
  )
  const mapped: Record<string, string> = {
    COMPLETED: 'complete',
    PARTIALLY_COMPLETED: 'partiallyComplete',
    UNDER_REVIEW: 'incomplete',
    NOT_APPLICABLE: 'notApplicable',
    complete: 'complete',
    partiallyComplete: 'partiallyComplete',
    incomplete: 'incomplete',
    notApplicable: 'notApplicable',
  }
  return mapped[raw] ?? mapped[raw.toUpperCase()] ?? null
}

export function sectionStatusesFromUnknown(data: unknown): Partial<Record<ReviewSectionKey, string>> {
  const map: Partial<Record<ReviewSectionKey, string>> = {}
  if (!data || typeof data !== 'object') return map
  const record = data as Record<string, unknown>
  const byKey = record.sectionReviewsByKey
  if (byKey && typeof byKey === 'object') {
    for (const key of REVIEW_SECTIONS) {
      const status = statusFromUnknown((byKey as Record<string, unknown>)[key])
      if (status) map[key] = status
    }
  }
  if (Array.isArray(record.sectionReviews)) {
    for (const row of record.sectionReviews) {
      if (!row || typeof row !== 'object') continue
      const key = (row as { sectionKey?: string }).sectionKey
      const status = statusFromUnknown(row)
      if (key && REVIEW_SECTIONS.includes(key as ReviewSectionKey) && status) {
        map[key as ReviewSectionKey] = status
      }
    }
  }
  return map
}

export function dedupeInformationRequired<T extends {
  referenceClause?: string | null
  informationItem?: string
  requestedOn?: string
}>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => Date.parse(b.requestedOn ?? '') - Date.parse(a.requestedOn ?? ''))
  const latestSection = new Map<string, T>()
  const manuals: T[] = []
  const seenManual = new Set<string>()
  for (const item of sorted) {
    if (isReviewSectionKey(item.referenceClause)) {
      if (!latestSection.has(item.referenceClause)) latestSection.set(item.referenceClause, item)
      continue
    }
    const key = `${item.referenceClause ?? ''}|${(item.informationItem ?? '').trim().toLowerCase()}`
    if (seenManual.has(key)) continue
    seenManual.add(key)
    manuals.push(item)
  }
  return [...manuals, ...latestSection.values()].sort(
    (a, b) => Date.parse(a.requestedOn ?? '') - Date.parse(b.requestedOn ?? ''),
  )
}

export function filterInformationRequiredLikeCab<T extends {
  referenceClause?: string | null
  informationItem?: string
  requestedOn?: string
}>(applicationId: string, items: T[], sectionStatuses?: Partial<Record<string, string>>): T[] {
  const statuses = sectionStatuses ?? {}
  const hasStatuses = Object.values(statuses).some(Boolean)
  const visible = items.filter((item) => {
    if (!isReviewSectionKey(item.referenceClause)) return true
    if (hasStatuses) return statuses[item.referenceClause] === 'partiallyComplete'
    return !isReviewSectionClearedFromInformationRequired(applicationId, item.referenceClause)
  })
  return dedupeInformationRequired(visible)
}

export function syncReviewSectionsWithInformationRequired(
  applicationId: string,
  statuses: Partial<Record<ReviewSectionKey, string>>,
): void {
  REVIEW_SECTIONS.forEach((sectionKey) => {
    const status = statuses[sectionKey]
    if (!status) return
    syncReviewSectionWithInformationRequired(applicationId, sectionKey, status === 'partiallyComplete')
  })
}
