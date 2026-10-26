import { useRef, useState } from 'react'
import { DatePicker } from '@/components/ui/DatePicker'
import { useTranslation } from 'react-i18next'
import { TrashIcon } from '@/components/icons'
import { AppIcon } from '@/components/icons'
import {
  FormField,
  FormSection,
  RadioGroup,
  SelectField,
  MultiSelect,
  TextField,
  Textarea,
} from '@/components/ui'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { getIafCodeOptions } from '@/lib/iafCodes'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import {
  type BranchFormValues,
  type YesNo,
} from '@/components/dashboard/entityData/applicationTypes'

const NEW_BRANCH_VALUE = '__new__'

function BranchForm({
  branch,
  onChange,
}: {
  branch: BranchFormValues
  onChange: (localId: number, patch: Partial<BranchFormValues>) => void
}) {
  const { t } = useTranslation()
  const { orgBranches, saveOrgBranch } = useApplicationForm()
  const [addingNew, setAddingNew] = useState(false)

  const selectOrgBranch = (id: string) => {
    if (id === NEW_BRANCH_VALUE) {
      setAddingNew(true)
      onChange(branch.localId, { sourceBranchId: undefined, branchName: '' })
      return
    }
    const source = orgBranches.find((orgBranch) => orgBranch.id === id)
    onChange(branch.localId, {
      sourceBranchId: id,
      branchName: source?.branchName ?? '',
      address: branch.address || source?.address || '',
    })
  }

  const showManualEntry = orgBranches.length === 0 || addingNew

  const handleBranchNameBlur = () => {
    if (!branch.sourceBranchId) void saveOrgBranch(branch.localId, branch.branchName, branch.address)
  }

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  const weeklyHolidayOptions = [
    t('accreditation.entityData.fields.scope.oneDay'),
    t('accreditation.entityData.fields.scope.twoDays'),
  ]

  return (
    <FormSection>
      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={t('accreditation.entityData.fields.scope.branchEmployees')}
          required
          variant="question"
        >
          <TextField
            type="number"
            min={0}
            value={branch.employees}
            onChange={(e) => onChange(branch.localId, { employees: e.target.value })}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.auditScopeEmployees')}
          required
          variant="question"
        >
          <TextField
            type="number"
            min={0}
            value={branch.employeesInScope}
            onChange={(e) => onChange(branch.localId, { employeesInScope: e.target.value })}
          />
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={t('accreditation.entityData.fields.scope.shiftCount')}
          required
          variant="question"
        >
          <TextField
            type="number"
            min={0}
            value={branch.shifts}
            onChange={(e) => onChange(branch.localId, { shifts: e.target.value })}
          />
        </FormField>

        <FormField label={t('accreditation.entityData.fields.scope.openingHours')} variant="question">
          <TextField
            type="number"
            min={0}
            value={branch.workingHours}
            onChange={(e) => onChange(branch.localId, { workingHours: e.target.value })}
          />
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField label={t('accreditation.entityData.fields.scope.weeklyVacation')} variant="question">
          <SelectField
            value={branch.weeklyHoliday}
            onChange={(value) => onChange(branch.localId, { weeklyHoliday: value })}
            options={weeklyHolidayOptions}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.productionLines')}
          variant="question"
        >
          <TextField
            type="number"
            min={0}
            value={branch.productionLines}
            onChange={(e) => onChange(branch.localId, { productionLines: e.target.value })}
          />
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={t('accreditation.entityData.fields.scope.firstPhaseDate')}
          required
          variant="question"
        >
          <DatePicker
            value={branch.phase1ExpectedDate}
            onChange={(date) => onChange(branch.localId, { phase1ExpectedDate: date })}
            placeholder=""
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.branchName')}
          required
          variant="question"
        >
          {!showManualEntry ? (
            <SelectField
              value={branch.sourceBranchId ?? ''}
              onChange={selectOrgBranch}
              options={[
                ...orgBranches.map((orgBranch) => ({
                  value: orgBranch.id,
                  label: orgBranch.branchName ?? orgBranch.id,
                })),
                {
                  value: NEW_BRANCH_VALUE,
                  label: t('accreditation.entityData.fields.scope.addNewBranchOption'),
                },
              ]}
            />
          ) : (
            <TextField
              type="text"
              value={branch.branchName}
              onChange={(e) => onChange(branch.localId, { branchName: e.target.value })}
              onBlur={handleBranchNameBlur}
            />
          )}
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={t('accreditation.entityData.fields.scope.branchAddress')}
          required
          variant="question"
        >
          <TextField
            type="text"
            value={branch.address}
            onChange={(e) => onChange(branch.localId, { address: e.target.value })}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.integratedSystem')}
          required
          variant="question"
        >
          <RadioGroup
            name={`integratedSystem-${branch.localId}`}
            value={branch.integratedSystem}
            onChange={(v) => onChange(branch.localId, { integratedSystem: v as YesNo })}
            options={yesNoOptions}
          />
        </FormField>
      </div>

      <FormField
        label={t('accreditation.entityData.fields.scope.centralAdministration')}
        required
        variant="question"
      >
        <RadioGroup
          name={`centralAdministration-${branch.localId}`}
          value={branch.centralManagement}
          onChange={(v) => onChange(branch.localId, { centralManagement: v as YesNo })}
          options={yesNoOptions}
        />
      </FormField>

      <FormField
        label={t('accreditation.entityData.fields.scope.activitiesToAudit')}
        required
        variant="question"
      >
        <TextField
          type="text"
          value={branch.activities}
          onChange={(e) => onChange(branch.localId, { activities: e.target.value })}
        />
      </FormField>

      <FormField
        label={t('accreditation.entityData.fields.scope.productsServices')}
        required
        variant="question"
      >
        <Textarea
          value={branch.products}
          onChange={(e) => onChange(branch.localId, { products: e.target.value })}
        />
      </FormField>

      <FormField
        label={t('accreditation.entityData.fields.scope.technicalCommunication')}
        required
        variant="question"
      >
        <Textarea
          value={branch.technicalCommunication}
          onChange={(e) =>
            onChange(branch.localId, { technicalCommunication: e.target.value })
          }
        />
      </FormField>
    </FormSection>
  )
}

export function ScopeOfActivityStep() {
  const { t, i18n } = useTranslation()
  const { form, update, updateBranch, addBranch, removeBranch, orgBranches } = useApplicationForm()

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  const onHasBranchesChange = (value: string) => {
    update('hasBranches', value as YesNo)
    if (value === 'no') update('branches', [])
  }

  const branchRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  function handleAddBranchSelect(value: string) {
  const newId = addBranch()
  if (value !== NEW_BRANCH_VALUE) {
    const source = orgBranches.find((orgBranch) => orgBranch.id === value)
    if (source) {
      updateBranch(newId, {
        sourceBranchId: source.id,
        branchName: source.branchName ?? '',
        address: source.address ?? '',
      })
    }
  }
  setTimeout(() => {
    branchRefs.current.get(newId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 50)
}

  function handleRemoveBranch(localId: number) {
    branchRefs.current.delete(localId)
    removeBranch(localId)
  }

  const branchLabel = (index: number) =>
    t('accreditation.entityData.fields.scope.branchNumber', { number: index + 1 })

  return (
    <div className="flex-1 space-y-5">
      <DashboardTourStep stepId="scope-of-activity">
        <SectionHeading title={t('accreditation.entityData.fields.scope.operationalData')} accordion>
        <FormSection>
          <FormField
            label={t('accreditation.entityData.fields.scope.scopeOfWork')}
            required
            variant="question"
          >
            <TextField
              type="text"
              value={form.fieldOfWork}
              onChange={(e) => update('fieldOfWork', e.target.value)}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.scope.economicField')}
            required
            variant="question"
          >
            <MultiSelect
              tags={form.economicFields}
              options={getIafCodeOptions(i18n.language)}
              onChange={(tags) => update('economicFields', tags)}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.scope.productsServicesNature')}
            required
            variant="question"
          >
            <Textarea
              value={form.productsServices}
              onChange={(e) => update('productsServices', e.target.value)}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.scope.annualProductionCapacity')}
            required
            variant="question"
          >
            <Textarea
              value={form.annualCapacity}
              onChange={(e) => update('annualCapacity', e.target.value)}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.scope.technicalSpecifications')}
            required
            variant="question"
          >
            <Textarea
              value={form.technicalSpecifications}
              onChange={(e) => update('technicalSpecifications', e.target.value)}
            />
          </FormField>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.scope.hasBranches')}
              required
              variant="question"
            >
              <RadioGroup
                name="hasBranches"
                value={form.hasBranches}
                onChange={onHasBranchesChange}
                options={yesNoOptions}
              />
            </FormField>

            {form.hasBranches === 'yes' && (
              <FormField
                label={t('accreditation.entityData.fields.scope.branchCount')}
                variant="question"
              >
                <SelectField
                  value=""
                  onChange={handleAddBranchSelect}
                  options={[
                    ...orgBranches.map((orgBranch) => ({
                      value: orgBranch.id,
                      label: orgBranch.branchName ?? orgBranch.id,
                    })),
                    {
                      value: NEW_BRANCH_VALUE,
                      label: t('accreditation.entityData.fields.scope.addNewBranchOption'),
                    },
                  ]}
                />
              </FormField>
            )}
          </div>
        </FormSection>
      </SectionHeading>
      </DashboardTourStep>

      {form.hasBranches === 'yes' &&
        form.branches.map((branch, index) => (
          <div key={branch.localId} ref={(el) => { if (el) branchRefs.current.set(branch.localId, el); }}>
            <SectionHeading
              title={branchLabel(index)}
              accordion
              headerActions={
                index > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveBranch(branch.localId)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-error-500 transition-colors hover:bg-error-50"
                    aria-label={t('accreditation.entityData.fields.scope.removeBranch')}
                  >
                    <AppIcon icon={TrashIcon} size={16} />
                    <span className="text-body-3">{t('accreditation.entityData.fields.scope.removeBranch')}</span>
                  </button>
                ) : undefined
              }
            >
              <BranchForm branch={branch} onChange={updateBranch} />
            </SectionHeading>
          </div>
        ))}
    </div>
  )
}