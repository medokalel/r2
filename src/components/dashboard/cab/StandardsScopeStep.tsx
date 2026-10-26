import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { AppIcon, AddCircleIcon, EditIcon, SearchIcon, TrashIcon } from '@/components/icons'
import { SectorIcon } from '@/components/icons/sectorIcons'
import type { SectorKey } from '@/components/dashboard/entityData/fieldTypes'
import { Textarea } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { AddStandardModal } from '@/components/dashboard/cab/AddStandardModal'
import { STANDARD_SCHEMA_OPTIONS } from '@/lib/api/applicationDraftApi'
import { SCOPE_TEXT_MAX_LENGTH, type SelectedStandard, type StandardsScopeForm } from '@/lib/standardsScopeForm'
import { cn } from '@/lib/utils'

interface StandardsScopeStepProps {
  form: StandardsScopeForm
  onPatch: (f: Partial<StandardsScopeForm>) => void
}

function standardName(value: string): string {
  return STANDARD_SCHEMA_OPTIONS.find((s) => s.value === value)?.name ?? value
}

/** Numeric part of an IHF code (e.g. "GP 24" → "24"), for the compact code badge. */
function ihfCodeNumber(ihfCode: string): string {
  return ihfCode.match(/\d+/)?.[0] ?? ihfCode
}

/** IHF category → closest sector icon. Falls back to `services` for any category not mapped here. */
const IHF_CATEGORY_SECTOR_ICON: Record<string, SectorKey> = {
  Construction: 'constructionAndBuilding',
  Manufacturing: 'industrialProduction',
  Engineering: 'mechanicalIndustries',
  'Health & Social Work': 'healthSector',
  'Other Services': 'services',
}

interface StandardScopeCardProps {
  standard: SelectedStandard
  displayName: string
  onScopeChange: (value: string) => void
}

/**
 * Single collapsible standard card in the "Scope of Each Standard" list —
 * plain bordered card (not the primary-bar SectionHeading style) so the
 * standard name, cert type, IHF code and category read as one inline row.
 */
function StandardScopeCard({ standard, displayName, onScopeChange }: StandardScopeCardProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const sector = IHF_CATEGORY_SECTOR_ICON[standard.ihfCategory] ?? 'services'

  return (
    <div className="overflow-hidden rounded-[16px] border border-alabaster-150 bg-white">
      <div
        className="flex cursor-pointer select-none items-center justify-between gap-3 p-4"
        onClick={() => setOpen((prev) => !prev)}
        role="button"
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="text-[16px] font-bold text-neutral-900">{displayName}</span>
          <span className="text-[14px] text-neutral-500">{standard.certificationType}</span>
          <span className="inline-flex items-center gap-2">
            <SectorIcon sector={sector} selected className="size-[24px]" />
            <span className="rounded-[6px] bg-success-50 px-2 py-0.5 text-[13px] font-semibold text-success-600">
              {ihfCodeNumber(standard.ihfCode)}
            </span>
          </span>
          <span className="text-[14px] font-medium text-primary">{standard.ihfCategory}</span>
        </div>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {open && (
        <div className="px-4 pb-4">
          <Textarea
            rows={3}
            value={standard.scopeText}
            maxLength={SCOPE_TEXT_MAX_LENGTH}
            onChange={(e) => onScopeChange(e.target.value)}
            placeholder={t('cab.applicationDraft.standardsScope.scopePlaceholder')}
            className="border-0 bg-primary-25 focus:border-0 focus:ring-0"
          />
          <p className="mt-1 text-end text-[12px] text-neutral-400">
            {standard.scopeText.length} / {SCOPE_TEXT_MAX_LENGTH} {t('cab.applicationDraft.standardsScope.characters')}
          </p>
        </div>
      )}
    </div>
  )
}

export function StandardsScopeStep({ form, onPatch }: StandardsScopeStepProps) {
  const { t } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const addStandard = (standard: SelectedStandard) =>
    onPatch({ standards: [...form.standards, standard] })

  const removeStandard = (id: string) =>
    onPatch({ standards: form.standards.filter((s) => s.id !== id) })

  const updateScope = (id: string, scopeText: string) =>
    onPatch({
      standards: form.standards.map((s) => (s.id === id ? { ...s, scopeText } : s)),
    })

  return (
    <div className="space-y-5">
      <SectionHeading
        title={t('cab.applicationDraft.standardsScope.title')}
        accordion
        headerActions={
          <Button
            type="button"
            variant="secondary"
            className="h-[40px] gap-2 rounded-[var(--radius-sm)] px-4"
            onClick={() => setIsAddOpen(true)}
          >
            <AppIcon icon={AddCircleIcon} size={24} />
            {t('cab.applicationDraft.standardsScope.addStandard')}
          </Button>
        }
      >
        {form.standards.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-neutral-500">
            {t('cab.applicationDraft.standardsScope.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-center">
              <thead className="bg-primary text-white">
                <tr className="rounded-[10px] bg-primary text-white">
                  <th className="w-12 p-[18px] text-center text-[14px] font-medium">#</th>
                  <th className="p-[18px] text-center text-[14px] font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.standardSchema')}
                  </th>
                  <th className="p-[18px] text-center text-[14px] font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.ihfCode')}
                  </th>
                  <th className="p-[18px] text-center text-[14px] font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.certificationType')}
                  </th>
                  <th className="p-[18px] text-center text-[14px] font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.accreditationBody')}
                  </th>
                  <th className="w-24 p-[18px] text-center text-[14px] font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.standards.map((s, index) => (
                  <tr key={s.id} className={cn(index % 2 === 1 ? 'bg-neutral-25' : 'bg-white')}>
                    <td className="px-4 py-4 text-[14px] text-neutral-500">{index + 1}</td>
                    <td className="px-4 py-4 text-[15px] font-medium text-neutral-900">
                      {standardName(s.standard)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="rounded-[6px] bg-primary px-2 py-0.5 text-[12px] font-semibold text-white">
                          {s.ihfCode}
                        </span>
                        <span className="text-[13px] text-neutral-500">{s.ihfCategory}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[14px] text-neutral-700">{s.certificationType}</td>
                    <td className="px-4 py-4 text-[14px] text-neutral-700">{s.accreditationBody}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-primary"
                          aria-label={t('common.edit')}
                        >
                          <AppIcon icon={EditIcon} size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStandard(s.id)}
                          className="text-error-400 hover:text-error-600"
                          aria-label={t('common.delete')}
                        >
                          <AppIcon icon={TrashIcon} size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionHeading>

      {form.standards.length > 0 && (
        <SectionHeading
          title={t('cab.applicationDraft.standardsScope.scopeSectionTitle')}
          accordion
        >
          <div className="space-y-4">
            {form.standards.map((s) => (
              <StandardScopeCard
                key={s.id}
                standard={s}
                displayName={standardName(s.standard)}
                onScopeChange={(value) => updateScope(s.id, value)}
              />
            ))}
          </div>
        </SectionHeading>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="button" className="text-[14px] font-semibold text-primary underline underline-offset-2">
          {t('cab.applicationDraft.standardsScope.needHelp')}
        </button>
        <Button type="button" variant="secondary" className="h-[40px] gap-2 rounded-[var(--radius-sm)] px-4">
          <AppIcon icon={SearchIcon} size={24} />
          {t('cab.applicationDraft.standardsScope.searchIhfCode')}
        </Button>
      </div>

      <AddStandardModal open={isAddOpen} onOpenChange={setIsAddOpen} onAdd={addStandard} />
    </div>
  )
}