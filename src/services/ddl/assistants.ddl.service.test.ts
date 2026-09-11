import { beforeEach, describe, expect, it, vi } from 'vitest'

import { $authHttp } from '@/utils/auth-http'

import { getAssistantsDdl } from './assistants.ddl.service'

vi.mock('@/utils/auth-http', () => ({ $authHttp: { get: vi.fn() } }))

describe('assistants DDL service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the selected subgroup through the confirmed backend group_id parameter', async () => {
    const options = [{ value: 'assistant-1', label: 'Mona' }]
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: options } } as never)

    await expect(getAssistantsDdl({ group: ' sub-1 ' })).resolves.toEqual(options)
    expect($authHttp.get).toHaveBeenCalledWith({
      url: '/v1/ddl/assistants',
      query: { group_id: 'sub-1' },
    })
  })

  it('retains group_id as a backward-compatible input and transport for existing direct callers', async () => {
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: [] } } as never)

    await getAssistantsDdl({ group_id: ' legacy-subgroup ' })

    expect($authHttp.get).toHaveBeenCalledWith({
      url: '/v1/ddl/assistants',
      query: { group_id: 'legacy-subgroup' },
    })
  })

  it('requests all assistants without sending a group filter', async () => {
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: [] } } as never)

    await expect(getAssistantsDdl({})).resolves.toEqual([])
    expect($authHttp.get).toHaveBeenCalledWith({
      url: '/v1/ddl/assistants',
      query: undefined,
    })
  })
})
