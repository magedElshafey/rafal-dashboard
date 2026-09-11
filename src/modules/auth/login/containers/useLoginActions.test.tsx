import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ login: vi.fn(), navigate: vi.fn() }))

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('@/store/auth', () => ({
  useAuth: (selector: (state: { login: typeof mocks.login }) => unknown) => selector({ login: mocks.login }),
}))

import useLoginActions from './useLoginActions'

describe('useLoginActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.login.mockResolvedValue({ token: 'token', role: null, user: { id: '1', name: 'Admin', phone: null } })
  })

  it('uses the neutral login action and redirects to /dashboard', async () => {
    const { result } = renderHook(() => useLoginActions())
    const values = { phone: '1000000000', password: 'password', rememberMe: true, countryCode: '+20' }

    await act(async () => result.current.onSubmit(values))

    expect(mocks.login).toHaveBeenCalledWith(values)
    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })
})
