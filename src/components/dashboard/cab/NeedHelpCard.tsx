import { AppIcon, HeadsetIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'

interface NeedHelpCardProps {
  title: string
  description: string
  contactSupportLabel: string
  onContactSupport?: () => void
}

/** Small bordered sidebar card offering support contact — shared by every
 *  Application Draft step that shows one, so the copy/styling only needs to
 *  change in one place. */
export function NeedHelpCard({ title, description, contactSupportLabel, onContactSupport }: NeedHelpCardProps) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-white p-5">
      <h3 className="mb-2 text-body font-semibold text-neutral-900">{title}</h3>
      <p className="mb-4 text-body-sm text-neutral-600">{description}</p>
      <Button type="button" variant="secondary" className="w-full gap-2 rounded-md" onClick={onContactSupport}>
        <AppIcon icon={HeadsetIcon} size={18} />
        {contactSupportLabel}
      </Button>
    </div>
  )
}