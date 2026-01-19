import { CircleDot } from 'lucide-react'
import { SidebarNavLinks } from './sidebar-nav-links'
import { NotificationBell } from '@/components/features/notification-bell'
import { UserProfileMenu } from '@/components/ui/user-profile-menu'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface ServerSidebarProps {
  user: User
}

export function ServerSidebar({ user }: ServerSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-background fixed left-0 top-0">
      {/* Logo and notification */}
      <div className="flex items-center justify-between px-6 py-5 border-b">
        <div className="flex items-center gap-2">
          <CircleDot className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">WheelDo</span>
        </div>
        <NotificationBell />
      </div>

      {/* Navigation - client component for active state */}
      <SidebarNavLinks />

      {/* User section with dropdown menu */}
      <div className="border-t p-4">
        <UserProfileMenu user={user} />
      </div>
    </aside>
  )
}
