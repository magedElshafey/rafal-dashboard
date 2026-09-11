import { AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { $authHttp } from '@/utils/auth-http'

import { ATTENDANCE_STATUSES_DDL_ENDPOINT, getAttendanceStatusesDdl } from './attendance-statuses.ddl.service'

vi.mock('@/utils/auth-http', () => ({ $authHttp: { get: vi.fn() } }))

function httpResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  }
}

describe('attendance statuses DDL service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the authenticated client and returns the confirmed data array unchanged', async () => {
    const statuses = [
      { value: 'present', label: 'حاضر' },
      { value: 'absent', label: 'غائب' },
    ]
    vi.mocked($authHttp.get).mockResolvedValue(httpResponse({ data: statuses }))

    await expect(getAttendanceStatusesDdl()).resolves.toBe(statuses)
    expect($authHttp.get).toHaveBeenCalledWith({ url: ATTENDANCE_STATUSES_DDL_ENDPOINT })
  })

  it('returns an empty successful array without fallback data', async () => {
    const statuses: IDDl[] = []
    vi.mocked($authHttp.get).mockResolvedValue(httpResponse({ data: statuses }))

    await expect(getAttendanceStatusesDdl()).resolves.toBe(statuses)
  })

  it('propagates API failures', async () => {
    const error = new Error('DDL unavailable')
    vi.mocked($authHttp.get).mockRejectedValue(error)

    await expect(getAttendanceStatusesDdl()).rejects.toBe(error)
  })
})
