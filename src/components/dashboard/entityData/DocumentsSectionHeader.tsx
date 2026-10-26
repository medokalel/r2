import { SectionTitle } from '@/components/dashboard/SectionTitle'

interface DocumentsSectionHeaderProps {
  title: string
  subtitle: string
}

export function DocumentsSectionHeader({ title, subtitle }: DocumentsSectionHeaderProps) {
  return <SectionTitle title={title} subtitle={subtitle} className="py-4" />
}
