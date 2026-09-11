import { beforeEach, describe, expect, it, vi } from 'vitest'

import { $authHttp } from '@/utils/auth-http'

import { getCountriesDdl } from './countries.ddl.service'

vi.mock('@/utils/auth-http', () => ({ $authHttp: { get: vi.fn() } }))

describe('countries DDL service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the complete shared country identity contract', async () => {
    const countries = [{ value: 'eg', label: 'Egypt', iso2: 'EG', phone_code: '+20' }]
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: countries } } as never)

    await expect(getCountriesDdl()).resolves.toEqual(countries)
    expect($authHttp.get).toHaveBeenCalledWith({ url: '/v1/ddl/countries' })
  })

  it('returns a stable empty result when the response has no data', async () => {
    vi.mocked($authHttp.get).mockResolvedValue({ data: undefined } as never)

    await expect(getCountriesDdl()).resolves.toEqual([])
  })
})
