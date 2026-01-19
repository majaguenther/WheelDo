export interface ThemeColors {
  background: string
  foreground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  muted: string
  mutedForeground: string
  border: string
  ring: string
  destructive: string
  success: string
  warning: string
}

export interface Theme {
  id: ThemeId
  name: string
  description: string
  colors: ThemeColors
}

export type ThemeId =
  | 'default'
  | 'warm-sunset'
  | 'ocean-breeze'
  | 'forest-calm'
  | 'midnight-purple'
  | 'coral-reef'
