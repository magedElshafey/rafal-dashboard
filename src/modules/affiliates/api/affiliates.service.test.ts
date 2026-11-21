import { beforeEach, describe, expect, it, vi } from 'vitest'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
const createAxios = vi.hoisted(() => vi.fn(() => http))

vi.mock('axios', () => ({ default: { create: createAxios } }))
vi.mock('@/modules/affiliates/config/affiliate-feature', () => ({
  affiliateMockConfig: { baseUrl: 'http://127.0.0.1:4100', token: 'mock-staff-authorized' },
  isAffiliateFeatureEnabled: true,
}))

import { affiliatesService, createAffiliateMockClient } from '@/modules/affiliates/api/affiliates.service'

const rawAffiliate = {
  id: 101,
  name: 'Noura Al Harbi',
  mobile: '+966501112233',
  email: 'noura@example.test',
  platform: 'instagram',
  username: 'noura.styles',
  code: 'NOURA25',
  status: 'active',
  created_at: '2026-11-10T09:30:00.000Z',
  updated_at: '2026-11-10T09:30:00.000Z',
}

beforeEach(() => {
  http.get.mockReset()
  http.post.mockReset()
  createAxios.mockClear()
})

describe('Affiliate mock service', () => {
  it('uses an isolated development token and never reads or forwards the Laravel session token', () => {
    localStorage.setItem('rafal_auth_session', JSON.stringify({ token: 'real-laravel-secret' }))
    createAffiliateMockClient('http://127.0.0.1:4100', 'mock-staff-authorized')

    expect(createAxios).toHaveBeenCalledWith({
      baseURL: 'http://127.0.0.1:4100',
      withCredentials: false,
      headers: { Accept: 'application/json', Authorization: 'Bearer mock-staff-authorized' },
    })
    expect(JSON.stringify(createAxios.mock.calls)).not.toContain('real-laravel-secret')
  })

  it('lists with server pagination plus search and status parameters', async () => {
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawAffiliate],
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      },
    })

    const result = await affiliatesService.list(2, undefined, { search: 'noura', status: 'active' })

    expect(http.get).toHaveBeenCalledWith('/dashboard/affiliates', {
      params: { page: 2, per_page: 15, search: 'noura', status: 'active' },
      signal: undefined,
    })
    expect(result.items[0]).toMatchObject({ id: 101, createdAt: rawAffiliate.created_at })
    expect(result.paginate).toMatchObject({ current_page: 2, total_pages: 3, total: 31 })
  })

  it('creates an Affiliate and preserves 422/409 errors from the isolated client', async () => {
    http.post.mockResolvedValueOnce({ data: { success: true, message: 'created', data: rawAffiliate } })
    await expect(
      affiliatesService.create({
        name: rawAffiliate.name,
        mobile: '0501112233',
        email: rawAffiliate.email,
        platform: rawAffiliate.platform,
        username: rawAffiliate.username,
        code: rawAffiliate.code,
      })
    ).resolves.toMatchObject({ id: 101, code: 'NOURA25' })

    const conflict = Object.assign(new Error('conflict'), { isAxiosError: true, response: { status: 409 } })
    http.post.mockRejectedValueOnce(conflict)
    await expect(affiliatesService.create({} as never)).rejects.toBe(conflict)
  })

  it('fetches an unreserved code suggestion', async () => {
    http.get.mockResolvedValue({
      data: { success: true, message: 'ok', data: { code: 'RAF12AB34CD56', reserved: false } },
    })
    await expect(affiliatesService.suggestCode()).resolves.toEqual({ code: 'RAF12AB34CD56', reserved: false })
    expect(http.get).toHaveBeenCalledWith('/dashboard/affiliates/code-suggestion', { signal: undefined })
  })
})
