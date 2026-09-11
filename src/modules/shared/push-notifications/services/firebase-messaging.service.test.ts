import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getApp: vi.fn(),
  getApps: vi.fn(),
  initializeApp: vi.fn(),
  getMessaging: vi.fn(),
  getToken: vi.fn(),
  isSupported: vi.fn(),
  onRegistered: vi.fn(),
  register: vi.fn(),
  unsubscribeRegistration: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  getApp: mocks.getApp,
  getApps: mocks.getApps,
  initializeApp: mocks.initializeApp,
}))

vi.mock('firebase/messaging', () => ({
  getMessaging: mocks.getMessaging,
  getToken: mocks.getToken,
  isSupported: mocks.isSupported,
  onRegistered: mocks.onRegistered,
  register: mocks.register,
}))

vi.mock('../config/firebase-messaging.config', () => ({
  getFirebaseMessagingConfig: () => ({
    firebaseOptions: { projectId: 'smart-hub-test' },
    vapidKey: 'configured-vapid-key',
  }),
}))

describe('Firebase Messaging registration', () => {
  const firebaseApp = { name: '[DEFAULT]' }
  const messaging = { app: firebaseApp }
  const workerRegistration = {
    active: { scriptURL: new URL('/firebase-messaging-sw.js', window.location.origin).href },
  } as unknown as ServiceWorkerRegistration

  beforeEach(() => {
    vi.resetModules()
    mocks.getApp.mockReset()
    mocks.getApps.mockReset().mockReturnValue([])
    mocks.initializeApp.mockReset().mockReturnValue(firebaseApp)
    mocks.getMessaging.mockReset().mockReturnValue(messaging)
    mocks.getToken.mockReset()
    mocks.isSupported.mockReset().mockResolvedValue(true)
    mocks.onRegistered.mockReset().mockReturnValue(mocks.unsubscribeRegistration)
    mocks.register.mockReset().mockResolvedValue(undefined)
    mocks.unsubscribeRegistration.mockReset()

    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
    vi.stubGlobal('Notification', { permission: 'granted' })
    vi.stubGlobal('PushManager', class PushManager {})
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(workerRegistration),
        register: vi.fn(),
        ready: Promise.resolve(workerRegistration),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('attaches onRegistered before register and forwards the configured worker and VAPID key', async () => {
    const order: string[] = []
    let registeredCallback: ((installationId: string) => void) | undefined
    const onInstallationId = vi.fn()
    mocks.onRegistered.mockImplementation((_messaging, callback: (installationId: string) => void) => {
      order.push('onRegistered')
      registeredCallback = callback
      return mocks.unsubscribeRegistration
    })
    mocks.register.mockImplementation(async () => {
      order.push('register')
      registeredCallback?.('installation-id')
    })
    const { subscribeToFirebaseRegistration } = await import('./firebase-messaging.service')

    await expect(subscribeToFirebaseRegistration(onInstallationId)).resolves.toBe(mocks.unsubscribeRegistration)

    expect(order).toEqual(['onRegistered', 'register'])
    expect(mocks.onRegistered).toHaveBeenCalledWith(messaging, onInstallationId)
    expect(mocks.register).toHaveBeenCalledWith(messaging, {
      vapidKey: 'configured-vapid-key',
      serviceWorkerRegistration: workerRegistration,
    })
    expect(onInstallationId).toHaveBeenCalledWith('installation-id')
    expect(mocks.getToken).not.toHaveBeenCalled()
  })

  it('unsubscribes and rejects when register fails so the caller can retry', async () => {
    mocks.register.mockRejectedValue(new Error('registration failed'))
    const { subscribeToFirebaseRegistration } = await import('./firebase-messaging.service')

    await expect(subscribeToFirebaseRegistration(vi.fn())).rejects.toThrow('registration failed')

    expect(mocks.unsubscribeRegistration).toHaveBeenCalledTimes(1)
    expect(mocks.getToken).not.toHaveBeenCalled()
  })
})
