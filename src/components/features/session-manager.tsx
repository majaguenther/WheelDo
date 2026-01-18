'use client'

import { useState, useEffect } from 'react'
import { Monitor, Smartphone, Globe, Trash2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

interface SessionData {
  id: string
  createdAt: Date
  expiresAt: Date
  ipAddress?: string | null
  userAgent?: string | null
  token: string
}

export function SessionManager() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const { data: currentSession } = authClient.useSession()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const result = await authClient.listSessions()
      if (result.data) {
        setSessions(result.data)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const revokeSession = async (token: string) => {
    setRevoking(token)
    try {
      await authClient.revokeSession({ token })
      setSessions(sessions.filter((s) => s.token !== token))
    } catch (error) {
      console.error('Failed to revoke session:', error)
    } finally {
      setRevoking(null)
    }
  }

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return Globe
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return Smartphone
    }
    return Monitor
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getBrowserInfo = (userAgent?: string | null) => {
    if (!userAgent) return 'Unknown browser'
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown browser'
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No active sessions found.</p>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const DeviceIcon = getDeviceIcon(session.userAgent)
        const isCurrentSession = currentSession?.session?.token === session.token

        return (
          <div
            key={session.id}
            className="flex items-center gap-4 p-4 border rounded-lg"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DeviceIcon className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">
                  {getBrowserInfo(session.userAgent)}
                </p>
                {isCurrentSession && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {session.ipAddress || 'Unknown IP'} • Created {formatDate(session.createdAt)}
              </p>
            </div>

            {!isCurrentSession && (
              <button
                onClick={() => revokeSession(session.token)}
                disabled={revoking === session.token}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                title="Revoke session"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
