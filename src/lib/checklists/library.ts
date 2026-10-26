/**
 * The iCASCO checklist library as data (one JSON file per standard in ./library, the same files the
 * API serves from src/modules/checklists/library). Used by the preview (demo mode) only; the real
 * app reads the library from GET /cab/checklists. Loaded lazily so the JSON stays out of the main bundle.
 */
import type { ChecklistItemData, ChecklistTemplate } from '@/lib/api/checklistsApi'

interface LibraryFile {
  key: string
  standardCode: string
  kind: ChecklistTemplate['kind']
  standard: string
  name: { en: string; ar: string }
  version: string
  /** Review status: "draft" or "approved" (approved by the product owner on 25 October 2026). */
  status: 'draft' | 'approved'
  approvedBy?: string
  approvedOn?: string
  reviewNote: { en: string; ar: string }
  items: Array<{
    code: string
    clause: string
    title: { en: string; ar: string }
    requirement: { en: string; ar: string }
    guidance: { en: string; ar: string }
    evidence: { en: string[]; ar: string[] }
    stages: string[]
    sampling: { en: string; ar: string } | null
    mandatory: boolean
    common: boolean
  }>
}

const files = import.meta.glob<LibraryFile>(['./library/*.json', '!./library/index.json'], { import: 'default' })

const ORDER = [
  'iso-9001', 'iso-14001', 'iso-45001', 'iso-22000', 'iso-27001', 'iso-50001', 'iso-22301', 'iso-13485',
  'iso-37001', 'iso-20000-1', 'iso-39001', 'iso-41001', 'iso-21001', 'ims', 'stage1-readiness',
]

const toItem = (item: LibraryFile['items'][number]): ChecklistItemData => ({
  id: null,
  code: item.code,
  clause: item.clause,
  title: item.title.en,
  titleAr: item.title.ar,
  requirement: item.requirement.en,
  requirementAr: item.requirement.ar,
  guidance: item.guidance.en,
  guidanceAr: item.guidance.ar,
  evidencePrompts: item.evidence.en,
  evidencePromptsAr: item.evidence.ar,
  stages: item.stages as ChecklistItemData['stages'],
  samplingHint: item.sampling?.en ?? '',
  samplingHintAr: item.sampling?.ar ?? '',
  mandatory: item.mandatory,
  common: item.common,
})

const toTemplate = (doc: LibraryFile): ChecklistTemplate => ({
  id: null,
  key: doc.key,
  source: 'library',
  code: doc.key.toUpperCase(),
  name: doc.name.en,
  nameAr: doc.name.ar,
  description: '',
  standardCode: doc.standardCode,
  standardLabel: doc.standard,
  kind: doc.kind,
  version: doc.version,
  status: 'ACTIVE',
  draft: doc.status === 'draft',
  reviewStatus: doc.status,
  approvedOn: doc.approvedOn ?? null,
  isDefault: false,
  reviewNote: doc.reviewNote,
  sourceKey: doc.key,
  itemCount: doc.items.length,
  updatedAt: null,
  items: doc.items.map(toItem),
})

let cache: ChecklistTemplate[] | null = null

/** Every library checklist with its items, in library order. */
export async function loadLibrary(): Promise<ChecklistTemplate[]> {
  if (cache) return cache
  const docs = await Promise.all(ORDER.map((key) => files[`./library/${key}.json`]?.()))
  cache = docs.filter((d): d is LibraryFile => Boolean(d)).map(toTemplate)
  return cache
}
