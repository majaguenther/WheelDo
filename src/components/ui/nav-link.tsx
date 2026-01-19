'use client'

import Link from 'next/link'
import { useLinkStatus } from 'next/link'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

interface NavLinkProps extends Omit<ComponentProps<typeof Link>, 'children'> {
  children: ReactNode
  icon?: ReactNode
  showLoadingSpinner?: boolean
  className?: string
  activeClassName?: string
  isActive?: boolean
}

/**
 * Loading indicator component that shows when link navigation is pending
 */
function LoadingIndicator({ showSpinner }: { showSpinner?: boolean }) {
  const { pending } = useLinkStatus()

  if (!pending) return null

  if (showSpinner) {
    return <Loader2 className="h-4 w-4 animate-spin ml-auto" />
  }

  return (
    <span
      aria-hidden
      className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-pulse ml-auto"
    />
  )
}

/**
 * Navigation link with loading state feedback
 */
export function NavLink({
  children,
  icon,
  showLoadingSpinner = false,
  className,
  activeClassName,
  isActive,
  ...props
}: NavLinkProps) {
  return (
    <Link
      className={cn(className, isActive && activeClassName)}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      <LoadingIndicator showSpinner={showLoadingSpinner} />
    </Link>
  )
}
