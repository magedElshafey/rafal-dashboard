import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import type { ProductCreateFormValues, ProductFormValues } from '@/modules/products/types/product.types'
import {
  hasNewVariantAttributeKeyCollision,
  isCanonicalVariantAttributeKey,
  isDangerousVariantAttributeKey,
  isSixDigitHexColor,
  normalizeVariantAttributeKey,
} from '@/modules/products/utils/product-variant.utils'

export const PRODUCT_IMAGE_MAX_SIZE = 5 * 1024 * 1024

export type ProductCreateValidationMessages = {
  required: string
  validNumber: string
  nonNegative: string
  integer: string
  minimumOne: string
  discountRange: string
  maxLength: string
  dateInvalid: string
  imageType: string
  imageSize: string
  imageRequired?: string
  variantRequired?: string
  duplicateVariantSku?: string
  attributeIncomplete?: string
  attributeDuplicate?: string
  attributeInvalidKey?: string
  attributeInvalidColor?: string
  duplicateWarehouse?: string
}

const nullableNumber = (messages: ProductCreateValidationMessages) =>
  yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
    .nullable()
    .defined()
    .typeError(messages.validNumber)
    .test('finite', messages.validNumber, (value) => value === null || Number.isFinite(value))

export function createProductFormSchema(messages: ProductCreateValidationMessages) {
  return yup.object<ProductFormValues>({
    categoryId: nullableNumber(messages).required(messages.required),
    sku: yup.string().trim().required(messages.required).max(255, messages.maxLength),
    name: yup.object({
      ar: yup.string().trim().required(messages.required).max(255, messages.maxLength),
      en: yup.string().trim().defined().max(255, messages.maxLength),
    }),
    description: yup.object({
      ar: yup.string().trim().defined(),
      en: yup.string().trim().defined(),
    }),
    basePrice: nullableNumber(messages).required(messages.required).min(0, messages.nonNegative),
    discountPercentage: nullableNumber(messages)
      .integer(messages.integer)
      .min(0, messages.discountRange)
      .max(100, messages.discountRange),
    discountEndAt: yup
      .string()
      .trim()
      .defined()
      .test('valid-date', messages.dateInvalid, (value) => !value || !Number.isNaN(Date.parse(value))),
    isPersonalizable: yup.boolean().required(messages.required).defined(),
    personalizationMaxLength: nullableNumber(messages)
      .when('isPersonalizable', {
        is: true,
        then: (schema) => schema.required(messages.required),
      })
      .integer(messages.integer)
      .min(1, messages.minimumOne),
    personalizationFee: nullableNumber(messages).min(0, messages.nonNegative),
    hidePriceOnPackaging: yup.boolean().required(messages.required).defined(),
    isNewArrival: yup.boolean().required(messages.required).defined(),
    isActive: yup.boolean().required(messages.required).defined(),
    sortOrder: nullableNumber(messages).required(messages.required).integer(messages.integer),
    images: yup
      .mixed<ImageUploadValue>()
      .defined()
      .test('image-type', messages.imageType, (value) => value.files.every((file) => file.type.startsWith('image/')))
      .test('image-size', messages.imageSize, (value) =>
        value.files.every((file) => file.size <= PRODUCT_IMAGE_MAX_SIZE)
      ),
  })
}

export function createProductCreateSchema(messages: ProductCreateValidationMessages) {
  const baseFields = createProductFormSchema(messages).fields
  const required = messages.required
  const nonNegative = messages.nonNegative
  const integer = messages.integer

  return yup.object<ProductCreateFormValues>({
    ...baseFields,
    images: yup
      .mixed<ImageUploadValue>()
      .defined()
      .test('image-required', messages.imageRequired ?? required, (value) => value.files.length > 0)
      .test('image-type', messages.imageType, (value) => value.files.every((file) => file.type.startsWith('image/')))
      .test('image-size', messages.imageSize, (value) =>
        value.files.every((file) => file.size <= PRODUCT_IMAGE_MAX_SIZE)
      ),
    variants: yup
      .array()
      .of(
        yup.object({
          sku: yup.string().trim().required(required).max(255, messages.maxLength),
          attributes: yup
            .array()
            .of(
              yup
                .object({
                  key: yup.string().defined(),
                  value: yup.string().defined(),
                })
                .test('complete-row', messages.attributeIncomplete ?? required, function (row) {
                  if (!row) return true
                  const key = row.key.trim()
                  const value = row.value.trim()
                  if ((!key && !value) || (key && value)) return true
                  return this.createError({ path: `${this.path}.${key ? 'value' : 'key'}` })
                })
                .test('valid-key', messages.attributeInvalidKey ?? required, function (row) {
                  if (!row?.key.trim()) return true
                  const key = normalizeVariantAttributeKey(row.key)
                  return (
                    (!isDangerousVariantAttributeKey(row.key) && isCanonicalVariantAttributeKey(key)) ||
                    this.createError({ path: `${this.path}.key` })
                  )
                })
                .test('valid-color', messages.attributeInvalidColor ?? required, function (row) {
                  if (!row?.key.trim() || !row.value.trim()) return true
                  return (
                    normalizeVariantAttributeKey(row.key) !== 'color' ||
                    isSixDigitHexColor(row.value) ||
                    this.createError({ path: `${this.path}.value` })
                  )
                })
            )
            .defined()
            .test(
              'unique-keys',
              messages.attributeDuplicate ?? required,
              (rows) => !hasNewVariantAttributeKeyCollision(rows)
            ),
          priceOverride: nullableNumber(messages).min(0, nonNegative),
          isActive: yup.boolean().required(required).defined(),
          stocks: yup
            .array()
            .of(
              yup.object({
                warehouseId: nullableNumber(messages).required(required).integer(integer),
                quantity: nullableNumber(messages).required(required).integer(integer).min(0, nonNegative),
              })
            )
            .defined()
            .test('unique-warehouses', messages.duplicateWarehouse ?? required, (stocks) => {
              const ids = stocks.map((stock) => stock.warehouseId).filter((id) => id !== null)
              return new Set(ids).size === ids.length
            }),
        })
      )
      .min(1, messages.variantRequired ?? required)
      .defined()
      .test('unique-skus', messages.duplicateVariantSku ?? required, (variants) => {
        const skus = variants.map((variant) => variant.sku.trim().toLocaleLowerCase()).filter(Boolean)
        return new Set(skus).size === skus.length
      }),
  })
}
