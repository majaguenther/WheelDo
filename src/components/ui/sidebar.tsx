'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CircleDot, History } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { UserProfileMenu } from './user-profile-menu'

const navItems = [
  { href: '/dashboard', label: 'Tasks', icon: Home },
  { href: '/wheel', label: 'Spin the Wheel', icon: CircleDot },
  { href: '/history', label: 'History', icon: History },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-background fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <CircleDot className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">WheelDo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section with dropdown menu */}
      {session?.user && (
        <div className="border-t p-4">
          <UserProfileMenu user={session.user} />
        </div>
      )}
    </aside>
  )
}
