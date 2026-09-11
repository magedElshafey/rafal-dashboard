import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  isFirebaseMessagingSupported: vi.fn(),
  subscribeToFirebaseRegistration: vi.fn(),
  subscribeToForegroundMessages: vi.fn(),
  registerDeviceToken: vi.fn(),
  getOrCreateDeviceId: vi.fn(),
  requestPermission: vi.fn(),
  unsubscribeForeground: vi.fn(),
  unsubscribeRegistration: vi.fn(),
}))

vi.mock('./firebase-messaging.service', () => ({
  isFirebaseMessagingSupported: mocks.isFirebaseMessagingSupported,
  subscribeToFirebaseRegistration: mocks.subscribeToFirebaseRegistration,
  subscribeToForegroundMessages: mocks.subscribeToForegroundMessages,
}))

vi.mock('./device-token.service', () => ({ registerDeviceToken: mocks.registerDeviceToken }))
vi.mock('../utils/device-id', () => ({ getOrCreateDeviceId: mocks.getOrCreateDeviceId }))

import {
  requestPushMessagingPermission,
  resetPostLoginPushMessagingAttempts,
  startAuthenticatedPushMessaging,
  startPostLoginPushMessaging,
  stopAuthenticatedPushMessaging,
} from './push-messaging-session'

let registrationCallback: ((installationId: string) => void) | undefined
let foregroundCallback: ((message: { data?: Record<string, string>; notification?: object }) => void) | undefined

function setNotificationPermission(permission: NotificationPermission) {
  vi.stubGlobal('Notification', { permission, requestPermission: mocks.requestPermission })
}

describe('push messaging session', () => {
  beforeEach(() => {
    registrationCallback = undefined
    foregroundCallback = undefined
    mocks.isFirebaseMessagingSupported.mockReset().mockResolvedValue(true)
    mocks.subscribeToFirebaseRegistration
      .mockReset()
      .mockImplementation(async (callback: (installationId: string) => void) => {
        registrationCallback = callback
        return mocks.unsubscribeRegistration
      })
    mocks.subscribeToForegroundMessages
      .mockReset()
      .mockImplementation(
        async (callback: (message: { data?: Record<string, string>; notification?: object }) => void) => {
          foregroundCallback = callback
          return mocks.unsubscribeForeground
        }
      )
    mocks.registerDeviceToken.mockReset().mockResolvedValue(undefined)
    mocks.getOrCreateDeviceId.mockReset().mockReturnValue('browser-device-id')
    mocks.requestPermission.mockReset()
    mocks.unsubscribeForeground.mockReset()
    mocks.unsubscribeRegistration.mockReset()
  })

  afterEach(() => {
    stopAuthenticatedPushMessaging()
    resetPostLoginPushMessagingAttempts()
    vi.unstubAllGlobals()
  })

  it('does not prompt or register during boot when permission is default', async () => {
    setNotificationPermission('default')
    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    expect(mocks.requestPermission).not.toHaveBeenCalled()
    expect(mocks.subscribeToFirebaseRegistration).not.toHaveBeenCalled()
    expect(mocks.registerDeviceToken).not.toHaveBeenCalled()
  })

  it('silently forwards a received FID through the existing backend payload', async () => {
    setNotificationPermission('granted')
    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    registrationCallback?.('firebase-installation-id')

    await vi.waitFor(() =>
      expect(mocks.registerDeviceToken).toHaveBeenCalledWith(
        { firebase_token: 'firebase-installation-id', device_id: 'browser-device-id' },
        expect.any(AbortSignal)
      )
    )
  })

  it('does not subscribe or register when permission is denied', async () => {
    setNotificationPermission('denied')
    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    expect(mocks.subscribeToFirebaseRegistration).not.toHaveBeenCalled()
    expect(mocks.registerDeviceToken).not.toHaveBeenCalled()
  })

  it('requests permission only from the explicit enable path', async () => {
    setNotificationPermission('default')
    mocks.requestPermission.mockImplementation(async () => {
      setNotificationPermission('granted')
      return 'granted'
    })
    await expect(requestPushMessagingPermission()).resolves.toBe('granted')
    expect(mocks.requestPermission).toHaveBeenCalledTimes(1)
  })

  it('attempts permission and registration setup exactly once for one successful login', async () => {
    setNotificationPermission('default')
    mocks.requestPermission.mockImplementation(async () => {
      setNotificationPermission('granted')
      return 'granted'
    })
    await Promise.all([
      startPostLoginPushMessaging('user:student:1', vi.fn()),
      startPostLoginPushMessaging('user:student:1', vi.fn()),
    ])
    expect(mocks.requestPermission).toHaveBeenCalledTimes(1)
    expect(mocks.subscribeToFirebaseRegistration).toHaveBeenCalledTimes(1)
  })

  it('starts silently without another prompt when permission is already granted', async () => {
    setNotificationPermission('granted')
    await startPostLoginPushMessaging('user:student:1', vi.fn())
    expect(mocks.requestPermission).not.toHaveBeenCalled()
    expect(mocks.subscribeToFirebaseRegistration).toHaveBeenCalledTimes(1)
  })

  it('does not prompt or start registration after login when permission is denied', async () => {
    setNotificationPermission('denied')
    await startPostLoginPushMessaging('user:student:1', vi.fn())
    expect(mocks.requestPermission).not.toHaveBeenCalled()
    expect(mocks.subscribeToFirebaseRegistration).not.toHaveBeenCalled()
  })

  it('keeps permission and unsupported Messaging failures non-blocking', async () => {
    setNotificationPermission('default')
    mocks.isFirebaseMessagingSupported.mockResolvedValueOnce(false)
    await expect(requestPushMessagingPermission()).resolves.toBe('unsupported')
    expect(mocks.requestPermission).not.toHaveBeenCalled()

    mocks.isFirebaseMessagingSupported.mockResolvedValue(true)
    mocks.requestPermission.mockRejectedValue(new Error('browser blocked the prompt'))
    await expect(startPostLoginPushMessaging('user:student:1', vi.fn())).resolves.toBeUndefined()
    expect(mocks.subscribeToFirebaseRegistration).not.toHaveBeenCalled()
  })

  it('stops a granted session cleanly when Messaging is unsupported', async () => {
    setNotificationPermission('granted')
    mocks.isFirebaseMessagingSupported.mockResolvedValue(false)
    await expect(startAuthenticatedPushMessaging('user:student:1', vi.fn())).resolves.toBeUndefined()
    expect(mocks.subscribeToForegroundMessages).not.toHaveBeenCalled()
    expect(mocks.subscribeToFirebaseRegistration).not.toHaveBeenCalled()
  })

  it('deduplicates concurrent backend requests and successful callbacks by account plus FID', async () => {
    setNotificationPermission('granted')
    let resolveRequest: (() => void) | undefined
    mocks.registerDeviceToken.mockImplementation(() => new Promise<void>((resolve) => (resolveRequest = resolve)))

    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    registrationCallback?.('shared-fid')
    registrationCallback?.('shared-fid')
    expect(mocks.registerDeviceToken).toHaveBeenCalledTimes(1)

    resolveRequest?.()
    await Promise.resolve()
    await Promise.resolve()
    registrationCallback?.('shared-fid')
    await Promise.resolve()
    expect(mocks.registerDeviceToken).toHaveBeenCalledTimes(1)
  })

  it('releases a failed backend-request guard so a later callback can retry', async () => {
    setNotificationPermission('granted')
    mocks.registerDeviceToken.mockRejectedValueOnce(new Error('backend unavailable')).mockResolvedValue(undefined)

    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    registrationCallback?.('retry-fid')
    await vi.waitFor(() => expect(mocks.registerDeviceToken).toHaveBeenCalledTimes(1))
    await Promise.resolve()
    await Promise.resolve()

    registrationCallback?.('retry-fid')
    await vi.waitFor(() => expect(mocks.registerDeviceToken).toHaveBeenCalledTimes(2))
  })

  it('allows the same FID to register for a different authenticated account', async () => {
    setNotificationPermission('granted')
    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    registrationCallback?.('shared-browser-fid')
    await vi.waitFor(() => expect(mocks.registerDeviceToken).toHaveBeenCalledTimes(1))

    await startAuthenticatedPushMessaging('user:student:2', vi.fn())
    registrationCallback?.('shared-browser-fid')
    await vi.waitFor(() => expect(mocks.registerDeviceToken).toHaveBeenCalledTimes(2))
    expect(mocks.getOrCreateDeviceId).toHaveBeenCalledTimes(2)
  })

  it('prevents stale and aborted registration callbacks from posting', async () => {
    setNotificationPermission('granted')
    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    const staleCallback = registrationCallback
    stopAuthenticatedPushMessaging('user:student:1')
    staleCallback?.('stale-fid')
    await Promise.resolve()
    expect(mocks.registerDeviceToken).not.toHaveBeenCalled()
  })

  it('cleans registration and foreground listeners while preserving foreground delivery', async () => {
    setNotificationPermission('granted')
    const foregroundHandler = vi.fn()
    await Promise.all([
      startAuthenticatedPushMessaging('user:student:1', foregroundHandler),
      startAuthenticatedPushMessaging('user:student:1', foregroundHandler),
    ])
    foregroundCallback?.({ data: { type: 'assignment' } })

    expect(mocks.subscribeToForegroundMessages).toHaveBeenCalledTimes(1)
    expect(mocks.subscribeToFirebaseRegistration).toHaveBeenCalledTimes(1)
    expect(foregroundHandler).toHaveBeenCalledWith({ data: { type: 'assignment' } })

    stopAuthenticatedPushMessaging('user:student:1')
    expect(mocks.unsubscribeForeground).toHaveBeenCalledTimes(1)
    expect(mocks.unsubscribeRegistration).toHaveBeenCalledTimes(1)
  })

  it('releases failed registration-listener setup for a later start attempt', async () => {
    setNotificationPermission('granted')
    mocks.subscribeToFirebaseRegistration
      .mockRejectedValueOnce(new Error('registration failed'))
      .mockResolvedValue(mocks.unsubscribeRegistration)
    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    await startAuthenticatedPushMessaging('user:student:1', vi.fn())
    expect(mocks.subscribeToFirebaseRegistration).toHaveBeenCalledTimes(2)
  })

  it('cleans a registration listener that resolves after logout', async () => {
    setNotificationPermission('granted')
    let resolveSubscription: ((unsubscribe: () => void) => void) | undefined
    mocks.subscribeToFirebaseRegistration.mockImplementation(
      () => new Promise<() => void>((resolve) => (resolveSubscription = resolve))
    )
    const start = startAuthenticatedPushMessaging('user:student:1', vi.fn())
    await vi.waitFor(() => expect(mocks.subscribeToFirebaseRegistration).toHaveBeenCalledTimes(1))
    stopAuthenticatedPushMessaging('user:student:1')
    resolveSubscription?.(mocks.unsubscribeRegistration)
    await start
    expect(mocks.unsubscribeRegistration).toHaveBeenCalledTimes(1)
  })

  it('does not resurrect a logged-out session when support detection resolves late', async () => {
    setNotificationPermission('granted')
    let resolveSupport: ((supported: boolean) => void) | undefined
    mocks.isFirebaseMessagingSupported.mockImplementation(
      () => new Promise<boolean>((resolve) => (resolveSupport = resolve))
    )
    const start = startAuthenticatedPushMessaging('user:student:1', vi.fn())
    stopAuthenticatedPushMessaging('user:student:1')
    resolveSupport?.(true)
    await start
    expect(mocks.subscribeToForegroundMessages).not.toHaveBeenCalled()
    expect(mocks.subscribeToFirebaseRegistration).not.toHaveBeenCalled()
    expect(mocks.registerDeviceToken).not.toHaveBeenCalled()
  })
})
