import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { ReviewStatusBadge } from '@/modules/reviews/components/ReviewStatusBadge'
import type { ReviewModerationTarget } from '@/modules/reviews/types/review.types'
import { getReviewerDisplayName } from '@/modules/reviews/utils/review.utils'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import { Routes } from '@/routes/routes'
import type { StoreRating } from '../types/store-rating.types'
import { StoreRatingActions } from './StoreRatingActions'

export function StoreRatingsList({
  ratings,
  onModerate,
}: {
  ratings: readonly StoreRating[]
  onModerate: (rating: StoreRating, status: ReviewModerationTarget) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  const columns = [
    { id: 'user', header: t('reviews.filters.user') },
    { id: 'rating', header: t('reviews.fields.rating') },
    { id: 'comment', header: t('reviews.fields.comment') },
    { id: 'order', header: t('storeRatings.fields.order') },
    { id: 'status', header: t('reviews.fields.status') },
    { id: 'response', header: t('storeRatings.fields.adminResponse') },
    { id: 'created', header: t('reviews.fields.createdAt') },
    { id: 'actions', header: t('reviews.actions.label') },
  ]
  const displayName = (rating: StoreRating) =>
    getReviewerDisplayName(rating.user, t('reviews.reviewerFallback', { id: rating.user.id }))
  const score = (rating: StoreRating) => t('reviews.ratingOutOfFive', { rating: numbers.format(rating.rating) })
  const date = (rating: StoreRating) => formatDateTime(rating.createdAt, { locale }) || '—'
  const order = (rating: StoreRating) => (
    <Link
      to={Routes.orderDetailPath(rating.order.id)}
      className="rounded-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <bdi>{rating.order.orderNumber}</bdi>
    </Link>
  )
  const text = (value: string | null) => (
    <p dir="auto" className="max-w-md whitespace-pre-wrap [overflow-wrap:anywhere]">
      {value || '—'}
    </p>
  )
  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns} aria-label={t('storeRatings.listTitle')}>
          {ratings.map((rating) => (
            <ResponsiveDataTableRow key={rating.id}>
              <ResponsiveDataTableCell className="max-w-48 whitespace-normal">
                <bdi className="font-medium">{displayName(rating)}</bdi>
                <p className="break-all text-xs text-muted-foreground">
                  <bdi>{rating.user.email}</bdi>
                </p>
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>{score(rating)}</ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="min-w-40 max-w-72">{text(rating.comment)}</ResponsiveDataTableCell>
              <ResponsiveDataTableCell>{order(rating)}</ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                <ReviewStatusBadge status={rating.status} />
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="max-w-64">{text(rating.adminResponse)}</ResponsiveDataTableCell>
              <ResponsiveDataTableCell>{date(rating)}</ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                <StoreRatingActions rating={rating} name={displayName(rating)} onModerate={onModerate} />
              </ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {ratings.map((rating) => (
          <ResponsiveDataMobileCard
            key={rating.id}
            title={<bdi>{displayName(rating)}</bdi>}
            subtitle={<bdi>{rating.user.email}</bdi>}
            actions={<StoreRatingActions rating={rating} name={displayName(rating)} onModerate={onModerate} />}
            facts={
              <>
                <ResponsiveDataFact label={t('reviews.fields.rating')}>{score(rating)}</ResponsiveDataFact>
                <ResponsiveDataFact label={t('reviews.fields.status')}>
                  <ReviewStatusBadge status={rating.status} />
                </ResponsiveDataFact>
                <ResponsiveDataFact label={t('storeRatings.fields.order')}>{order(rating)}</ResponsiveDataFact>
                <ResponsiveDataFact label={t('reviews.fields.createdAt')}>{date(rating)}</ResponsiveDataFact>
                <ResponsiveDataFact label={t('reviews.fields.comment')} className="sm:col-span-2">
                  {text(rating.comment)}
                </ResponsiveDataFact>
                <ResponsiveDataFact label={t('storeRatings.fields.adminResponse')} className="sm:col-span-2">
                  {text(rating.adminResponse)}
                </ResponsiveDataFact>
              </>
            }
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
