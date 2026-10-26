import type { EntityDataSubSection, EntityDataViewTab } from '@/components/dashboard/entityDataNavSections'
import type { FieldPhase, SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { ApprovedStep } from '@/components/dashboard/entityData/ApprovedStep'
import { ConsultingReadinessStep } from '@/components/dashboard/entityData/ConsultingReadinessStep'
import { EntityDataDocumentsStep } from '@/components/dashboard/entityData/EntityDataDocumentsStep'
import { EntityDataFeedbackStep } from '@/components/dashboard/entityData/EntityDataFeedbackStep'
import { EntityDataFieldStep } from '@/components/dashboard/entityData/EntityDataFieldStep'
import { LegalDeclarationsStep } from '@/components/dashboard/entityData/LegalDeclarationsStep'
import { LegalIdentityStep } from '@/components/dashboard/entityData/LegalIdentityStep'
import { RejectedStep } from '@/components/dashboard/entityData/RejectedStep'
import { ScopeOfActivityStep } from '@/components/dashboard/entityData/ScopeOfActivityStep'
import { SpecificationQuestionsStep } from '@/components/dashboard/entityData/SpecificationQuestionsStep'
import { UnderReviewStep } from '@/components/dashboard/entityData/UnderReviewStep'

interface EntityDataFormProps {
  section: EntityDataSubSection
  viewTab: EntityDataViewTab
  fieldPhase?: FieldPhase
  selectedSectors?: Record<string, SectorKey[]>
  onSelectedSectorsChange?: (standard: StandardKey, sectors: SectorKey[]) => void
  selectedStandards?: StandardKey[]
  onSelectedStandardsChange?: (standards: StandardKey[]) => void
  selectedCodes?: Record<string, string[]>
  onSelectedCodesChange?: (codes: Record<string, string[]>) => void
}

interface EntityDataSectionsStepProps {
  section: EntityDataSubSection
  selectedStandards?: StandardKey[]
  onSelectedStandardsChange?: (standards: StandardKey[]) => void
}

function EntityDataSectionsStep({
  section,
  selectedStandards,
  onSelectedStandardsChange,
}: EntityDataSectionsStepProps) {
  switch (section) {
    case 'legalIdentity':
      return (
        <LegalIdentityStep
          selectedStandards={selectedStandards}
          onSelectedStandardsChange={onSelectedStandardsChange}
        />
      )
    case 'scopeOfActivity':
      return <ScopeOfActivityStep />
    case 'consultingReadiness':
      return <ConsultingReadinessStep />
    case 'specificationQuestions':
      return <SpecificationQuestionsStep />
    case 'legalDeclarations':
      return <LegalDeclarationsStep />
    default:
      return null
  }
}

export function EntityDataForm({
  section,
  viewTab,
  fieldPhase = 'sectors',
  selectedSectors = {},
  onSelectedSectorsChange,
  selectedStandards,
  onSelectedStandardsChange,
  selectedCodes = {},
  onSelectedCodesChange,
}: EntityDataFormProps) {
  switch (viewTab) {
    case 'field':
      return (
        <EntityDataFieldStep
          phase={fieldPhase}
          selectedSectors={selectedSectors}
          onSelectedSectorsChange={onSelectedSectorsChange ?? (() => undefined)}
          selectedStandards={selectedStandards}
          selectedCodes={selectedCodes}
          onSelectedCodesChange={onSelectedCodesChange ?? (() => undefined)}
        />
      )
    case 'documents':
      return <EntityDataDocumentsStep />
    case 'feedback':
      return <EntityDataFeedbackStep />
    case 'approved':
      return <ApprovedStep />
    case 'underReview':
      return <UnderReviewStep />
    case 'rejected':
      return <RejectedStep />
    case 'entityData':
    default:
      return (
        <EntityDataSectionsStep
          section={section}
          selectedStandards={selectedStandards}
          onSelectedStandardsChange={onSelectedStandardsChange}
        />
      )
  }
}
