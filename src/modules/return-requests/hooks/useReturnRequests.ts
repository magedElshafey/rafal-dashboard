import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { returnRequestsService } from '../api/return-requests.service'
import { returnRequestsKeys } from '../queries/return-requests.keys'
import type { ReturnRequestDecisionPayload } from '../types/return-request.types'
import type { ReturnRequestsFilters } from '../types/return-request.types'
import { emptyReturnRequestsFilters, validReturnRequestsDateRange } from '../utils/return-request-filters'

export function useReturnRequests(filters: ReturnRequestsFilters = emptyReturnRequestsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: returnRequestsKeys.list(filters),
    queryFn: (page, signal) => returnRequestsService.list(filters, page, signal),
    enabled: validReturnRequestsDateRange(filters),
    retry: false,
  })
}

export function useReturnRequest(id: number) {
  return useQuery({
    queryKey: returnRequestsKeys.detail(id),
    queryFn: ({ signal }) => returnRequestsService.show(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
    retry: false,
  })
}

export function useDecideReturnRequest(id: number) {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ action, decisionNote }: ReturnRequestDecisionPayload) =>
      action === 'approve'
        ? returnRequestsService.approve(id, decisionNote)
        : returnRequestsService.reject(id, decisionNote),
    retry: false,
    onSuccess: async (response, variables) => {
      await client.cancelQueries({ queryKey: returnRequestsKeys.detail(id), exact: true })
      if (response.detail) client.setQueryData(returnRequestsKeys.detail(id), response.detail)
      toast.success(
        response.message ||
          t(variables.action === 'approve' ? 'returnRequests.feedback.approved' : 'returnRequests.feedback.rejected')
      )
      await Promise.all([
        client.invalidateQueries({ queryKey: returnRequestsKeys.detail(id), exact: true }),
        client.invalidateQueries({ queryKey: returnRequestsKeys.lists() }),
      ])
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: returnRequestsKeys.detail(id), exact: true })
    },
  })
}
