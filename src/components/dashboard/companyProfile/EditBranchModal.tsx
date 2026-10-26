import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { type CountryCode } from '@/components/auth/CountryCodeSelect'
import { Button } from '@/components/ui/Button'
import { updateBranch } from '@/lib/api/organizationProfileApi'
import type { OrgBranch } from '@/lib/api/organizationProfileApi'
import { BranchFormFields } from './BranchFormFields'
import { branchFormFrom, branchPayloadFrom } from './mappers'
import { useProfileForm } from './ProfileFormContext'
import type { BranchFormValues } from './types'
import { isBranchFormComplete } from './validation'

function EditBranchForm({ branch, onClose }: { branch: OrgBranch; onClose: () => void }) {
  const { t } = useTranslation()
  const { refreshBranches, notify, handleApiError } = useProfileForm()
  const [form, setForm] = useState<BranchFormValues>(() => branchFormFrom(branch))
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const countryCode: CountryCode = form.countryCode ?? 'SA'

  const onUpdate = async () => {
    setSaving(true)
    try {
      await updateBranch(branch.id, branchPayloadFrom(form, countryCode))
      await refreshBranches()
      notify({ type: 'success', message: t('companyProfile.messages.branchSaved') })
      onClose()
    } catch (error) {
      handleApiError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Fixed header: title at start, circular close at end */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-50 px-6 py-5">
        <Dialog.Title className="text-[24px] font-semibold leading-[1.6] text-neutral-900">
          {t('companyProfile.addBranch.editTitle')}
        </Dialog.Title>
        <Dialog.Close asChild>
          <button
            type="button"
            aria-label={t('common.close')}
            className="flex size-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-colors hover:border-neutral-500 hover:text-neutral-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </Dialog.Close>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <BranchFormFields
          form={form}
          set={set}
          countryCode={countryCode}
          mapClassName="h-[140px] w-full"
          branchTypeVariant="pills"
        />

        {/* Footer actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            className="min-w-[200px]"
            onClick={onUpdate}
            disabled={saving || !isBranchFormComplete(form, countryCode)}
          >
            {saving ? t('common.loading') : t('companyProfile.addBranch.updateButton')}
          </Button>
          <Button
            variant="tertiary"
            size="lg"
            className="min-w-[200px] bg-error-50 text-error-500 hover:bg-error-100"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </>
  )
}

/**
 * Edit-branch dialog. Opens whenever a branch is put in editing mode
 * (via the branch card's Edit button) and closes by clearing it.
 */
export function EditBranchModal() {
  const { editingBranch, setEditingBranch } = useProfileForm()

  const onOpenChange = (open: boolean) => {
    if (!open) setEditingBranch(null)
  }

  return (
    <Dialog.Root open={editingBranch !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(735px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          {editingBranch && (
            <EditBranchForm
              key={editingBranch.id}
              branch={editingBranch}
              onClose={() => setEditingBranch(null)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
