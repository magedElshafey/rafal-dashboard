import { describe, expect, it } from 'vitest'

import { buildWarehouseCreatePayload, buildWarehouseUpdatePayload, parseWarehouseCityIds } from './warehouse.utils'

const values = { name: ' Main ', cityIds: ['1', '2', '3'], isActive: true }

describe('Warehouse payload builders', () => {
  it('builds the complete Create payload and deduplicates selected IDs', () => {
    expect(buildWarehouseCreatePayload({ ...values, cityIds: ['1', '2', '1'] })).toEqual({
      name: 'Main',
      cityIds: [1, 2],
      isActive: true,
    })
  })

  it('omits unchanged fields from Update', () => {
    expect(buildWarehouseUpdatePayload(values, { name: true })).toEqual({ name: 'Main' })
    expect(buildWarehouseUpdatePayload(values, { isActive: true })).toEqual({ isActive: true })
  })

  it('sends the complete selected City list when the selection is dirty', () => {
    expect(buildWarehouseUpdatePayload(values, { cityIds: [true, true, true] })).toEqual({ cityIds: [1, 2, 3] })
  })

  it('rejects malformed selected IDs instead of coercing them to zero', () => {
    expect(() => parseWarehouseCityIds([''])).toThrow('City ID is unavailable')
    expect(() => parseWarehouseCityIds(['not-an-id'])).toThrow('City ID is unavailable')
  })
})
