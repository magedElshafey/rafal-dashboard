import type { FieldNamesMarkedBoolean } from 'react-hook-form'

import { EMPTY_IMAGE_UPLOAD_VALUE } from '@/components/form/image-upload'
import { toProductDateTimeLocal } from '@/modules/products/api/products.service'
import type { ProductDetail, ProductFormValues, ProductUpdatePayload } from '@/modules/products/types/product.types'

export function productDetailToFormValues(product: ProductDetail): ProductFormValues {
  return {
    categoryId: product.categoryId,
    sku: product.sku,
    name: { ...product.name },
    description: { ...product.description },
    basePrice: product.basePrice,
    discountPercentage: product.discountPercentage,
    discountEndAt: toProductDateTimeLocal(product.discountEndAt),
    isPersonalizable: product.isPersonalizable,
    personalizationMaxLength: product.personalizationMaxLength,
    personalizationFee: product.personalizationFee,
    hidePriceOnPackaging: product.hidePriceOnPackaging,
    isNewArrival: product.isNewArrival,
    isActive: product.isActive,
    sortOrder: product.sortOrder,
    images: EMPTY_IMAGE_UPLOAD_VALUE,
  }
}

export function buildProductUpdatePayload(
  values: ProductFormValues,
  dirty: Partial<Readonly<FieldNamesMarkedBoolean<ProductFormValues>>>
): ProductUpdatePayload {
  const payload: ProductUpdatePayload = {}
  if (dirty.categoryId && values.categoryId !== null) payload.categoryId = values.categoryId
  if (dirty.sku) payload.sku = values.sku.trim()
  if (dirty.name?.ar) payload.name = { ...payload.name, ar: values.name.ar.trim() }
  if (dirty.name?.en) payload.name = { ...payload.name, en: values.name.en.trim() || null }
  if (dirty.description?.ar) payload.description = { ...payload.description, ar: values.description.ar.trim() || null }
  if (dirty.description?.en) payload.description = { ...payload.description, en: values.description.en.trim() || null }
  if (dirty.basePrice && values.basePrice !== null) payload.basePrice = values.basePrice
  if (dirty.discountPercentage) payload.discountPercentage = values.discountPercentage
  if (dirty.discountEndAt) payload.discountEndAt = values.discountEndAt.trim() || null
  if (dirty.isPersonalizable) {
    payload.isPersonalizable = values.isPersonalizable
    if (!values.isPersonalizable) {
      payload.personalizationMaxLength = null
      payload.personalizationFee = null
    }
  }
  if (dirty.personalizationMaxLength && values.isPersonalizable)
    payload.personalizationMaxLength = values.personalizationMaxLength
  if (dirty.personalizationFee && values.isPersonalizable) payload.personalizationFee = values.personalizationFee
  if (dirty.hidePriceOnPackaging) payload.hidePriceOnPackaging = values.hidePriceOnPackaging
  if (dirty.isNewArrival) payload.isNewArrival = values.isNewArrival
  if (dirty.isActive) payload.isActive = values.isActive
  if (dirty.sortOrder && values.sortOrder !== null) payload.sortOrder = values.sortOrder
  if (dirty.images && values.images.files.length > 0) payload.images = [...values.images.files]
  return payload
}
