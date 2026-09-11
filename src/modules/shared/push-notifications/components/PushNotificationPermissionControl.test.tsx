import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAuth } from '@/store/auth'

const mocks = vi.hoisted(() => ({
  isFirebaseMessagingSupported: vi.fn(),
  requestPushMessagingPermission: vi.fn(),
  startAuthenticatedPushMessaging: vi.fn(),
  toastInfo: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { info: mocks.toastInfo },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../services/firebase-messaging.service', () => ({
  isFirebaseMessagingSupported: mocks.isFirebaseMessagingSupported,
}))

vi.mock('../services/push-messaging-session', () => ({
  requestPushMessagingPermission: mocks.requestPushMessagingPermission,
  startAuthenticatedPushMessaging: mocks.startAuthenticatedPushMessaging,
  stopAuthenticatedPushMessaging: vi.fn(),
}))

import { PushNotificationPermissionControl } from './PushNotificationPermissionControl'

describe('PushNotificationPermissionControl', () => {
  beforeEach(() => {
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn(),
    })
    mocks.isFirebaseMessagingSupported.mockReset().mockResolvedValue(true)
    mocks.requestPushMessagingPermission.mockReset().mockResolvedValue('granted')
    mocks.startAuthenticatedPushMessaging.mockReset().mockResolvedValue(undefined)
    mocks.toastInfo.mockReset()
    useAuth.setState({
      isAuthenticated: true,
      portal: 'user',
      role: 'student',
      user: {
        id: '1',
        role: 'student',
        name: 'Student',
        phone: null,
        group: {
          id: '1',
          name: 'Group',
          parent: { id: '1', name: 'Parent' },
        },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAuth.setState({
      isAuthenticated: false,
      portal: null,
      role: null,
      user: null,
      token: null,
    })
  })

  it('waits for an explicit click before enabling push notifications', async () => {
    const user = userEvent.setup()
    render(<PushNotificationPermissionControl />)

    const enableButton = await screen.findByRole('button', {
      name: 'notifications.actions.enable_push',
    })
    expect(mocks.requestPushMessagingPermission).not.toHaveBeenCalled()

    await user.click(enableButton)

    await waitFor(() => expect(mocks.requestPushMessagingPermission).toHaveBeenCalledTimes(1))
    expect(mocks.startAuthenticatedPushMessaging).toHaveBeenCalledWith('user:student:1', expect.any(Function))
  })

  it('registers the account that is current when a delayed permission prompt resolves', async () => {
    let resolvePermission: ((permission: NotificationPermission) => void) | undefined
    mocks.requestPushMessagingPermission.mockImplementation(
      () => new Promise<NotificationPermission>((resolve) => (resolvePermission = resolve))
    )
    const user = userEvent.setup()
    render(<PushNotificationPermissionControl />)

    await user.click(
      await screen.findByRole('button', {
        name: 'notifications.actions.enable_push',
      })
    )
    await waitFor(() => expect(mocks.requestPushMessagingPermission).toHaveBeenCalledTimes(1))

    useAuth.setState({ portal: 'teacher', role: 'teacher', user: { ...useAuth.getState().user!, role: 'teacher' } })
    resolvePermission?.('granted')

    await waitFor(() =>
      expect(mocks.startAuthenticatedPushMessaging).toHaveBeenCalledWith('teacher:teacher:1', expect.any(Function))
    )
    expect(mocks.startAuthenticatedPushMessaging).not.toHaveBeenCalledWith('user:student:1', expect.any(Function))
  })

  it('keeps the enable control available when permission remains default', async () => {
    mocks.requestPushMessagingPermission.mockResolvedValue('default')
    const user = userEvent.setup()
    render(<PushNotificationPermissionControl />)

    await user.click(
      await screen.findByRole('button', {
        name: 'notifications.actions.enable_push',
      })
    )

    expect(
      await screen.findByRole('button', {
        name: 'notifications.actions.enable_push',
      })
    ).toBeInTheDocument()
  })

  it('explains browser settings without requesting permission again when denied', async () => {
    vi.stubGlobal('Notification', {
      permission: 'denied',
      requestPermission: vi.fn(),
    })
    const user = userEvent.setup()
    render(<PushNotificationPermissionControl />)

    await user.click(
      await screen.findByRole('button', {
        name: 'notifications.actions.enable_push',
      })
    )

    expect(mocks.requestPushMessagingPermission).not.toHaveBeenCalled()
    expect(mocks.toastInfo).toHaveBeenCalledWith('notifications.feedback.push_permission_denied')
  })
})
