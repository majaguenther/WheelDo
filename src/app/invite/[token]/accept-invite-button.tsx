'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X } from 'lucide-react'

interface AcceptInviteButtonProps {
  token: string
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invite')
      }

      setSuccess(true)

      // Redirect to the task after a brief delay
      setTimeout(() => {
        router.push(`/tasks/${data.taskId}`)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
      setLoading(false)
    }
  }

  const handleDecline = () => {
    router.push('/dashboard')
  }

  if (success) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-green-600">
        <Check className="h-5 w-5" />
        <span className="font-medium">Invite accepted! Redirecting...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleDecline}
          disabled={loading}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          Decline
        </Button>
        <Button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Accept
        </Button>
      </div>
    </div>
  )
}
