import { describe, expect, it } from 'vitest'

import { createWarehouseSchema } from './warehouse.schema'

const createSchema = createWarehouseSchema('create', 'name-required', 'cities-required')
const editSchema = createWarehouseSchema('edit', 'name-required', 'cities-required')

describe('Warehouse validation', () => {
  it('requires a name and at least one City on Create', async () => {
    await expect(createSchema.isValid({ name: '', cityIds: [], isActive: true })).resolves.toBe(false)
    await expect(createSchema.isValid({ name: 'Main', cityIds: [], isActive: true })).resolves.toBe(false)
    await expect(createSchema.isValid({ name: 'Main', cityIds: ['1'], isActive: true })).resolves.toBe(true)
  })

  it('allows an empty replacement City list on Edit and rejects malformed IDs', async () => {
    await expect(editSchema.isValid({ name: 'Main', cityIds: [], isActive: true })).resolves.toBe(true)
    await expect(editSchema.isValid({ name: 'Main', cityIds: ['0'], isActive: true })).resolves.toBe(false)
  })
})
