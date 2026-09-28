import type { FieldNamesMarkedBoolean } from 'react-hook-form'

import type {
  WarehouseCreatePayload,
  WarehouseFormValues,
  WarehouseUpdatePayload,
} from '@/modules/warehouses/types/warehouse.types'

export function parseWarehouseCityIds(cityIds: string[]) {
  return [...new Set(cityIds)].map((value) => {
    const normalized = value.trim()
    if (!/^[1-9]\d*$/.test(normalized)) throw new Error('City ID is unavailable')
    const id = Number(normalized)
    if (!Number.isSafeInteger(id)) throw new Error('City ID is unavailable')
    return id
  })
}

export function buildWarehouseCreatePayload(values: WarehouseFormValues): WarehouseCreatePayload {
  return {
    name: values.name.trim(),
    cityIds: parseWarehouseCityIds(values.cityIds),
    isActive: values.isActive,
  }
}

export function buildWarehouseUpdatePayload(
  values: WarehouseFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<WarehouseFormValues>>>
): WarehouseUpdatePayload {
  return {
    ...(dirtyFields.name ? { name: values.name.trim() } : {}),
    ...(dirtyFields.cityIds ? { cityIds: parseWarehouseCityIds(values.cityIds) } : {}),
    ...(dirtyFields.isActive ? { isActive: values.isActive } : {}),
  }
}
