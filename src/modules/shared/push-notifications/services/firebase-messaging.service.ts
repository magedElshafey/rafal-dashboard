import type { FirebaseApp } from 'firebase/app'
import type { MessagePayload, Messaging } from 'firebase/messaging'

import { getFirebaseMessagingConfig } from '../config/firebase-messaging.config'

export type ForegroundPushMessage = Pick<MessagePayload, 'data' | 'notification'>
export type ForegroundMessageUnsubscribe = () => void
export type FirebaseRegistrationUnsubscribe = () => void

type MessagingContext = {
  messaging: Messaging
  vapidKey: string
}

let appPromise: Promise<FirebaseApp | null> | null = null
let messagingContextPromise: Promise<MessagingContext | null> | null = null
let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null

function hasRequiredBrowserApis(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    window.isSecureContext !== false
  )
}

async function getFirebaseApp(): Promise<FirebaseApp | null> {
  const config = getFirebaseMessagingConfig()
  if (!config) return null

  appPromise ??= import('firebase/app')
    .then(({ getApp, getApps, initializeApp }) =>
      getApps().length > 0 ? getApp() : initializeApp(config.firebaseOptions)
    )
    .catch(() => null)

  return appPromise
}

export async function isFirebaseMessagingSupported(): Promise<boolean> {
  if (!hasRequiredBrowserApis() || !getFirebaseMessagingConfig()) return false

  try {
    const { isSupported } = await import('firebase/messaging')
    return await isSupported()
  } catch {
    return false
  }
}

async function getMessagingContext(): Promise<MessagingContext | null> {
  const config = getFirebaseMessagingConfig()
  if (!config || !(await isFirebaseMessagingSupported())) return null

  messagingContextPromise ??= Promise.all([getFirebaseApp(), import('firebase/messaging')])
    .then(([app, { getMessaging }]) => (app ? { messaging: getMessaging(app), vapidKey: config.vapidKey } : null))
    .catch(() => null)

  return messagingContextPromise
}

function getWorkerUrls() {
  const basePath = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  const workerPath = `${basePath}firebase-messaging-sw.js`

  return {
    workerPath,
    workerUrl: new URL(workerPath, window.location.origin),
    scopeUrl: new URL(basePath, window.location.origin),
  }
}

function registrationUsesMessagingWorker(registration: ServiceWorkerRegistration, workerUrl: URL): boolean {
  const scriptUrl =
    registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL
  return scriptUrl === workerUrl.href
}

async function ensureMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!hasRequiredBrowserApis()) return null

  serviceWorkerRegistrationPromise ??= (async () => {
    const { workerPath, workerUrl, scopeUrl } = getWorkerUrls()
    const existingRegistration = await navigator.serviceWorker.getRegistration(scopeUrl.href)

    if (existingRegistration) {
      return registrationUsesMessagingWorker(existingRegistration, workerUrl) ? existingRegistration : null
    }

    const registration = await navigator.serviceWorker.register(workerPath, { scope: scopeUrl.pathname })
    const readyRegistration = await navigator.serviceWorker.ready

    return registrationUsesMessagingWorker(readyRegistration, workerUrl) ? readyRegistration : registration
  })().catch(() => null)

  return serviceWorkerRegistrationPromise
}

export async function subscribeToFirebaseRegistration(
  onRegistration: (installationId: string) => void
): Promise<FirebaseRegistrationUnsubscribe | null> {
  const [context, serviceWorkerRegistration] = await Promise.all([
    getMessagingContext(),
    ensureMessagingServiceWorker(),
  ])

  if (!context || !serviceWorkerRegistration) return null

  const { onRegistered, register } = await import('firebase/messaging')
  const unsubscribe = onRegistered(context.messaging, onRegistration)

  try {
    await register(context.messaging, {
      vapidKey: context.vapidKey,
      serviceWorkerRegistration,
    })

    return unsubscribe
  } catch (error) {
    unsubscribe()
    throw error
  }
}

export async function subscribeToForegroundMessages(
  onMessageReceived: (message: ForegroundPushMessage) => void
): Promise<ForegroundMessageUnsubscribe | null> {
  const context = await getMessagingContext()
  if (!context) return null

  try {
    const { onMessage } = await import('firebase/messaging')
    return onMessage(context.messaging, onMessageReceived)
  } catch {
    return null
  }
}
