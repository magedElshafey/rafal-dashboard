import { describe, expect, it } from 'vitest'

import { createProductVariantSchema } from '@/modules/products/schemas/product-variant.schema'
import type { ProductVariantAttributeDefinition } from '@/modules/products/types/product-variant.types'
import {
  buildProductVariantCreatePayload,
  buildProductVariantUpdatePayload,
  getVariantAttributesPresentation,
  hasNewVariantAttributeKeyCollision,
  isCanonicalVariantAttributeKey,
  isSixDigitHexColor,
  normalizeVariantAttributeKey,
  normalizeVariantAttributeRows,
} from '@/modules/products/utils/product-variant.utils'

const messages = {
  required: 'required',
  maxLength: 'max',
  validNumber: 'number',
  nonNegative: 'nonnegative',
  attributeIncomplete: 'incomplete',
  attributeDuplicate: 'duplicate',
  attributeInvalidKey: 'invalid-key',
  attributeInvalidColor: 'invalid-color',
  imageType: 'type',
  imageSize: 'size',
}

describe('Product Variant form mapping', () => {
  it('ignores blank rows and normalizes dynamic technical keys without changing business values', () => {
    expect(
      normalizeVariantAttributeRows([
        { key: ' ', value: '' },
        { key: ' Any thing else ', value: ' Blue Diamond ' },
      ])
    ).toEqual({ any_thing_else: 'Blue Diamond' })
  })

  it('normalizes keys deterministically', () => {
    expect(normalizeVariantAttributeKey('Color')).toBe('color')
    expect(normalizeVariantAttributeKey('Any thing else')).toBe('any_thing_else')
    expect(normalizeVariantAttributeKey('  Stone   Type  ')).toBe('stone_type')
    expect(normalizeVariantAttributeKey('stone-type')).toBe('stone_type')
    expect(normalizeVariantAttributeKey('stone___type')).toBe('stone_type')
    expect(normalizeVariantAttributeKey('---Stone / Type---')).toBe('stone_type')
    expect(isCanonicalVariantAttributeKey('stone_type')).toBe(true)
    expect(isCanonicalVariantAttributeKey('size_2')).toBe(true)
    expect(isCanonicalVariantAttributeKey('é_color')).toBe(false)
    expect(isCanonicalVariantAttributeKey('نوع_الحجر')).toBe(false)
  })

  it('rejects incomplete rows and collisions after key normalization', () => {
    expect(() => normalizeVariantAttributeRows([{ key: 'color', value: '' }])).toThrow(/both/)
    expect(() =>
      normalizeVariantAttributeRows([
        { key: 'Stone Type', value: 'diamond' },
        { key: 'stone-type', value: 'ruby' },
      ])
    ).toThrow(/unique/)
  })

  it('keeps persisted keys authoritative and canonicalizes valid color values', () => {
    expect(
      normalizeVariantAttributeRows([
        { key: 'Legacy Key', value: 'Keep Me', isPersisted: true },
        { key: 'Color', value: '#c8102e' },
      ])
    ).toEqual({ 'Legacy Key': 'Keep Me', color: '#C8102E' })
    expect(isSixDigitHexColor('#C8102E')).toBe(true)
    expect(isSixDigitHexColor('red')).toBe(false)
  })

  it('grandfathers only an unchanged persisted legacy color', async () => {
    const schema = createProductVariantSchema(messages)
    const values = (value: string) => ({
      sku: 'VAR',
      attributes: [{ key: 'color', value, isPersisted: true, originalValue: 'red' }],
      priceOverride: null,
      isActive: true,
      images: { files: [], removedExistingIds: [] },
    })

    await expect(schema.validate(values('red'))).resolves.toBeDefined()
    await expect(schema.validate(values('blue'))).rejects.toThrow('invalid-color')
    await expect(schema.validate(values('#FF0000'))).resolves.toBeDefined()
  })

  it('requires changed canonical colors to remain HEX', async () => {
    const schema = createProductVariantSchema(messages)
    const values = (value: string) => ({
      sku: 'VAR',
      attributes: [{ key: 'color', value, isPersisted: true, originalValue: '#C8102E' }],
      priceOverride: null,
      isActive: true,
      images: { files: [], removedExistingIds: [] },
    })

    await expect(schema.validate(values('#D4AF37'))).resolves.toBeDefined()
    await expect(schema.validate(values('gold'))).rejects.toThrow('invalid-color')
  })

  it.each(['تيست', 'تيست_تيست', 'نوع الحجر', 'é_color'])('rejects a NEW non-ASCII technical key: %s', async (key) => {
    const schema = createProductVariantSchema(messages)
    await expect(
      schema.validate({
        sku: 'VAR',
        attributes: [{ key, value: 'value' }],
        priceOverride: null,
        isActive: true,
        images: { files: [], removedExistingIds: [] },
      })
    ).rejects.toThrow('invalid-key')
  })

  it.each(['__proto__', 'prototype', 'constructor'])('rejects the dangerous NEW key %s', async (key) => {
    const schema = createProductVariantSchema(messages)
    await expect(
      schema.validate({
        sku: 'VAR',
        attributes: [{ key, value: 'value' }],
        priceOverride: null,
        isActive: true,
        images: { files: [], removedExistingIds: [] },
      })
    ).rejects.toThrow('invalid-key')
    expect(() => normalizeVariantAttributeRows([{ key, value: 'value' }])).toThrow()
  })

  it('rejects a NEW canonical collision but grandfathers collisions between persisted keys', () => {
    expect(
      hasNewVariantAttributeKeyCollision([
        { key: 'Stone Type', value: 'legacy', isPersisted: true, originalValue: 'legacy' },
        { key: 'stone-type', value: 'new' },
      ])
    ).toBe(true)
    expect(
      hasNewVariantAttributeKeyCollision([
        { key: 'Stone Type', value: 'one', isPersisted: true, originalValue: 'one' },
        { key: 'stone-type', value: 'two', isPersisted: true, originalValue: 'two' },
      ])
    ).toBe(false)
  })

  it('builds a Create payload containing only new local image files', () => {
    const image = new File(['image'], 'variant.png', { type: 'image/png' })
    expect(
      buildProductVariantCreatePayload({
        sku: ' VAR ',
        attributes: [{ key: ' Stone Type ', value: ' Blue Diamond ' }],
        priceOverride: null,
        isActive: true,
        images: { files: [image], removedExistingIds: [99] },
      })
    ).toEqual({
      sku: 'VAR',
      attributes: { stone_type: 'Blue Diamond' },
      priceOverride: null,
      isActive: true,
      images: [image],
    })
  })

  it('builds Variant Update with the complete attributes object when attributes change', () => {
    expect(
      buildProductVariantUpdatePayload(
        {
          sku: 'VAR',
          attributes: [
            { key: 'color', value: '#D4AF37', isPersisted: true },
            { key: 'size', value: 'l' },
          ],
          priceOverride: null,
          isActive: true,
          images: { files: [], removedExistingIds: [] },
        },
        {
          id: 1,
          sku: 'VAR',
          attributes: { color: '#C0C0C0' },
          priceOverride: 10,
          isActive: true,
          images: [],
          warehouseStocks: [],
        }
      )
    ).toEqual({ attributes: { color: '#D4AF37', size: 'l' }, priceOverride: null })
  })

  it('omits untouched attributes and preserves exact legacy survivors when another attribute changes', () => {
    const original = {
      id: 1,
      sku: 'VAR',
      attributes: { color: 'red', legacy_key: ' Keep Me ', size: 'M' },
      priceOverride: 10,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }
    const persistedAttributes = [
      { key: 'color', value: 'red', isPersisted: true, originalValue: 'red' },
      { key: 'legacy_key', value: ' Keep Me ', isPersisted: true, originalValue: ' Keep Me ' },
      { key: 'size', value: 'M', isPersisted: true, originalValue: 'M' },
    ]

    expect(
      buildProductVariantUpdatePayload(
        {
          sku: 'NEXT',
          attributes: persistedAttributes,
          priceOverride: 10,
          isActive: true,
          images: { files: [], removedExistingIds: [] },
        },
        original
      )
    ).toEqual({ sku: 'NEXT' })
    expect(
      buildProductVariantUpdatePayload(
        {
          sku: 'VAR',
          attributes: persistedAttributes,
          priceOverride: 20,
          isActive: true,
          images: { files: [], removedExistingIds: [] },
        },
        original
      )
    ).toEqual({ priceOverride: 20 })
    expect(
      buildProductVariantUpdatePayload(
        {
          sku: 'VAR',
          attributes: persistedAttributes.map((row) => (row.key === 'size' ? { ...row, value: 'L' } : row)),
          priceOverride: 10,
          isActive: true,
          images: { files: [], removedExistingIds: [] },
        },
        original
      )
    ).toEqual({
      attributes: { color: 'red', legacy_key: ' Keep Me ', size: 'L' },
    })
  })

  it('serializes a new attribute with all existing persisted attributes', () => {
    const original = {
      id: 1,
      sku: 'VAR',
      attributes: { color: '#C0C0C0', size: 'M' },
      priceOverride: null,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }

    expect(
      buildProductVariantUpdatePayload(
        {
          sku: 'VAR',
          attributes: [
            { key: 'color', value: '#C0C0C0', isPersisted: true, originalValue: '#C0C0C0' },
            { key: 'size', value: 'M', isPersisted: true, originalValue: 'M' },
            { key: 'material', value: 'Gold' },
          ],
          priceOverride: null,
          isActive: true,
          images: { files: [], removedExistingIds: [] },
        },
        original
      )
    ).toEqual({
      attributes: { color: '#C0C0C0', size: 'M', material: 'Gold' },
    })
  })

  it('deletes a persisted attribute by omitting it from the complete replacement object', () => {
    const original = {
      id: 1,
      sku: 'VAR',
      attributes: { color: '#C0C0C0', size: 'M' },
      priceOverride: null,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }

    expect(
      buildProductVariantUpdatePayload(
        {
          sku: 'VAR',
          attributes: [{ key: 'color', value: '#C0C0C0', isPersisted: true, originalValue: '#C0C0C0' }],
          priceOverride: null,
          isActive: true,
          images: { files: [], removedExistingIds: [] },
        },
        original
      )
    ).toEqual({ attributes: { color: '#C0C0C0' } })
  })

  it('deletes the final persisted attribute with an empty replacement object', () => {
    const original = {
      id: 1,
      sku: 'VAR',
      attributes: { color: '#C0C0C0' },
      priceOverride: null,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }

    expect(
      buildProductVariantUpdatePayload(
        {
          sku: 'VAR',
          attributes: [],
          priceOverride: null,
          isActive: true,
          images: { files: [], removedExistingIds: [] },
        },
        original
      )
    ).toEqual({ attributes: {} })
  })

  it('sends only intentional legacy and canonical color changes', () => {
    const original = {
      id: 1,
      sku: 'VAR',
      attributes: { color: 'red' },
      priceOverride: null,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }
    const values = (value: string) => ({
      sku: 'VAR',
      attributes: [{ key: 'color', value, isPersisted: true, originalValue: 'red' }],
      priceOverride: null,
      isActive: true,
      images: { files: [], removedExistingIds: [] },
    })

    expect(buildProductVariantUpdatePayload(values('#ff0000'), original)).toEqual({
      attributes: { color: '#FF0000' },
    })
    expect(
      buildProductVariantUpdatePayload(
        {
          ...values('#D4AF37'),
          attributes: [{ key: 'color', value: '#D4AF37', isPersisted: true, originalValue: '#C8102E' }],
        },
        { ...original, attributes: { color: '#C8102E' } }
      )
    ).toEqual({ attributes: { color: '#D4AF37' } })
  })

  it('keeps an existing Unicode key exact and sends only its changed value', () => {
    const key = 'تيست_تيست_تيست'
    const original = {
      id: 1,
      sku: 'VAR',
      attributes: { [key]: '11117' },
      priceOverride: null,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }
    const form = {
      sku: 'VAR',
      attributes: [{ key, value: '22222', isPersisted: true, originalValue: '11117' }],
      priceOverride: null,
      isActive: true,
      images: { files: [], removedExistingIds: [] },
    }

    expect(buildProductVariantUpdatePayload(form, original)).toEqual({ attributes: { [key]: '22222' } })
  })

  it('preserves an unchanged Unicode persisted key when another attribute changes', () => {
    const key = 'ØªÙŠØ³Øª_ØªÙŠØ³Øª_ØªÙŠØ³Øª'
    const original = {
      id: 1,
      sku: 'VAR',
      attributes: { [key]: '11117', size: 'M' },
      priceOverride: null,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }

    expect(
      buildProductVariantUpdatePayload(
        {
          sku: 'VAR',
          attributes: [
            { key, value: '11117', isPersisted: true, originalValue: '11117' },
            { key: 'size', value: 'L', isPersisted: true, originalValue: 'M' },
          ],
          priceOverride: null,
          isActive: true,
          images: { files: [], removedExistingIds: [] },
        },
        original
      )
    ).toEqual({ attributes: { [key]: '11117', size: 'L' } })
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
          { key: 'Stone Type', value: 'diamond' },
          { key: 'stone-type', value: 'ruby' },
        ],
      })
    ).rejects.toThrow('duplicate')
    await expect(schema.validate({ ...base, attributes: [{ key: '---', value: 'value' }] })).rejects.toThrow(
      'invalid-key'
    )
    await expect(schema.validate({ ...base, attributes: [{ key: 'Color', value: 'red' }] })).rejects.toThrow(
      'invalid-color'
    )
    await expect(schema.validate({ ...base, attributes: [{ key: 'Color', value: '#c8102e' }] })).resolves.toBeDefined()
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

  it('classifies flat and empty normalized attributes for presentation', () => {
    expect(getVariantAttributesPresentation({ color: 'silver' })).toEqual({
      kind: 'flat',
      entries: [['color', 'silver']],
    })
    expect(getVariantAttributesPresentation({})).toEqual({ kind: 'empty' })
  })

  it('keeps canonical machine codes separate from localized labels and color visuals', () => {
    const definition: ProductVariantAttributeDefinition = {
      key: 'color',
      label: { ar: 'اللون', en: 'Color' },
      presentation: 'color_swatch',
      values: [{ code: 'gold', label: { ar: 'ذهبي', en: 'Gold' }, visual: { type: 'color', value: '#D4AF37' } }],
    }
    expect(definition.values[0]).toMatchObject({
      code: 'gold',
      label: { ar: 'ذهبي', en: 'Gold' },
      visual: { value: '#D4AF37' },
    })
  })
})
