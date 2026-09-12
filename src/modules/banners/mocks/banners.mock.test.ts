import { beforeEach, describe, expect, it } from 'vitest'

import { bannersMockTransport, resetBannersMock } from './banners.mock'

describe('banners mock transport', () => {
  beforeEach(resetBannersMock)

  it('paginates the documented response without search or filter behavior', async () => {
    const first = await bannersMockTransport.list(1)
    const second = await bannersMockTransport.list(2)
    expect(first).toMatchObject({
      success: true,
      message: 'Banners retrieved successfully',
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 6 },
    })
    expect(first.data).toHaveLength(6)
    expect(second.data).toHaveLength(0)
  })

  it('supports show, create, update, and delete while retaining remote image semantics', async () => {
    const image = new File(['new'], 'new.png', { type: 'image/png' })
    const created = await bannersMockTransport.create({
      placement: 'home',
      title: { ar: 'جديد', en: 'New' },
      link_url: null,
      platform: 'web',
      starts_at: null,
      ends_at: null,
      is_active: true,
      sort_order: 1,
      image,
    })
    expect(created.data).not.toHaveProperty('image')
    expect(created.data.image_url).toMatch(/^https:/)
    expect((await bannersMockTransport.show(created.data.id)).data.title.en).toBe('New')

    const originalUrl = created.data.image_url
    const updated = await bannersMockTransport.update(created.data.id, {
      placement: 'splash',
      title: { ar: 'محدث', en: 'Updated' },
      link_url: '/products/updated',
      platform: 'both',
      starts_at: null,
      ends_at: null,
      is_active: false,
      sort_order: 2,
    })
    expect(updated.data.image_url).toBe(originalUrl)
    await bannersMockTransport.delete(created.data.id)
    await expect(bannersMockTransport.show(created.data.id)).rejects.toThrow('Banner not found')
  })
})
