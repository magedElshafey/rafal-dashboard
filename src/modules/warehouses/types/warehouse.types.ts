import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type Warehouse = {
  id: number
  name: string
  coverage_zone: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type WarehouseFormValues = {
  name: string
  coverageZone: string[]
  isActive: boolean
}

export type WarehousePayload = WarehouseFormValues
export type WarehousesIndexResponse = PaginatedDashboardResponse<Warehouse>
export type WarehouseResponse = { success: boolean; message: string; data: Warehouse }
export type DeleteWarehouseResponse = Omit<WarehouseResponse, 'data'>
