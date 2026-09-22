import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import type { ProductCreateFormValues } from '@/modules/products/types/product.types'

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
}

const nullableNumber = (messages: ProductCreateValidationMessages) =>
  yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
    .nullable()
    .defined()
    .typeError(messages.validNumber)
    .test('finite', messages.validNumber, (value) => value === null || Number.isFinite(value))

export function createProductCreateSchema(messages: ProductCreateValidationMessages) {
  return yup.object<ProductCreateFormValues>({
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
