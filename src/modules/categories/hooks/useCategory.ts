import { useQuery } from '@tanstack/react-query'

import { categoriesService } from '@/modules/categories/api/categories.service'
import { categoriesKeys } from '@/modules/categories/queries/categories.keys'

export function useCategory(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: categoriesKeys.detail(id ?? 0),
    queryFn: ({ signal }) => categoriesService.show(id as number, signal),
    enabled: enabled && id !== null,
    staleTime: 0,
    retry: false,
  })
}
