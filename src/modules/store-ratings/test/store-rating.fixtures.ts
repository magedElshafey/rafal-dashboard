import type { RawStoreRating } from '../types/store-rating.types'

export const rawStoreRating: RawStoreRating = {
  id: 2,
  rating: 5,
  comment: 'جميل جدا',
  status: 'pending',
  admin_response: null,
  user: { id: 1, first_name: 'abdullah', last_name: 'essam', email: 'abdullah.essam@gmail.com' },
  order: { id: 47, order_number: 'RF-10047' },
  created_at: '2026-09-23T17:45:03+00:00',
  updated_at: '2026-09-23T17:45:03+00:00',
}

export function paginated<T>(items: T[], page = 1, pages = 1): PaginatedData<T> {
  return {
    items,
    paginate: {
      current_page: page,
      total_pages: pages,
      total: pages * items.length,
      per_page: 15,
      count: items.length,
      next_page_url: page < pages ? String(page + 1) : null,
      prev_page_url: page > 1 ? String(page - 1) : null,
    },
    extra: null,
  }
}
