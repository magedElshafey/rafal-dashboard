import { describe, expect, it } from 'vitest'
import { inventoryKeys } from '../queries/inventory.keys'
import { normalizeInventoryFilters, readInventoryFilters, serializeInventoryFilters } from '../utils/inventory-filters'
import en from '../locale/en.json'
import ar from '../locale/ar.json'

describe('inventory filter URL and cache contract', () => {
  it('restores all confirmed filters from a direct URL', () => {
    expect(readInventoryFilters({ search: ' Musk ', product_id: '0022', stock_status: 'out_of_stock', sort_by: 'updated_at', sort_dir: 'desc' })).toEqual({
      search: 'Musk', productId: 22, stockStatus: 'out_of_stock', sortBy: 'updated_at', sortDir: 'desc',
    })
  })
  it.each(['0', '-2', '1.5', 'Infinity', 'abc', '9007199254740992', ''])('ignores invalid URL product ID %s and unsupported enums', product_id => {
    const filters = readInventoryFilters({ product_id, stock_status: 'reserved', sort_by: 'price', sort_dir: 'down', search: '  ' })
    expect(filters).toEqual(normalizeInventoryFilters())
    expect(serializeInventoryFilters(filters)).toEqual({})
  })
  it.each(['in_stock', 'low_stock', 'out_of_stock'])('accepts existing stock status %s', stock_status => {
    expect(serializeInventoryFilters(readInventoryFilters({ stock_status }))).toEqual({ stock_status })
  })
  it('normalizes cache identity and isolates every filter, page and warehouse under the same family', () => {
    const base = inventoryKeys.list(6, 1)
    expect(base.slice(0, 1)).toEqual(inventoryKeys.all)
    expect(inventoryKeys.list(6, 1, { search: '  ', productId: null })).toEqual(base)
    expect(inventoryKeys.list(6, 1, { search: ' Musk ' })).toEqual(inventoryKeys.list(6, 1, { search: 'Musk' }))
    for (const filters of [{ search: 'Musk' }, { productId: 22 }, { stockStatus: 'low_stock' as const }, { sortBy: 'warehouse' as const }, { sortDir: 'asc' as const }]) {
      expect(inventoryKeys.list(6, 1, filters)).not.toEqual(base)
    }
    expect(inventoryKeys.list(8, 1)).not.toEqual(base)
    expect(inventoryKeys.list(6, 2)).not.toEqual(base)
  })
  it('keeps filter labels and interpolation aligned in both languages', () => {
    const flatten = (value: object, prefix = ''): Record<string, string> => Object.fromEntries(Object.entries(value).flatMap(([key, item]) =>
      typeof item === 'string' ? [[prefix + key, item]] : Object.entries(flatten(item, prefix + key + '.'))))
    const english = flatten(en.inventory.filters)
    const arabic = flatten(ar.inventory.filters)
    expect(Object.keys(arabic).sort()).toEqual(Object.keys(english).sort())
    for (const key of Object.keys(english)) {
      expect(arabic[key]).not.toBe('')
      expect(arabic[key].match(/{{.*?}}/g) ?? []).toEqual(english[key].match(/{{.*?}}/g) ?? [])
    }
  })
})
