import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import type { ReviewStatus } from '@/modules/reviews/types/review.types'

const variants = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
} as const

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { t } = useTranslation()
  return <Badge variant={variants[status]}>{t(`reviews.status.${status}`)}</Badge>
}
