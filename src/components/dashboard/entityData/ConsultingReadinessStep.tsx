import { useTranslation } from 'react-i18next'
import {
  FormField,
  FormSection,
  RadioGroup,
  RatingScale,
  SearchableSelect,
  TextField,
  fieldTextClassName,
} from '@/components/ui'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import type { YesNo } from '@/components/dashboard/entityData/applicationTypes'
import { formatFileSize } from '@/lib/files'
import { LANGUAGE_OPTIONS } from '@/lib/languages'
import { cn } from '@/lib/utils'

export function ConsultingReadinessStep() {
  const { t } = useTranslation()
  const { form, update, uploadDocument, removeDocument, uploading } = useApplicationForm()

  const consultantCvFiles: UploadedDocumentFile[] = form.documents
    .filter((doc) => doc.slotId === 'consultantCv')
    .map((doc) => ({
      id: doc.localId,
      name: doc.originalName || doc.fileName,
      sizeLabel: formatFileSize(doc.fileSize),
      url: doc.fileUrl,
    }))

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  const languageOptions = LANGUAGE_OPTIONS.map((lang) => ({
    value: lang.code,
    label: lang.name,
  }))

  const isoSystemOptions = [
    { value: 'iso9001', label: 'ISO 9001' },
    { value: 'iso14001', label: 'ISO 14001' },
    { value: 'iso45001', label: 'ISO 45001' },
    { value: 'iso22000', label: 'ISO 22000' },
  ]

  return (
    <div className="flex-1 space-y-5">
      <DashboardTourStep stepId="consulting-readiness-consultation">
        <SectionHeading title={t('accreditation.entityData.fields.consulting.title')} accordion>
        <FormSection>
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.consulting.qualifiedByConsultant')}
              variant="question"
            >
              <RadioGroup
                name="qualifiedByConsultant"
                value={form.usedConsultant}
                onChange={(v) => {
                  update('usedConsultant', v as YesNo)
                  // The consultant name only applies when the answer is "yes"
                  if (v === 'no') update('consultantName', '')
                }}
                options={yesNoOptions}
              />
            </FormField>

            {form.usedConsultant === 'yes' && (
              <FormField
                label={t('accreditation.entityData.fields.consulting.consultantName')}
                required
                variant="question"
              >
                <TextField
                  type="text"
                  value={form.consultantName}
                  onChange={(e) => update('consultantName', e.target.value)}
                />
              </FormField>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.consulting.cvAttached')}
              variant="question"
            >
              <RadioGroup
                name="cvAttached"
                value={form.consultantCvAttached}
                onChange={(v) => update('consultantCvAttached', v as YesNo)}
                options={yesNoOptions}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.consulting.consultationPeriod')}
              variant="question"
            >
              <TextField
                type="number"
                min={1}
                value={form.consultancyMonths}
                onChange={(e) => update('consultancyMonths', e.target.value)}
              />
            </FormField>
          </div>

          {form.consultantCvAttached === 'yes' && (
            <DocumentUploadField
              title={t('accreditation.entityData.fields.consulting.consultantCvUpload')}
              files={consultantCvFiles}
              busy={uploading}
              onSelectFile={(file) => void uploadDocument('consultantCv', file)}
              onDeleteFile={(fileId) => void removeDocument(fileId)}
              onOpenFile={(file) => file.url && window.open(file.url, '_blank', 'noopener')}
            />
          )}

          <FormField
            label={t('accreditation.entityData.fields.consulting.consultantRating')}
            variant="question"
          >
            <RatingScale
              value={form.qualificationRate}
              onChange={(value) => update('qualificationRate', value)}
            />
            <p className="text-body-3 text-primary">
              {t('accreditation.entityData.fields.consulting.ratingNote')}
            </p>
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.consulting.recommendationRating')}
            variant="question"
          >
            <RatingScale
              value={form.recommendationRate}
              onChange={(value) => update('recommendationRate', value)}
            />
            <p className="text-body-3 text-primary">
              {t('accreditation.entityData.fields.consulting.ratingNote')}
            </p>
          </FormField>
        </FormSection>
      </SectionHeading>
      </DashboardTourStep>

      <DashboardTourStep stepId="consulting-readiness-management-system">
      <div className="space-y-5">
      <SectionHeading title={t('accreditation.entityData.fields.readiness.title')} accordion>
        <FormSection>
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.readiness.systemLanguage')}
              variant="question"
            >
              <SearchableSelect
                value={form.systemLanguage}
                onChange={(v) => update('systemLanguage', v)}
                options={languageOptions}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.readiness.easySiteAccess')}
              variant="question"
            >
              <RadioGroup
                name="easySiteAccess"
                value={form.easyAccess}
                onChange={(v) => update('easyAccess', v as YesNo)}
                options={yesNoOptions}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.readiness.safetyProcedures')}
              variant="question"
            >
              <RadioGroup
                name="safetyProcedures"
                value={form.safetyProcedures}
                onChange={(v) => update('safetyProcedures', v as YesNo)}
                options={yesNoOptions}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.readiness.subcontracting')}
              variant="question"
            >
              <RadioGroup
                name="subcontracting"
                value={form.usesSubcontractors}
                onChange={(v) => update('usesSubcontractors', v as YesNo)}
                options={yesNoOptions}
              />
            </FormField>
          </div>

          <FormField
            label={t('accreditation.entityData.fields.readiness.previousGrants')}
            variant="question"
            className="max-w-2xl"
          >
            <RadioGroup
              name="previousGrants"
              value={form.previousGrants}
              onChange={(v) => update('previousGrants', v as YesNo)}
              options={yesNoOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.readiness.otherManagementSystems')}
            variant="question"
          >
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
              {isoSystemOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-2',
                    form.otherSystemSelected ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                  )}
                >
                  <Checkbox
                    checked={form.currentSystems.includes(opt.value)}
                    disabled={form.otherSystemSelected}
                    onChange={() =>
                      update(
                        'currentSystems',
                        form.currentSystems.includes(opt.value)
                          ? form.currentSystems.filter((v) => v !== opt.value)
                          : [...form.currentSystems, opt.value]
                      )
                    }
                  />
                  <span className={cn(fieldTextClassName, 'text-neutral-700')}>{opt.label}</span>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={form.otherSystemSelected}
                  onChange={() => {
                    if (!form.otherSystemSelected) update('currentSystems', [])
                    else update('otherSpecification', '')
                    update('otherSystemSelected', !form.otherSystemSelected)
                  }}
                />
                <span className={cn(fieldTextClassName, 'text-neutral-700')}>
                  {t('accreditation.entityData.fields.readiness.other')}
                </span>
              </label>
            </div>
          </FormField>

          {form.otherSystemSelected && (
            <FormField label={t('accreditation.entityData.fields.readiness.otherSpecification')}>
              <TextField
                type="text"
                value={form.otherSpecification}
                onChange={(e) => update('otherSpecification', e.target.value)}
              />
            </FormField>
          )}
        </FormSection>
      </SectionHeading>

      <SectionHeading title={t('accreditation.entityData.fields.readiness.title')} accordion>
        <FormSection>
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.readiness.designActivity')}
              required
              variant="question"
            >
              <RadioGroup
                name="designActivity"
                value={form.designActivity}
                onChange={(v) => {
                  update('designActivity', v as YesNo)
                  // The exception reason only applies when the answer is "no"
                  if (v === 'yes') update('designException', '')
                }}
                options={yesNoOptions}
              />
            </FormField>

            {form.designActivity === 'no' && (
              <FormField
                label={t('accreditation.entityData.fields.readiness.designExceptionReason')}
                required
              >
                <TextField
                  type="text"
                  value={form.designException}
                  onChange={(e) => update('designException', e.target.value)}
                />
              </FormField>
            )}
          </div>
        </FormSection>
      </SectionHeading>
      </div>
      </DashboardTourStep>
    </div>
  )
}