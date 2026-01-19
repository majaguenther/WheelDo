import { ImageResponse } from 'next/og'
import { OG_IMAGE_SIZE, OG_COLORS } from '@/lib/og/constants'
import { WheelDoLogo } from '@/lib/og/components'

export const runtime = 'nodejs'
export const alt = 'WheelDo - Focus on One Task at a Time'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

export default function Image() {
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
          padding: 60,
        }}
      >
        {/* Main content card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: OG_COLORS.backgroundSecondary,
            borderRadius: 24,
            border: `1px solid ${OG_COLORS.border}`,
            padding: '60px 80px',
            gap: 32,
          }}
        >
          {/* Logo */}
          <WheelDoLogo size={80} />

          {/* Title */}
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: OG_COLORS.textPrimary,
              letterSpacing: '-0.02em',
            }}
          >
            WheelDo
          </span>

          {/* Tagline */}
          <span
            style={{
              fontSize: 28,
              color: OG_COLORS.textSecondary,
              textAlign: 'center',
            }}
          >
            Focus on one task at a time
          </span>

          {/* Feature badges */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 16,
            }}
          >
            {['Single Focus', 'Spin the Wheel', 'Task Dependencies'].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    backgroundColor: `${OG_COLORS.primary}10`,
                    borderRadius: 9999,
                    border: `1px solid ${OG_COLORS.primary}30`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: OG_COLORS.primary,
                    }}
                  >
                    {feature}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
