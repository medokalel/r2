import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  updateCabApplicationTechnicalFeasibility,
  type CabApplicationTechnicalFeasibility,
  type FeasibilityTeamRoleKey,
} from '@/lib/api/cabApplicationTechnicalFeasibilityApi'
import { TeamSelector, type TeamDraftMember } from '@/components/teamSelection/TeamSelector'
import type { TeamRole, TeamValidationResult } from '@/lib/api/teamSelectionApi'
import { workflowErrorMessage } from '@/lib/workflowErrors'

const ROLE_OF: Record<string, TeamRole> = { leadAuditor: 'TEAM_LEADER', auditor: 'AUDITOR', technicalExpert: 'TECHNICAL_EXPERT', trainee: 'TRAINEE', observer: 'OBSERVER' }
const KEY_OF: Record<TeamRole, FeasibilityTeamRoleKey> = { TEAM_LEADER: 'leadAuditor', AUDITOR: 'auditor', TECHNICAL_EXPERT: 'technicalExpert', TRAINEE: 'trainee', OBSERVER: 'observer' }
const ROLES: TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT', 'TRAINEE']

interface Props {
  open: boolean
  applicationId: string
  data: CabApplicationTechnicalFeasibility
  onClose: () => void
  onSaved: (data: CabApplicationTechnicalFeasibility) => void
}

/**
 * "Edit team" of the technical feasibility review: the competence-based team selector (recommendations,
 * validation of competence, IAF codes, critical codes and impartiality). Saved via PATCH; the server
 * applies the same rules (422 TEAM_BLOCKED).
 */
export function TechnicalFeasibilityTeamDialog(props: Props) {
  // Mounted only while open, so every opening starts from the saved team.
  return props.open ? <TeamDialogBody {...props} /> : null
}

function TeamDialogBody({ open, applicationId, data, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const [team, setTeam] = useState<TeamDraftMember[]>(() =>
    data.auditTeam.filter((m) => m.employeeId).map((m) => ({ personId: m.employeeId as string, name: m.name, role: ROLE_OF[m.roleKey] ?? 'AUDITOR' })),
  )
  const [validation, setValidation] = useState<TeamValidationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLead = team.some((m) => m.role === 'TEAM_LEADER')

  const save = async () => {
    if (!hasLead) return
    setBusy(true)
    setError(null)
    try {
      const saved = await updateCabApplicationTechnicalFeasibility(applicationId, {
        auditTeam: team.filter((m) => m.personId).map((m) => ({ employeeId: m.personId as string, roleKey: KEY_OF[m.role] })),
      })
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <WorkflowDialog
      open={open}
      size="lg"
      title={t('cab.applications.technicalFeasibility.team.title', 'Edit audit team')}
      description={t('team.feasibility.hint')}
      confirmLabel={t('cab.applications.technicalFeasibility.team.save', 'Save team')}
      confirmDisabled={!hasLead || !validation?.canConfirm}
      busy={busy}
      error={error}
      onConfirm={() => void save()}
      onClose={onClose}
    >
      <TeamSelector scope={{ applicationId }} value={team} onChange={setTeam} roles={ROLES} onValidation={setValidation} />
    </WorkflowDialog>
  )
}
