import type { Urgency, Effort } from './types'
import { OG_COLORS } from './constants'

// CircleDot SVG logo (matches Lucide icon)
export function WheelDoLogo({ size = 48 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={OG_COLORS.primary}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  )
}

// Branding block: Logo + "WheelDo" text
export function WheelDoBranding({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <WheelDoLogo size={size} />
      <span
        style={{
          fontSize: size * 0.75,
          fontWeight: 700,
          color: OG_COLORS.primary,
        }}
      >
        WheelDo
      </span>
    </div>
  )
}

// Urgency badge with color coding
export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const labels: Record<Urgency, string> = {
    HIGH: 'High Priority',
    MEDIUM: 'Medium Priority',
    LOW: 'Low Priority',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: `${OG_COLORS.urgency[urgency]}15`,
        borderRadius: 9999,
        border: `1px solid ${OG_COLORS.urgency[urgency]}40`,
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: OG_COLORS.urgency[urgency],
        }}
      >
        {labels[urgency]}
      </span>
    </div>
  )
}

// Category badge with custom color
export function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: `${color}15`,
        borderRadius: 9999,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: color,
        }}
      >
        {name}
      </span>
    </div>
  )
}

// Effort indicator (5 bars)
export function EffortIndicator({ effort }: { effort: Effort }) {
  const levels: Record<Effort, number> = {
    MINIMAL: 1,
    LOW: 2,
    MODERATE: 3,
    HIGH: 4,
    EXTREME: 5,
  }
  const level = levels[effort]
  const color = OG_COLORS.effort[effort]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, color: OG_COLORS.textSecondary }}>Effort:</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 20,
              borderRadius: 3,
              backgroundColor: i <= level ? color : OG_COLORS.border,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// User avatar with initials fallback
export function OGAvatar({
  imageUrl,
  name,
  size = 40,
}: {
  imageUrl: string | null
  name: string | null
  size?: number
}) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?'

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'User'}
        width={size}
        height={size}
        style={{
          borderRadius: '50%',
          border: `2px solid ${OG_COLORS.background}`,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: OG_COLORS.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${OG_COLORS.background}`,
      }}
    >
      <span
        style={{
          fontSize: size * 0.4,
          fontWeight: 600,
          color: '#ffffff',
        }}
      >
        {initials}
      </span>
    </div>
  )
}

// Permission badge for invites
export function PermissionBadge({ canEdit }: { canEdit: boolean }) {
  const color = canEdit ? '#1a7f37' : '#0969da'
  const label = canEdit ? 'Can edit' : 'Can view'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        backgroundColor: `${color}15`,
        borderRadius: 9999,
        border: `1px solid ${color}40`,
      }}
    >
      {canEdit ? (
        // Pencil icon for edit
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      ) : (
        // Eye icon for view
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
      <span
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: color,
        }}
      >
        {label}
      </span>
    </div>
  )
}

// Get deadline urgency color
export function getDeadlineColor(deadline: Date): string {
  const now = new Date()
  const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntil < 24) return '#cf222e' // Red - urgent
  if (hoursUntil < 72) return '#bf8700' // Orange - soon
  return '#656d76' // Gray - normal
}

// Format deadline for display
export function formatDeadline(deadline: Date): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const deadlineYear = deadline.getFullYear()

  if (currentYear === deadlineYear) {
    return deadline.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return deadline.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Deadline badge with urgency color
export function DeadlineBadge({ deadline }: { deadline: Date }) {
  const color = getDeadlineColor(deadline)
  const formattedDate = formatDeadline(deadline)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        backgroundColor: `${color}15`,
        borderRadius: 9999,
        border: `1px solid ${color}30`,
      }}
    >
      {/* Clock icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: color,
        }}
      >
        Due {formattedDate}
      </span>
    </div>
  )
}

// Collaborator avatars with overflow indicator
export function CollaboratorAvatars({
  avatars,
  totalCount,
}: {
  avatars: Array<{ name: string | null; image: string | null }>
  totalCount: number
}) {
  const maxDisplay = 3
  const displayAvatars = avatars.slice(0, maxDisplay)
  const remaining = totalCount - maxDisplay

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', marginLeft: 8 }}>
        {displayAvatars.map((avatar, index) => (
          <div key={index} style={{ marginLeft: index > 0 ? -12 : 0 }}>
            <OGAvatar imageUrl={avatar.image} name={avatar.name} size={32} />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span
          style={{
            marginLeft: 8,
            fontSize: 14,
            color: OG_COLORS.textSecondary,
          }}
        >
          +{remaining} more
        </span>
      )}
    </div>
  )
}
