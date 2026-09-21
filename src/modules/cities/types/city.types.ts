import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { Coordinate } from '@/types/geo.types'
import type { LocalizedName } from '@/types/localized-name.types'

export type RegionSummary = {
  id: number
  name: LocalizedName
}

export type City = {
  id: number
  region_id: number
  region: RegionSummary
  name: LocalizedName
  boundary: Coordinate[] | null
  center: Coordinate | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type CityFormValues = {
  regionId: number | null
  name: LocalizedName
  isActive: boolean
  sortOrder: number | null
  boundary: Coordinate[]
  center: Coordinate | null
}

export type CityPayload = CityFormValues

export type CityCreateRequest = {
  region_id: number
  name: LocalizedName
  is_active: boolean
  sort_order?: number
  boundary: Coordinate[]
  center: Coordinate
}

export type CityUpdatePayload = {
  regionId?: number
  nameAr?: string
  nameEn?: string
  sortOrder?: number | null
  isActive?: boolean
  center?: Coordinate
  boundary?: Coordinate[]
}

export type DeleteCityResponse = { success: boolean; message: string }

export type CitiesIndexResponse = PaginatedDashboardResponse<City>
export type CityResponse = { success: boolean; message: string; data: City & { warehouse?: unknown } }
