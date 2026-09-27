import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: { post: mocks.post } }))

import { loginRequest } from './login.service'

describe('loginRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts only email and password as multipart data to the dashboard login endpoint', async () => {
    const responseData = {
      admin: { id: 1, name: 'Admin', email: 'admin@example.com', roles: ['Super Admin'] },
      token: 'token',
      roles: ['Super Admin'],
    }
    mocks.post.mockResolvedValue({ data: { data: responseData } })

    await expect(loginRequest({ email: 'admin@example.com', password: 'password' })).resolves.toEqual(responseData)

    expect(mocks.post).toHaveBeenCalledOnce()
    const request = mocks.post.mock.calls[0]?.[0] as {
      url: string
      data: FormData
      isFormData: boolean
      suppressErrorNotification: boolean
    }
    expect(request.url).toBe('/dashboard/auth/login')
    expect(request.isFormData).toBe(true)
    expect(request.suppressErrorNotification).toBe(true)
    expect(Array.from(request.data.entries())).toEqual([
      ['email', 'admin@example.com'],
      ['password', 'password'],
    ])
  })
})
