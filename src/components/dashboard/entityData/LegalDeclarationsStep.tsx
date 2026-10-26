import { useTranslation } from 'react-i18next'
import {
  FormField,
  FormSection,
  RequiredMark,
  TextField,
  fieldBodyTextClassName,
  fieldLabelClassName,
} from '@/components/ui'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { Checkbox } from '@/components/ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { SignaturePad } from '@/components/ui/SignaturePad'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import { cn } from '@/lib/utils'

/** Name of the granting certification body (the demo CAB tenant) shown in the declaration letter. */
const CB_NAME = 'CASCO'

const AR_BOLD_PHRASES = ['اسم الجهة', 'اسم المواصفة', 'جهة المنح']

function boldPlaceholders(text: string, replacements: Record<string, string>) {
  return text
    .split(new RegExp(`(\\[.*?\\]|${AR_BOLD_PHRASES.join('|')})`, 'g'))
    .map((part, i) =>
      /^\[.*\]$/.test(part) || AR_BOLD_PHRASES.includes(part) ? (
        <span key={i} className="font-semibold">
          {replacements[part] || part}
        </span>
      ) : (
        part
      )
    )
}

export function LegalDeclarationsStep() {
  const { t, i18n } = useTranslation()
  const { form, update } = useApplicationForm()

  const standardNames = form.selectedStandards
    .map((standard) => t(`accreditation.entityData.field.standards.${standard}`))
    .join(i18n.dir() === 'rtl' ? '، ' : ', ')

  // The bold placeholder phrases render the real application data once known
  const replacements: Record<string, string> = {
    'اسم الجهة': form.organizationName,
    '[Name of the Entity]': form.organizationName,
    'اسم المواصفة': standardNames,
    '[Name of the Standard]': standardNames,
    'جهة المنح': CB_NAME,
    '[CB Name]': CB_NAME,
  }

  return (
    <div className="flex-1 space-y-5">
      {/* Section 1 */}
      <DashboardTourStep stepId="legal-declarations-letter">
        <SectionHeading title={t('accreditation.entityData.fields.legal.sectionOneTitle')} accordion>
        <FormSection>
          <div className="space-y-5 rounded-md bg-white p-5 text-neutral-900">
            <p className={cn(fieldBodyTextClassName, 'field-text')}>{boldPlaceholders(t('accreditation.entityData.fields.legal.greeting'), replacements)}</p>
            <p className={cn(fieldBodyTextClassName, 'field-text whitespace-pre-wrap')}>
              {boldPlaceholders(t('accreditation.entityData.fields.legal.applicationBody'), replacements)}
            </p>
            <p className={cn(fieldBodyTextClassName, 'field-text')}>{t('accreditation.entityData.fields.legal.closing')}</p>

            <div className="grid gap-5 pt-2 lg:grid-cols-2">
              <FormField
                label={t('accreditation.entityData.fields.legal.authorizedSignatory')}
                required
                variant="question"
              >
                <TextField
                  type="text"
                  value={form.signatoryName}
                  onChange={(e) => update('signatoryName', e.target.value)}
                />
              </FormField>

              <FormField label={t('accreditation.entityData.fields.legal.date')} required variant="question">
                <DatePicker
                  value={form.declarationDate}
                  onChange={(date) => update('declarationDate', date)}
                  placeholder=""
                />
              </FormField>
            </div>

            <FormField label={t('accreditation.entityData.fields.legal.signature', 'Signature')} required variant="question">
              <SignaturePad
                value={form.signature}
                onChange={(dataUrl) => update('signature', dataUrl)}
                signerName={form.signatoryName}
                caption={[form.signatoryName, form.declarationDate ? form.declarationDate.toLocaleDateString(i18n.language) : '']
                  .filter(Boolean)
                  .join(' · ')}
              />
            </FormField>
          </div>
        </FormSection>
      </SectionHeading>
      </DashboardTourStep>

      {/* Section 2 */}
      <DashboardTourStep stepId="legal-declarations-confidentiality">
        <SectionHeading title={t('accreditation.entityData.fields.legal.sectionTwoTitle')} accordion>
        <FormSection>
          <div className="rounded-md bg-white p-5 text-neutral-800">
            <p className={cn(fieldBodyTextClassName, 'field-text mb-4')}>{boldPlaceholders(t('accreditation.entityData.fields.legal.confidentialityIntro'), replacements)}</p>
            <ul className="space-y-2 ps-2">
              {[
                t('accreditation.entityData.fields.legal.confidentialityItem1'),
                t('accreditation.entityData.fields.legal.confidentialityItem2'),
                t('accreditation.entityData.fields.legal.confidentialityItem3'),
              ].map((item, i) => (
                <li key={i} className={cn(fieldBodyTextClassName, 'field-text flex gap-2')}>
                  <span className="mt-1 shrink-0">•</span>
                  <span>{boldPlaceholders(item, replacements)}</span>
                </li>
              ))}
            </ul>
          </div>
        </FormSection>
      </SectionHeading>
      </DashboardTourStep>

      {/* Certificate Data */}
      <DashboardTourStep stepId="legal-declarations-certificate-data">
        <SectionHeading title={t('accreditation.entityData.fields.legal.certificateDataTitle')} accordion>
        <FormSection>
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.legal.certificateNameAr')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateNameAr}
                onChange={(e) => update('certificateNameAr', e.target.value)}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.legal.certificateNameEn')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateNameEn}
                onChange={(e) => update('certificateNameEn', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.legal.certificateAddressAr')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateAddressAr}
                onChange={(e) => update('certificateAddressAr', e.target.value)}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.legal.certificateAddressEn')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateAddressEn}
                onChange={(e) => update('certificateAddressEn', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.legal.certificateFieldAr')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateScopeAr}
                onChange={(e) => update('certificateScopeAr', e.target.value)}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.legal.certificateFieldEn')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateScopeEn}
                onChange={(e) => update('certificateScopeEn', e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>
      </SectionHeading>
      </DashboardTourStep>

      {/* Acknowledgement */}
      <div className="space-y-4 rounded-lg border border-neutral-100 bg-white p-6">
        <div className="rounded-md bg-error-50/30 px-4 py-3">
          <p className="field-text text-body-lg leading-[1.6] text-error-500">
            {t('accreditation.entityData.fields.legal.submissionWarning')}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2">
          <Checkbox
            checked={form.agreed}
            onChange={() => update('agreed', !form.agreed)}
            className="mt-1"
          />
          <span className={fieldLabelClassName}>
            {t('accreditation.entityData.fields.legal.acknowledgement')}
            <RequiredMark />
          </span>
        </label>
      </div>
    </div>
  )
}
