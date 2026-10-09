import type { CategoriesFilters } from '../types/category.types'

export const categoriesKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
  list: (filters: CategoriesFilters) => [...categoriesKeys.lists(), filters] as const,
  details: () => [...categoriesKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoriesKeys.details(), id] as const,
}
