import * as yup from 'yup'

import type { CategoryFormValues } from '@/modules/categories/types/category.types'

type Messages = {
  nameArRequired: string
  nameEnRequired: string
  slugRequired: string
  sortRequired: string
  sortInteger: string
  sortNonNegative: string
}

export function createCategorySchema(messages: Messages) {
  return yup.object<CategoryFormValues>({
    parent_id: yup.number().nullable().defined(),
    name: yup.object({
      ar: yup.string().trim().required(messages.nameArRequired),
      en: yup.string().trim().required(messages.nameEnRequired),
    }),
    slug: yup.string().trim().required(messages.slugRequired),
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
  })
}
