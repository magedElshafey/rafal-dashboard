import * as yup from 'yup'

import type { RegionFormValues } from '@/modules/regions/types/region.types'

type Messages = {
  nameArRequired: string
  nameEnRequired: string
  sortInteger: string
}

export function createRegionSchema(messages: Messages) {
  return yup.object<RegionFormValues>({
    name: yup.object({
      ar: yup.string().trim().required(messages.nameArRequired),
      en: yup.string().trim().required(messages.nameEnRequired),
    }),
    code: yup.string().trim().defined(),
    sortOrder: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
      .nullable()
      .defined()
      .integer(messages.sortInteger),
    isActive: yup.boolean().defined(),
  })
}
