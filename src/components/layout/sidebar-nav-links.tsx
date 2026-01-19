'use client'

import { usePathname } from 'next/navigation'
import { Home, CircleDot, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavLink } from '@/components/ui/nav-link'

const navItems = [
  { href: '/dashboard', label: 'Tasks', icon: Home },
  { href: '/wheel', label: 'Spin the Wheel', icon: CircleDot },
  { href: '/history', label: 'History', icon: History },
]

export function SidebarNavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4">
      <ul className="space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <NavLink
                href={href}
                icon={<Icon className="h-5 w-5" />}
                isActive={isActive}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
                activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                {label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
