import type { InventoryPage } from '@/modules/inventory/types/inventory.types'

export function readInventoryPage(value: string | null): number {
  return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : 1
}

// The shared footer updates the URL page; transport owns warehouse_id/page serialization.
export function inventoryPagination({ meta, items }: InventoryPage): Pagination {
  return {
    current_page: meta.current_page,
    total_pages: meta.last_page,
    per_page: meta.per_page,
    total: meta.total,
    count: items.length,
    next_page_url: null,
    prev_page_url: null,
  }
}
