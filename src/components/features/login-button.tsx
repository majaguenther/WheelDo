'use client'

import { useState, useEffect } from 'react'
import { Github } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { PasskeyLoginButton } from './passkey-login-button'

export function LoginButton() {
  const [error, setError] = useState<string | null>(null)
  const [supportsPasskey, setSupportsPasskey] = useState(false)

  useEffect(() => {
    // Check if WebAuthn is supported
    const checkPasskeySupport = async () => {
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setSupportsPasskey(available)
        } catch {
          setSupportsPasskey(false)
        }
      }
    }
    void checkPasskeySupport()
  }, [])

  const handleGitHubLogin = async () => {
    setError(null)
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    })
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* GitHub Login */}
      <button
        onClick={handleGitHubLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        <Github className="h-5 w-5" />
        Continue with GitHub
      </button>

      {/* Passkey login - only show if supported */}
      {supportsPasskey && (
        <>
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Passkey Login */}
          <PasskeyLoginButton onError={handleError} />
        </>
      )}
    </div>
  )
}
