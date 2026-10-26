import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { AppIcon, ThumbDownIcon, ThumbUpIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { fieldTextareaClassName } from '@/components/ui/fieldStyles'
import { sendPageFeedback } from '@/lib/api/pageFeedbackApi'
import { cn } from '@/lib/utils'

/** "Was this page helpful?" at the end of every page: thumbs up/down, then an optional note. */
export function PageFeedback() {
  const location = useLocation()
  // Keyed by route so each page starts fresh.
  return <PageFeedbackInner key={location.pathname} route={location.pathname} />
}

function PageFeedbackInner({ route }: { route: string }) {
  const { t, i18n } = useTranslation()
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!rating) return
    setSending(true)
    try {
      await sendPageFeedback({
        route,
        rating,
        comment: comment.trim() || undefined,
        language: i18n.language,
        createdAt: new Date().toISOString(),
      })
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  const thumb = (value: 'up' | 'down') => (
    <button
      type="button"
      onClick={() => setRating(value)}
      aria-pressed={rating === value}
      aria-label={value === 'up' ? t('feedback.helpful', 'Helpful') : t('feedback.notHelpful', 'Not helpful')}
      title={value === 'up' ? t('feedback.helpful', 'Helpful') : t('feedback.notHelpful', 'Not helpful')}
      className={cn(
        'flex size-9 items-center justify-center rounded-md border transition-colors',
        rating === value
          ? 'border-primary bg-primary-25 text-primary'
          : 'border-neutral-100 bg-white text-neutral-700 hover:border-primary/40 hover:text-primary'
      )}
    >
      <AppIcon icon={value === 'up' ? ThumbUpIcon : ThumbDownIcon} size={18} variant={rating === value ? 'Bold' : 'Linear'} />
    </button>
  )

  return (
    <section
      aria-label={t('feedback.title', 'Page feedback')}
      className="mx-3 mb-6 mt-2 rounded-lg border border-neutral-100 bg-white px-4 py-3 sm:mx-5"
    >
      {sent ? (
        <p className="text-body-3 text-success-700" role="status">
          {t('feedback.thanks', 'Thanks for your feedback. It helps us improve iCASCO.')}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-body-3-medium text-text-secondary">{t('feedback.question', 'Was this page helpful?')}</p>
            <div className="flex gap-2">
              {thumb('up')}
              {thumb('down')}
            </div>
          </div>
          {rating && (
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-body-3 text-text-secondary">
                  {rating === 'down'
                    ? t('feedback.promptDown', 'What went wrong, or what should we improve?')
                    : t('feedback.promptUp', 'Anything we could make even better? (optional)')}
                </span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className={cn(fieldTextareaClassName, 'min-h-[88px]')}
                  placeholder={t('feedback.placeholder', 'Write your note here…')}
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="tertiary" onClick={() => setRating(null)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button type="button" onClick={submit} disabled={sending}>
                  {t('feedback.send', 'Send feedback')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
