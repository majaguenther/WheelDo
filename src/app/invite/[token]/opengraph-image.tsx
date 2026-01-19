import { ImageResponse } from 'next/og'
import { OG_IMAGE_SIZE, OG_COLORS } from '@/lib/og/constants'
import {
  WheelDoBranding,
  OGAvatar,
  PermissionBadge,
  CategoryBadge,
  DeadlineBadge,
} from '@/lib/og/components'
import { getInviteForOG } from '@/lib/og/data'

export const runtime = 'nodejs'
export const alt = 'WheelDo Task Invitation'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

// Reusable fallback image component
function FallbackImage({ message, subtext }: { message: string; subtext?: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: OG_COLORS.background,
        gap: 16,
      }}
    >
      <WheelDoBranding size={48} />
      <span
        style={{
          marginTop: 24,
          fontSize: 36,
          fontWeight: 600,
          color: OG_COLORS.textPrimary,
        }}
      >
        {message}
      </span>
      {subtext && (
        <span
          style={{
            fontSize: 24,
            color: OG_COLORS.textSecondary,
            maxWidth: 600,
            textAlign: 'center',
          }}
        >
          {subtext}
        </span>
      )}
    </div>
  )
}

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  try {
    const { token } = await params
    const invite = await getInviteForOG(token)

    // Fallback for invalid invite
    if (!invite) {
      return new ImageResponse(
        <FallbackImage
          message="Invite Not Found"
          subtext="This invite link is no longer valid"
        />,
        { ...size }
      )
    }

    // Fallback for expired invite
    if (invite.expired) {
      return new ImageResponse(
        <FallbackImage
          message="Invite Expired"
          subtext="Request a new invite from the task owner"
        />,
        { ...size }
      )
    }

    // Truncate title if too long
    const displayTitle =
      invite.taskTitle.length > 60
        ? invite.taskTitle.substring(0, 57) + '...'
        : invite.taskTitle

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: OG_COLORS.background,
            padding: 56,
          }}
        >
          {/* Top bar: Logo (left) + Badges (right) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <WheelDoBranding size={36} />

            {/* Right side badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {invite.category && (
                <CategoryBadge name={invite.category.name} color={invite.category.color} />
              )}
              {invite.deadline && <DeadlineBadge deadline={new Date(invite.deadline)} />}
            </div>
          </div>

          {/* Center content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: 16,
            }}
          >
            {/* Small label */}
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: OG_COLORS.textSecondary,
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}
            >
              Collaboration Invite
            </span>

            {/* Task title (large, bold) */}
            <span
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: OG_COLORS.textPrimary,
                textAlign: 'center',
                maxWidth: 1000,
                lineHeight: 1.2,
              }}
            >
              {displayTitle}
            </span>
          </div>

          {/* Bottom row: Avatar + Name + Permission badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <OGAvatar
              imageUrl={invite.inviterImage}
              name={invite.inviterName}
              size={44}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: OG_COLORS.textPrimary,
              }}
            >
              {invite.inviterName}
            </span>
            <span
              style={{
                fontSize: 22,
                color: OG_COLORS.textMuted,
              }}
            >
              •
            </span>
            <PermissionBadge canEdit={invite.canEdit} />
          </div>
        </div>
      ),
      { ...size }
    )
  } catch (error) {
    // Log error for debugging but always return a valid image
    console.error('OG image generation failed:', error)
    return new ImageResponse(
      <FallbackImage message="WheelDo" subtext="Task collaboration made easy" />,
      { ...size }
    )
  }
}
