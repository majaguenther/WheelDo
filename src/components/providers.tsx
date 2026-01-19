'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/contexts/theme-context'
import { PWAProvider, InstallPrompt } from '@/components/pwa'
import type { ThemeId } from '@/types/theme'

interface ProvidersProps {
  children: ReactNode
  initialThemeId?: ThemeId
}

export function Providers({ children, initialThemeId }: ProvidersProps) {
  return (
    <ThemeProvider initialThemeId={initialThemeId}>
      <PWAProvider>
        {children}
        <InstallPrompt />
      </PWAProvider>
    </ThemeProvider>
  )
}
