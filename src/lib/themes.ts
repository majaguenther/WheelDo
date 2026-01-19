import type { Theme, ThemeId, ThemeColors } from '@/types/theme'

export const themes: Record<ThemeId, Theme> = {
  default: {
    id: 'default',
    name: 'Default Indigo',
    description: 'Clean and modern with indigo accents',
    colors: {
      background: '#ffffff',
      foreground: '#0f172a',
      primary: '#6366f1',
      primaryForeground: '#ffffff',
      secondary: '#f1f5f9',
      secondaryForeground: '#0f172a',
      accent: '#8b5cf6',
      muted: '#f8fafc',
      mutedForeground: '#64748b',
      border: '#e2e8f0',
      ring: '#6366f1',
      destructive: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
    },
  },
  'warm-sunset': {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    description: 'Soft rose and burgundy tones',
    colors: {
      background: '#FFF8F3',
      foreground: '#3A2430',
      primary: '#A63A6B',
      primaryForeground: '#ffffff',
      secondary: '#FFF0C9',
      secondaryForeground: '#3A2430',
      accent: '#C94A7A',
      muted: '#FFD6B8',
      mutedForeground: '#8A5A44',
      border: '#FFC1CC',
      ring: '#A63A6B',
      destructive: '#C26A4A',
      success: '#6B8E23',
      warning: '#C26A4A',
    },
  },
  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Calming blue and teal tones',
    colors: {
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      primary: '#0284c7',
      primaryForeground: '#ffffff',
      secondary: '#e0f2fe',
      secondaryForeground: '#0c4a6e',
      accent: '#06b6d4',
      muted: '#e0f2fe',
      mutedForeground: '#0369a1',
      border: '#bae6fd',
      ring: '#0284c7',
      destructive: '#dc2626',
      success: '#059669',
      warning: '#d97706',
    },
  },
  'forest-calm': {
    id: 'forest-calm',
    name: 'Forest Calm',
    description: 'Natural green and earth tones',
    colors: {
      background: '#f0fdf4',
      foreground: '#14532d',
      primary: '#16a34a',
      primaryForeground: '#ffffff',
      secondary: '#dcfce7',
      secondaryForeground: '#14532d',
      accent: '#22c55e',
      muted: '#dcfce7',
      mutedForeground: '#15803d',
      border: '#bbf7d0',
      ring: '#16a34a',
      destructive: '#dc2626',
      success: '#059669',
      warning: '#ca8a04',
    },
  },
  'midnight-purple': {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    description: 'Elegant purple and violet hues',
    colors: {
      background: '#faf5ff',
      foreground: '#3b0764',
      primary: '#9333ea',
      primaryForeground: '#ffffff',
      secondary: '#f3e8ff',
      secondaryForeground: '#3b0764',
      accent: '#a855f7',
      muted: '#f3e8ff',
      mutedForeground: '#7c3aed',
      border: '#e9d5ff',
      ring: '#9333ea',
      destructive: '#dc2626',
      success: '#16a34a',
      warning: '#d97706',
    },
  },
  'coral-reef': {
    id: 'coral-reef',
    name: 'Coral Reef',
    description: 'Warm coral and orange tones',
    colors: {
      background: '#fff7ed',
      foreground: '#7c2d12',
      primary: '#ea580c',
      primaryForeground: '#ffffff',
      secondary: '#ffedd5',
      secondaryForeground: '#7c2d12',
      accent: '#f97316',
      muted: '#fed7aa',
      mutedForeground: '#c2410c',
      border: '#fdba74',
      ring: '#ea580c',
      destructive: '#dc2626',
      success: '#16a34a',
      warning: '#ca8a04',
    },
  },
}

export const themeIds = Object.keys(themes) as ThemeId[]

export function getTheme(id: ThemeId): Theme {
  return themes[id] ?? themes.default
}

export function isValidThemeId(id: string): id is ThemeId {
  return id in themes
}

/**
 * Apply theme colors to CSS custom properties on the document root
 */
export function applyThemeToDOM(colors: ThemeColors): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.style.setProperty('--background', colors.background)
  root.style.setProperty('--foreground', colors.foreground)
  root.style.setProperty('--primary', colors.primary)
  root.style.setProperty('--primary-foreground', colors.primaryForeground)
  root.style.setProperty('--secondary', colors.secondary)
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground)
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--muted', colors.muted)
  root.style.setProperty('--muted-foreground', colors.mutedForeground)
  root.style.setProperty('--border', colors.border)
  root.style.setProperty('--ring', colors.ring)
  root.style.setProperty('--destructive', colors.destructive)
  root.style.setProperty('--success', colors.success)
  root.style.setProperty('--warning', colors.warning)
}

/**
 * Generate inline script content to apply theme before hydration (prevents FOUC)
 */
export function getThemeScript(themeId: ThemeId): string {
  const theme = getTheme(themeId)
  const { colors } = theme

  return `
(function() {
  var root = document.documentElement;
  root.style.setProperty('--background', '${colors.background}');
  root.style.setProperty('--foreground', '${colors.foreground}');
  root.style.setProperty('--primary', '${colors.primary}');
  root.style.setProperty('--primary-foreground', '${colors.primaryForeground}');
  root.style.setProperty('--secondary', '${colors.secondary}');
  root.style.setProperty('--secondary-foreground', '${colors.secondaryForeground}');
  root.style.setProperty('--accent', '${colors.accent}');
  root.style.setProperty('--muted', '${colors.muted}');
  root.style.setProperty('--muted-foreground', '${colors.mutedForeground}');
  root.style.setProperty('--border', '${colors.border}');
  root.style.setProperty('--ring', '${colors.ring}');
  root.style.setProperty('--destructive', '${colors.destructive}');
  root.style.setProperty('--success', '${colors.success}');
  root.style.setProperty('--warning', '${colors.warning}');
})();
`.trim()
}
