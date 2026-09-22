import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { productsService } from '@/modules/products/api/products.service'
import { productsKeys } from '@/modules/products/queries/products.keys'

export function useProducts() {
  return useInfinitePaginatedQuery({
    queryKey: productsKeys.list(),
    queryFn: (page, signal) => productsService.list(page, signal),
    retry: false,
  })
}
