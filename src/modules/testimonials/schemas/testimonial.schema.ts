import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import type { TestimonialFormValues } from '@/modules/testimonials/types/testimonial.types'

type Messages = {
  required: string
  validNumber: string
  integer: string
}

export function createTestimonialSchema(messages: Messages) {
  const requiredNumber = yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? Number.NaN : value))
    .typeError(messages.validNumber)
    .required(messages.required)
    .test('finite', messages.validNumber, Number.isFinite)

  return yup.object<TestimonialFormValues>({
    name: yup.object({
      ar: yup.string().trim().required(messages.required),
      en: yup.string().trim().required(messages.required),
    }),
    title: yup.object({
      ar: yup.string().trim().required(messages.required),
      en: yup.string().trim().required(messages.required),
    }),
    comment: yup.object({
      ar: yup.string().trim().required(messages.required),
      en: yup.string().trim().required(messages.required),
    }),
    rating: requiredNumber.nullable().defined(),
    sortOrder: requiredNumber.integer(messages.integer).nullable().defined(),
    isPublished: yup.boolean().defined(),
    avatar: yup.mixed<ImageUploadValue>().defined(),
  })
}
