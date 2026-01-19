'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Share } from 'lucide-react'
import { usePWA } from './pwa-provider'

const DISMISS_STORAGE_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function InstallPrompt() {
  const { isInstallable, isInstalled, installPrompt } = usePWA()
  const [isDismissed, setIsDismissed] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  // Check if the prompt was previously dismissed and detect iOS
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      // @ts-expect-error - MSStream is IE-specific
      !window.MSStream

    setIsIOS(isIOSDevice)

    const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY)
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      const now = Date.now()
      // If dismissed more than 7 days ago, show again
      if (now - dismissedTime > DISMISS_DURATION_MS) {
        localStorage.removeItem(DISMISS_STORAGE_KEY)
        setIsDismissed(false)
      }
    } else {
      setIsDismissed(false)
    }
  }, [])

  // Show the prompt after a delay and when conditions are met
  useEffect(() => {
    // For iOS, show if not installed and not dismissed
    // For other browsers, show only if installable
    const shouldShow = isIOS
      ? !isInstalled && !isDismissed
      : isInstallable && !isInstalled && !isDismissed

    if (!shouldShow) {
      setIsVisible(false)
      return
    }

    // Show after 3 seconds to not interrupt initial experience
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isInstallable, isInstalled, isDismissed, isIOS])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString())
    setIsDismissed(true)
    setIsVisible(false)
  }

  const handleInstall = async () => {
    await installPrompt()
    setIsVisible(false)
  }

  if (!isVisible) return null

  // iOS-specific install instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-[5.5rem] left-4 right-4 z-[60] mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300 md:bottom-4 md:left-auto md:right-4">
        <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="font-medium text-foreground">Install WheelDo</h3>
              <p className="text-sm text-muted-foreground">
                Add to your home screen for the best experience.
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* iOS Installation Instructions */}
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-foreground">
              To install this app on your iOS device:
            </p>
            <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  1
                </span>
                <span>
                  Tap the share button{' '}
                  <Share className="inline h-4 w-4 text-primary" />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  2
                </span>
                <span>Scroll down and tap &quot;Add to Home Screen&quot;</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  3
                </span>
                <span>Tap &quot;Add&quot; to confirm</span>
              </li>
            </ol>
          </div>

          <div className="mt-4">
            <button
              onClick={handleDismiss}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Standard install prompt for other browsers
  return (
    <div className="fixed bottom-[5.5rem] left-4 right-4 z-[60] mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300 md:bottom-4 md:left-auto md:right-4">
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="font-medium text-foreground">Install WheelDo</h3>
            <p className="text-sm text-muted-foreground">
              Add to your home screen for quick access and offline support.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
