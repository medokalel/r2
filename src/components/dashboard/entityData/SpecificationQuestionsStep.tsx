import { useTranslation } from 'react-i18next'
import {
  FormField,
  FormSection,
  RadioGroup,
  Textarea,
  TextField,
} from '@/components/ui'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { DatePicker } from '@/components/ui/DatePicker'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import {
  SPEC_QUESTIONS,
  isSpecQuestionVisible,
  type SpecQuestionDef,
} from '@/components/dashboard/entityData/applicationTypes'
import type { StandardKey } from '@/components/dashboard/entityData/fieldTypes'

/** Display order and section titles of the question groups. */
const SECTION_ORDER: { standard: string; title: string }[] = [
  { standard: 'iso9001', title: 'ISO 9001:2015' },
  { standard: 'iso14001', title: 'ISO 14001:2026' },
  { standard: 'iso45001', title: 'ISO 45001:2018' },
  { standard: 'iso50001', title: 'ISO 50001:2022' },
  { standard: 'iso22000', title: 'ISO 22000:2022' },
  { standard: 'iso22301', title: 'ISO 22301:2019' },
  { standard: 'iso27001', title: 'ISO/IEC 27001:2022' },
  { standard: 'iso13485', title: 'ISO 13485:2016' },
]

function SpecQuestionField({ question }: { question: SpecQuestionDef }) {
  const { t } = useTranslation()
  const { form, setSpecAnswer } = useApplicationForm()

  const label = t(`accreditation.entityData.fields.spec.${question.labelKey}`)
  const raw = form.specAnswers[question.questionKey] ?? ''

  if (question.questionType === 'BOOLEAN') {
    const yesNoOptions = [
      { value: 'yes', label: t('accreditation.form.yes') },
      { value: 'no', label: t('accreditation.form.no') },
    ]
    return (
      <FormField label={label} required variant="question">
        <RadioGroup
          name={question.questionKey}
          value={raw}
          onChange={(v) => setSpecAnswer(question.questionKey, v)}
          options={yesNoOptions}
        />
      </FormField>
    )
  }

  if (question.questionType === 'DATE') {
    const date = raw ? new Date(raw) : undefined
    const value = date && !Number.isNaN(date.getTime()) ? date : undefined
    return (
      <FormField label={label} required variant="question">
        <DatePicker
          value={value}
          onChange={(next) => setSpecAnswer(question.questionKey, next.toISOString())}
          placeholder=""
        />
      </FormField>
    )
  }

  if (question.questionType === 'NUMBER') {
    return (
      <FormField label={label} required variant="question">
        <TextField
          type="number"
          min={0}
          value={raw}
          onChange={(e) => setSpecAnswer(question.questionKey, e.target.value)}
        />
      </FormField>
    )
  }

  return (
    <FormField label={label} required variant="question" className="lg:col-span-2">
      <Textarea
        value={raw}
        onChange={(e) => setSpecAnswer(question.questionKey, e.target.value)}
      />
    </FormField>
  )
}

export function SpecificationQuestionsStep() {
  const { t } = useTranslation()
  const { form } = useApplicationForm()

  // Only the question groups of the certificates picked in "Required Standard
  // Specification" are shown
  const sections = SECTION_ORDER.filter(({ standard }) =>
    form.selectedStandards.includes(standard as StandardKey)
  )
    .map(({ standard, title }) => ({
      title,
      questions: SPEC_QUESTIONS.filter(
        (question) =>
          question.certificateCode === standard.toUpperCase() &&
          isSpecQuestionVisible(question, form.specAnswers)
      ),
    }))
    .filter((section) => section.questions.length > 0)

  return (
    <DashboardTourStep stepId="specification-questions">
      <div className="flex-1 space-y-5">
        {sections.length === 0 && (
          <p className="rounded-md bg-neutral-50 p-5 text-body-2 text-neutral-700">
            {t('accreditation.entityData.fields.spec.noQuestions')}
          </p>
        )}

        {sections.map((section) => (
          <div key={section.title} className="space-y-5">
            <SectionHeading title={section.title} />
            <FormSection>
              <div className="grid gap-5 lg:grid-cols-2">
                {section.questions.map((question) => (
                  <SpecQuestionField key={question.questionKey} question={question} />
                ))}
              </div>
            </FormSection>
          </div>
        ))}
      </div>
    </DashboardTourStep>
  )
}