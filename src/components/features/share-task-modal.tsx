'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Copy,
  Check,
  Link as LinkIcon,
  Trash2,
  Crown,
  Pencil,
  Eye,
  Loader2
} from 'lucide-react'

interface Collaborator {
  id: string
  userId: string
  canEdit: boolean
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface Invite {
  id: string
  token: string
  canEdit: boolean
  expiresAt: string
  createdAt: string
  url?: string
}

interface Owner {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface ShareTaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
  isOwner: boolean
}

export function ShareTaskModal({ isOpen, onClose, taskId, taskTitle, isOwner }: ShareTaskModalProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [owner, setOwner] = useState<Owner | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [newInviteCanEdit, setNewInviteCanEdit] = useState(false)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [collabRes, invitesRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}/collaborators`),
        isOwner ? fetch(`/api/tasks/${taskId}/invites`) : Promise.resolve(null),
      ])

      if (!collabRes.ok) throw new Error('Failed to load collaborators')
      const collabData = await collabRes.json()
      setCollaborators(collabData.collaborators || [])
      setOwner(collabData.owner || null)

      if (invitesRes && invitesRes.ok) {
        const invitesData = await invitesRes.json()
        setInvites(invitesData || [])
      }
    } catch (err) {
      setError('Failed to load sharing data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [taskId, isOwner])

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, loadData])

  const createInvite = async () => {
    setCreatingInvite(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${taskId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canEdit: newInviteCanEdit }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create invite')
      }

      const invite = await res.json()
      setInvites([invite, ...invites])

      // Auto-copy the new invite URL
      await copyToClipboard(invite.url, invite.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setCreatingInvite(false)
    }
  }

  const revokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/invites`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })

      if (!res.ok) throw new Error('Failed to revoke invite')
      setInvites(invites.filter((i) => i.id !== inviteId))
    } catch {
      setError('Failed to revoke invite')
    }
  }

  const removeCollaborator = async (userId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/collaborators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) throw new Error('Failed to remove collaborator')
      setCollaborators(collaborators.filter((c) => c.userId !== userId))
    } catch {
      setError('Failed to remove collaborator')
    }
  }

  const updateCollaboratorRole = async (userId: string, canEdit: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/collaborators`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, canEdit }),
      })

      if (!res.ok) throw new Error('Failed to update role')
      setCollaborators(collaborators.map((c) =>
        c.userId === userId ? { ...c, canEdit } : c
      ))
    } catch {
      setError('Failed to update role')
    }
  }

  const copyToClipboard = async (url: string, inviteId: string) => {
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopiedInviteId(inviteId)
      setTimeout(() => setCopiedInviteId(null), 2000)
    } catch {
      // Silently fail - clipboard might not be available in some contexts
    }
  }

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Expired'
    if (diffDays === 1) return 'Expires tomorrow'
    return `Expires in ${diffDays} days`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${taskTitle}"`}
      description={isOwner ? "Manage who has access to this task" : "View who has access to this task"}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* People with access */}
          <div>
            <h3 className="text-sm font-medium mb-3">People with access</h3>
            <div className="space-y-2">
              {/* Owner */}
              {owner && (
                <div className="flex items-center gap-3 p-2 rounded-lg">
                  <Avatar user={owner} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {owner.name || owner.email}
                    </p>
                    {owner.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {owner.email}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Owner
                  </Badge>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((collab) => (
                <div key={collab.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                  <Avatar user={collab.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {collab.user.name || collab.user.email}
                    </p>
                    {collab.user.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {collab.user.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <select
                        value={collab.canEdit ? 'editor' : 'viewer'}
                        onChange={(e) => updateCollaboratorRole(collab.userId, e.target.value === 'editor')}
                        className="text-sm bg-transparent border rounded px-2 py-1"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        {collab.canEdit ? (
                          <>
                            <Pencil className="h-3 w-3" />
                            Editor
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Viewer
                          </>
                        )}
                      </Badge>
                    )}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCollaborator(collab.userId)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No collaborators yet
                </p>
              )}
            </div>
          </div>

          {/* Create invite link (owner only) */}
          {isOwner && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Create invite link</h3>
              <div className="flex items-center gap-2">
                <select
                  value={newInviteCanEdit ? 'editor' : 'viewer'}
                  onChange={(e) => setNewInviteCanEdit(e.target.value === 'editor')}
                  className="flex-1 text-sm bg-background border rounded-lg px-3 py-2"
                >
                  <option value="viewer">Can view</option>
                  <option value="editor">Can edit</option>
                </select>
                <Button
                  onClick={createInvite}
                  disabled={creatingInvite}
                  className="gap-2"
                >
                  {creatingInvite ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  Create Link
                </Button>
              </div>
            </div>
          )}

          {/* Active invites (owner only) */}
          {isOwner && invites.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Active invite links</h3>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {invite.canEdit ? 'Editor' : 'Viewer'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatExpiryDate(invite.expiresAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(invite.url || '', invite.id)}
                      className="gap-1"
                    >
                      {copiedInviteId === invite.id ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => revokeInvite(invite.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
