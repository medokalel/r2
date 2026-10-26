import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { fieldLabelClassName } from '@/components/ui/fieldStyles'
import { CriticalCodeExamModal } from '@/components/dashboard/cab/CriticalCodeExamModal'
import type { CompetenceMatrix } from '@/lib/api/competenceMatrixApi'
import { iafDigits, isCriticalIafCode } from '@/lib/criticalCodeExams'
import { getIafCodeOptions } from '@/lib/iafCodes'
import { notSet } from '@/lib/emptyValue'

interface SchemeCompetenceEditorProps {
  schemes: string[]
  schemeOptions: { value: string; label: string }[]
  onSchemesChange: (schemes: string[]) => void
  matrix: CompetenceMatrix
  onMatrixChange: (matrix: CompetenceMatrix) => void
  /** Rendered under the standards picker (e.g. the "configure schemes" hint). */
  schemesHint?: React.ReactNode
}

/**
 * Competence by standard: pick the standards, then the IAF codes for each one.
 * Picking a critical code opens its MCQ exam; the code is added only after a pass.
 */
export function SchemeCompetenceEditor({
  schemes,
  schemeOptions,
  onSchemesChange,
  matrix,
  onMatrixChange,
  schemesHint,
}: SchemeCompetenceEditorProps) {
  const { t, i18n } = useTranslation()
  const [exam, setExam] = useState<{ scheme: string; code: string } | null>(null)

  const criticalLabel = t('cab.competence.exam.criticalShort', 'critical, exam required')
  const codeOptions = useMemo(
    () =>
      getIafCodeOptions(i18n.language).map((option) =>
        isCriticalIafCode(option.value) ? { ...option, label: `${option.label} · ${criticalLabel}` } : option
      ),
    [i18n.language, criticalLabel]
  )

  const passedExam = (scheme: string, code: string) =>
    matrix.exams.find((e) => e.scheme === scheme && e.code === iafDigits(code) && e.passed)

  const setCodes = (scheme: string, codes: string[]) =>
    onMatrixChange({ ...matrix, schemeIafCodes: { ...matrix.schemeIafCodes, [scheme]: codes } })

  const handleCodesChange = (scheme: string, next: string[]) => {
    const current = matrix.schemeIafCodes[scheme] ?? []
    const added = next.filter((code) => !current.includes(code))
    const blocked = added.filter((code) => isCriticalIafCode(code) && !passedExam(scheme, code))
    // Critical codes that are not yet passed wait for their exam; everything else applies now.
    setCodes(scheme, next.filter((code) => !blocked.includes(code)))
    if (blocked.length) setExam({ scheme, code: blocked[0] })
  }

  const handleSchemesChange = (next: string[]) => {
    const schemeIafCodes = Object.fromEntries(next.map((s) => [s, matrix.schemeIafCodes[s] ?? []]))
    onMatrixChange({ ...matrix, schemeIafCodes })
    onSchemesChange(next)
  }

  const recordExam = (score: number, passed: boolean) => {
    if (!exam) return
    const entry = { code: iafDigits(exam.code), scheme: exam.scheme, score, passed, takenAt: new Date().toISOString() }
    const exams = [...matrix.exams, entry]
    const schemeIafCodes = passed
      ? {
          ...matrix.schemeIafCodes,
          [exam.scheme]: Array.from(new Set([...(matrix.schemeIafCodes[exam.scheme] ?? []), exam.code])),
        }
      : matrix.schemeIafCodes
    onMatrixChange({ schemeIafCodes, exams })
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className={`mb-1 ${fieldLabelClassName}`}>{t('cab.competence.byStandard.standards', 'Standards')}</legend>
        <MultiSelect
          tags={schemes}
          options={schemeOptions}
          searchable
          onChange={handleSchemesChange}
          placeholder={t('cab.competence.byStandard.pickStandards', 'Choose the standards this person works on')}
        />
        {schemesHint}
      </fieldset>

      {schemes.length === 0 ? (
        <p className="rounded-md bg-neutral-25 px-4 py-3 text-body-3 text-text-secondary">
          {t('cab.competence.byStandard.empty', 'Choose a standard first; its IAF codes appear here.')}
        </p>
      ) : (
        schemes.map((scheme) => {
          const codes = matrix.schemeIafCodes[scheme] ?? []
          const passedHere = codes.filter((code) => isCriticalIafCode(code)).map((code) => ({ code, exam: passedExam(scheme, code) }))
          return (
            <section key={scheme} className="rounded-lg border border-neutral-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-body-2-semibold text-primary">{scheme}</h4>
                <span className="rounded-full bg-primary-25 px-2.5 py-0.5 text-caption font-medium text-primary tabular-nums">
                  {t('cab.competence.byStandard.codeCount', { count: codes.length, defaultValue: '{{count}} codes' })}
                </span>
              </div>
              <span className={`mb-1 block ${fieldLabelClassName}`}>{t('cab.competence.byStandard.iafCodes', 'IAF codes for this standard')}</span>
              <MultiSelect
                tags={codes}
                options={codeOptions}
                searchable
                onChange={(next) => handleCodesChange(scheme, next)}
                placeholder={t('cab.competence.byStandard.pickCodes', 'Choose the IAF codes')}
              />
              {passedHere.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {passedHere.map(({ code, exam: result }) => (
                    <li key={code} className="rounded-sm bg-success-50 px-2 py-0.5 text-caption font-medium text-success-700">
                      {t('cab.competence.byStandard.examPassed', {
                        code: iafDigits(code),
                        score: result ? `${Math.round(result.score * 100)}%` : notSet(),
                        defaultValue: 'IAF {{code}} exam passed ({{score}})',
                      })}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })
      )}

      <CriticalCodeExamModal
        code={exam?.code ?? null}
        scheme={exam?.scheme ?? ''}
        onClose={() => setExam(null)}
        onFailed={(score) => recordExam(score, false)}
        onPassed={(score) => {
          recordExam(score, true)
          setExam(null)
        }}
      />
    </div>
  )
}
