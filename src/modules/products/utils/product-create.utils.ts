import { EMPTY_IMAGE_UPLOAD_VALUE } from '@/components/form/image-upload'
import type {
  ProductCreateFormValues,
  ProductCreatePayload,
  ProductCreateStockFormValues,
  ProductCreateVariantFormValues,
} from '@/modules/products/types/product.types'
import { normalizeVariantAttributeRows } from '@/modules/products/utils/product-variant.utils'

export function createEmptyProductStock(): ProductCreateStockFormValues {
  return { warehouseId: null, quantity: null }
}

export function createEmptyProductVariant(): ProductCreateVariantFormValues {
  return {
    sku: '',
    attributes: [{ key: '', value: '' }],
    priceOverride: null,
    isActive: true,
    stocks: [],
  }
}

export function createEmptyProductCreateFormValues(): ProductCreateFormValues {
  return {
    categoryId: null,
    sku: '',
    name: { ar: '', en: '' },
    description: { ar: '', en: '' },
    basePrice: null,
    discountPercentage: null,
    discountEndAt: '',
    isPersonalizable: false,
    personalizationMaxLength: null,
    personalizationFee: null,
    hidePriceOnPackaging: false,
    isNewArrival: false,
    isActive: true,
    sortOrder: 0,
    images: EMPTY_IMAGE_UPLOAD_VALUE,
    variants: [],
  }
}

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
    variants: values.variants.map((variant) => ({
      sku: variant.sku.trim(),
      attributes: normalizeVariantAttributeRows(variant.attributes),
      priceOverride: variant.priceOverride,
      isActive: variant.isActive,
      stocks: variant.stocks.map((stock) => {
        if (stock.warehouseId === null || stock.quantity === null) {
          throw new Error('Required Product Variant stock values are missing')
        }
        return { warehouseId: stock.warehouseId, quantity: stock.quantity }
      }),
    })),
  }
}
