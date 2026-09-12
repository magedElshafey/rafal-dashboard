import type { PaginatedDashboardResponse } from '@/modules/roles/types/pagination.types'

export type Permission = {
  id: number
  name: string
}

export type PermissionsIndexResponse = PaginatedDashboardResponse<Permission>
