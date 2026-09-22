import type { ProductCreateFormValues, ProductCreatePayload } from '@/modules/products/types/product.types'

export function buildProductCreatePayload(values: ProductCreateFormValues): ProductCreatePayload {
  if (values.categoryId === null || values.basePrice === null || values.sortOrder === null) {
    throw new Error('Required Product Create values are missing')
  }

  return {
    categoryId: values.categoryId,
    sku: values.sku.trim(),
    name: { ar: values.name.ar.trim(), en: values.name.en.trim() },
    description: { ar: values.description.ar.trim(), en: values.description.en.trim() },
    basePrice: values.basePrice,
    discountPercentage: values.discountPercentage,
    discountEndAt: values.discountEndAt.trim() || null,
    isPersonalizable: values.isPersonalizable,
    personalizationMaxLength: values.isPersonalizable ? values.personalizationMaxLength : null,
    personalizationFee: values.isPersonalizable ? values.personalizationFee : null,
    hidePriceOnPackaging: values.hidePriceOnPackaging,
    isNewArrival: values.isNewArrival,
    isActive: values.isActive,
    sortOrder: values.sortOrder,
    images: [...values.images.files],
  }
}
