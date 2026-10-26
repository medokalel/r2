import { cn } from '@/lib/utils'

export const DEFAULT_AVATAR_SRC = '/default-avatar.png'

interface UserAvatarProps {
  src?: string | null
  alt?: string
  className?: string
}

export function UserAvatar({ src, alt = '', className }: UserAvatarProps) {
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-full border border-neutral-300 bg-primary-subtle',
        className
      )}
    >
      <img
        src={src || DEFAULT_AVATAR_SRC}
        alt={alt}
        className="size-full object-cover"
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = DEFAULT_AVATAR_SRC
        }}
      />
    </div>
  )
}
