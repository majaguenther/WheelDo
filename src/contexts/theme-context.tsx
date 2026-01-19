'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
  useEffect,
  ReactNode,
} from 'react'
import type { Theme, ThemeId } from '@/types/theme'
import { getTheme, applyThemeToDOM } from '@/lib/themes'

interface ThemeContextValue {
  /** Current saved theme ID */
  themeId: ThemeId
  /** Full theme object with colors */
  theme: Theme
  /** Currently previewing theme ID (if different from saved) */
  previewThemeId: ThemeId | null
  /** Whether in preview mode */
  isPreviewMode: boolean
  /** Loading state during save */
  isPending: boolean
  /** Save theme to database */
  setTheme: (id: ThemeId) => Promise<void>
  /** Apply theme temporarily for live preview */
  previewTheme: (id: ThemeId) => void
  /** Cancel preview and revert to saved theme */
  cancelPreview: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  children: ReactNode
  initialThemeId?: ThemeId
}

export function ThemeProvider({
  children,
  initialThemeId = 'default',
}: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<ThemeId>(initialThemeId)
  const [previewThemeId, setPreviewThemeId] = useState<ThemeId | null>(null)
  const [isPending, startTransition] = useTransition()

  // Get the active theme (preview or saved)
  const activeThemeId = previewThemeId ?? themeId
  const theme = getTheme(activeThemeId)

  // Apply theme to DOM when active theme changes
  useEffect(() => {
    applyThemeToDOM(theme.colors)
  }, [theme])

  // Preview a theme without saving
  const previewTheme = useCallback((id: ThemeId) => {
    setPreviewThemeId(id)
  }, [])

  // Cancel preview and revert to saved theme
  const cancelPreview = useCallback(() => {
    setPreviewThemeId(null)
  }, [])

  // Save theme to database
  const setTheme = useCallback(
    async (id: ThemeId) => {
      startTransition(async () => {
        try {
          const response = await fetch('/api/user/theme', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ themeId: id }),
          })

          if (!response.ok) {
            throw new Error('Failed to save theme')
          }

          setThemeIdState(id)
          setPreviewThemeId(null) // Clear preview state after save
        } catch (error) {
          console.error('Failed to save theme:', error)
          // Revert preview on error
          setPreviewThemeId(null)
          throw error
        }
      })
    },
    []
  )

  const value: ThemeContextValue = {
    themeId,
    theme,
    previewThemeId,
    isPreviewMode: previewThemeId !== null && previewThemeId !== themeId,
    isPending,
    setTheme,
    previewTheme,
    cancelPreview,
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
