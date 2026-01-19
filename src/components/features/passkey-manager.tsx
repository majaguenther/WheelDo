'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, Check, X, Loader2, Smartphone, Monitor, AlertCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { PasskeyIcon } from '@/components/ui/passkey-icon'

interface Passkey {
  id: string
  name: string | null
  createdAt: Date
  deviceType: string
}

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [supportsPasskey, setSupportsPasskey] = useState(false)

  const loadPasskeys = useCallback(async () => {
    try {
      const result = await authClient.passkey.listUserPasskeys()
      if (result?.data) {
        setPasskeys(result.data as Passkey[])
      }
    } catch (err) {
      console.error('Failed to load passkeys:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    void loadPasskeys()
  }, [loadPasskeys])

  const handleAddPasskey = async () => {
    setIsAdding(true)
    setError(null)
    try {
      const result = await authClient.passkey.addPasskey()
      if (result?.error) {
        setError(result.error.message || 'Failed to add passkey')
      } else {
        await loadPasskeys()
      }
    } catch (err) {
      // User cancelled or WebAuthn error
      if (err instanceof Error && !err.message.includes('cancelled')) {
        setError(err.message)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeletePasskey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this passkey? You won\'t be able to sign in with it anymore.')) {
      return
    }

    setError(null)
    try {
      const result = await authClient.passkey.deletePasskey({ id })
      if (result?.error) {
        setError(result.error.message || 'Failed to delete passkey')
      } else {
        setPasskeys(passkeys.filter(p => p.id !== id))
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  const handleStartEdit = (passkey: Passkey) => {
    setEditingId(passkey.id)
    setEditName(passkey.name || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleSaveEdit = async (id: string) => {
    setError(null)
    try {
      const result = await authClient.passkey.updatePasskey({
        id,
        name: editName.trim(),
      })
      if (result?.error) {
        setError(result.error.message || 'Failed to update passkey')
      } else {
        setPasskeys(passkeys.map(p =>
          p.id === id ? { ...p, name: editName.trim() || null } : p
        ))
        setEditingId(null)
        setEditName('')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'singleDevice') {
      return <Smartphone className="h-4 w-4 text-muted-foreground" />
    }
    return <Monitor className="h-4 w-4 text-muted-foreground" />
  }

  const getPasskeyDisplayName = (passkey: Passkey, index: number) => {
    if (passkey.name) return passkey.name
    return `Passkey ${index + 1}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!supportsPasskey) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="text-sm text-muted-foreground">
          Passkeys are not supported on this device or browser. Try using a device with Touch ID, Face ID, or Windows Hello.
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {passkeys.length === 0 ? (
        <div className="text-center py-6">
          <PasskeyIcon variant="gray" size={48} className="mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            No passkeys registered yet. Add a passkey for quick and secure sign-in.
          </p>
          <button
            onClick={handleAddPasskey}
            disabled={isAdding}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Passkey
          </button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {passkeys.map((passkey, index) => (
              <li key={passkey.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(passkey.deviceType)}

                  <div className="flex-1 min-w-0">
                    {editingId === passkey.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Passkey name"
                          className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleSaveEdit(passkey.id)
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                        />
                        <button
                          onClick={() => void handleSaveEdit(passkey.id)}
                          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-muted-foreground hover:bg-muted rounded"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium truncate">
                          {getPasskeyDisplayName(passkey, index)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Added {formatDate(passkey.createdAt)}
                        </p>
                      </>
                    )}
                  </div>

                  {editingId !== passkey.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(passkey)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Rename"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void handleDeletePasskey(passkey.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={handleAddPasskey}
            disabled={isAdding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors disabled:opacity-50"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Another Passkey
          </button>
        </>
      )}
    </div>
  )
}
