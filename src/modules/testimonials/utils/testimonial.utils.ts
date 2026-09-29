import { EMPTY_IMAGE_UPLOAD_VALUE } from '@/components/form/image-upload'
import type {
  Testimonial,
  TestimonialFormValues,
  TestimonialWritePayload,
} from '@/modules/testimonials/types/testimonial.types'
import type { LocalizedName } from '@/types/localized-name.types'

export function getLocalizedTestimonialValue(value: LocalizedName, language: string) {
  const preferred = language.startsWith('ar') ? value.ar : value.en
  return preferred.trim() || value.ar.trim() || value.en.trim() || '—'
}

export function toTestimonialFormValues(testimonial: Testimonial): TestimonialFormValues {
  return {
    name: { ...testimonial.name },
    title: { ...testimonial.title },
    comment: { ...testimonial.comment },
    rating: testimonial.rating,
    sortOrder: testimonial.sortOrder,
    isPublished: testimonial.isPublished,
    avatar: EMPTY_IMAGE_UPLOAD_VALUE,
  }
}

export function buildTestimonialPayload(values: TestimonialFormValues): TestimonialWritePayload {
  if (values.rating === null || values.sortOrder === null) {
    throw new Error('Validated testimonial numeric fields are unavailable')
  }
  const avatar = values.avatar.files[0]
  return {
    name: { ar: values.name.ar.trim(), en: values.name.en.trim() },
    title: { ar: values.title.ar.trim(), en: values.title.en.trim() },
    comment: { ar: values.comment.ar.trim(), en: values.comment.en.trim() },
    rating: values.rating,
    sortOrder: values.sortOrder,
    isPublished: values.isPublished,
    ...(avatar ? { avatar } : {}),
  }
}
