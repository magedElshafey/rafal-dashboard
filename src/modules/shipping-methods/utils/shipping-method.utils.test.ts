import { describe, expect, it } from 'vitest'

import type { ShippingMethodFormValues } from '@/modules/shipping-methods/types/shipping-method.types'
import { buildShippingMethodUpdatePayload, getLocalizedShippingMethodValue } from './shipping-method.utils'

const values: ShippingMethodFormValues = {
  code: 'standard',
  name: { ar: 'عادي', en: 'Standard' },
  etaLabel: { ar: '٣ أيام', en: '3 days' },
  price: 25,
  isPickup: false,
  isActive: true,
  sortOrder: 0,
}

describe('Shipping Method utilities', () => {
  it('uses a safe localized fallback', () => {
    expect(getLocalizedShippingMethodValue({ ar: 'عربي', en: '' }, 'en')).toBe('عربي')
  })

  it('maps nested dirty fields without leaking untouched values', () => {
    expect(buildShippingMethodUpdatePayload(values, { name: { en: true }, etaLabel: { ar: true } })).toEqual({
      nameEn: 'Standard',
      etaLabelAr: '٣ أيام',
    })
  })

  it('includes zero price when Pickup is enabled and leaves zero editable when disabled', () => {
    expect(
      buildShippingMethodUpdatePayload({ ...values, isPickup: true, price: 0 }, { isPickup: true, price: true })
    ).toEqual({ isPickup: true, price: 0 })
    expect(buildShippingMethodUpdatePayload({ ...values, isPickup: false, price: 0 }, { isPickup: true })).toEqual({
      isPickup: false,
    })
  })

  it.each([0, -2])('includes a dirty numeric sort order of %s', (sortOrder) => {
    expect(buildShippingMethodUpdatePayload({ ...values, sortOrder }, { sortOrder: true })).toEqual({ sortOrder })
  })

  it('rejects a dirty null sort order instead of silently omitting it', () => {
    expect(() => buildShippingMethodUpdatePayload({ ...values, sortOrder: null }, { sortOrder: true })).toThrow(
      'A dirty Shipping Method sort order must be numeric.'
    )
  })
})
