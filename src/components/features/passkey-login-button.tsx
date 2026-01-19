'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { PasskeyIcon } from '@/components/ui/passkey-icon'

interface PasskeyLoginButtonProps {
  onError?: (error: string) => void
}

export function PasskeyLoginButton({ onError }: PasskeyLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await authClient.signIn.passkey()
      if (result?.error) {
        onError?.(result.error.message || 'Failed to sign in with passkey')
      }
    } catch (error) {
      // User cancelled or WebAuthn error
      if (error instanceof Error && !error.message.includes('cancelled')) {
        onError?.(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <PasskeyIcon variant="white" size={20} />
      )}
      Sign in with Passkey
    </button>
  )
}
