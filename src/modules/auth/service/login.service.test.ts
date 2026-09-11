import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: { post: mocks.post } }))

import { loginRequest } from './login.service'

describe('loginRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the canonical HTTP client and neutral auth endpoint', async () => {
    const responseData = { token: 'token', user: { id: '1', name: 'Admin', phone: null } }
    mocks.post.mockResolvedValue({ data: { data: responseData } })

    await expect(
      loginRequest({ phone: '1000000000', password: 'password', rememberMe: true, countryCode: '+20' })
    ).resolves.toEqual(responseData)

    expect(mocks.post).toHaveBeenCalledWith({
      url: '/auth/login',
      data: {
        phone: '1000000000',
        password: 'password',
        remember_me: 1,
        country_code: '+20',
      },
      isFormData: false,
    })
  })
})
