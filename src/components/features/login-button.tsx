'use client'

import { Github } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function LoginButton() {
  const handleLogin = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
    >
      <Github className="h-5 w-5" />
      Continue with GitHub
    </button>
  )
}
