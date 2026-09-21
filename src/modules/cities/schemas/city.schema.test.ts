import { describe, expect, it } from 'vitest'

import { createCitySchema } from './city.schema'

const schema = createCitySchema({
  regionRequired: 'Region required',
  nameArRequired: 'Arabic required',
  nameEnRequired: 'English required',
  sortInteger: 'Integer required',
  coordinateNumber: 'Coordinate required',
  latitudeRange: 'Latitude range',
  longitudeRange: 'Longitude range',
  centerRequired: 'Center required',
  boundaryRequired: 'Boundary required',
  boundaryMinimum: 'Boundary minimum',
})

const valid = {
  regionId: 1,
  name: { ar: 'الرياض', en: 'Riyadh' },
  isActive: true,
  sortOrder: null,
  boundary: [
    { lat: 24.6, lng: 46.5 },
    { lat: 24.9, lng: 46.9 },
    { lat: 24.9, lng: 46.5 },
  ],
  center: { lat: 24.75, lng: 46.7 },
}

describe('city schema', () => {
  it('requires a Region and localized names', async () => {
    await expect(schema.validate({ ...valid, regionId: null })).rejects.toThrow('Region required')
    await expect(schema.validate({ ...valid, name: { ar: ' ', en: '' } })).rejects.toThrow()
  })

  it('requires a center and a completed polygon boundary', async () => {
    await expect(schema.validate({ ...valid, center: null })).rejects.toThrow('Center required')
    await expect(schema.validate({ ...valid, boundary: [] })).rejects.toThrow('Boundary required')
    await expect(schema.validate({ ...valid, boundary: valid.boundary.slice(0, 2) })).rejects.toThrow(
      'Boundary minimum'
    )
  })

  it('accepts valid required geography', async () => {
    await expect(
      schema.validate({
        ...valid,
        boundary: [
          { lat: -90, lng: -180 },
          { lat: 90, lng: 180 },
          { lat: 0, lng: 0 },
        ],
        center: { lat: 0, lng: 0 },
      })
    ).resolves.toBeTruthy()
  })

  it.each([
    [{ lat: -90.1, lng: 0 }, 'Latitude range'],
    [{ lat: 90.1, lng: 0 }, 'Latitude range'],
    [{ lat: 0, lng: -180.1 }, 'Longitude range'],
    [{ lat: 0, lng: 180.1 }, 'Longitude range'],
    [{ lat: Number.NaN, lng: Number.NaN }, 'Coordinate required'],
  ])('rejects invalid or unfinished coordinate %j', async (coordinate, message) => {
    await expect(
      schema.validate({ ...valid, boundary: [coordinate, valid.boundary[1], valid.boundary[2]] })
    ).rejects.toThrow(message)
  })

  it.each([null, 0, -1, 1])('accepts optional integer sort order %s', async (sortOrder) => {
    await expect(schema.validate({ ...valid, sortOrder })).resolves.toMatchObject({ sortOrder })
  })

  it('rejects a fractional sort order', async () => {
    await expect(schema.validate({ ...valid, sortOrder: 1.5 })).rejects.toThrow('Integer required')
  })
})
