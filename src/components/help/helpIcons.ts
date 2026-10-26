import { Book1, Buildings2, Category2, Crown1, Profile2User, Speaker, Setting2, Receipt21 } from 'iconsax-reactjs'
import {
  BuildingsIcon,
  CertificateBadgeIcon,
  FileTextIcon,
  ReceiptIcon,
  TaskSquareIcon,
  UsersIcon,
  WalletIcon,
  type AppIconComponent,
} from '@/components/icons'
import type { HelpAudience } from '@/lib/help/types'

/** Icon of each help section; a new section without one gets the book icon. */
const SECTION_ICONS: Record<string, AppIconComponent> = {
  'cab-start': Book1,
  'cab-setup': BuildingsIcon,
  'cab-clients': UsersIcon,
  'cab-application': FileTextIcon,
  'cab-contract': WalletIcon,
  'cab-audit': TaskSquareIcon,
  'cab-certification': CertificateBadgeIcon,
  'cab-followUp': ReceiptIcon,
  'client-start': Book1,
  'client-certification': CertificateBadgeIcon,
  'client-billing': Receipt21,
  'platform-start': Book1,
  'platform-overview': Category2,
  'platform-customers': Buildings2,
  'platform-billing': Crown1,
  'platform-communication': Speaker,
  'platform-administration': Setting2,
}

export function sectionIcon(sectionId: string): AppIconComponent {
  return SECTION_ICONS[sectionId] ?? Book1
}

export const AUDIENCE_ICONS: Record<HelpAudience, AppIconComponent> = {
  cab: BuildingsIcon,
  client: Profile2User,
  platform: Category2,
}
