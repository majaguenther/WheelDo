'use client'

import { Check } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { themes, themeIds } from '@/lib/themes'
import type { Theme, ThemeId } from '@/types/theme'

function ThemeCard({
  theme,
  isSelected,
  isPreview,
  onClick,
}: {
  theme: Theme
  isSelected: boolean
  isPreview: boolean
  onClick: () => void
}) {
  const { colors } = theme

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full p-4 rounded-xl border-2 text-left transition-all
        hover:scale-[1.02] active:scale-[0.98]
        ${
          isSelected || isPreview
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border hover:border-primary/50'
        }
      `}
      style={{ backgroundColor: colors.background }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Check className="w-4 h-4" style={{ color: colors.primaryForeground }} />
        </div>
      )}

      {/* Preview badge */}
      {isPreview && !isSelected && (
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: colors.primary,
            color: colors.primaryForeground,
          }}
        >
          Preview
        </div>
      )}

      {/* Theme name and description */}
      <div className="mb-3">
        <h3 className="font-semibold" style={{ color: colors.foreground }}>
          {theme.name}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
          {theme.description}
        </p>
      </div>

      {/* Color swatches */}
      <div className="flex gap-1.5 mb-3">
        <div
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: colors.primary, borderColor: colors.border }}
          title="Primary"
        />
        <div
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: colors.accent, borderColor: colors.border }}
          title="Accent"
        />
        <div
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: colors.secondary, borderColor: colors.border }}
          title="Secondary"
        />
        <div
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: colors.muted, borderColor: colors.border }}
          title="Muted"
        />
      </div>

      {/* Mini UI mockup */}
      <div
        className="rounded-lg p-2 space-y-1.5"
        style={{ backgroundColor: colors.secondary }}
      >
        {/* Mini task card */}
        <div
          className="rounded p-1.5 flex items-center gap-2"
          style={{ backgroundColor: colors.background }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <div
            className="h-2 rounded flex-1"
            style={{ backgroundColor: colors.muted }}
          />
        </div>
        {/* Mini button */}
        <div
          className="rounded h-5 flex items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <div
            className="w-8 h-1.5 rounded"
            style={{ backgroundColor: colors.primaryForeground }}
          />
        </div>
      </div>
    </button>
  )
}

export function ThemeSelector() {
  const {
    themeId,
    previewThemeId,
    isPreviewMode,
    isPending,
    setTheme,
    previewTheme,
    cancelPreview,
  } = useTheme()

  const handleThemeClick = (id: ThemeId) => {
    if (id === themeId && !isPreviewMode) {
      // Already selected and not previewing, do nothing
      return
    }
    previewTheme(id)
  }

  const handleSave = async () => {
    if (previewThemeId) {
      await setTheme(previewThemeId)
    }
  }

  const handleCancel = () => {
    cancelPreview()
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Theme</p>
        <p className="text-sm text-muted-foreground">
          Choose a color theme for your WheelDo experience.
        </p>
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {themeIds.map((id) => (
          <ThemeCard
            key={id}
            theme={themes[id]}
            isSelected={themeId === id}
            isPreview={previewThemeId === id && previewThemeId !== themeId}
            onClick={() => handleThemeClick(id)}
          />
        ))}
      </div>

      {/* Save/Cancel buttons */}
      {isPreviewMode && (
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isPending ? 'Saving...' : 'Save Theme'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="py-2.5 px-4 rounded-lg border border-border bg-secondary text-secondary-foreground font-medium hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
