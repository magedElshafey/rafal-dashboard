import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type Permission = {
  id: number
  name: string
}

export type PermissionsIndexResponse = PaginatedDashboardResponse<Permission>
