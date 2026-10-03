import type {
  ProductVariant,
  ProductVariantCreatePayload,
  ProductVariantFormValues,
  ProductVariantUpdatePayload,
  VariantAttributes,
  VariantAttributeRow,
} from '@/modules/products/types/product-variant.types'

export type VariantAttributesPresentation = { kind: 'empty' } | { kind: 'flat'; entries: Array<[string, string]> }

export function getVariantAttributesPresentation(attributes: VariantAttributes): VariantAttributesPresentation {
  const entries = Object.entries(attributes)
  if (entries.length === 0) return { kind: 'empty' }
  return { kind: 'flat', entries }
}

export function normalizeVariantAttributeKey(input: string) {
  return input
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const CANONICAL_VARIANT_ATTRIBUTE_KEY = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/
const DANGEROUS_VARIANT_ATTRIBUTE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export function isCanonicalVariantAttributeKey(key: string) {
  return CANONICAL_VARIANT_ATTRIBUTE_KEY.test(key)
}

export function isDangerousVariantAttributeKey(key: string) {
  return DANGEROUS_VARIANT_ATTRIBUTE_KEYS.has(key.normalize('NFKC').trim().toLowerCase())
}

export function hasNewVariantAttributeKeyCollision(rows: VariantAttributeRow[]) {
  const seen = new Map<string, { hasNew: boolean }>()
  for (const row of rows) {
    if (!row.key.trim()) continue
    const canonicalKey = normalizeVariantAttributeKey(row.key)
    const existing = seen.get(canonicalKey)
    if (!row.isPersisted) {
      if (existing) return true
      seen.set(canonicalKey, { hasNew: true })
    } else if (existing?.hasNew) {
      return true
    } else if (!existing) {
      seen.set(canonicalKey, { hasNew: false })
    }
  }
  return false
}

export function isSixDigitHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

export function humanizeVariantAttributeKey(key: string) {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function normalizeVariantAttributeRows(rows: VariantAttributeRow[]) {
  if (hasNewVariantAttributeKeyCollision(rows)) throw new Error('Variant attribute keys must be unique')
  const attributes: Record<string, string> = {}
  rows.forEach((row) => {
    const key = row.isPersisted ? row.key : normalizeVariantAttributeKey(row.key)
    const isUnchangedPersisted = row.isPersisted && row.originalValue !== undefined && row.value === row.originalValue
    const value = isUnchangedPersisted ? row.value : row.value.trim()
    if (!key && !value) return
    if (!key || !value) throw new Error('Variant attributes require both a key and value')
    if (isDangerousVariantAttributeKey(row.key)) throw new Error('Variant attribute key is unsafe')
    if (!row.isPersisted && !isCanonicalVariantAttributeKey(key)) {
      throw new Error('Variant attribute key is invalid')
    }
    if (Object.prototype.hasOwnProperty.call(attributes, key)) throw new Error('Variant attribute keys must be unique')
    attributes[key] = key === 'color' && isSixDigitHexColor(value) ? value.toUpperCase() : value
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
        ? presentation.entries.map(([key, value]) => ({ key, value, isPersisted: true, originalValue: value }))
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

  const current = getVariantAttributesPresentation(original.attributes)
  const currentFlat = current.kind === 'flat' ? Object.fromEntries(current.entries) : {}
  if (hasNewVariantAttributeKeyCollision(values.attributes)) {
    throw new Error('Variant attribute keys must be unique')
  }
  const changed: VariantAttributes = {}
  values.attributes.forEach((row) => {
    const key = row.isPersisted ? row.key : normalizeVariantAttributeKey(row.key)
    const value = row.value.trim()
    if (!key && !value) return
    if (!key || !value) throw new Error('Variant attributes require both a key and value')
    if (isDangerousVariantAttributeKey(row.key)) throw new Error('Variant attribute key is unsafe')
    if (!row.isPersisted && !isCanonicalVariantAttributeKey(key)) {
      throw new Error('Variant attribute key is invalid')
    }
    const originalValue = row.isPersisted ? (row.originalValue ?? currentFlat[key]) : undefined
    if (row.isPersisted && row.value === originalValue) return
    const normalizedValue = key === 'color' && isSixDigitHexColor(value) ? value.toUpperCase() : value
    if (currentFlat[key] !== normalizedValue) changed[key] = normalizedValue
  })
  if (Object.keys(changed).length > 0) payload.attributes = changed
  return payload
}
