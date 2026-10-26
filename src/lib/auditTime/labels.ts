/**
 * Translated labels of the audit-time classification and the multi-site register (category names,
 * effect on the duration, MD 1 criteria, site groups and reasons). Keys under `auditCalc.*`.
 */
import type { TFunction } from 'i18next'

const CATEGORY_FALLBACK: Record<string, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', LIMITED: 'Limited', SPECIAL: 'Special' }

/** Translated category name (High, Medium, Low, Limited, Special). */
export const categoryLabel = (t: TFunction, category: string | null | undefined) =>
  category ? t(`auditCalc.category.${category}`, CATEGORY_FALLBACK[category] ?? category) : t('auditCalc.category.none', 'Not set')

export const TABLE_FALLBACK: Record<string, string> = { ISO_9001: 'Table QMS 2 (QMS risk)', ISO_14001: 'Table EMS 2 (EMS complexity)', ISO_45001: 'Table OH&SMS 2 (OH&S risk)' }

/** Translated explanation of what the category does to the audit time. */
export function effectText(t: TFunction, standardCode: string, category: string | null): string {
  if (!category) return t('auditCalc.effect.none', 'Choose a category to calculate the audit time.')
  if (standardCode === 'ISO_9001') {
    return t(`auditCalc.effect.QMS_${category}`, {
      HIGH: 'High risk: IAF MD 5 expects more time than Table QMS 1 (Table QMS 2, Note 1). Add an increase factor with its reason (clause 8).',
      MEDIUM: 'Medium risk: the Table QMS 1 time applies without a risk factor.',
      LOW: 'Low risk: may need less time than Table QMS 1 (Table QMS 2, Note 1). A reduction factor is allowed within the 30 % cap (clause 8).',
    }[category] ?? '')
  }
  if (category === 'SPECIAL') return t('auditCalc.effect.SPECIAL', 'Special case: not covered by Table EMS 1. Enter the audit time developed and justified for this organisation (IAF MD 5 Annex B).')
  if (standardCode === 'ISO_50001') return t('auditCalc.effect.ENERGY', { category: categoryLabel(t, category), defaultValue: 'Selects the {{category}} column of ISO 50003 Table A.3 and the surveillance and recertification times of Table A.4.' })
  return t('auditCalc.effect.COLUMN', {
    category: categoryLabel(t, category),
    table: standardCode === 'ISO_14001' ? t('auditCalc.tableName.EMS', 'Table EMS 1') : t('auditCalc.tableName.OHS', 'Table OH&SMS 1'),
    defaultValue: 'Selects the {{category}} column of IAF MD 5 {{table}}.',
  })
}

const CRITERION_FALLBACK: Record<string, string> = {
  CENTRAL_FUNCTION: 'A central function is identified (a site is marked as central function)',
  SINGLE_MANAGEMENT_SYSTEM: 'One management system covers all sites',
  CENTRAL_AUTHORITY: 'The central function defines, establishes and maintains the system',
  CENTRAL_MANAGEMENT_REVIEW: 'The system is subject to a centralised management review',
  INTERNAL_AUDIT_ALL_SITES: 'All sites are covered by the internal audit programme',
  CENTRAL_DATA_ANALYSIS: 'The central function collects and analyses data from all sites and can initiate change',
  LEGAL_LINK: 'Every site has a legal or contractual link with the central function',
  SIMILAR_PROCESSES: 'The sites perform very similar processes and activities',
  NO_SCHEME_RESTRICTION: 'No scheme or regulatory rule requires every site to be audited',
  CLIENT_ACCEPTS_SAMPLING: 'The client has not asked for every site to be audited',
}

const REASON_FALLBACK: Record<string, string> = {
  CENTRAL_FUNCTION: 'Central function: audited at every audit',
  NOT_ELIGIBLE: 'Sampling not allowed: an IAF MD 1 criterion is not met or not confirmed',
  SAMPLING_NOT_REQUESTED: 'Sampling switched off',
  DIFFERENT_PROCESSES: 'Different processes or activities',
  INDIVIDUAL_REQUESTED: 'Individual audit requested',
  HIGHER_RISK: 'Higher risk category than the other sites',
}

const GROUP_FALLBACK: Record<string, string> = { CENTRAL: 'Central function', SAMPLED: 'Sampled group', INDIVIDUAL: 'Audited individually' }

/** Translated reason why a site is in its group. */
export const siteReasonText = (t: TFunction, reason: string) => t(`auditCalc.sites.reason.${reason}`, REASON_FALLBACK[reason] ?? reason)
export const siteGroupText = (t: TFunction, group: string | undefined) => (group ? t(`auditCalc.sites.group.${group}`, GROUP_FALLBACK[group] ?? group) : '')
export const criterionText = (t: TFunction, key: string) => t(`auditCalc.criterion.${key}`, CRITERION_FALLBACK[key] ?? key)

/** Kind of the information note of a linked IAF code (the mapping itself is owner-confirmed). */
export type LinkNoteKind = 'MIXED' | 'PARTIAL' | 'INTERPRETED'

export function linkNoteKind(link: { category: string | null; entries: { category: string }[]; note: string | null }): LinkNoteKind | null {
  if (!link.category || !link.note) return null
  if (/interpretation/i.test(link.note)) return 'INTERPRETED'
  if (new Set(link.entries.map((e) => e.category)).size > 1) return 'MIXED'
  return 'PARTIAL'
}

const NOTE_FALLBACK: Record<LinkNoteKind, string> = {
  MIXED: 'Mixed: the code covers entries of different categories. The highest non-Special one is suggested; the others are alternatives.',
  PARTIAL: 'Partial: the listed entry covers only part of the code.',
  INTERPRETED: 'Interpreted: linked by reading the code description (not named in the table).',
}

/** Translated information note of a linked code, or null. */
export const linkNoteText = (t: TFunction, link: Parameters<typeof linkNoteKind>[0]) => {
  const kind = linkNoteKind(link)
  return kind ? t(`auditCalc.classification.note.${kind}`, NOTE_FALLBACK[kind]) : null
}

/** Plain label of a code with no IAF MD 5 category (not a confirmation case). */
export const noCategoryText = (t: TFunction, standardCode: string) =>
  standardCode === 'ISO_9001'
    ? t('auditCalc.classification.noCategoryQms', 'No MD 5 category; table time used')
    : t('auditCalc.classification.noCategory', 'No MD 5 category; not used for the suggestion')

/** Category of one code for one-line lists (breakdown, PDF). */
export const codeCategoryText = (t: TFunction, category: string | null) =>
  category ? categoryLabel(t, category) : t('auditCalc.classification.noCategoryShort', 'No MD 5 category')

/** The owner's confirmation of the IAF code to MD 5 mapping, shown once. */
export const mappingConfirmedText = (t: TFunction) =>
  t('auditCalc.classification.mappingConfirmed', 'IAF code to IAF MD 5 category mapping confirmed by the product owner on 25 October 2026.')
