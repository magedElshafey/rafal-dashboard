import { describe, expect, it } from 'vitest'

import { createRegionSchema } from './region.schema'

const schema = createRegionSchema({
  nameArRequired: 'Arabic required',
  nameEnRequired: 'English required',
  sortInteger: 'Integer required',
})

describe('region schema', () => {
  it('accepts empty optional code and sort order values', async () => {
    await expect(
      schema.validate({ name: { ar: 'الرياض', en: 'Riyadh' }, code: ' ', sortOrder: null, isActive: true })
    ).resolves.toMatchObject({ code: '', sortOrder: null })
  })

  it.each([null, 0, 1, -1])('accepts %s as a valid sort order', async (sortOrder) => {
    await expect(
      schema.validate({ name: { ar: 'الرياض', en: 'Riyadh' }, code: '', sortOrder, isActive: true })
    ).resolves.toMatchObject({ sortOrder })
  })

  it('rejects a fractional sort order', async () => {
    await expect(
      schema.validate({ name: { ar: 'الرياض', en: 'Riyadh' }, code: '', sortOrder: 1.5, isActive: true })
    ).rejects.toThrow('Integer required')
  })
})
