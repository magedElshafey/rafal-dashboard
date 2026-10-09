import { describe, expect, it } from 'vitest'

import type { ProductCreateFormValues } from '@/modules/products/types/product.types'

import { createProductCreateSchema, PRODUCT_IMAGE_MAX_SIZE } from './product-create.schema'

const messages = {
  required: 'required',
  validNumber: 'valid-number',
  nonNegative: 'non-negative',
  integer: 'integer',
  minimumOne: 'minimum-one',
  discountRange: 'discount-range',
  maxLength: 'max-length',
  dateInvalid: 'invalid-date',
  imageType: 'image-type',
  imageSize: 'image-size',
  imageRequired: 'image-required',
  variantRequired: 'variant-required',
  duplicateVariantSku: 'duplicate-sku',
  attributeIncomplete: 'attribute-incomplete',
  attributeDuplicate: 'attribute-duplicate',
  attributeInvalidKey: 'attribute-key',
  attributeInvalidColor: 'attribute-color',
  duplicateWarehouse: 'duplicate-warehouse',
}

const productImage = new File(['image'], 'product.png', { type: 'image/png' })
const validVariant = () => ({
  sku: 'VAR-1',
  attributes: [],
  priceOverride: null,
  isActive: true,
  stocks: [],
})

const validValues = (overrides: Partial<ProductCreateFormValues> = {}): ProductCreateFormValues => ({
  categoryId: 1,
  sku: 'RFL-1',
  name: { ar: 'منتج', en: '' },
  description: { ar: '', en: '' },
  basePrice: 0,
  discountPercentage: null,
  discountEndAt: '',
  isPersonalizable: false,
  personalizationMaxLength: null,
  personalizationFee: null,
  hidePriceOnPackaging: false,
  isNewArrival: false,
  isActive: true,
  sortOrder: 0,
  images: { files: [productImage], removedExistingIds: [] },
  variants: [validVariant()],
  ...overrides,
})

const schema = createProductCreateSchema(messages)

describe('aggregate Product Create validation', () => {
  it('requires Category for both Dashboard write flows and trims required identity fields', async () => {
    await expect(schema.validateAt('categoryId', validValues({ categoryId: null }))).rejects.toThrow('required')
    await expect(schema.validateAt('sku', validValues({ sku: ' '.repeat(2) }))).rejects.toThrow('required')
    await expect(schema.validateAt('sku', validValues({ sku: 'x'.repeat(256) }))).rejects.toThrow('max-length')
    await expect(schema.validateAt('name.ar', validValues({ name: { ar: 'x'.repeat(256), en: '' } }))).rejects.toThrow(
      'max-length'
    )
    await expect(
      schema.validateAt('name.en', validValues({ name: { ar: 'منتج', en: 'x'.repeat(256) } }))
    ).rejects.toThrow('max-length')
  })

  it('requires a finite non-negative Base Price', async () => {
    await expect(schema.validateAt('basePrice', validValues({ basePrice: null }))).rejects.toThrow('required')
    await expect(schema.validateAt('basePrice', validValues({ basePrice: Number.NaN }))).rejects.toThrow('valid-number')
    await expect(schema.validateAt('basePrice', validValues({ basePrice: -0.01 }))).rejects.toThrow('non-negative')
  })

  it('accepts nullable discounts but requires an integer from 0 through 100 when present', async () => {
    await expect(schema.validateAt('discountPercentage', validValues())).resolves.toBeNull()
    await expect(schema.validateAt('discountPercentage', validValues({ discountPercentage: 10.5 }))).rejects.toThrow(
      'integer'
    )
    for (const discountPercentage of [-1, 101]) {
      await expect(schema.validateAt('discountPercentage', validValues({ discountPercentage }))).rejects.toThrow(
        'discount-range'
      )
    }
  })

  it('conditionally requires personalization length and validates dependent numbers', async () => {
    await expect(
      schema.validateAt(
        'personalizationMaxLength',
        validValues({ isPersonalizable: true, personalizationMaxLength: null })
      )
    ).rejects.toThrow('required')
    await expect(
      schema.validateAt(
        'personalizationMaxLength',
        validValues({ isPersonalizable: true, personalizationMaxLength: 1.5 })
      )
    ).rejects.toThrow('integer')
    await expect(
      schema.validateAt(
        'personalizationMaxLength',
        validValues({ isPersonalizable: true, personalizationMaxLength: 0 })
      )
    ).rejects.toThrow('minimum-one')
    await expect(schema.validateAt('personalizationFee', validValues({ personalizationFee: -1 }))).rejects.toThrow(
      'non-negative'
    )
  })

  it('requires integer Sort Order without inventing a range', async () => {
    await expect(schema.validateAt('sortOrder', validValues({ sortOrder: null }))).rejects.toThrow('required')
    await expect(schema.validateAt('sortOrder', validValues({ sortOrder: 1.2 }))).rejects.toThrow('integer')
    await expect(schema.validateAt('sortOrder', validValues({ sortOrder: -8 }))).resolves.toBe(-8)
  })

  it('accepts an independent nullable discount datetime and rejects invalid values', async () => {
    await expect(schema.validateAt('discountEndAt', validValues())).resolves.toBe('')
    await expect(schema.validateAt('discountEndAt', validValues({ discountEndAt: '2026-10-03T14:05' }))).resolves.toBe(
      '2026-10-03T14:05'
    )
    await expect(schema.validateAt('discountEndAt', validValues({ discountEndAt: 'not-a-date' }))).rejects.toThrow(
      'invalid-date'
    )
  })

  it('rejects non-images and images larger than 5 MB', async () => {
    const textFile = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const oversizedImage = new File([new Uint8Array(PRODUCT_IMAGE_MAX_SIZE + 1)], 'large.png', {
      type: 'image/png',
    })

    await expect(
      schema.validateAt('images', validValues({ images: { files: [textFile], removedExistingIds: [] } }))
    ).rejects.toThrow('image-type')
    await expect(
      schema.validateAt('images', validValues({ images: { files: [oversizedImage], removedExistingIds: [] } }))
    ).rejects.toThrow('image-size')
  })

  it('requires a Product image before aggregate submission', async () => {
    await expect(
      schema.validateAt('images', validValues({ images: { files: [], removedExistingIds: [] } }))
    ).rejects.toThrow('image-required')
  })

  it('requires at least one Variant and preserves nested Variant validation', async () => {
    await expect(schema.validateAt('variants', validValues({ variants: [] }))).rejects.toThrow('variant-required')
    await expect(schema.validateAt('variants', validValues({ variants: [validVariant()] }))).resolves.toHaveLength(1)
    await expect(
      schema.validateAt('variants.0.sku', validValues({ variants: [{ ...validVariant(), sku: ' ' }] }))
    ).rejects.toThrow('required')
  })

  it('rejects duplicate Variant SKUs, attribute keys, and Warehouses', async () => {
    const duplicateVariants = [
      { sku: 'VAR-1', attributes: [], priceOverride: null, isActive: true, stocks: [] },
      { sku: ' var-1 ', attributes: [], priceOverride: null, isActive: true, stocks: [] },
    ]
    await expect(schema.validateAt('variants', validValues({ variants: duplicateVariants }))).rejects.toThrow(
      'duplicate-sku'
    )

    const variant = {
      sku: 'VAR-1',
      priceOverride: null,
      isActive: true,
      attributes: [
        { key: 'Stone Type', value: 'diamond' },
        { key: 'stone_type', value: 'ruby' },
      ],
      stocks: [
        { warehouseId: 2, quantity: 0 },
        { warehouseId: 2, quantity: 5 },
      ],
    }
    await expect(schema.validateAt('variants.0.attributes', validValues({ variants: [variant] }))).rejects.toThrow(
      'attribute-duplicate'
    )
    await expect(schema.validateAt('variants.0.stocks', validValues({ variants: [variant] }))).rejects.toThrow(
      'duplicate-warehouse'
    )
  })
})
