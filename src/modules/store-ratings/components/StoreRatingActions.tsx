import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import { reviewModerationTargets, type ReviewModerationTarget } from '@/modules/reviews/types/review.types'
import type { StoreRating } from '../types/store-rating.types'

export function StoreRatingActions({
  rating,
  name,
  onModerate,
}: {
  rating: StoreRating
  name: string
  onModerate: (rating: StoreRating, status: ReviewModerationTarget) => void
}) {
  const { t } = useTranslation()
  if (rating.status !== 'pending') return null
  const context = { name, order: rating.order.orderNumber, id: rating.id }
  return (
    <DashboardCardActions
      triggerMode="menu"
      triggerLabel={t('storeRatings.actions.forRating', context)}
      actions={reviewModerationTargets.map((status) => {
        const approve = status === 'approved'
        return {
          id: status,
          label: t(approve ? 'reviews.actions.approve' : 'reviews.actions.reject'),
          accessibleLabel: t(
            approve ? 'storeRatings.actions.approveNamed' : 'storeRatings.actions.rejectNamed',
            context
          ),
          icon: approve ? Check : X,
          variant: approve ? 'success' : 'destructive',
          onClick: () => onModerate(rating, status),
        }
      })}
    />
  )
}
