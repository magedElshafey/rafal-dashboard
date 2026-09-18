import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type LocalizedName = { ar: string; en: string }

export type Region = {
  id: number
  name: LocalizedName
  code: string | null
  is_active: boolean
  sort_order: number
  cities_count: number
  created_at: string
  updated_at: string
}

export type RegionFormValues = {
  name: LocalizedName
  code: string
  sortOrder: number | null
  isActive: boolean
}

export type RegionPayload = {
  name: LocalizedName
  code?: string
  sortOrder?: number | null
  isActive: boolean
}
export type RawRegion = Omit<Region, 'cities_count'> & { cities_count?: number }
export type RegionsIndexResponse = PaginatedDashboardResponse<RawRegion>
export type RawRegionResponse = { success: boolean; message: string; data: RawRegion }
export type RegionResponse = { success: boolean; message: string; data: Region }
export type DeleteRegionResponse = Omit<RegionResponse, 'data'>
