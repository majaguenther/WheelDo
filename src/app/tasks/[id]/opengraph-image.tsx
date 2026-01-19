import { ImageResponse } from 'next/og'
import { OG_IMAGE_SIZE, OG_COLORS } from '@/lib/og/constants'
import { WheelDoBranding } from '@/lib/og/components'

export const runtime = 'nodejs'
export const alt = 'WheelDo Task'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

// Generic OG image for task pages - no private data exposed
// Task details are only shown via invite links (/invite/[token])
export default async function Image() {
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
        {/* Logo */}
        <WheelDoBranding size={64} />

        {/* Title */}
        <span
          style={{
            marginTop: 40,
            fontSize: 48,
            fontWeight: 700,
            color: OG_COLORS.textPrimary,
          }}
        >
          WheelDo Task
        </span>

        {/* Tagline */}
        <span
          style={{
            marginTop: 16,
            fontSize: 24,
            color: OG_COLORS.textSecondary,
          }}
        >
          Sign in to view task details
        </span>

        {/* Footer tagline */}
        <span
          style={{
            marginTop: 'auto',
            fontSize: 18,
            color: OG_COLORS.textMuted,
          }}
        >
          Focus on one task at a time
        </span>
      </div>
    ),
    { ...size }
  )
}
