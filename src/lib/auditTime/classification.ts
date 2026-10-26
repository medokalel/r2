/**
 * Business-sector risk / complexity classification per standard: TypeScript copy of the backend's
 * src/modules/audit-engine/audit-sector-classification.js (keep both in step; parity is pinned by
 * tests/audit-time.test.mjs).
 *
 * The suggested category is the HIGHEST among the client's IAF codes (scope and sites), using the
 * IAF MD 5:2023 tables (Annex A Table QMS 2, Annex B Table EMS 2, Annex C Table OH&SMS 2). Changing
 * a suggestion read from the codes needs an override with a justification (MD 5 Annex B / C: the
 * CAB documents every case where it lowers the category); the API also checks who may override.
 * The mapping was confirmed by the product owner (MAPPING_CONFIRMATION, 25 October 2026): every
 * code with a category is confirmed; a code without one has no MD 5 category (unmappedCodes).
 */
import {
  CATEGORY_RANK, CLASSIFICATION_SOURCES, IAF_SECTOR_CATEGORIES, MAPPING_CONFIRMATION, SECTOR_TABLES,
  type MappingConfirmation, type SectorCategory, type SectorEntry, type SectorTableKey,
} from '@/lib/auditTime/sectorCategories'

export type ClassificationBasis = 'IAF_CODE' | 'ENERGY_COMPLEXITY' | 'FOOD_CATEGORY' | null
export type ClassificationRule = 'HIGHEST_OF_CODES' | 'DEFAULT_TABLE_TIME' | 'NO_MAPPED_CODE' | 'NO_CODES' | 'NO_IAF_TABLE'
export type ClassificationSource = 'OVERRIDE' | 'SELECTED' | 'SUGGESTED' | 'NONE'

interface StandardClassificationDef {
  basis: ClassificationBasis
  table: SectorTableKey | null
  effect: 'FACTOR' | 'TABLE_COLUMN' | 'FORMULA' | null
  categories: string[] | null
  defaultCategory: string | null
}

export const CLASSIFICATION_STANDARDS: Record<string, StandardClassificationDef> = {
  ISO_9001: { basis: 'IAF_CODE', table: 'QMS', effect: 'FACTOR', categories: ['HIGH', 'MEDIUM', 'LOW'], defaultCategory: 'MEDIUM' },
  ISO_14001: { basis: 'IAF_CODE', table: 'EMS', effect: 'TABLE_COLUMN', categories: ['HIGH', 'MEDIUM', 'LOW', 'LIMITED', 'SPECIAL'], defaultCategory: null },
  ISO_45001: { basis: 'IAF_CODE', table: 'OHS', effect: 'TABLE_COLUMN', categories: ['HIGH', 'MEDIUM', 'LOW'], defaultCategory: null },
  ISO_50001: { basis: 'ENERGY_COMPLEXITY', table: null, effect: 'TABLE_COLUMN', categories: ['HIGH', 'MEDIUM', 'LOW'], defaultCategory: null },
  ISO_22000: { basis: 'FOOD_CATEGORY', table: null, effect: 'FORMULA', categories: null, defaultCategory: null },
  ISO_13485: { basis: null, table: null, effect: null, categories: null, defaultCategory: null },
  ISO_27001: { basis: null, table: null, effect: null, categories: null, defaultCategory: null },
}

/** Minimum length of an override justification. */
export const JUSTIFICATION_MIN_LENGTH = 10

export interface ClassificationEffect {
  kind: 'FACTOR' | 'TABLE_COLUMN' | 'INDIVIDUAL'
  column: string | null
  direction: 'INCREASE' | 'DECREASE' | null
  text: string
  reference: { document: string; clause: string }
}

export interface ClassifiedCode {
  code: string
  description: string
  category: SectorCategory | null
  verified: boolean
  entries: SectorEntry[]
  note: string | null
}

export interface ClassificationSuggestion {
  standardCode: string
  basis: ClassificationBasis
  table: { document: string; edition: string; clause: string } | null
  suggested: string | null
  codes: ClassifiedCode[]
  unknownCodes: string[]
  unmappedCodes: string[]
  unverifiedCodes: string[]
  confirmation: MappingConfirmation | null
  rule: ClassificationRule
  effect: ClassificationEffect | null
  categories: string[] | null
}

export interface ClassificationOverrideInput {
  category: string
  justification: string
  by?: { userId?: string | null; name?: string | null; role?: string | null } | null
  at?: string | null
}

export interface ClassificationOverrideRecord {
  from: string | null
  to: string
  justification: string
  lowered: boolean
  by: ClassificationOverrideInput['by']
  at: string | null
}

/** Error of the classification (same codes as the backend). */
export class ClassificationError extends Error {
  code: string
  params: Record<string, unknown>
  constructor(code: string, message: string, params: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ClassificationError'
    this.code = code
    this.params = params
  }
}

/** Two-digit IAF code ("01" to "39") of "IAF 3", "IAF_03", "03", "3 a", or null. */
export function normaliseIafCode(value: unknown): string | null {
  const match = /(\d{1,2})/.exec(String(value ?? ''))
  if (!match) return null
  const code = match[1].padStart(2, '0')
  return IAF_SECTOR_CATEGORIES[code] ? code : null
}

const highest = (categories: SectorCategory[]) =>
  categories.reduce<SectorCategory | null>((best, category) => (best == null || CATEGORY_RANK[category] > CATEGORY_RANK[best] ? category : best), null)

const rankOf = (category: string) => CATEGORY_RANK[category as SectorCategory] ?? 0

/** What the category does to the audit time (the explanation under the classification). */
export function classificationEffect(standardCode: string, category: string | null): ClassificationEffect | null {
  const def = CLASSIFICATION_STANDARDS[standardCode]
  if (!def?.table || !category) return null
  const table = SECTOR_TABLES[def.table]
  const reference = { document: CLASSIFICATION_SOURCES[table.source].document, clause: table.effectReference }
  if (def.effect === 'FACTOR') {
    const text: Record<string, string> = {
      HIGH: 'High risk: MD 5 expects more time than Table QMS 1 (Table QMS 2 Note 1). Add an increase factor with its reason (clause 8 ii) a)).',
      MEDIUM: 'Medium risk: the Table QMS 1 time applies.',
      LOW: 'Low risk: may need less time than Table QMS 1 (Table QMS 2 Note 1). A reduction factor is allowed within the 30 % cap (clause 8, clause 3.9).',
    }
    return { kind: 'FACTOR', column: null, direction: category === 'HIGH' ? 'INCREASE' : category === 'LOW' ? 'DECREASE' : null, text: text[category], reference }
  }
  if (category === 'SPECIAL') {
    return {
      kind: 'INDIVIDUAL',
      column: null,
      direction: null,
      text: 'Special case: not covered by Table EMS 1. The audit time is developed and justified individually (Annex B).',
      reference: { ...reference, clause: 'Annex B (Special category)' },
    }
  }
  const tableName = def.table === 'EMS' ? 'Table EMS 1' : 'Table OH&SMS 1'
  return { kind: 'TABLE_COLUMN', column: category, direction: null, text: `Selects the ${category} column of ${tableName}.`, reference }
}

/** Suggested category of one standard from IAF codes (any spelling; unknown codes are reported). */
export function classifyStandard(standardCode: string, iafCodes: unknown[] = []): ClassificationSuggestion {
  const def = CLASSIFICATION_STANDARDS[standardCode] ?? { basis: null, table: null, categories: null, defaultCategory: null, effect: null }
  const unknownCodes: string[] = []
  const seen = new Set<string>()
  for (const raw of iafCodes) {
    const code = normaliseIafCode(raw)
    if (!code) unknownCodes.push(String(raw))
    else seen.add(code)
  }
  const ordered = [...seen].sort()
  if (def.basis !== 'IAF_CODE' || !def.table) {
    return { standardCode, basis: def.basis, table: null, suggested: null, codes: [], unknownCodes, unmappedCodes: [], unverifiedCodes: [], confirmation: null, rule: 'NO_IAF_TABLE', effect: null, categories: def.categories ?? null }
  }
  const tableKey = def.table
  const table = SECTOR_TABLES[tableKey]
  const source = CLASSIFICATION_SOURCES[table.source]
  const codes: ClassifiedCode[] = ordered.map((code) => {
    const row = IAF_SECTOR_CATEGORIES[code]
    const linked = row[tableKey]
    return { code, description: row.description, category: linked.category, verified: linked.verified, entries: linked.entries, note: linked.note }
  })
  const suggestedFromCodes = highest(codes.flatMap((c) => (c.category ? [c.category] : [])))
  const suggested = suggestedFromCodes ?? (codes.length || def.defaultCategory ? def.defaultCategory : null)
  return {
    standardCode,
    basis: def.basis,
    table: { document: source.document, edition: source.edition, clause: table.table },
    suggested,
    codes,
    unknownCodes,
    unmappedCodes: codes.filter((c) => !c.category).map((c) => c.code),
    // Linked codes not confirmed: none since the owner confirmed the mapping.
    unverifiedCodes: codes.filter((c) => c.category && !c.verified).map((c) => c.code),
    confirmation: MAPPING_CONFIRMATION,
    rule: suggestedFromCodes ? 'HIGHEST_OF_CODES' : suggested ? 'DEFAULT_TABLE_TIME' : codes.length ? 'NO_MAPPED_CODE' : 'NO_CODES',
    effect: classificationEffect(standardCode, suggested),
    categories: def.categories,
  }
}

/** Category used for the calculation, with its provenance. Throws ClassificationError. */
export function resolveClassification(
  suggestion: ClassificationSuggestion,
  { selected = null, override = null }: { selected?: string | null; override?: ClassificationOverrideInput | null } = {},
): { category: string | null; source: ClassificationSource; override: ClassificationOverrideRecord | null } {
  const allowed = suggestion.categories
  // A manual choice keeps the calculator's historical error code (COMPLEXITY_INVALID).
  const check = (category: string, code = 'CLASSIFICATION_INVALID') => {
    if (allowed && !allowed.includes(category)) {
      throw new ClassificationError(code, `Category "${category}" is not valid for ${suggestion.standardCode} (${allowed.join(', ')}).`, { standardCode: suggestion.standardCode, allowed })
    }
  }
  if (override?.category) {
    check(override.category)
    const justification = typeof override.justification === 'string' ? override.justification.trim() : ''
    if (justification.length < JUSTIFICATION_MIN_LENGTH) {
      throw new ClassificationError(
        'CLASSIFICATION_JUSTIFICATION_REQUIRED',
        `${suggestion.standardCode}: changing the classification needs a justification of at least ${JUSTIFICATION_MIN_LENGTH} characters.`,
        { standardCode: suggestion.standardCode },
      )
    }
    if (override.category === suggestion.suggested) return { category: override.category, source: 'SUGGESTED', override: null }
    return {
      category: override.category,
      source: 'OVERRIDE',
      override: {
        from: suggestion.suggested,
        to: override.category,
        justification,
        lowered: suggestion.suggested ? rankOf(override.category) < rankOf(suggestion.suggested) : false,
        by: override.by ?? null,
        at: override.at ?? null,
      },
    }
  }
  if (selected) {
    check(selected, 'COMPLEXITY_INVALID')
    // Only a suggestion read from the client's IAF codes needs a justified override to change.
    if (suggestion.rule === 'HIGHEST_OF_CODES' && selected !== suggestion.suggested) {
      throw new ClassificationError(
        'CLASSIFICATION_JUSTIFICATION_REQUIRED',
        `${suggestion.standardCode}: the suggested category is ${suggestion.suggested}; changing it to ${selected} needs an override with a justification.`,
        { standardCode: suggestion.standardCode, suggested: suggestion.suggested, selected },
      )
    }
    return { category: selected, source: suggestion.rule === 'HIGHEST_OF_CODES' ? 'SUGGESTED' : 'SELECTED', override: null }
  }
  return { category: suggestion.suggested, source: suggestion.suggested ? 'SUGGESTED' : 'NONE', override: null }
}
