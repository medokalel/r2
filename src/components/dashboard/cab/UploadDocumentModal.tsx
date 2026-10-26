import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { FormField, SelectField, RadioGroup, Textarea } from '@/components/ui'
import { AppIcon, DocumentFileIcon, TrashIcon, UploadOutlineIcon } from '@/components/icons'
import { formatFileSize } from '@/lib/files'
import {
  APPLICABLE_TO_OPTIONS,
  DOCUMENT_CATEGORIES,
  type DocumentApplicableTo,
  type DocumentCategory,
  type DocumentRecord,
  type DocumentRequirement,
} from '@/lib/documentsForm'
import { cn } from '@/lib/utils'

interface UploadDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing documents, used to populate the "Document Type" naming suggestions per category. */
  documents: DocumentRecord[]
  onUpload: (payload: {
    category: DocumentCategory
    customName: string
    requirement: DocumentRequirement
    applicableTo: DocumentApplicableTo
    description: string
    file: File
  }) => void
}

const emptyState = {
  category: '' as DocumentCategory | '',
  documentId: '',
  customName: '',
  requirement: 'mandatory' as DocumentRequirement,
  applicableTo: '' as DocumentApplicableTo | '',
  description: '',
}

export function UploadDocumentModal({ open, onOpenChange, documents, onUpload }: UploadDocumentModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyState)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const patch = (f: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...f }))

  // Start from a clean form every time the modal opens (adjusting state during render).
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setForm(emptyState)
      setFile(null)
    }
  }

  // This is just a naming shortcut (picking one fills the Document Name
  // field below) — it never targets or overwrites an existing row. This
  // modal always adds a brand-new supplementary document.
  const documentTypeSuggestions = form.category
    ? documents
        .filter((doc) => doc.category === form.category)
        .map((doc) => ({ value: doc.id, label: t(`cab.applicationDraft.documents.items.${doc.nameKey}.title`) }))
    : []

  const canUpload = Boolean(form.category && form.customName.trim() && form.applicableTo && file)

  const reset = () => {
    setForm(emptyState)
    setFile(null)
    setDragActive(false)
  }

  const handleFile = (selected: File | null | undefined) => {
    if (selected) setFile(selected)
  }

  const handleUpload = () => {
    if (!canUpload || !file || !form.category || !form.applicableTo) return
    onUpload({
      category: form.category,
      customName: form.customName.trim(),
      requirement: form.requirement,
      applicableTo: form.applicableTo,
      description: form.description.trim(),
      file,
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
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(760px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          <div className="flex shrink-0 items-start justify-between px-6 pt-6">
            <div>
              <Dialog.Title className="text-body-lg font-semibold text-neutral-900">
                {t('cab.applicationDraft.documents.uploadModal.title')}
              </Dialog.Title>
              <p className="mt-1 text-body-sm text-neutral-600">
                {t('cab.applicationDraft.documents.uploadModal.subtitle')}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 hover:border-neutral-500"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="rounded-md bg-primary-25 px-4 py-3 text-body-sm text-primary">
              {t('cab.applicationDraft.documents.uploadModal.newDocumentHint')}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('cab.applicationDraft.documents.uploadModal.documentCategory')} required>
                <SelectField
                  value={form.category}
                  onChange={(value) =>
                    patch({ category: value as DocumentCategory, documentId: '', customName: '' })
                  }
                  placeholder={t('cab.applicationDraft.documents.uploadModal.documentCategoryPlaceholder')}
                  options={DOCUMENT_CATEGORIES.map((category) => ({
                    value: category,
                    label: t(`cab.applicationDraft.documents.categories.${category}`),
                  }))}
                />
              </FormField>
              <FormField label={t('cab.applicationDraft.documents.uploadModal.documentType')}>
                <SelectField
                  value={form.documentId}
                  onChange={(value) => {
                    const suggestion = documentTypeSuggestions.find((option) => option.value === value)
                    patch({ documentId: value, customName: suggestion?.label ?? form.customName })
                  }}
                  placeholder={t('cab.applicationDraft.documents.uploadModal.documentTypePlaceholder')}
                  options={documentTypeSuggestions}
                  disabled={!form.category}
                />
                <p className="text-body-sm text-neutral-600">
                  {t('cab.applicationDraft.documents.uploadModal.documentTypeHint')}
                </p>
              </FormField>
            </div>

            <FormField label={t('cab.applicationDraft.documents.uploadModal.documentName')} required>
              <input
                type="text"
                value={form.customName}
                onChange={(e) => patch({ customName: e.target.value })}
                placeholder={t('cab.applicationDraft.documents.uploadModal.documentNamePlaceholder')}
                disabled={!form.category}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-body focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-50"
              />
              <p className="text-body-sm text-neutral-600">
                {t('cab.applicationDraft.documents.uploadModal.documentNameHint')}
              </p>
            </FormField>

            <FormField label={t('cab.applicationDraft.documents.uploadModal.requirement')} required>
              <RadioGroup
                name="documentRequirement"
                value={form.requirement}
                onChange={(value) => patch({ requirement: value as DocumentRequirement })}
                options={[
                  { value: 'mandatory', label: t('cab.applicationDraft.documents.requirement.mandatory') },
                  { value: 'optional', label: t('cab.applicationDraft.documents.requirement.optional') },
                  { value: 'notApplicable', label: t('cab.applicationDraft.documents.requirement.notApplicable') },
                ]}
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('cab.applicationDraft.documents.uploadModal.applicableTo')} required>
                <SelectField
                  value={form.applicableTo}
                  onChange={(value) => patch({ applicableTo: value as DocumentApplicableTo })}
                  placeholder={t('cab.applicationDraft.documents.uploadModal.applicableToPlaceholder')}
                  options={APPLICABLE_TO_OPTIONS.map((option) => ({
                    value: option,
                    label: t(`cab.applicationDraft.documents.uploadModal.applicableToOptions.${option}`),
                  }))}
                />
                <p className="text-body-sm text-neutral-600">
                  {t('cab.applicationDraft.documents.uploadModal.applicableToHint')}
                </p>
              </FormField>
              <FormField label={t('cab.applicationDraft.documents.uploadModal.description')}>
                <Textarea
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder={t('cab.applicationDraft.documents.uploadModal.descriptionPlaceholder')}
                  className="min-h-[86px]"
                />
              </FormField>
            </div>

            <FormField label={t('cab.applicationDraft.documents.uploadModal.uploadFile')} required>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(false)
                  handleFile(e.dataTransfer.files?.[0])
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed px-6 py-8 text-center transition-colors',
                  dragActive ? 'border-primary bg-primary-25' : 'border-neutral-300 bg-neutral-25 hover:bg-primary-25'
                )}
              >
                <AppIcon icon={UploadOutlineIcon} size={32} className="text-primary" />
                <p className="text-body-sm text-neutral-800">
                  {t('cab.applicationDraft.documents.uploadModal.dropzoneTitle')}{' '}
                  <span className="font-medium text-primary">
                    {t('cab.applicationDraft.documents.uploadModal.dropzoneBrowse')}
                  </span>
                </p>
                <p className="text-body-sm text-neutral-600">
                  {t('cab.applicationDraft.documents.uploadModal.dropzoneMaxSize')}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {file && (
                <div className="flex items-center justify-between gap-3 rounded-md border border-neutral-100 bg-white px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-25 text-primary">
                      <AppIcon icon={DocumentFileIcon} size={16} />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <p dir="ltr" className="truncate text-body-sm font-medium text-neutral-900">
                        {file.name}
                      </p>
                      <span className="text-caption text-neutral-600">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label={t('common.delete')}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:text-error-500"
                  >
                    <AppIcon icon={TrashIcon} size={16} />
                  </button>
                </div>
              )}
            </FormField>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4">
            <Button variant="tertiary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" className="gap-2" disabled={!canUpload} onClick={handleUpload}>
              <AppIcon icon={UploadOutlineIcon} size={18} />
              {t('cab.applicationDraft.documents.uploadModal.title')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}