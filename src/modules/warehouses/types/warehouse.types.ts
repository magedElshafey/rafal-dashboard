import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { LocalizedName } from '@/types/localized-name.types'

export type WarehouseListItem = {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type WarehouseCity = {
  id: number
  name: LocalizedName
}

export type WarehouseDetail = WarehouseListItem & {
  cities: WarehouseCity[]
}

export type WarehouseFormValues = {
  name: string
  cityIds: string[]
  isActive: boolean
}

export type WarehouseCreatePayload = {
  name: string
  cityIds: number[]
  isActive: boolean
}

export type WarehouseUpdatePayload = {
  name?: string
  cityIds?: number[]
  isActive?: boolean
}

export type RawWarehouseListItem = {
  id: number
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RawWarehouseDetail = RawWarehouseListItem & {
  cities: Array<{ id: number; name: LocalizedName }>
}

export type RawWarehouseCreatePayload = {
  name: string
  city_ids: number[]
  is_active: 0 | 1
}

export type RawWarehouseUpdatePayload = Partial<RawWarehouseCreatePayload>

export type WarehousesIndexResponse = PaginatedDashboardResponse<RawWarehouseListItem>
export type RawWarehouseResponse = { success: boolean; message: string; data: RawWarehouseDetail }
export type WarehouseResponse = { success: boolean; message: string; data: WarehouseDetail }
export type DeleteWarehouseResponse = { success: boolean; message: string }

export type WarehouseSortBy = 'id' | 'name' | 'created_at'
export type WarehouseSortDir = 'asc' | 'desc'

export type WarehousesFilters = {
  cityId: number | null
  createdFrom: string
  createdTo: string
  sortBy: WarehouseSortBy | null
  sortDir: WarehouseSortDir | null
}
