import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

const get = vi.hoisted(() => vi.fn())

vi.mock('@/utils/auth-http', () => ({ $authHttp: { get } }))

import { getChaptersDdl } from './chapters.ddl.service'

describe('Chapters DDL service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    get.mockResolvedValue({ data: { data: [{ value: 'chapter-1', label: 'Reading' }] } })
  })

  it('uses one request with repeated group_id[] params for all normalized Subgroup IDs', async () => {
    const signal = new AbortController().signal

    await getChaptersDdl({ groupIds: ['sub-3', 'sub-1', 'sub-2', 'sub-1'] }, signal)

    expect(get).toHaveBeenCalledWith({
      url: '/v1/ddl/chapters',
      query: { 'group_id[]': ['sub-1', 'sub-2', 'sub-3'] },
      signal,
    })
    expect(get).toHaveBeenCalledOnce()

    const [{ query }] = get.mock.calls[0]
    const url = axios.getUri({ url: '/v1/ddl/chapters', params: query })
    expect(decodeURIComponent(url)).toBe('/v1/ddl/chapters?group_id[]=sub-1&group_id[]=sub-2&group_id[]=sub-3')
  })

  it('does not send an empty group_id[] param', async () => {
    await getChaptersDdl()

    expect(get).toHaveBeenCalledWith({
      url: '/v1/ddl/chapters',
      query: undefined,
      signal: undefined,
    })
  })
})
