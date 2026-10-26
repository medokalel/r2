import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { FormField, SelectField } from '@/components/ui'
import {
  ACCREDITATION_BODY_OPTIONS,
  IHF_CODE_OPTIONS,
  STANDARD_SCHEMA_OPTIONS,
} from '@/lib/api/applicationDraftApi'
import type { SelectedStandard } from '@/lib/standardsScopeForm'

interface AddStandardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (standard: SelectedStandard) => void
}

export function AddStandardModal({ open, onOpenChange, onAdd }: AddStandardModalProps) {
  const { t } = useTranslation()
  const [standard, setStandard] = useState('')
  const [ihfCode, setIhfCode] = useState('')
  const [accreditationBody, setAccreditationBody] = useState('')

  const standardOption = STANDARD_SCHEMA_OPTIONS.find((s) => s.value === standard)
  const ihfOption = IHF_CODE_OPTIONS.find((c) => c.value === ihfCode)
  const canAdd = Boolean(standardOption && ihfOption && accreditationBody)

  const reset = () => {
    setStandard('')
    setIhfCode('')
    setAccreditationBody('')
  }

  const handleAdd = () => {
    if (!standardOption || !ihfOption || !accreditationBody) return
    onAdd({
      id: crypto.randomUUID(),
      standard: standardOption.value,
      ihfCode: ihfOption.value,
      ihfCategory: ihfOption.category,
      certificationType: standardOption.certificationType,
      accreditationBody,
      scopeText: '',
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 w-[min(520px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-body-lg font-semibold text-neutral-900">
              {t('cab.applicationDraft.standardsScope.addStandard')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 hover:border-neutral-500"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            <FormField label={t('cab.applicationDraft.standardsScope.standardSchema')} required>
              <SelectField
                value={standard}
                onChange={setStandard}
                placeholder={t('cab.applicationDraft.standardsScope.standardSchemaPlaceholder')}
                options={STANDARD_SCHEMA_OPTIONS.map((s) => ({ value: s.value, label: s.name }))}
              />
            </FormField>
            <FormField label={t('cab.applicationDraft.standardsScope.ihfCode')} required>
              <SelectField
                value={ihfCode}
                onChange={setIhfCode}
                placeholder={t('cab.applicationDraft.standardsScope.ihfCodePlaceholder')}
                options={IHF_CODE_OPTIONS.map((c) => ({ value: c.value, label: `${c.value} · ${c.category}` }))}
              />
            </FormField>
            <FormField label={t('cab.applicationDraft.standardsScope.certificationType')}>
              <SelectField
                value={standardOption?.certificationType ?? ''}
                onChange={() => {}}
                disabled
                options={standardOption ? [standardOption.certificationType] : []}
                placeholder={t('cab.applicationDraft.standardsScope.certificationTypeAuto')}
              />
            </FormField>
            <FormField label={t('cab.applicationDraft.standardsScope.accreditationBody')} required>
              <SelectField
                value={accreditationBody}
                onChange={setAccreditationBody}
                placeholder={t('cab.applicationDraft.standardsScope.accreditationBodyPlaceholder')}
                options={ACCREDITATION_BODY_OPTIONS}
              />
            </FormField>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="tertiary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" disabled={!canAdd} onClick={handleAdd}>
              {t('cab.applicationDraft.standardsScope.addStandard')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}