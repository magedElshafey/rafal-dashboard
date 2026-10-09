import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { productsService } from '@/modules/products/api/products.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductsFilters } from '@/modules/products/types/product.types'
import { validProductsRanges } from '@/modules/products/utils/product-filters'

export function useProducts(filters: ProductsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: productsKeys.list(filters),
    queryFn: (page, signal) => productsService.list(filters, page, signal),
    enabled: validProductsRanges(filters),
    retry: false,
  })
}
