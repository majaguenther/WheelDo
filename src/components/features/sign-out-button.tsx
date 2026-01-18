'use client'

import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

interface SignOutButtonProps {
  variant?: 'default' | 'sidebar'
}

export function SignOutButton({ variant = 'default' }: SignOutButtonProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/')
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    )
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-secondary transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  )
}
