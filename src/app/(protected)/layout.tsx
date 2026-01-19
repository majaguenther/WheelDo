import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { ServerSidebar } from '@/components/layout/server-sidebar'
import { ServerBottomNav } from '@/components/layout/server-bottom-nav'
import { NotificationProvider } from '@/components/layout/notification-provider'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Pass user data as props instead of client-side useSession()
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }

  return (
    <div className="min-h-screen bg-background">
      <ServerSidebar user={user} />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <ServerBottomNav />
      <NotificationProvider userId={user.id} />
    </div>
  )
}
