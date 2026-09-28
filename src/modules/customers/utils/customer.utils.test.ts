import { describe, expect, it } from 'vitest'

import { getCustomerDisplayName, getReadableStatus } from '@/modules/customers/utils/customer.utils'

const customer = {
  id: 6,
  name: ' Preferred ',
  firstName: ' First ',
  lastName: ' Last ',
  email: ' customer@example.com ',
  phone: ' +966500000000 ',
}

describe('Customer utilities', () => {
  it.each([
    [customer, 'Preferred'],
    [{ ...customer, name: '' }, 'First Last'],
    [{ ...customer, name: '', firstName: null, lastName: null }, 'customer@example.com'],
    [{ ...customer, name: '', firstName: null, lastName: null, email: null }, '+966500000000'],
    [{ ...customer, name: '', firstName: null, lastName: null, email: null, phone: null }, 'Customer #6'],
  ])('uses the documented display-name priority', (value, expected) => {
    expect(getCustomerDisplayName(value, 'Customer #6')).toBe(expected)
  })

  it('renders unknown status strings as safe readable labels', () => {
    expect(getReadableStatus('awaiting_manual-review')).toBe('Awaiting manual review')
    expect(getReadableStatus('   ')).toBe('—')
  })
})
