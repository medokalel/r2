import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { AppIcon, AttachIcon, BoldIcon, ExternalLinkIcon, LinkIcon, UserIcon } from '@/components/icons'
import { ErrorState, SelectField, fieldTitleClassName } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import { ApiError } from '@/lib/api/client'
import {
  listInformationRequired,
  submitInformationRequiredResponse,
  uploadApplicationDocument,
  type InformationRequiredItem,
} from '@/lib/api/certificationApplicationApi'
import { getAuthSession } from '@/lib/authStorage'
import { cn } from '@/lib/utils'

type MessageAuthor = 'reviewer' | 'applicant'

interface FeedbackMessage {
  id: string
  author: MessageAuthor
  name: string
  role: string
  timestamp: string
  text: string
  attachments?: string[]
  showCommentLink?: boolean
}

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/
const BOLD_RE = /\*\*([^*]+)\*\*/

/** Renders **bold** and [text](url) markdown inline for message bodies. */
function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = text
  let key = 0
  while (rest.length > 0) {
    const link = rest.match(LINK_RE)
    const bold = rest.match(BOLD_RE)
    const linkAt = link ? link.index! : Infinity
    const boldAt = bold ? bold.index! : Infinity
    if (linkAt === Infinity && boldAt === Infinity) {
      nodes.push(rest)
      break
    }
    if (linkAt < boldAt) {
      if (linkAt > 0) nodes.push(rest.slice(0, linkAt))
      // Message text now comes from the server, so only http(s) links become anchors
      nodes.push(
        /^https?:\/\//i.test(link![2]) ? (
          <a
            key={key++}
            href={link![2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {link![1]}
          </a>
        ) : (
          link![0]
        )
      )
      rest = rest.slice(linkAt + link![0].length)
    } else {
      if (boldAt > 0) nodes.push(rest.slice(0, boldAt))
      nodes.push(
        <strong key={key++} className="font-semibold">
          {bold![1]}
        </strong>
      )
      rest = rest.slice(boldAt + bold![0].length)
    }
  }
  return nodes
}

function TimelineDot({ variant }: { variant: 'primary' | 'muted' }) {
  return (
    <span
      className={cn(
        'mt-1 size-6 shrink-0 rounded-full border-4 border-white shadow-sm',
        variant === 'primary' ? 'bg-primary' : 'bg-neutral-600'
      )}
      aria-hidden
    />
  )
}

function ComposerToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md p-2 text-neutral-700 hover:bg-white"
      aria-label={label}
    >
      {children}
    </button>
  )
}

function AttachmentChips({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="flex items-center gap-1.5 rounded-md border border-primary-100 bg-primary-25 px-2.5 py-1 text-body-sm text-neutral-800"
        >
          <AppIcon icon={AttachIcon} size={14} className="text-primary" />
          {name}
        </span>
      ))}
    </div>
  )
}

function MessageBubble({ message }: { message: FeedbackMessage }) {
  const { t } = useTranslation()
  const isReviewer = message.author === 'reviewer'

  return (
    <div className={cn('flex items-start gap-5', !isReviewer && 'justify-end')}>
      {isReviewer && <TimelineDot variant="primary" />}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-4 rounded-lg p-6',
          isReviewer
            ? 'border border-primary-100 bg-[rgba(232,237,252,0.5)]'
            : 'border border-neutral-500 bg-neutral-50'
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isReviewer ? (
              <UserAvatar
                alt={message.name}
                className="size-10 rounded-lg shadow-sm"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-600">
                <AppIcon icon={UserIcon} size={24} className="text-white" />
              </span>
            )}
            <div>
              <p className={cn(fieldTitleClassName, 'text-neutral-900')}>{message.name}</p>
              <p className={cn('text-caption leading-normal', isReviewer ? 'text-neutral-700' : 'text-neutral-600')}>
                {enumLabel(t, message.role)}
              </p>
            </div>
          </div>
          <time className={cn('text-body-sm leading-[1.6]', isReviewer ? 'text-neutral-700' : 'text-neutral-600')}>
            {message.timestamp}
          </time>
        </div>

        {message.text && (
          <p className="whitespace-pre-wrap text-body leading-[1.6] text-neutral-900">
            {renderRichText(message.text)}
          </p>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <AttachmentChips names={message.attachments} />
        )}

        {message.showCommentLink && (
          <Button
            type="button"
            variant="primary"
            className="h-12 w-fit gap-2 rounded-md px-6 text-body-sm font-semibold"
          >
            {t('accreditation.entityData.feedback.goToCommentReview')}
            <AppIcon icon={ExternalLinkIcon} size={14} className="text-white" />
          </Button>
        )}
      </div>
      {!isReviewer && <TimelineDot variant="muted" />}
    </div>
  )
}

export function EntityDataFeedbackStep() {
  const { t, i18n } = useTranslation()
  const { applicationId, handleApiError } = useApplicationForm()
  const session = getAuthSession()
  const applicantName =
    session?.user?.email ?? t('accreditation.entityData.feedback.applicantName')
  const applicantRole = session?.role?.name ?? t('accreditation.entityData.feedback.applicantRole')
  const reviewerRole = t('accreditation.entityData.feedback.reviewerRole')

  const [reply, setReply] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [requests, setRequests] = useState<InformationRequiredItem[]>([])
  const [loading, setLoading] = useState(Boolean(applicationId))
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [targetId, setTargetId] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!applicationId) return
    let cancelled = false
    listInformationRequired(applicationId)
      .then((items) => {
        if (cancelled) return
        setRequests([...items].sort((a, b) => Date.parse(a.requestedOn) - Date.parse(b.requestedOn)))
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) handleApiError(error)
        else setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applicationId, reloadKey, handleApiError])

  // Replies go to the chosen request, else the oldest one still unanswered, else the latest
  const replyTo = requests.some((request) => request.id === targetId)
    ? targetId
    : (requests.find((request) => request.responses.length === 0) ?? requests[requests.length - 1])?.id ?? ''

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))

  const messages: FeedbackMessage[] = requests.flatMap((request) => [
    {
      id: request.id,
      author: 'reviewer' as const,
      name: request.requestedBy?.fullName ?? reviewerRole,
      role: reviewerRole,
      timestamp: formatDate(request.requestedOn),
      text: [
        request.informationItem,
        request.referenceClause &&
          t('accreditation.entityData.feedback.reference', { value: request.referenceClause }),
        request.dueDate &&
          t('accreditation.entityData.feedback.dueDate', {
            value: new Date(request.dueDate).toLocaleDateString(i18n.language, { timeZone: 'UTC' }),
          }),
      ]
        .filter(Boolean)
        .join('\n'),
    },
    ...[...request.responses]
      .sort((a, b) => Date.parse(a.submittedOn) - Date.parse(b.submittedOn))
      .map((response) => ({
        id: response.id,
        author: 'applicant' as const,
        name: response.submittedBy?.fullName ?? applicantName,
        role: applicantRole,
        timestamp: formatDate(response.submittedOn),
        text: response.response ?? '',
        attachments: response.attachments.length
          ? response.attachments.map((file) => file.originalName || file.fileName || file.fileUrl)
          : undefined,
      })),
  ])

  /** Wraps the current selection (or inserts a placeholder) with markers. */
  const surroundSelection = (before: string, after: string, placeholder: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = reply.slice(start, end) || placeholder
    const next = reply.slice(0, start) + before + selected + after + reply.slice(end)
    setReply(next)
    requestAnimationFrame(() => {
      el.focus()
      const caret = start + before.length + selected.length
      el.setSelectionRange(caret, caret)
    })
  }

  const applyBold = () => surroundSelection('**', '**', t('accreditation.entityData.feedback.boldPlaceholder'))

  const insertLink = () => {
    const url = window.prompt(t('accreditation.entityData.feedback.linkPrompt'))
    if (!url) return
    const el = textareaRef.current
    const selected =
      el && el.selectionStart !== el.selectionEnd
        ? reply.slice(el.selectionStart, el.selectionEnd)
        : t('accreditation.entityData.feedback.linkText')
    surroundSelection(`[${selected}](`, ')', url)
  }

  const onSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    if (selected.length) setFiles((prev) => [...prev, ...selected])
    event.target.value = ''
  }

  const canSend = !sending && Boolean(applicationId && replyTo) && (reply.trim().length > 0 || files.length > 0)

  const sendReply = async () => {
    if (!canSend || !applicationId) return
    setSending(true)
    try {
      const attachments = await Promise.all(
        files.map(async (file) => {
          const uploaded = await uploadApplicationDocument(file)
          return {
            fileUrl: uploaded.fileUrl,
            fileName: uploaded.fileName,
            originalName: file.name,
            mimeType: uploaded.mimeType,
            fileSize: uploaded.sizeBytes,
          }
        })
      )
      await submitInformationRequiredResponse(applicationId, replyTo, {
        response: reply.trim() || null,
        attachments: attachments.length ? attachments : undefined,
      })
      setReply('')
      setFiles([])
      setReloadKey((key) => key + 1)
    } catch (error) {
      handleApiError(error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="rounded-lg border border-neutral-100 bg-white p-6">
      {loading ? (
        <p className="text-center text-body-sm text-neutral-600">
          {t('accreditation.entityData.feedback.loading')}
        </p>
      ) : loadError ? (
        <ErrorState
          onRetry={() => {
            setLoadError(false)
            setLoading(true)
            setReloadKey((key) => key + 1)
          }}
        />
      ) : requests.length === 0 ? (
        <p className="text-center text-body-sm text-neutral-600">
          {t('accreditation.entityData.feedback.noFeedback')}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="mb-3 text-body font-semibold text-neutral-900">
              {t('accreditation.entityData.feedback.requestedTitle')}
            </h3>
            <ul className="flex flex-col gap-3">
              {requests.map((request) => (
                <li
                  key={`request-${request.id}`}
                  className="rounded-lg border border-primary-100 bg-[rgba(232,237,252,0.5)] p-4"
                >
                  <p className="whitespace-pre-wrap text-body leading-[1.6] text-neutral-900">
                    {request.informationItem}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-neutral-700">
                    {request.referenceClause ? (
                      <span>{t('accreditation.entityData.feedback.reference', { value: request.referenceClause })}</span>
                    ) : null}
                    {request.dueDate ? (
                      <span>
                        {t('accreditation.entityData.feedback.dueDate', {
                          value: new Date(request.dueDate).toLocaleDateString(i18n.language, { timeZone: 'UTC' }),
                        })}
                      </span>
                    ) : null}
                    {request.priority ? <span>{request.priority}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {messages
            .filter((message) => message.author === 'applicant')
            .map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
        </div>
      )}
    </div>

      <div className="rounded-lg border border-neutral-100 bg-white p-4 shadow-card">
        {requests.length > 1 && (
          <div className="mb-3">
            <SelectField
              label={t('accreditation.entityData.feedback.replyTo')}
              value={replyTo}
              onChange={setTargetId}
              options={requests.map((request, index) => ({
                value: request.id,
                label: `${index + 1}. ${request.informationItem.slice(0, 80)}`,
              }))}
            />
          </div>
        )}
        <div className="rounded-lg bg-neutral-50 p-2">
          <textarea
            ref={textareaRef}
            value={reply}
            disabled={!replyTo || sending}
            onChange={(event) => setReply(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                sendReply()
              }
            }}
            className="min-h-24 w-full resize-none rounded-lg border-0 bg-transparent p-4 text-body leading-[1.6] text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
          />

          {files.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <span
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-1.5 rounded-md border border-primary-100 bg-white px-2.5 py-1 text-body-sm text-neutral-800"
                  >
                    <AppIcon icon={AttachIcon} size={14} className="text-primary" />
                    {file.name}
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                      className="text-neutral-500 hover:text-error-500"
                      aria-label={t('accreditation.entityData.feedback.removeAttachment')}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-400 px-4 pb-4 pt-4">
            <div className="flex items-center gap-4">
              <ComposerToolbarButton label={t('accreditation.entityData.feedback.bold')} onClick={applyBold}>
                <AppIcon icon={BoldIcon} size={20} />
              </ComposerToolbarButton>
              <span className="h-6 w-px bg-neutral-400" aria-hidden />
              <ComposerToolbarButton label={t('accreditation.entityData.feedback.insertLink')} onClick={insertLink}>
                <AppIcon icon={LinkIcon} size={20} />
              </ComposerToolbarButton>
              <span className="h-6 w-px bg-neutral-400" aria-hidden />
              <ComposerToolbarButton
                label={t('accreditation.entityData.feedback.attach')}
                onClick={() => fileInputRef.current?.click()}
              >
                <AppIcon icon={AttachIcon} size={20} />
              </ComposerToolbarButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onSelectFiles}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={sendReply}
              disabled={!canSend}
              className="h-12 rounded-md px-6 text-body font-semibold"
            >
              {sending ? t('accreditation.entityData.feedback.sending') : t('accreditation.entityData.feedback.sendReply')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
