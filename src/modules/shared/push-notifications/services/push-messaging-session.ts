import type {
  FirebaseRegistrationUnsubscribe,
  ForegroundMessageUnsubscribe,
  ForegroundPushMessage,
} from './firebase-messaging.service'
import {
  isFirebaseMessagingSupported,
  subscribeToFirebaseRegistration,
  subscribeToForegroundMessages,
} from './firebase-messaging.service'
import { registerDeviceToken } from './device-token.service'
import { getOrCreateDeviceId } from '../utils/device-id'

export type PushPermissionResult = NotificationPermission | 'unsupported'

type ActiveSession = {
  accountKey: string
  abortController: AbortController
  generation: number
  listenerPromise: Promise<void> | null
  registrationListenerPromise: Promise<void> | null
  registrationKeys: Set<string>
  unsubscribeRegistration: FirebaseRegistrationUnsubscribe | null
  unsubscribeForeground: ForegroundMessageUnsubscribe | null
  onForegroundMessage: (message: ForegroundPushMessage) => void
}

let activeSession: ActiveSession | null = null
let nextGeneration = 0
const registrationPromises = new Map<string, Promise<void>>()
const successfulRegistrations = new Set<string>()
const postLoginPermissionAttempts = new Set<string>()

function isCurrentSession(session: ActiveSession): boolean {
  return activeSession?.generation === session.generation && activeSession.accountKey === session.accountKey
}

function ensureForegroundListener(session: ActiveSession): Promise<void> {
  session.listenerPromise ??= subscribeToForegroundMessages((message) => {
    if (isCurrentSession(session)) session.onForegroundMessage(message)
  }).then((unsubscribe) => {
    if (!unsubscribe) return

    if (!isCurrentSession(session)) {
      unsubscribe()
      return
    }

    session.unsubscribeForeground = unsubscribe
  })

  return session.listenerPromise
}

function getRegistrationKey(accountKey: string, installationId: string): string {
  return `${accountKey}\u0000${installationId}`
}

function registerInstallation(session: ActiveSession, installationId: string): Promise<void> {
  const normalizedInstallationId = installationId.trim()
  if (!normalizedInstallationId || !isCurrentSession(session) || session.abortController.signal.aborted) {
    return Promise.resolve()
  }

  const registrationKey = getRegistrationKey(session.accountKey, normalizedInstallationId)
  if (successfulRegistrations.has(registrationKey)) return Promise.resolve()

  const existingRegistration = registrationPromises.get(registrationKey)
  if (existingRegistration) return existingRegistration

  const registration = (async () => {
    const deviceId = getOrCreateDeviceId()
    if (!isCurrentSession(session) || session.abortController.signal.aborted) return

    await registerDeviceToken(
      {
        firebase_token: normalizedInstallationId,
        device_id: deviceId,
      },
      session.abortController.signal
    )

    if (isCurrentSession(session) && !session.abortController.signal.aborted) {
      successfulRegistrations.add(registrationKey)
    }
  })().catch(() => undefined)

  session.registrationKeys.add(registrationKey)
  registrationPromises.set(registrationKey, registration)
  void registration.then(() => {
    if (registrationPromises.get(registrationKey) === registration) {
      registrationPromises.delete(registrationKey)
    }
  })
  return registration
}

function ensureRegistrationListener(session: ActiveSession): Promise<void> {
  if (session.registrationListenerPromise) return session.registrationListenerPromise

  const listenerPromise = subscribeToFirebaseRegistration((installationId) => {
    void registerInstallation(session, installationId)
  })
    .then((unsubscribe) => {
      if (!unsubscribe) {
        if (isCurrentSession(session) && session.registrationListenerPromise === listenerPromise) {
          session.registrationListenerPromise = null
        }
        return
      }

      if (!isCurrentSession(session)) {
        unsubscribe()
        return
      }

      session.unsubscribeRegistration = unsubscribe
    })
    .catch(() => {
      if (isCurrentSession(session) && session.registrationListenerPromise === listenerPromise) {
        session.registrationListenerPromise = null
      }
    })

  session.registrationListenerPromise = listenerPromise
  return listenerPromise
}

export async function startAuthenticatedPushMessaging(
  accountKey: string,
  onForegroundMessage: (message: ForegroundPushMessage) => void
): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

  if (activeSession?.accountKey !== accountKey) {
    stopAuthenticatedPushMessaging()
    activeSession = {
      accountKey,
      abortController: new AbortController(),
      generation: ++nextGeneration,
      listenerPromise: null,
      registrationListenerPromise: null,
      registrationKeys: new Set(),
      unsubscribeRegistration: null,
      unsubscribeForeground: null,
      onForegroundMessage,
    }
  } else {
    activeSession.onForegroundMessage = onForegroundMessage
  }

  const session = activeSession
  if (!(await isFirebaseMessagingSupported())) {
    if (isCurrentSession(session)) stopAuthenticatedPushMessaging(accountKey)
    return
  }

  if (!isCurrentSession(session) || session.abortController.signal.aborted) return

  await Promise.all([ensureForegroundListener(session), ensureRegistrationListener(session)])
}

export async function requestPushMessagingPermission(): Promise<PushPermissionResult> {
  if (!(await isFirebaseMessagingSupported())) return 'unsupported'

  return Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission
}

export async function startPostLoginPushMessaging(
  accountKey: string,
  onForegroundMessage: (message: ForegroundPushMessage) => void
): Promise<void> {
  if (postLoginPermissionAttempts.has(accountKey)) return

  postLoginPermissionAttempts.add(accountKey)

  try {
    const permission = await requestPushMessagingPermission()
    if (permission === 'granted') {
      await startAuthenticatedPushMessaging(accountKey, onForegroundMessage)
    }
  } catch {
    // Permission and Messaging failures must never block a successful login.
  }
}

export function resetPostLoginPushMessagingAttempts(): void {
  postLoginPermissionAttempts.clear()
}

export function stopAuthenticatedPushMessaging(accountKey?: string): void {
  if (!activeSession || (accountKey && activeSession.accountKey !== accountKey)) return

  activeSession.abortController.abort()
  activeSession.unsubscribeForeground?.()
  activeSession.unsubscribeRegistration?.()
  for (const registrationKey of activeSession.registrationKeys) {
    registrationPromises.delete(registrationKey)
    successfulRegistrations.delete(registrationKey)
  }
  activeSession = null
  nextGeneration += 1
}
