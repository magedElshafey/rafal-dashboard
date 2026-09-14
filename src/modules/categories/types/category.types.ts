import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type LocalizedText = { ar: string; en: string }

export type Category = {
  id: number
  parent_id: number | null
  name: LocalizedText
  slug: string
  description: LocalizedText | null
  is_active: boolean
  sort_order: number
  image_url: string | null
  children_count: number
  created_at: string
  updated_at: string
}

export type CategoryPayload = {
  parent_id: number | null
  name: LocalizedText
  slug: string
  description: LocalizedText | null
  is_active: boolean
  sort_order: number
}

export type CategoryFormValues = {
  parent_id: number | null
  name: LocalizedText
  slug: string
  description: LocalizedText
  is_active: boolean
  sort_order: number
}

export type RawCategory = Omit<Category, 'parent_id' | 'sort_order' | 'description' | 'children_count'> & {
  parent_id: number | string | null
  sort_order: number | string
  description: LocalizedText | [] | null
  children_count?: number | string
}

export type RawCategoriesIndexResponse = PaginatedDashboardResponse<RawCategory>
export type RawCategoryResponse = { success: boolean; message: string; data: RawCategory }
export type CategoryResponse = { success: boolean; message: string; data: Category }
export type DeleteCategoryResponse = Omit<CategoryResponse, 'data'>
