import { beforeEach, describe, expect, it } from 'vitest'

import { serializeWarehouse, warehousesService } from './warehouses.service'
import { resetWarehousesMock, seedWarehousesMock } from '../mocks/warehouses.mock'

describe('warehousesService', () => {
  beforeEach(() => resetWarehousesMock())

  it('serializes clean domain values to the multipart backend contract', () => {
    const body = serializeWarehouse({ name: ' Main ', coverageZone: [' مكة ', 'Makkah'], isActive: false })
    expect(body.get('name')).toBe('Main')
    expect(body.getAll('coverage_zone[]')).toEqual(['مكة', 'Makkah'])
    expect(body.get('is_active')).toBe('0')
  })

  it('paginates and mutates the in-memory transport through the service boundary', async () => {
    seedWarehousesMock([])
    const created = await warehousesService.create({ name: 'Warehouse A', coverageZone: ['Jeddah'], isActive: true })
    expect((await warehousesService.show(created.data.id)).data.coverage_zone).toEqual(['Jeddah'])
    const updated = await warehousesService.update(created.data.id, {
      name: 'Warehouse B',
      coverageZone: ['مكة'],
      isActive: false,
    })
    expect(updated.data).toMatchObject({ name: 'Warehouse B', coverage_zone: ['مكة'], is_active: false })
    expect((await warehousesService.list(1)).items).toHaveLength(1)
    await warehousesService.delete(created.data.id)
    expect((await warehousesService.list(1)).items).toHaveLength(0)
  })
})
