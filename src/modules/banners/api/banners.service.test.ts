import { describe, expect, it } from 'vitest'

import { normalizeBanner, serializeBanner } from './banners.service'

const payload = {
  placement: 'home' as const,
  title: { ar: 'العنوان', en: 'Title' },
  link_url: '/products/example',
  platform: 'both' as const,
  starts_at: null,
  ends_at: null,
  is_active: true,
  sort_order: 4,
}

describe('banners service boundary', () => {
  it('serializes the documented multipart fields and only includes a changed image', () => {
    const withoutImage = serializeBanner(payload)
    expect(withoutImage.get('title[ar]')).toBe('العنوان')
    expect(withoutImage.get('title[en]')).toBe('Title')
    expect(withoutImage.get('link_url')).toBe('/products/example')
    expect(withoutImage.get('is_active')).toBe('1')
    expect(withoutImage.get('sort_order')).toBe('4')
    expect(withoutImage.has('image')).toBe(false)
    expect(withoutImage.has('starts_at')).toBe(false)

    const image = new File(['image'], 'banner.png', { type: 'image/png' })
    expect(serializeBanner({ ...payload, image }).get('image')).toBe(image)
  })

  it('normalizes inconsistent sort order responses to a domain number', () => {
    const normalized = normalizeBanner({
      id: 49,
      ...payload,
      sort_order: '4',
      image_url: 'https://example.test/banner.png',
      created_at: '2026-09-06T20:01:03+00:00',
      updated_at: '2026-09-06T20:01:03+00:00',
    })
    expect(normalized.sort_order).toBe(4)
  })
})
