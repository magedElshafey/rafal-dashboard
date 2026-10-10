import type { ImageUploadValue } from '@/components/form/image-upload'
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

type BaseCategoryPayload = {
  name: LocalizedText
  is_active: boolean
  sort_order: number
}

export type CategoryPayload = BaseCategoryPayload &
  (
    | {
        parent_id: null
        description: LocalizedText | null
        image?: File
      }
    | {
        parent_id: number
        description?: never
        image?: never
      }
  )

export type CategoryFormValues = {
  parent_id: number | null
  name: LocalizedText
  description: LocalizedText
  is_active: boolean
  sort_order: number
  image: ImageUploadValue
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

export type CategorySortBy = 'sort_order' | 'name' | 'created_at'
export type CategorySortDir = 'asc' | 'desc'

export type CategoriesFilters = {
  isActive: boolean | null
  createdFrom: string
  createdTo: string
  sortBy: CategorySortBy | null
  sortDir: CategorySortDir | null
}
