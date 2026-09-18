import * as yup from 'yup'

import type { WarehouseFormValues } from '@/modules/warehouses/types/warehouse.types'

export function createWarehouseSchema(nameRequired: string) {
  return yup.object<WarehouseFormValues>({
    name: yup.string().trim().required(nameRequired),
    coverageZone: yup.array(yup.string().trim().defined()).defined(),
    isActive: yup.boolean().defined(),
  })
}
