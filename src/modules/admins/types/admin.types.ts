import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type Admin = {
  id: number
  name: string
  email: string
  roles: string[]
}

export type AdminSortBy = 'name' | 'email' | 'created_at'
export type AdminSortDir = 'asc' | 'desc'

export type AdminsFilters = {
  search: string
  roleId: number | null
  sortBy: AdminSortBy | null
  sortDir: AdminSortDir | null
}

export type AdminsIndexResponse = PaginatedDashboardResponse<Admin>

export type AdminResponse = {
  success: boolean
  message: string
  data: Admin
}

export type DeleteAdminResponse = Omit<AdminResponse, 'data'>

export type CreateAdminPayload = {
  name: string
  email: string
  password: string
  passwordConfirmation: string
  roles: string[]
}

export type UpdateAdminPayload = {
  name: string
  email: string
  roles: string[]
}

export type AdminFormValues = {
  name: string
  email: string
  password: string
  passwordConfirmation: string
  roles: string[]
}
