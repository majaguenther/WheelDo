// Type-safe constants with 'as const' for literal types
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const

export const OG_COLORS = {
  background: '#ffffff',
  backgroundSecondary: '#f6f8fa',
  textPrimary: '#1f2328',
  textSecondary: '#656d76',
  textMuted: '#8b949e',
  primary: '#6366f1',
  border: '#d0d7de',
  // Urgency colors mapped to Prisma enum values
  urgency: {
    HIGH: '#cf222e',
    MEDIUM: '#bf8700',
    LOW: '#1a7f37',
  },
  // Effort colors mapped to Prisma enum values
  effort: {
    MINIMAL: '#1a7f37',
    LOW: '#3fb950',
    MODERATE: '#bf8700',
    HIGH: '#db6d28',
    EXTREME: '#cf222e',
  },
} as const
