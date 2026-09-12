export type DashboardPaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type PaginatedDashboardResponse<T> = {
  success: boolean
  message: string
  data: T[]
  meta: DashboardPaginationMeta
}
