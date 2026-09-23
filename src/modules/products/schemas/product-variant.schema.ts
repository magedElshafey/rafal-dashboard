import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import { PRODUCT_IMAGE_MAX_SIZE } from '@/modules/products/schemas/product-create.schema'
import type { ProductVariantFormValues } from '@/modules/products/types/product-variant.types'

export type ProductVariantValidationMessages = {
  required: string
  maxLength: string
  validNumber: string
  nonNegative: string
  attributeIncomplete: string
  attributeDuplicate: string
  imageType: string
  imageSize: string
}

export function createProductVariantSchema(messages: ProductVariantValidationMessages) {
  return yup.object<ProductVariantFormValues>({
    sku: yup.string().trim().required(messages.required).max(255, messages.maxLength),
    attributes: yup
      .array()
      .of(
        yup
          .object({ key: yup.string().trim().defined(), value: yup.string().trim().defined() })
          .test('complete-row', messages.attributeIncomplete, function (row) {
            if (!row) return true
            const key = row.key.trim()
            const value = row.value.trim()
            if ((!key && !value) || (key && value)) return true
            return this.createError({ path: `${this.path}.${key ? 'value' : 'key'}` })
          })
      )
      .defined()
      .test('unique-keys', messages.attributeDuplicate, (rows) => {
        const keys = rows.map((row) => row.key.trim()).filter(Boolean)
        return new Set(keys).size === keys.length
      }),
    priceOverride: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
      .nullable()
      .defined()
      .typeError(messages.validNumber)
      .test('finite', messages.validNumber, (value) => value === null || Number.isFinite(value))
      .min(0, messages.nonNegative),
    isActive: yup.boolean().required(messages.required).defined(),
    images: yup
      .mixed<ImageUploadValue>()
      .defined()
      .test('image-type', messages.imageType, (value) => value.files.every((file) => file.type.startsWith('image/')))
      .test('image-size', messages.imageSize, (value) =>
        value.files.every((file) => file.size <= PRODUCT_IMAGE_MAX_SIZE)
      ),
  })
}
