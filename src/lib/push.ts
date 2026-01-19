import 'server-only'
import webpush from 'web-push'
import { db } from './db'

// Configure VAPID details
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'noreply@wheeldo.app'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

/**
 * Subscribe a user to push notifications
 */
export async function subscribeToPush(
  userId: string,
  subscription: PushSubscriptionData,
  userAgent?: string
) {
  // Upsert to handle re-subscriptions from the same endpoint
  return db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
      updatedAt: new Date(),
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
    },
  })
}

/**
 * Unsubscribe a user from push notifications
 */
export async function unsubscribeFromPush(userId: string, endpoint: string) {
  return db.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint,
    },
  })
}

/**
 * Get all push subscriptions for a user
 */
export async function getUserPushSubscriptions(userId: string) {
  return db.pushSubscription.findMany({
    where: { userId },
  })
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.svg',
        badge: payload.badge || '/icons/icon-192x192.svg',
        url: payload.url || '/dashboard',
        tag: payload.tag,
      })
    )
    return { success: true }
  } catch (error) {
    // If subscription is no longer valid, remove it
    if (error instanceof webpush.WebPushError && error.statusCode === 410) {
      await db.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      })
    }
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

/**
 * Send a push notification to all of a user's subscriptions
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await getUserPushSubscriptions(userId)

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  )

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length

  return {
    total: subscriptions.length,
    successful,
    failed: subscriptions.length - successful,
  }
}

/**
 * Send a push notification to multiple users
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  )

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length

  return {
    total: subscriptions.length,
    successful,
    failed: subscriptions.length - successful,
  }
}

/**
 * Check if VAPID keys are configured
 */
export function isWebPushConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  )
}
