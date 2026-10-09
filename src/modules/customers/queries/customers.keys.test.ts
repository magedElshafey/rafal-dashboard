import { describe, expect, it } from 'vitest'
import { emptyCustomersFilters } from '../utils/customer-filters'
import { customersKeys } from './customers.keys'

describe('customersKeys', () => {
  it('scopes list keys under Customers with the applied filters', () => {
    expect(customersKeys.all).toEqual(['customers'])
    expect(customersKeys.lists()).toEqual(['customers', 'list'])
    expect(customersKeys.list(emptyCustomersFilters)).toEqual(['customers', 'list', emptyCustomersFilters])
  })
})
