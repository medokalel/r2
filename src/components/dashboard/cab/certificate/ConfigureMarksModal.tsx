import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WalletModalBody, WalletModalShell } from '@/components/dashboard/wallet/WalletModalShell'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import type { CertificateMark } from '@/lib/api/cabCertificatesApi'

interface ConfigureMarksModalProps {
  open: boolean
  onClose: () => void
  marks: CertificateMark[]
  selectedIds: string[]
  onApply: (markIds: string[]) => void
}

type MarksChecklistProps = Omit<ConfigureMarksModalProps, 'open'>

/** Mounted only while the dialog is open, so its draft selection restarts from `selectedIds` every time. */
function MarksChecklist({ onClose, marks, selectedIds, onApply }: MarksChecklistProps) {
  const { t } = useTranslation()
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds)

  const toggle = (markId: string) =>
    setDraftIds((previous) =>
      previous.includes(markId) ? previous.filter((id) => id !== markId) : [...previous, markId],
    )

  return (
    <WalletModalBody className="gap-4">
      {marks.length === 0 ? (
        <p className="rounded-md border border-neutral-100 bg-neutral-25 px-4 py-6 text-center text-body-sm text-neutral-600">
          {t('cab.certificatePrepare.marksModal.empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {marks.map((mark) => (
            <li key={mark.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-neutral-300 px-4 py-3 transition-colors hover:bg-neutral-50">
                <Checkbox checked={draftIds.includes(mark.id)} onChange={() => toggle(mark.id)} />
                <img src={mark.imageUrl} alt="" className="h-9 w-auto shrink-0 object-contain" />
                <span className="text-body-sm font-medium text-neutral-900">{mark.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button className="flex-1" onClick={() => onApply(draftIds)}>
          {t('cab.certificatePrepare.marksModal.apply')}
        </Button>
      </div>
    </WalletModalBody>
  )
}

export function ConfigureMarksModal({ open, onClose, marks, selectedIds, onApply }: ConfigureMarksModalProps) {
  const { t } = useTranslation()

  return (
    <WalletModalShell
      open={open}
      onClose={onClose}
      title={t('cab.certificatePrepare.marksModal.title')}
      subtitle={t('cab.certificatePrepare.marksModal.subtitle')}
    >
      <MarksChecklist onClose={onClose} marks={marks} selectedIds={selectedIds} onApply={onApply} />
    </WalletModalShell>
  )
}