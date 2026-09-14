import { describe, expect, it } from 'vitest'

import { normalizeCategory } from './category.mapper'

const raw = {
  id: 17,
  parent_id: '16',
  name: { ar: 'ورد', en: 'Flowers' },
  slug: 'flowers',
  description: [] as [],
  is_active: true,
  sort_order: '1',
  image_url: null,
  created_at: '2026-09-06T20:01:03+00:00',
  updated_at: '2026-09-06T20:01:03+00:00',
}

describe('normalizeCategory', () => {
  it('normalizes string primitives and malformed description arrays', () => {
    expect(normalizeCategory(raw)).toMatchObject({
      parent_id: 16,
      sort_order: 1,
      description: null,
      children_count: 0,
    })
  })

  it('preserves localized descriptions and nullable roots', () => {
    expect(normalizeCategory({ ...raw, parent_id: null, description: { ar: 'وصف', en: 'Description' } })).toMatchObject(
      { parent_id: null, description: { ar: 'وصف', en: 'Description' } }
    )
  })
})
