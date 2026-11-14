import type { DashboardPaginationMeta } from '@/types/dashboard-api.types'

export function readLoyaltyPage(value: string | null | undefined): number {
  return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : 1
}

export function loyaltyPagination(meta: DashboardPaginationMeta, itemCount: number): Pagination {
  return {
    current_page: meta.current_page,
    total_pages: meta.last_page,
    per_page: meta.per_page,
    total: meta.total,
    count: itemCount,
    next_page_url: null,
    prev_page_url: null,
  }
}
