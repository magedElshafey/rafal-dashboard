import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { mediaService } from './media.service'

describe('mediaService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('DELETEs the exact media endpoint without a request body', async () => {
    httpMocks.delete.mockResolvedValueOnce({ data: { success: true, message: 'deleted' } })

    await expect(mediaService.delete(23)).resolves.toEqual({ success: true, message: 'deleted' })

    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/media/23',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
