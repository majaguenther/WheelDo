'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getAvatarColor, getInitials } from '@/lib/avatar-colors'

interface AvatarProps {
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

const imageSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
}

export function Avatar({ user, size = 'md', className, showTooltip }: AvatarProps) {
  const color = getAvatarColor(user.name, user.email)
  const initials = getInitials(user.name, user.email)
  const displayName = user.name || user.email

  const avatar = user.image ? (
    <Image
      src={user.image}
      alt={displayName}
      width={imageSizes[size]}
      height={imageSizes[size]}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
    />
  ) : (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )

  if (showTooltip) {
    return (
      <div className="group relative inline-block">
        {avatar}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {displayName}
        </div>
      </div>
    )
  }

  return avatar
}

export type { AvatarProps }
