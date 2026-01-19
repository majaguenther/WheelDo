'use client'

import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import { getAvatarColor } from '@/lib/avatar-colors'

interface User {
  id: string
  name?: string | null
  email: string
  image?: string | null
}

interface AvatarStackProps {
  users: User[]
  max?: number
  size?: 'sm' | 'md'
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
}

const overlapClasses = {
  sm: '-ml-2',
  md: '-ml-3',
}

export function AvatarStack({ users, max = 3, size = 'sm', className }: AvatarStackProps) {
  const visibleUsers = users.slice(0, max)
  const overflowCount = users.length - max

  if (users.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex items-center">
        {visibleUsers.map((user, index) => (
          <div
            key={user.id}
            className={cn(
              'relative rounded-full ring-2 ring-background',
              index > 0 && overlapClasses[size]
            )}
            style={{ zIndex: visibleUsers.length - index }}
          >
            <Avatar
              user={user}
              size={size === 'sm' ? 'xs' : 'sm'}
              showTooltip
              className={sizeClasses[size]}
            />
          </div>
        ))}
        {overflowCount > 0 && (
          <div
            className={cn(
              'relative rounded-full ring-2 ring-background flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium',
              sizeClasses[size],
              overlapClasses[size]
            )}
            style={{ zIndex: 0 }}
          >
            +{overflowCount}
          </div>
        )}
      </div>
    </div>
  )
}

export type { AvatarStackProps, User as AvatarStackUser }
