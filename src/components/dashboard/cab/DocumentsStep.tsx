import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { CabDonutCard } from '@/components/dashboard/cab/CabDonutCard'
import { NeedHelpCard } from '@/components/dashboard/cab/NeedHelpCard'
import { UploadDocumentModal } from '@/components/dashboard/cab/UploadDocumentModal'
import { AppIcon, DownloadIcon, EyeIcon, SuccessCircleIcon, TrashIcon, UploadOutlineIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import {
  documentCompletionCounts,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type DocumentRecord,
  type DocumentsForm,
  type DocumentUploadStatus,
} from '@/lib/documentsForm'
import { cn } from '@/lib/utils'

interface DocumentsStepProps {
  form: DocumentsForm
  onPatch: (f: Partial<DocumentsForm>) => void
}

type FilterKey = 'all' | 'mandatory' | 'optional' | 'uploaded' | 'pending'

const statusBadgeStyles: Record<DocumentUploadStatus, string> = {
  uploaded: 'bg-success-50 text-success-600',
  pending: 'bg-warning-50 text-warning-700',
  notUploaded: 'bg-neutral-50 text-[#4b5563]',
}

const donutColors: Record<DocumentUploadStatus, string> = {
  uploaded: '#16a34a',
  pending: '#f59e0b',
  notUploaded: '#d1d5db',
}

export function DocumentsStep({ form, onPatch }: DocumentsStepProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [addDocumentModalOpen, setAddDocumentModalOpen] = useState(false)
  const rowFileInputRef = useRef<HTMLInputElement>(null)
  const pendingRowUploadId = useRef<string | null>(null)

  const counts = documentCompletionCounts(form)

  const filterOptions: { key: FilterKey; count: number }[] = [
    { key: 'all', count: form.documents.length },
    { key: 'mandatory', count: form.documents.filter((d) => d.requirement === 'mandatory').length },
    { key: 'optional', count: form.documents.filter((d) => d.requirement === 'optional').length },
    { key: 'uploaded', count: counts.uploaded },
    { key: 'pending', count: counts.pending },
  ]

  const visibleDocuments = useMemo(() => {
    return form.documents.filter((doc) => {
      if (filter === 'all') return true
      if (filter === 'mandatory' || filter === 'optional') return doc.requirement === filter
      return doc.status === filter
    })
  }, [form.documents, filter])

  const groupedDocuments = useMemo(() => {
    return DOCUMENT_CATEGORIES.map((category) => ({
      category,
      documents: visibleDocuments.filter((doc) => doc.category === category),
    })).filter((group) => group.documents.length > 0)
  }, [visibleDocuments])

  // Running row-count offset per category group, so the white/blue zebra
  // stripe continues across category boundaries instead of restarting at
  // white after every group header.
  const groupRowOffsets = useMemo(
    () =>
      groupedDocuments.map((_, index) =>
        groupedDocuments.slice(0, index).reduce((sum, group) => sum + group.documents.length, 0)
      ),
    [groupedDocuments]
  )

  const updateDocument = (id: string, patch: Partial<DocumentRecord>) => {
    onPatch({
      documents: form.documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)),
    })
  }

  const openRowFilePicker = (documentId: string) => {
    pendingRowUploadId.current = documentId
    rowFileInputRef.current?.click()
  }

  const onRowFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const id = pendingRowUploadId.current
    if (file && id) {
      updateDocument(id, {
        status: 'uploaded',
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedDate: new Date().toLocaleDateString(),
      })
    }
    event.target.value = ''
    pendingRowUploadId.current = null
  }

  // The modal is only ever used for adding a brand-new supplementary
  // document (13, 14, ...) via the header button — it never targets one of
  // the 12 required rows, so this always appends.
  const handleAddDocument: React.ComponentProps<typeof UploadDocumentModal>['onUpload'] = (payload) => {
    onPatch({
      documents: [
        ...form.documents,
        {
          id: crypto.randomUUID(),
          category: payload.category,
          nameKey: 'otherSupportingDocuments',
          customName: payload.customName,
          requirement: payload.requirement,
          status: 'uploaded',
          applicableTo: payload.applicableTo,
          description: payload.description || undefined,
          fileName: payload.file.name,
          fileUrl: URL.createObjectURL(payload.file),
          uploadedDate: new Date().toLocaleDateString(),
        },
      ],
    })
  }

  const resetDocument = (id: string) =>
    updateDocument(id, { status: 'notUploaded', fileName: undefined, fileUrl: undefined, uploadedDate: undefined })

  const docLabel = (doc: DocumentRecord) =>
    doc.customName || t(`cab.applicationDraft.documents.items.${doc.nameKey}.title`)
  const docNote = (doc: DocumentRecord) =>
    doc.description || t(`cab.applicationDraft.documents.items.${doc.nameKey}.note`)

  return (
    <>
      <SectionHeading
        title={t('cab.applicationDraft.documents.title')}
        accordion
        headerActions={
          <Button
            type="button"
            variant="secondary"
            className="h-[40px] gap-2 rounded-[var(--radius-sm)] px-4"
            onClick={() => setAddDocumentModalOpen(true)}
          >
            <AppIcon icon={UploadOutlineIcon} size={24} />
            {t('cab.applicationDraft.documents.uploadDocument')}
          </Button>
        }
      >
        <p className="mb-4 text-[14px] text-neutral-500">
          {t('cab.applicationDraft.documents.subtitle')}
        </p>

        {/* Row-level uploads pick a file directly — no modal, straight to browse. */}
        <input ref={rowFileInputRef} type="file" accept=".pdf" className="hidden" onChange={onRowFileSelected} />

        <div className="mb-4 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors',
                filter === option.key
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-alabaster-150 bg-white text-neutral-600 hover:bg-neutral-50'
              )}
            >
              {t(`cab.applicationDraft.documents.filters.${option.key}`)}
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-[11px] font-semibold',
                  filter === option.key ? 'bg-primary text-white' : 'bg-neutral-50 text-neutral-500'
                )}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] border-collapse text-center">
            <thead className="bg-primary text-white">
              <tr className="rounded-[10px] bg-primary text-white">
                <th className="w-12 p-[18px] text-center text-[14px] font-medium">#</th>
                <th className="p-[18px] text-center text-[14px] font-medium">
                  {t('cab.applicationDraft.documents.columns.documentName')}
                </th>
                <th className="p-[18px] text-center text-[14px] font-medium">
                  {t('cab.applicationDraft.documents.columns.type')}
                </th>
                <th className="p-[18px] text-center text-[14px] font-medium">
                  {t('cab.applicationDraft.documents.columns.status')}
                </th>
                <th className="p-[18px] text-center text-[14px] font-medium">
                  {t('cab.applicationDraft.documents.columns.fileUploadedOn')}
                </th>
                <th className="p-[18px] text-center text-[14px] font-medium">
                  {t('cab.applicationDraft.documents.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                    {t('cab.applicationDraft.documents.empty')}
                  </td>
                </tr>
              ) : (
                groupedDocuments.map((group, groupIndex) => (
                  <CategoryGroup
                    key={group.category}
                    category={group.category}
                    documents={group.documents}
                    startIndex={groupRowOffsets[groupIndex]}
                    docLabel={docLabel}
                    docNote={docNote}
                    onView={(doc) => doc.fileUrl && window.open(doc.fileUrl, '_blank', 'noopener')}
                    onUpload={openRowFilePicker}
                    onRemove={resetDocument}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards, matching DashboardTasksTable's small-screen layout */}
        <div className="rounded-[12px] border border-alabaster-150 bg-neutral-25 p-2 md:hidden">
          {groupedDocuments.length === 0 ? (
            <p className="py-6 text-center text-neutral-500">{t('cab.applicationDraft.documents.empty')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {groupedDocuments.map((group) => (
                <div key={group.category}>
                  <p className="px-2 py-1 text-[13px] font-semibold text-primary">
                    {t(`cab.applicationDraft.documents.categories.${group.category}`)}
                  </p>
                  <div className="flex flex-col gap-3">
                    {group.documents.map((doc) => (
                      <div key={doc.id} className="rounded-[12px] border border-alabaster-150 bg-white p-4">
                        <p className="text-[15px] font-medium text-neutral-900">{docLabel(doc)}</p>
                        <p className="text-[13px] text-neutral-500">{docNote(doc)}</p>

                        <div className="mt-3 flex items-center justify-between">
                          <span
                            className={cn(
                              'inline-block rounded-[6px] px-2 py-0.5 text-[12px] font-medium',
                              doc.requirement === 'mandatory'
                                ? 'bg-primary-50 text-primary'
                                : 'bg-neutral-50 text-neutral-600'
                            )}
                          >
                            {t(`cab.applicationDraft.documents.requirement.${doc.requirement}`)}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
                              statusBadgeStyles[doc.status]
                            )}
                          >
                            {t(`cab.applicationDraft.documents.status.${doc.status}`)}
                          </span>
                        </div>

                        {doc.fileName && (
                          <p className="mt-2 text-[13px] text-neutral-500">
                            {doc.fileName} · {doc.uploadedDate}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                          {doc.status === 'uploaded' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank', 'noopener')}
                                className="text-[14px] font-medium text-primary hover:underline"
                              >
                                {t('common.view')}
                              </button>
                              <a
                                href={doc.fileUrl}
                                download={doc.fileName}
                                target="_blank"
                                rel="noopener"
                                className="text-[14px] font-medium text-primary hover:underline"
                              >
                                {t('common.download')}
                              </a>
                              <button
                                type="button"
                                onClick={() => resetDocument(doc.id)}
                                className="text-[14px] font-medium text-error-500 hover:underline"
                              >
                                {t('common.delete')}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openRowFilePicker(doc.id)}
                              className="text-[14px] font-medium text-primary hover:underline"
                            >
                              {t('cab.applicationDraft.documents.uploadDocument')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-[13px] text-neutral-500">
          {t('cab.applicationDraft.documents.showing', { count: visibleDocuments.length, total: form.documents.length })}
        </p>
      </SectionHeading>

      <UploadDocumentModal
        open={addDocumentModalOpen}
        onOpenChange={setAddDocumentModalOpen}
        documents={form.documents}
        onUpload={handleAddDocument}
      />
    </>
  )
}

/**
 * Replaces `WorkflowProgressCard` in the page's sidebar slot while on the
 * Documents step — same card width/style, stacked completion + guidelines +
 * support sections instead of the workflow timeline.
 */
export function DocumentsSidebar({ form }: { form: DocumentsForm }) {
  const { t } = useTranslation()
  const counts = documentCompletionCounts(form)

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
      <CabDonutCard
        title={t('cab.applicationDraft.documents.completion.title')}
        labelPrefix="cab.applicationDraft.documents.completion.legend"
        totalLabel={t('cab.applicationDraft.documents.completion.totalLabel')}
        entries={[
          { key: 'uploaded', count: counts.uploaded, color: donutColors.uploaded },
          { key: 'pending', count: counts.pending, color: donutColors.pending },
          { key: 'notUploaded', count: counts.notUploaded, color: donutColors.notUploaded },
        ]}
        footer={
          <div className="mt-4 border-t border-alabaster-150 pt-4">
            <p className="text-[20px] font-semibold text-primary">
              {counts.mandatoryUploaded} / {counts.mandatoryTotal}
            </p>
            <p className="text-[13px] text-neutral-500">
              {t('cab.applicationDraft.documents.completion.mandatorySummary', {
                uploaded: counts.mandatoryUploaded,
                total: counts.mandatoryTotal,
              })}
            </p>
          </div>
        }
      />

      <div className="rounded-[var(--radius-md)] border border-alabaster-150 bg-white p-5">
        <h3 className="mb-3 text-[16px] font-semibold text-neutral-900">
          {t('cab.applicationDraft.documents.guidelines.title')}
        </h3>
        <ul className="space-y-2.5 text-[13px] text-neutral-600">
          {['item1', 'item2', 'item3', 'item4'].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <AppIcon icon={SuccessCircleIcon} size={16} className="mt-0.5 shrink-0 text-success-600" />
              <span>{t(`cab.applicationDraft.documents.guidelines.${item}`)}</span>
            </li>
          ))}
        </ul>
      </div>

      <NeedHelpCard
        title={t('cab.applicationDraft.documents.needHelp.title')}
        description={t('cab.applicationDraft.documents.needHelp.description')}
        contactSupportLabel={t('cab.applicationDraft.documents.needHelp.contactSupport')}
      />
    </aside>
  )
}

function CategoryGroup({
  category,
  documents,
  startIndex,
  docLabel,
  docNote,
  onView,
  onUpload,
  onRemove,
}: {
  category: DocumentCategory
  documents: DocumentRecord[]
  startIndex: number
  docLabel: (doc: DocumentRecord) => string
  docNote: (doc: DocumentRecord) => string
  onView: (doc: DocumentRecord) => void
  onUpload: (id: string) => void
  onRemove: (id: string) => void
}) {
  const { t } = useTranslation()

  return (
    <>
      <tr className="border-t border-alabaster-150 bg-primary-25">
        <td colSpan={6} className="px-4 py-2 text-center text-[13px] font-semibold text-primary">
          {t(`cab.applicationDraft.documents.categories.${category}`)}
        </td>
      </tr>
      {documents.map((doc, index) => (
        <tr key={doc.id} className={cn((startIndex + index) % 2 === 1 ? 'bg-neutral-25' : 'bg-white')}>
          <td className="px-4 py-4 text-[14px] text-neutral-500">{startIndex + index + 1}</td>
          <td className="px-4 py-4">
            <p className="text-[15px] font-medium text-neutral-900">{docLabel(doc)}</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">{docNote(doc)}</p>
          </td>
          <td className="px-4 py-4">
            <span
              className={cn(
                'inline-block rounded-[6px] px-2 py-0.5 text-[12px] font-medium',
                doc.requirement === 'mandatory' ? 'bg-primary-50 text-primary' : 'bg-neutral-50 text-neutral-600'
              )}
            >
              {t(`cab.applicationDraft.documents.requirement.${doc.requirement}`)}
            </span>
          </td>
          <td className="px-4 py-4">
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
                statusBadgeStyles[doc.status]
              )}
            >
              {t(`cab.applicationDraft.documents.status.${doc.status}`)}
            </span>
          </td>
          <td className="px-4 py-4 text-[13px] text-neutral-700">
            {doc.fileName ? (
              <>
                <p className="font-medium text-neutral-900">{doc.fileName}</p>
                <p className="text-neutral-500">{doc.uploadedDate}</p>
              </>
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              {doc.status === 'uploaded' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onView(doc)}
                    className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-alabaster-150 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-primary"
                    aria-label={t('common.view')}
                  >
                    <AppIcon icon={EyeIcon} size={18} />
                  </button>
                  <a
                    href={doc.fileUrl}
                    download={doc.fileName}
                    target="_blank"
                    rel="noopener"
                    className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-alabaster-150 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-primary"
                    aria-label={t('common.download')}
                  >
                    <AppIcon icon={DownloadIcon} size={18} />
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemove(doc.id)}
                    className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-alabaster-150 bg-white text-error-400 hover:bg-neutral-50 hover:text-error-600"
                    aria-label={t('common.delete')}
                  >
                    <AppIcon icon={TrashIcon} size={18} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpload(doc.id)}
                  className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-alabaster-150 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-primary"
                  aria-label={t('cab.applicationDraft.documents.uploadDocument')}
                >
                  <AppIcon icon={UploadOutlineIcon} size={18} />
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}