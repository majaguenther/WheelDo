import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/ui/app-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return <AppShell>{children}</AppShell>
}
