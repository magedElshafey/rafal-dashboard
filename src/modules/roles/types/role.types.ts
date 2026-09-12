export type Role = {
  id: number
  name: string
  permissions: string[]
}

export type RolesIndexResponse = PaginatedDashboardResponse<Role>

export type RoleResponse = {
  success: boolean
  message: string
  data: Role
}

export type DeleteRoleResponse = Omit<RoleResponse, 'data'>

export type CreateRolePayload = {
  name: string
  permissions?: string[]
}

export type UpdateRolePayload = {
  name: string
  permissions?: string[]
}

export type RoleFormValues = {
  name: string
  permissions: string[]
}

export type RolesListParams = {
  page: number
}
import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
