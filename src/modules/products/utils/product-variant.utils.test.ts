import { describe, expect, it } from 'vitest'

import { createProductVariantSchema } from '@/modules/products/schemas/product-variant.schema'
import {
  buildProductVariantCreatePayload,
  getVariantAttributesPresentation,
  normalizeVariantAttributeRows,
} from '@/modules/products/utils/product-variant.utils'

const messages = {
  required: 'required',
  maxLength: 'max',
  validNumber: 'number',
  nonNegative: 'nonnegative',
  attributeIncomplete: 'incomplete',
  attributeDuplicate: 'duplicate',
  imageType: 'type',
  imageSize: 'size',
}

describe('Product Variant form mapping', () => {
  it('ignores blank rows and trims flat attributes', () => {
    expect(
      normalizeVariantAttributeRows([
        { key: ' ', value: '' },
        { key: ' color ', value: ' silver ' },
      ])
    ).toEqual({ color: 'silver' })
  })

  it('rejects incomplete rows and duplicate trimmed keys', () => {
    expect(() => normalizeVariantAttributeRows([{ key: 'color', value: '' }])).toThrow(/both/)
    expect(() =>
      normalizeVariantAttributeRows([
        { key: 'color', value: 'silver' },
        { key: ' color ', value: 'gold' },
      ])
    ).toThrow(/unique/)
  })

  it('builds a Create payload containing only new local image files', () => {
    const image = new File(['image'], 'variant.png', { type: 'image/png' })
    expect(
      buildProductVariantCreatePayload({
        sku: ' VAR ',
        attributes: [{ key: ' size ', value: ' large ' }],
        priceOverride: null,
        isActive: true,
        images: { files: [image], removedExistingIds: [99] },
      })
    ).toEqual({ sku: 'VAR', attributes: { size: 'large' }, priceOverride: null, isActive: true, images: [image] })
  })

  it('validates required SKU, nullable nonnegative finite price, attribute rows, and image size', async () => {
    const schema = createProductVariantSchema(messages)
    const base = {
      sku: 'VAR',
      attributes: [{ key: '', value: '' }],
      priceOverride: null,
      isActive: true,
      images: { files: [], removedExistingIds: [] },
    }
    await expect(schema.validate(base)).resolves.toBeDefined()
    await expect(schema.validate({ ...base, sku: ' ' })).rejects.toThrow('required')
    await expect(schema.validate({ ...base, sku: 'x'.repeat(256) })).rejects.toThrow('max')
    await expect(schema.validate({ ...base, priceOverride: -1 })).rejects.toThrow('nonnegative')
    await expect(schema.validate({ ...base, priceOverride: Number.POSITIVE_INFINITY })).rejects.toThrow('number')
    await expect(schema.validate({ ...base, attributes: [{ key: 'color', value: '' }] })).rejects.toThrow('incomplete')
    await expect(
      schema.validate({
        ...base,
        attributes: [
          { key: 'color', value: 'silver' },
          { key: ' color ', value: 'gold' },
        ],
      })
    ).rejects.toThrow('duplicate')
    await expect(
      schema.validate({
        ...base,
        images: {
          files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })],
          removedExistingIds: [],
        },
      })
    ).rejects.toThrow('size')
    await expect(
      schema.validate({
        ...base,
        images: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })], removedExistingIds: [] },
      })
    ).rejects.toThrow('type')
    await expect(
      schema.validate({
        ...base,
        images: {
          files: Array.from({ length: 12 }, (_, index) => new File(['image'], `${index}.png`, { type: 'image/png' })),
          removedExistingIds: [],
        },
      })
    ).resolves.toBeDefined()
  })

  it('classifies flat, empty, and complex backend attributes for safe presentation', () => {
    expect(getVariantAttributesPresentation({ color: 'silver' })).toEqual({
      kind: 'flat',
      entries: [['color', 'silver']],
    })
    expect(getVariantAttributesPresentation(null)).toEqual({ kind: 'empty' })
    expect(getVariantAttributesPresentation([])).toEqual({ kind: 'empty' })
    expect(getVariantAttributesPresentation({ nested: { value: 1 } })).toEqual({ kind: 'complex' })
  })
})
