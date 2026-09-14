import { beforeEach, describe, expect, it } from 'vitest'

import { categoriesMockTransport, resetCategoriesMock } from './categories.mock'

describe('categories mock transport', () => {
  beforeEach(resetCategoriesMock)

  it('returns the documented paginated hierarchy shape', async () => {
    const response = await categoriesMockTransport.list(1)
    expect(response).toMatchObject({
      success: true,
      message: 'Categories retrieved successfully',
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 12 },
    })
    expect(response.data).toHaveLength(12)
    expect(response.data.find((category) => category.parent_id !== null)).toBeDefined()
  })

  it('supports hierarchy-aware create, show, update, and delete mutations', async () => {
    const created = await categoriesMockTransport.create({
      parent_id: 1,
      name: { ar: 'فرعي', en: 'Child' },
      slug: 'child',
      description: null,
      is_active: true,
      sort_order: 1,
    })
    expect(created.data).toMatchObject({ parent_id: '1', sort_order: '1', description: [] })
    expect((await categoriesMockTransport.show(created.data.id)).data.name.en).toBe('Child')
    const updated = await categoriesMockTransport.update(created.data.id, {
      parent_id: null,
      name: { ar: 'رئيسي', en: 'Root' },
      slug: 'root',
      description: { ar: '', en: 'Root description' },
      is_active: false,
      sort_order: 2,
    })
    expect(updated.data).toMatchObject({ parent_id: null, is_active: false })
    await categoriesMockTransport.delete(created.data.id)
    await expect(categoriesMockTransport.show(created.data.id)).rejects.toThrow('Category not found')
  })
})
