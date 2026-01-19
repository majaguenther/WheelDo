'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/contexts/theme-context'
import type { ThemeId } from '@/types/theme'

interface ProvidersProps {
  children: ReactNode
  initialThemeId?: ThemeId
}

export function Providers({ children, initialThemeId }: ProvidersProps) {
  return (
    <ThemeProvider initialThemeId={initialThemeId}>
      {children}
    </ThemeProvider>
  )
}
