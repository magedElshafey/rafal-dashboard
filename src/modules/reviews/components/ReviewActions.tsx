import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { ReviewListItem, ReviewModerationTarget } from '@/modules/reviews/types/review.types'

type Props = {
  review: ReviewListItem
  reviewerName: string
  onModerate: (review: ReviewListItem, status: ReviewModerationTarget) => void
}

export function ReviewActions({ review, reviewerName, onModerate }: Props) {
  const { t } = useTranslation()
  if (review.status !== 'pending') return null

  return (
    <DashboardCardActions
      triggerMode="menu"
      triggerLabel={t('reviews.actions.forReview', {
        name: reviewerName,
        product: review.product.name,
        id: review.id,
      })}
      actions={[
        {
          id: 'approve',
          label: t('reviews.actions.approve'),
          accessibleLabel: t('reviews.actions.approveNamed', {
            name: reviewerName,
            product: review.product.name,
            id: review.id,
          }),
          icon: Check,
          variant: 'success',
          onClick: () => onModerate(review, 'approved'),
        },
        {
          id: 'reject',
          label: t('reviews.actions.reject'),
          accessibleLabel: t('reviews.actions.rejectNamed', {
            name: reviewerName,
            product: review.product.name,
            id: review.id,
          }),
          icon: X,
          variant: 'destructive',
          onClick: () => onModerate(review, 'rejected'),
        },
      ]}
    />
  )
}
