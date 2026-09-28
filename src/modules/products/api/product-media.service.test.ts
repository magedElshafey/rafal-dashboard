import { beforeEach, describe, expect, it, vi } from 'vitest'

const mediaMocks = vi.hoisted(() => ({ delete: vi.fn() }))
vi.mock('@/services/media.service', () => ({ mediaService: mediaMocks }))

import { productMediaService } from './product-media.service'

describe('Product media service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the shared global media DELETE service', async () => {
    mediaMocks.delete.mockResolvedValue({ success: true, message: 'deleted' })
    await expect(productMediaService.delete(91)).resolves.toEqual({ success: true, message: 'deleted' })
    expect(mediaMocks.delete).toHaveBeenCalledWith(91)
  })
})
