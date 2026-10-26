/** Helpers shared by the team-selection components. */
import { useTranslation } from 'react-i18next'
import type { Localized, TeamRole } from '@/lib/api/teamSelectionApi'

/** Text of a bilingual server message in the UI language. */
export function useLocalized() {
  const { i18n } = useTranslation()
  const ar = i18n.language?.startsWith('ar')
  return (value: Localized | null | undefined) => (value ? (ar ? value.ar || value.en : value.en) : '')
}

export const ROLE_KEY: Record<TeamRole, string> = {
  TEAM_LEADER: 'teamLeader',
  AUDITOR: 'auditor',
  TECHNICAL_EXPERT: 'technicalExpert',
  TRAINEE: 'trainee',
  OBSERVER: 'observer',
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

