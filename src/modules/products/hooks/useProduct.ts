import { useQuery } from '@tanstack/react-query'

import { productsService } from '@/modules/products/api/products.service'
import { productsKeys } from '@/modules/products/queries/products.keys'

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: productsKeys.detail(id ?? 0),
    queryFn: ({ signal }) => productsService.show(id as number, signal),
    enabled: id !== null,
    staleTime: 0,
    retry: false,
  })
}
