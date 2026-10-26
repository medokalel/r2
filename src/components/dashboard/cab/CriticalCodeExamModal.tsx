import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { EXAM_PASS_MARK, getExamQuestions, iafDigits } from '@/lib/criticalCodeExams'
import { resolveIafCodeSectorName } from '@/lib/iafCodes'
import { cn } from '@/lib/utils'

interface CriticalCodeExamModalProps {
  /** IAF code value, e.g. "IAF_28"; null keeps the modal closed. */
  code: string | null
  scheme: string
  onClose: () => void
  /** Called once with the score (0..1) when the exam is passed. */
  onPassed: (score: number) => void
  /** Called with the score each time the exam is submitted and failed. */
  onFailed?: (score: number) => void
}

/** Multiple-choice qualification exam for a critical IAF code (pass mark 80 %). */
export function CriticalCodeExamModal({ code, scheme, onClose, onPassed, onFailed }: CriticalCodeExamModalProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const questions = code ? getExamQuestions(code) : []
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  const reset = () => {
    setAnswers({})
    setResult(null)
  }
  const close = () => {
    reset()
    onClose()
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined)
  const submit = () => {
    const correct = questions.filter((q) => answers[q.id] === q.answer).length
    const score = questions.length ? correct / questions.length : 0
    const passed = score >= EXAM_PASS_MARK
    setResult({ score, passed })
    if (!passed) onFailed?.(score)
  }

  const digits = code ? iafDigits(code) : ''
  const sector = code ? resolveIafCodeSectorName(code, lang) : ''
  const pct = (v: number) => `${Math.round(v * 100)}%`

  return (
    <Dialog.Root open={code !== null} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(720px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          <div className="border-b border-neutral-100 p-5">
            <span className="inline-block rounded-sm bg-error-50 px-2 py-0.5 text-caption font-medium text-error-600">
              {t('cab.competence.exam.criticalBadge', 'Critical code')}
            </span>
            <Dialog.Title className="mt-2 text-h3-semi text-text-primary">
              {t('cab.competence.exam.title', { code: digits, defaultValue: 'Qualification exam: IAF {{code}}' })}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-body-3 text-text-secondary">
              {sector} · {scheme}
              <br />
              {t('cab.competence.exam.intro', {
                count: questions.length,
                pass: pct(EXAM_PASS_MARK),
                defaultValue: 'Answer all {{count}} questions. You need {{pass}} to pass; the code is added only after you pass.',
              })}
            </Dialog.Description>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {result ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span
                  className={cn(
                    'flex size-20 items-center justify-center rounded-full text-h3-semi',
                    result.passed ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-600'
                  )}
                >
                  {pct(result.score)}
                </span>
                <p className="text-body-1-semibold text-text-primary">
                  {result.passed
                    ? t('cab.competence.exam.passed', 'Passed. The code has been added.')
                    : t('cab.competence.exam.failed', 'Not passed. The code was not added.')}
                </p>
                {!result.passed && (
                  <p className="text-body-3 text-text-secondary">
                    {t('cab.competence.exam.failedHint', { pass: pct(EXAM_PASS_MARK), defaultValue: 'You need {{pass}}. Review the sector requirements and try again.' })}
                  </p>
                )}
              </div>
            ) : (
              <ol className="flex flex-col gap-5">
                {questions.map((question, index) => (
                  <li key={question.id}>
                    <fieldset>
                      <legend className="mb-2 text-body-2-medium text-text-primary">
                        {index + 1}. {question[lang].q}
                      </legend>
                      <div className="flex flex-col gap-2">
                        {question[lang].options.map((option, optionIndex) => {
                          const checked = answers[question.id] === optionIndex
                          return (
                            <label
                              key={optionIndex}
                              className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-colors',
                                checked ? 'border-primary bg-primary-25' : 'border-neutral-100 hover:border-primary/40'
                              )}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                checked={checked}
                                onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                                className="mt-1 accent-primary"
                              />
                              <span className="text-body-3 text-text-primary">{option}</span>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-100 p-5">
            {result ? (
              result.passed ? (
                <Button
                  type="button"
                  onClick={() => {
                    const score = result.score
                    reset()
                    onPassed(score)
                  }}
                >
                  {t('common.done', 'Done')}
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={close}>
                    {t('common.close', 'Close')}
                  </Button>
                  <Button type="button" onClick={reset}>
                    {t('cab.competence.exam.retry', 'Retake the exam')}
                  </Button>
                </>
              )
            ) : (
              <>
                <Button type="button" variant="outline" onClick={close}>
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={submit} disabled={!allAnswered}>
                  {t('cab.competence.exam.submit', 'Submit answers')}
                </Button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
