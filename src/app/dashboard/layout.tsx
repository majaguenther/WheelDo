import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { AppShell } from '@/components/ui/app-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  return <AppShell>{children}</AppShell>
}
