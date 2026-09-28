import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { ReviewActions } from '@/modules/reviews/components/ReviewActions'
import { ReviewComment } from '@/modules/reviews/components/ReviewComment'
import { ReviewStatusBadge } from '@/modules/reviews/components/ReviewStatusBadge'
import type { ReviewListItem, ReviewModerationTarget } from '@/modules/reviews/types/review.types'
import { getReviewerDisplayName } from '@/modules/reviews/utils/review.utils'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

type Props = {
  reviews: readonly ReviewListItem[]
  onModerate: (review: ReviewListItem, status: ReviewModerationTarget) => void
}

export function ReviewsList({ reviews, onModerate }: Props) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar' : 'en', {
        maximumFractionDigits: 2,
      }),
    [i18n.language]
  )
  const columns = [
    { id: 'reviewer', header: t('reviews.fields.reviewer') },
    { id: 'product', header: t('reviews.fields.product') },
    { id: 'rating', header: t('reviews.fields.rating'), className: 'w-24' },
    { id: 'comment', header: t('reviews.fields.comment') },
    { id: 'status', header: t('reviews.fields.status'), className: 'w-28' },
    { id: 'engagement', header: t('reviews.fields.engagement'), className: 'w-28' },
    { id: 'created', header: t('reviews.fields.createdAt'), className: 'w-40' },
    { id: 'actions', header: t('reviews.actions.label'), className: 'w-20' },
  ]
  const reviewerName = (review: ReviewListItem) =>
    getReviewerDisplayName(review.reviewer, t('reviews.reviewerFallback', { id: review.reviewer.id }))
  const rating = (review: ReviewListItem) =>
    t('reviews.ratingOutOfFive', { rating: numberFormatter.format(review.rating) })
  const engagement = (review: ReviewListItem) => (
    <div className="space-y-1 text-xs">
      <div>{t('reviews.engagement.helpful', { value: numberFormatter.format(review.helpfulCount) })}</div>
      <div>{t('reviews.engagement.reports', { value: numberFormatter.format(review.reportsCount) })}</div>
    </div>
  )
  const createdAt = (review: ReviewListItem) => formatDateTime(review.createdAt, { locale }) || '—'
  const comment = (review: ReviewListItem) => <ReviewComment reviewId={review.id} comment={review.comment} />

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {reviews.map((review) => {
            const name = reviewerName(review)
            return (
              <ResponsiveDataTableRow key={review.id}>
                <ResponsiveDataTableCell className="max-w-48 whitespace-normal">
                  <div className="font-medium" dir="auto">
                    {name}
                  </div>
                  <div className="break-all text-xs text-muted-foreground">{review.reviewer.email}</div>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="max-w-48 whitespace-normal">
                  {review.product.name}
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{rating(review)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{comment(review)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <ReviewStatusBadge status={review.status} />
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{engagement(review)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{createdAt(review)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <ReviewActions review={review} reviewerName={name} onModerate={onModerate} />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {reviews.map((review) => {
          const name = reviewerName(review)
          return (
            <ResponsiveDataMobileCard
              key={review.id}
              title={<span dir="auto">{name}</span>}
              subtitle={review.product.name}
              actions={<ReviewActions review={review} reviewerName={name} onModerate={onModerate} />}
              facts={
                <>
                  <ResponsiveDataFact label={t('reviews.fields.rating')}>{rating(review)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('reviews.fields.status')}>
                    <ReviewStatusBadge status={review.status} />
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('reviews.fields.engagement')}>{engagement(review)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('reviews.fields.createdAt')}>{createdAt(review)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('reviews.fields.comment')} className="sm:col-span-2">
                    {comment(review)}
                  </ResponsiveDataFact>
                </>
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}
