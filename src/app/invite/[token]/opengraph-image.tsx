import { ImageResponse } from 'next/og'
import { OG_IMAGE_SIZE, OG_COLORS } from '@/lib/og/constants'
import { WheelDoBranding, OGAvatar, PermissionBadge } from '@/lib/og/components'
import { getInviteForOG } from '@/lib/og/data'

export const runtime = 'nodejs'
export const alt = 'WheelDo Task Invitation'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

// Reusable fallback image component
function FallbackImage({ message }: { message: string }) {
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
      }}
    >
      <WheelDoBranding size={48} />
      <span
        style={{
          marginTop: 24,
          fontSize: 32,
          color: OG_COLORS.textSecondary,
        }}
      >
        {message}
      </span>
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
      return new ImageResponse(<FallbackImage message="Invalid invite" />, { ...size })
    }

    // Fallback for expired invite
    if (invite.expired) {
      return new ImageResponse(<FallbackImage message="Invite expired" />, { ...size })
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
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: OG_COLORS.background,
            padding: 48,
          }}
        >
          {/* Main content card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: OG_COLORS.backgroundSecondary,
              borderRadius: 16,
              border: `1px solid ${OG_COLORS.border}`,
              padding: '48px 64px',
              gap: 24,
            }}
          >
            {/* Inviter section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <OGAvatar
                imageUrl={invite.inviterImage}
                name={invite.inviterName}
                size={64}
              />
              <span style={{ fontSize: 18, color: OG_COLORS.textSecondary }}>
                Invitation from
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: OG_COLORS.textPrimary,
                }}
              >
                {invite.inviterName}
              </span>
            </div>

            {/* Task title (hero) */}
            <span
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: OG_COLORS.textPrimary,
                textAlign: 'center',
                marginTop: 16,
                marginBottom: 8,
                maxWidth: 800,
              }}
            >
              {displayTitle}
            </span>

            {/* Permission badge */}
            <PermissionBadge canEdit={invite.canEdit} />
          </div>

          {/* Footer with branding */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 32,
            }}
          >
            <WheelDoBranding size={32} />
          </div>
        </div>
      ),
      { ...size }
    )
  } catch (error) {
    // Log error for debugging but always return a valid image
    console.error('OG image generation failed:', error)
    return new ImageResponse(<FallbackImage message="WheelDo" />, { ...size })
  }
}
