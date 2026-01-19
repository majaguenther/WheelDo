'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  subscribeToPush,
  unsubscribeFromPush,
  sendPushToUser,
  type PushSubscriptionData,
} from '@/lib/push'

/**
 * Subscribe the current user to push notifications
 */
export async function subscribeUserAction(subscription: PushSubscriptionData) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || undefined

    await subscribeToPush(session.user.id, subscription, userAgent)
    return { success: true }
  } catch (error) {
    console.error('Error subscribing to push:', error)
    return { success: false, error: 'Failed to subscribe' }
  }
}

/**
 * Unsubscribe the current user from push notifications
 */
export async function unsubscribeUserAction(endpoint: string) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    await unsubscribeFromPush(session.user.id, endpoint)
    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing from push:', error)
    return { success: false, error: 'Failed to unsubscribe' }
  }
}

/**
 * Send a test notification to the current user
 */
export async function sendTestNotificationAction(message: string) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const result = await sendPushToUser(session.user.id, {
      title: 'WheelDo Test Notification',
      body: message || 'This is a test notification from WheelDo!',
      url: '/dashboard',
    })

    if (result.successful === 0) {
      return { success: false, error: 'No active subscriptions found' }
    }

    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending test notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}
