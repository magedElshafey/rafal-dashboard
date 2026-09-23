import * as yup from 'yup'

import type { VariantWarehouseStockFormValues } from '@/modules/products/types/product-variant.types'

export type ProductVariantStockValidationMessages = {
  required: string
  validNumber: string
  integer: string
  nonNegative: string
}

export function createProductVariantStockSchema(messages: ProductVariantStockValidationMessages) {
  const nullableNumber = yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
    .nullable()
    .defined()
    .typeError(messages.validNumber)
    .test('finite', messages.validNumber, (value) => value === null || Number.isFinite(value))

  return yup.object<VariantWarehouseStockFormValues>({
    warehouseId: nullableNumber.required(messages.required).integer(messages.integer),
    quantity: nullableNumber.required(messages.required).integer(messages.integer).min(0, messages.nonNegative),
  })
}
