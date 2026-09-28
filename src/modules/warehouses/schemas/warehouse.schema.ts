import * as yup from 'yup'

import type { WarehouseFormValues } from '@/modules/warehouses/types/warehouse.types'

export function createWarehouseSchema(mode: 'create' | 'edit', nameRequired: string, citiesRequired: string) {
  return yup.object<WarehouseFormValues>({
    name: yup.string().trim().required(nameRequired),
    cityIds: yup
      .array(
        yup
          .string()
          .trim()
          .matches(/^[1-9]\d*$/)
          .defined()
      )
      .min(mode === 'create' ? 1 : 0, citiesRequired)
      .defined(),
    isActive: yup.boolean().defined(),
  })
}
