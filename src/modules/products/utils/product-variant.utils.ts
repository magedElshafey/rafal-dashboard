import type {
  ProductVariant,
  ProductVariantCreatePayload,
  ProductVariantFormValues,
  ProductVariantUpdatePayload,
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

export function productVariantToFormValues(variant: ProductVariant): ProductVariantFormValues {
  const presentation = getVariantAttributesPresentation(variant.attributes)
  return {
    sku: variant.sku,
    attributes:
      presentation.kind === 'flat'
        ? presentation.entries.map(([key, value]) => ({ key, value }))
        : [{ key: '', value: '' }],
    priceOverride: variant.priceOverride,
    isActive: variant.isActive,
    images: { files: [], removedExistingIds: [] },
  }
}

export function buildProductVariantUpdatePayload(
  values: ProductVariantFormValues,
  original: ProductVariant
): ProductVariantUpdatePayload {
  const payload: ProductVariantUpdatePayload = {}
  const sku = values.sku.trim()
  if (sku !== original.sku) payload.sku = sku
  if (values.priceOverride !== original.priceOverride) payload.priceOverride = values.priceOverride
  if (values.isActive !== original.isActive) payload.isActive = values.isActive
  if (values.images.files.length > 0) payload.images = [...values.images.files]

  const next = normalizeVariantAttributeRows(values.attributes)
  const current = getVariantAttributesPresentation(original.attributes)
  const currentFlat = current.kind === 'flat' ? Object.fromEntries(current.entries) : {}
  const changed = Object.fromEntries(Object.entries(next).filter(([key, value]) => currentFlat[key] !== value))
  if (Object.keys(changed).length > 0) payload.attributes = changed
  return payload
}
