import { describe, expect, it } from 'vitest'

import { serializeCategory } from './categories.service'

describe('categories service serialization', () => {
  it('isolates localized multipart fields and nullable root representation', () => {
    const body = serializeCategory({
      parent_id: null,
      name: { ar: 'مجوهرات', en: 'Jewelry' },
      slug: 'jewelry',
      description: { ar: 'وصف', en: 'Description' },
      is_active: true,
      sort_order: 2,
    })
    expect(body.get('name[ar]')).toBe('مجوهرات')
    expect(body.get('name[en]')).toBe('Jewelry')
    expect(body.get('parent_id')).toBe('')
    expect(body.get('description[ar]')).toBe('وصف')
    expect(body.get('sort_order')).toBe('2')
    expect(body.has('image')).toBe(false)
  })

  it('omits an entirely empty normalized description', () => {
    const body = serializeCategory({
      parent_id: 3,
      name: { ar: 'فرعي', en: 'Child' },
      slug: 'child',
      description: null,
      is_active: false,
      sort_order: 0,
    })
    expect(body.get('parent_id')).toBe('3')
    expect(body.has('description[ar]')).toBe(false)
    expect(body.get('is_active')).toBe('0')
  })
})
