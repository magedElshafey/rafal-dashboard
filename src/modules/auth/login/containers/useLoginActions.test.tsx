import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
  startPostLoginPushMessaging: vi.fn(),
  showForegroundPushMessage: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/login' }),
  useNavigate: () => mocks.navigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

vi.mock('@/store/auth', () => ({
  useAuth: (selector: (state: { login: typeof mocks.login }) => unknown) => selector({ login: mocks.login }),
}))

vi.mock('@/config/auth.helpers', () => ({
  getHomePathByRole: () => '/user/home',
  getPortalByPathname: () => 'user',
}))

vi.mock('@/modules/shared/push-notifications/components/AuthenticatedPushMessaging', () => ({
  getPushMessagingAccountKey: ({ portal, role, userId }: { portal: string; role: string; userId: EntityId }) =>
    `${portal}:${role}:${String(userId)}`,
  showForegroundPushMessage: mocks.showForegroundPushMessage,
}))

vi.mock('@/modules/shared/push-notifications/services/push-messaging-session', () => ({
  startPostLoginPushMessaging: mocks.startPostLoginPushMessaging,
}))

import useLoginActions from './useLoginActions'

describe('useLoginActions push permission lifecycle', () => {
  beforeEach(() => {
    mocks.login.mockReset().mockResolvedValue({
      token: 'auth-token',
      portal: 'user',
      role: 'student',
      user: { id: '1', role: 'student' },
    })
    mocks.navigate.mockReset()
    mocks.startPostLoginPushMessaging.mockReset().mockResolvedValue(undefined)
    mocks.showForegroundPushMessage.mockReset()
  })

  it('does not attempt permission from render, hydration, or rerender', () => {
    const { rerender } = renderHook(() => useLoginActions())

    rerender()

    expect(mocks.startPostLoginPushMessaging).not.toHaveBeenCalled()
  })

  it('starts the non-blocking permission flow immediately after a successful login', async () => {
    const { result } = renderHook(() => useLoginActions())

    await act(async () => {
      await result.current.onSubmit({
        phone: '1000000000',
        password: 'password',
        rememberMe: false,
        countryCode: '+20',
      })
    })

    expect(mocks.startPostLoginPushMessaging).toHaveBeenCalledTimes(1)
    expect(mocks.startPostLoginPushMessaging).toHaveBeenCalledWith('user:student:1', mocks.showForegroundPushMessage)
    expect(mocks.navigate).toHaveBeenCalledWith('/user/home', { replace: true })
  })
})
