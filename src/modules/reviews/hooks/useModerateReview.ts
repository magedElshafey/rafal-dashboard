import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { reviewsService } from '@/modules/reviews/api/reviews.service'
import { reviewsKeys } from '@/modules/reviews/queries/reviews.keys'
import type { ReviewModerationTarget } from '@/modules/reviews/types/review.types'

type ModerateReviewVariables = {
  id: number
  status: ReviewModerationTarget
}

export function useModerateReview() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, status }: ModerateReviewVariables) => reviewsService.moderate(id, status),
    onSuccess: async (_response, { status }) => {
      await queryClient.invalidateQueries({ queryKey: reviewsKeys.lists() })
      toast.success(t(status === 'approved' ? 'reviews.feedback.approved' : 'reviews.feedback.rejected'))
    },
    onError: (_error, { status }) => {
      toast.error(t(status === 'approved' ? 'reviews.feedback.approveError' : 'reviews.feedback.rejectError'))
    },
  })
}
