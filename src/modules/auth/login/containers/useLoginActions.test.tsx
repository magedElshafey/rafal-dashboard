import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }))
vi.mock('@/store/auth', () => ({
  useAuth: (selector: (state: { login: typeof mocks.login }) => unknown) => selector({ login: mocks.login }),
}))

import useLoginActions from './useLoginActions'

const values = { email: 'admin@example.com', password: 'password' }

describe('useLoginActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.login.mockResolvedValue({
      token: 'token',
      admin: { id: 1, name: 'Admin', email: values.email, roles: ['Super Admin'] },
    })
  })

  it('uses the real login action and redirects to the dashboard', async () => {
    const { result } = renderHook(() => useLoginActions())

    await act(async () => result.current.onSubmit(values))

    expect(mocks.login).toHaveBeenCalledWith(values)
    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('keeps the email default available and shows localized safe feedback after failure', async () => {
    mocks.login.mockRejectedValue(new Error('raw backend failure'))
    const { result } = renderHook(() => useLoginActions())

    await act(async () => result.current.onSubmit(values))

    expect(result.current.defaultValues).toEqual({ email: '', password: '' })
    expect(mocks.toastError).toHaveBeenCalledWith('auth.login.server_error')
    expect(mocks.navigate).not.toHaveBeenCalled()
  })

  it('prevents duplicate login submissions while one is pending', async () => {
    let resolveLogin: (() => void) | undefined
    mocks.login.mockReturnValue(new Promise<void>((resolve) => (resolveLogin = resolve)))
    const { result } = renderHook(() => useLoginActions())

    let firstSubmit: Promise<void> | undefined
    await act(async () => {
      firstSubmit = result.current.onSubmit(values)
      await result.current.onSubmit(values)
    })

    expect(mocks.login).toHaveBeenCalledOnce()

    await act(async () => {
      resolveLogin?.()
      await firstSubmit
    })
  })
})
