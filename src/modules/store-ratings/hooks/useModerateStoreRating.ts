import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ReviewModerationTarget } from '@/modules/reviews/types/review.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
import { storeRatingsService } from '../api/store-ratings.service'
import { storeRatingsKeys } from '../queries/store-ratings.keys'

export function useModerateStoreRating() {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReviewModerationTarget }) =>
      storeRatingsService.moderate(id, status),
    retry: false,
    onSuccess: async (_response, { status }) => {
      await client.invalidateQueries({ queryKey: storeRatingsKeys.lists() })
      toast.success(t(status === 'approved' ? 'storeRatings.feedback.approved' : 'storeRatings.feedback.rejected'))
    },
    onError: (error, { status }) => {
      toastApiError(
        error,
        t(status === 'approved' ? 'storeRatings.feedback.approveError' : 'storeRatings.feedback.rejectError')
      )
    },
  })
}
