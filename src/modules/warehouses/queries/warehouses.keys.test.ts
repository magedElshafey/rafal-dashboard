import { describe, expect, it } from 'vitest'
import { emptyWarehousesFilters } from '../utils/warehouse-filters'
import { warehousesKeys } from './warehouses.keys'

describe('warehousesKeys', () => {
  it('scopes list keys under Warehouses with the applied filters', () => {
    expect(warehousesKeys.all).toEqual(['warehouses'])
    expect(warehousesKeys.lists()).toEqual(['warehouses', 'list'])
    expect(warehousesKeys.list(emptyWarehousesFilters)).toEqual(['warehouses', 'list', emptyWarehousesFilters])
  })
})
