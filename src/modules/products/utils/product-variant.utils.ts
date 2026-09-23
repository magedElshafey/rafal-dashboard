import type {
  ProductVariantCreatePayload,
  ProductVariantFormValues,
  JsonValue,
  VariantAttributeRow,
} from '@/modules/products/types/product-variant.types'

export type VariantAttributesPresentation =
  { kind: 'empty' } | { kind: 'flat'; entries: Array<[string, string]> } | { kind: 'complex' }

export function getVariantAttributesPresentation(attributes: JsonValue): VariantAttributesPresentation {
  if (attributes === null) return { kind: 'empty' }
  if (Array.isArray(attributes)) return attributes.length === 0 ? { kind: 'empty' } : { kind: 'complex' }
  if (typeof attributes !== 'object') return { kind: 'complex' }
  const entries = Object.entries(attributes)
  if (entries.length === 0) return { kind: 'empty' }
  if (entries.every((entry): entry is [string, string] => typeof entry[1] === 'string')) {
    return { kind: 'flat', entries }
  }
  return { kind: 'complex' }
}

export function normalizeVariantAttributeRows(rows: VariantAttributeRow[]) {
  const attributes: Record<string, string> = {}
  rows.forEach((row) => {
    const key = row.key.trim()
    const value = row.value.trim()
    if (!key && !value) return
    if (!key || !value) throw new Error('Variant attributes require both a key and value')
    if (Object.prototype.hasOwnProperty.call(attributes, key)) throw new Error('Variant attribute keys must be unique')
    attributes[key] = value
  })
  return attributes
}

export function buildProductVariantCreatePayload(values: ProductVariantFormValues): ProductVariantCreatePayload {
  return {
    sku: values.sku.trim(),
    attributes: normalizeVariantAttributeRows(values.attributes),
    priceOverride: values.priceOverride,
    isActive: values.isActive,
    images: values.images.files,
  }
}
