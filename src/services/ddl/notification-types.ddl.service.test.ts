import { beforeEach, describe, expect, it, vi } from 'vitest'

import { $authHttp } from '@/utils/auth-http'

import { getNotificationTypesDdl, NOTIFICATION_TYPES_DDL_ENDPOINT } from './notification-types.ddl.service'

vi.mock('@/utils/auth-http', () => ({
  $authHttp: { get: vi.fn() },
}))

describe('notification types DDL service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests user notification types and unwraps the DDL items', async () => {
    const types = [
      { value: 'assignment', label: 'Assignments' },
      { value: 'future-type', label: 'Future type' },
    ]
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: types } } as never)

    await expect(getNotificationTypesDdl()).resolves.toBe(types)
    expect($authHttp.get).toHaveBeenCalledWith({
      url: NOTIFICATION_TYPES_DDL_ENDPOINT,
      query: { actor: 'user' },
    })
  })
})
