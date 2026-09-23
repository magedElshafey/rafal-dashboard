import { describe, expect, it } from 'vitest'

import type { ProductDetail, ProductFormValues } from '@/modules/products/types/product.types'
import { buildProductUpdatePayload, productDetailToFormValues } from './product-edit.utils'

const detail: ProductDetail = {
  id: 5,
  categoryId: 2,
  sku: 'SKU',
  name: { ar: 'اسم', en: 'Name' },
  description: { ar: '<p>عربي</p>', en: '<p>Hello</p>' },
  slug: 'never-send',
  basePrice: 25,
  discountPercentage: 10,
  discountEndAt: '2026-10-03 14:05:00',
  isPersonalizable: true,
  personalizationMaxLength: 20,
  personalizationFee: 5,
  hidePriceOnPackaging: false,
  isNewArrival: true,
  isActive: true,
  sortOrder: 3,
  simulatedViewersCount: 9,
  simulatedOrdersCount: 4,
  variants: [],
  images: [{ id: 8, url: 'image' }],
  createdAt: 'created',
  updatedAt: 'updated',
}

describe('Product Edit mapping', () => {
  it('hydrates backend datetime without timezone conversion', () => {
    expect(productDetailToFormValues(detail)).toMatchObject({
      discountEndAt: '2026-10-03T14:05',
      description: detail.description,
      images: { files: [], removedExistingIds: [] },
    })
  })

  it('builds granular localized updates and textual-clear domain values', () => {
    const values = productDetailToFormValues(detail)
    values.name.ar = 'اسم جديد'
    values.description.en = ''
    values.discountPercentage = null
    expect(
      buildProductUpdatePayload(values, { name: { ar: true }, description: { en: true }, discountPercentage: true })
    ).toEqual({ name: { ar: 'اسم جديد' }, description: { en: null }, discountPercentage: null })
  })

  it('clears personalization dependents when toggled off and includes only new images', () => {
    const values: ProductFormValues = {
      ...productDetailToFormValues(detail),
      isPersonalizable: false,
      personalizationMaxLength: null,
      personalizationFee: null,
      images: { files: [new File(['x'], 'new.png', { type: 'image/png' })], removedExistingIds: [8] },
    }
    const result = buildProductUpdatePayload(values, { isPersonalizable: true, images: { files: [true] } })
    expect(result).toMatchObject({ isPersonalizable: false, personalizationMaxLength: null, personalizationFee: null })
    expect(result.images).toEqual(values.images.files)
    expect(result).not.toHaveProperty('removedExistingIds')
    expect(result).not.toHaveProperty('slug')
  })
})
