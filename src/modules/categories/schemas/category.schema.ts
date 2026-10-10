import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import type { CategoryFormValues } from '@/modules/categories/types/category.types'

type Messages = {
  nameArRequired: string
  nameEnRequired: string
  sortRequired: string
  sortInteger: string
  sortNonNegative: string
  imageRequired: string
}

export function createCategorySchema(mode: 'create' | 'edit', hasExistingImage: boolean, messages: Messages) {
  return yup.object<CategoryFormValues>({
    parent_id: yup.number().nullable().defined(),
    name: yup.object({
      ar: yup.string().trim().required(messages.nameArRequired),
      en: yup.string().trim().required(messages.nameEnRequired),
    }),
    description: yup.object({
      ar: yup.string().trim().defined(),
      en: yup.string().trim().defined(),
    }),
    is_active: yup.boolean().defined(),
    sort_order: yup
      .number()
      .typeError(messages.sortRequired)
      .required(messages.sortRequired)
      .integer(messages.sortInteger)
      .min(0, messages.sortNonNegative),
    image: yup
      .mixed<ImageUploadValue>()
      .defined()
      .test('required-image', messages.imageRequired, function (value) {
        if (this.parent.parent_id !== null || value.files.length > 0) return true
        return mode === 'edit' && hasExistingImage && value.removedExistingIds.length === 0
      })
      .test('single-image', messages.imageRequired, (value) => value.files.length <= 1),
  })
}
