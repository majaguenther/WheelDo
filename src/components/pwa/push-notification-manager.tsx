'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Send, Loader2 } from 'lucide-react'
import {
  subscribeUserAction,
  unsubscribeUserAction,
  sendTestNotificationAction,
} from '@/app/actions/push'

/**
 * Convert a base64 string to a Uint8Array for the applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check if push notifications are supported and get current subscription
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return
    }

    setIsSupported(true)

    // Check for existing subscription
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const existingSub = await registration.pushManager.getSubscription()
        setSubscription(existingSub)
        setIsSubscribed(!!existingSub)
      } catch (err) {
        console.error('Error checking push subscription:', err)
      }
    }

    checkSubscription()
  }, [])

  const subscribeToPush = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setError('Push notifications are not configured')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      })

      // Send subscription to server
      const subJson = sub.toJSON()
      const result = await subscribeUserAction({
        endpoint: sub.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || '',
        },
      })

      if (result.success) {
        setSubscription(sub)
        setIsSubscribed(true)
        setSuccess('Successfully subscribed to push notifications!')
      } else {
        setError(result.error || 'Failed to subscribe')
        // Unsubscribe from browser if server failed
        await sub.unsubscribe()
      }
    } catch (err) {
      console.error('Error subscribing to push:', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Permission denied. Please enable notifications in your browser settings.')
      } else {
        setError('Failed to subscribe to push notifications')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Unsubscribe from browser
      await subscription.unsubscribe()

      // Remove from server
      await unsubscribeUserAction(subscription.endpoint)

      setSubscription(null)
      setIsSubscribed(false)
      setSuccess('Successfully unsubscribed from push notifications')
    } catch (err) {
      console.error('Error unsubscribing from push:', err)
      setError('Failed to unsubscribe')
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  const sendTestNotification = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await sendTestNotificationAction(
        message || 'Hello from WheelDo!'
      )

      if (result.success) {
        setSuccess('Test notification sent!')
        setMessage('')
      } else {
        setError(result.error || 'Failed to send notification')
      }
    } catch (err) {
      console.error('Error sending test notification:', err)
      setError('Failed to send test notification')
    } finally {
      setIsLoading(false)
    }
  }, [message])

  // Clear messages after a delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <BellOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported in this browser.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isSubscribed ? 'bg-primary/10' : 'bg-muted'
          }`}
        >
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {isSubscribed
              ? 'You will receive notifications for task updates.'
              : 'Enable notifications to stay updated on your tasks.'}
          </p>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 space-y-3">
        {isSubscribed ? (
          <>
            {/* Test notification */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Test message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={sendTestNotification}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Test
              </button>
            </div>

            {/* Unsubscribe */}
            <button
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                'Disable Notifications'
              )}
            </button>
          </>
        ) : (
          <button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              'Enable Notifications'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
