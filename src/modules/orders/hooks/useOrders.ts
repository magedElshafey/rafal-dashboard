import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { ordersService } from '../api/orders.service'
import { ordersKeys } from '../queries/orders.keys'
import type { OrdersFilters } from '../types/order.types'
import { validOrdersDateRange } from '../utils/order-filters'
import { orderTransitionFeedback } from '../utils/order-errors'

export function useOrders(filters: OrdersFilters) {
  return useInfinitePaginatedQuery({
    queryKey: ordersKeys.list(filters),
    queryFn: (page, signal) => ordersService.list(filters, page, signal),
    enabled: validOrdersDateRange(filters),
    retry: false,
  })
}
export function useOrderStatuses() {
  return useQuery({
    queryKey: ordersKeys.statuses(),
    queryFn: ({ signal }) => ordersService.statuses(signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
export function useOrder(id: number) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: ({ signal }) => ordersService.show(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
    retry: false,
  })
}
export function useUpdateOrderStatus(id: number) {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (status: string) => ordersService.updateStatus(id, status),
    retry: false,
    onSuccess: async (response) => {
      await client.cancelQueries({ queryKey: ordersKeys.detail(id), exact: true })
      if (response.detail) client.setQueryData(ordersKeys.detail(id), response.detail)
      toast.success(response.message || t('orders.updated'))
      await Promise.all([
        client.invalidateQueries({ queryKey: ordersKeys.detail(id), exact: true }),
        client.invalidateQueries({ queryKey: ordersKeys.lists() }),
      ])
    },
    onError: (error) => {
      if (orderTransitionFeedback(error, '').stale)
        void client.invalidateQueries({ queryKey: ordersKeys.detail(id), exact: true })
      // The confirmation dialog owns error feedback; no duplicate interceptor/hook toast.
    },
  })
}
