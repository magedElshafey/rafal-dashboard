import { beforeEach, describe, expect, it, vi } from 'vitest'

import { $authHttp } from '@/utils/auth-http'

import { getAdminsDdl } from './admins.ddl.service'

vi.mock('@/utils/auth-http', () => ({ $authHttp: { get: vi.fn() } }))

describe('admins DDL service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests the admins dropdown options from the backend', async () => {
    const options = [{ value: 'admin-1', label: 'Admin Account' }]
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: options } } as never)

    await expect(getAdminsDdl()).resolves.toEqual(options)
    expect($authHttp.get).toHaveBeenCalledWith({
      url: '/v1/ddl/admins',
    })
  })

  it('returns an empty array when the response has no data', async () => {
    vi.mocked($authHttp.get).mockResolvedValue({ data: {} } as never)

    await expect(getAdminsDdl()).resolves.toEqual([])
  })
})
