import { beforeEach, describe, expect, it, vi } from 'vitest'

import { $authHttp } from '@/utils/auth-http'

import { getMainGroupsDdl, getSubGroupsDdl } from './groups.ddl.service'

vi.mock('@/utils/auth-http', () => ({ $authHttp: { get: vi.fn() } }))

describe('groups DDL service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('preserves enriched Main Group data and forwards cancellation', async () => {
    const signal = new AbortController().signal
    const options = [{ value: 'group-1', label: 'Group 1', sub_groups_count: 4 }]
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: options } } as never)

    await expect(getMainGroupsDdl(signal)).resolves.toEqual(options)
    expect($authHttp.get).toHaveBeenCalledWith({
      url: '/v1/ddl/groups',
      query: { type: 'main' },
      signal,
    })
  })

  it('keeps the existing Subgroup query contract while forwarding cancellation', async () => {
    const signal = new AbortController().signal
    const options = [{ value: 'sub-1', label: 'Subgroup 1' }]
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: options } } as never)

    await expect(getSubGroupsDdl('group-1', signal)).resolves.toEqual(options)
    expect($authHttp.get).toHaveBeenCalledWith({
      url: '/v1/ddl/groups',
      query: { type: 'sub', group_id: 'group-1' },
      signal,
    })
  })
})
