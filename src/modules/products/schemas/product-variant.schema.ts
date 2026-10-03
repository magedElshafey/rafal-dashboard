import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import { PRODUCT_IMAGE_MAX_SIZE } from '@/modules/products/schemas/product-create.schema'
import type { ProductVariantFormValues } from '@/modules/products/types/product-variant.types'
import {
  hasNewVariantAttributeKeyCollision,
  isCanonicalVariantAttributeKey,
  isDangerousVariantAttributeKey,
  isSixDigitHexColor,
  normalizeVariantAttributeKey,
} from '@/modules/products/utils/product-variant.utils'

export type ProductVariantValidationMessages = {
  required: string
  maxLength: string
  validNumber: string
  nonNegative: string
  attributeIncomplete: string
  attributeDuplicate: string
  attributeInvalidKey: string
  attributeInvalidColor: string
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
          .object({
            key: yup.string().defined(),
            value: yup.string().defined(),
            isPersisted: yup.boolean().optional(),
            originalValue: yup.string().optional(),
          })
          .test('complete-row', messages.attributeIncomplete, function (row) {
            if (!row) return true
            const key = row.key.trim()
            const value = row.value.trim()
            if ((!key && !value) || (key && value)) return true
            return this.createError({ path: `${this.path}.${key ? 'value' : 'key'}` })
          })
          .test('valid-key', messages.attributeInvalidKey, function (row) {
            if (!row?.key.trim() || row.isPersisted) return true
            const key = normalizeVariantAttributeKey(row.key)
            return (
              (!isDangerousVariantAttributeKey(row.key) && isCanonicalVariantAttributeKey(key)) ||
              this.createError({ path: `${this.path}.key` })
            )
          })
          .test('valid-color', messages.attributeInvalidColor, function (row) {
            if (!row?.key.trim() || !row.value.trim()) return true
            const key = row.isPersisted ? row.key : normalizeVariantAttributeKey(row.key)
            const isUnchangedLegacy =
              row.isPersisted && row.originalValue !== undefined && row.value === row.originalValue
            return (
              key !== 'color' ||
              isSixDigitHexColor(row.value) ||
              isUnchangedLegacy ||
              this.createError({ path: `${this.path}.value` })
            )
          })
      )
      .defined()
      .test('unique-keys', messages.attributeDuplicate, (rows) => !hasNewVariantAttributeKeyCollision(rows)),
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
