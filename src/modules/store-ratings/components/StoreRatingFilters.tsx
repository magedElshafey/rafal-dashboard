import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCustomers } from '@/modules/customers/hooks/useCustomers'
import { getCustomerDisplayName } from '@/modules/customers/utils/customer.utils'
import {
  reviewRatingValues,
  reviewSortDirections,
  validReviewsDateRange,
  validReviewsRatingRange,
} from '@/modules/reviews/utils/review-filters'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { readStoreRatingsFilters, storeRatingSortValues } from '../utils/store-rating-filters'

export function StoreRatingFilters({ showValidation }: { showValidation: boolean }) {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const usersQuery = useCustomers()
  const users = useMemo(() => usersQuery.data?.pages.flatMap((page) => page.items) ?? [], [usersQuery.data])
  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        id: user.id,
        label: getCustomerDisplayName(user, t('reviews.filters.userFallback', { id: user.id })),
      })),
    [users, t]
  )
  const filters = readStoreRatingsFilters(forwardQuery)
  const ratingInvalid = showValidation && !validReviewsRatingRange(filters)
  const dateInvalid = showValidation && !validReviewsDateRange(filters)
  const all = t('reviews.filters.all')
  const ratings = reviewRatingValues.map((value) => ({ value: String(value), label: String(value) }))
  return (
    <div className="space-y-4">
      <FilterSelect
        name="user_id"
        label={t('reviews.filters.user')}
        placeholder={all}
        data={userOptions}
        valueKey="id"
        labelKey="label"
        isLoading={usersQuery.isLoading}
        isFetchingNextPage={usersQuery.isFetchingNextPage}
        hasNextPage={usersQuery.hasNextPage && !usersQuery.isFetchNextPageError}
        onLoadMore={() => usersQuery.fetchNextPage({ cancelRefetch: false })}
      />
      <FilterSelect
        name="rating"
        label={t('reviews.filters.rating')}
        placeholder={all}
        data={ratings}
        valueKey="value"
        labelKey="label"
      />
      <div
        role="group"
        aria-label={t('storeRatings.filters.ratingRange')}
        aria-invalid={ratingInvalid}
        aria-describedby={ratingInvalid ? 'store-ratings-rating-error' : undefined}
        className="space-y-3"
      >
        {(['rating_min', 'rating_max'] as const).map((name) => (
          <FilterSelect
            key={name}
            name={name}
            label={t(`reviews.filters.${name}`)}
            placeholder={all}
            data={ratings}
            valueKey="value"
            labelKey="label"
          />
        ))}
      </div>
      {ratingInvalid ? (
        <p id="store-ratings-rating-error" role="alert">
          {t('reviews.filters.invalidRatingRange')}
        </p>
      ) : null}
      {(['date_from', 'date_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2" htmlFor={`store-ratings-${name}`}>
            {t(`reviews.filters.${name}`)}
          </Label>
          <Input
            id={`store-ratings-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={dateInvalid}
            aria-describedby={dateInvalid ? 'store-ratings-date-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {dateInvalid ? (
        <p id="store-ratings-date-error" role="alert">
          {t('storeRatings.filters.invalidDateRange')}
        </p>
      ) : null}
      <FilterSelect
        name="sort_by"
        label={t('reviews.filters.sortBy')}
        placeholder={all}
        data={storeRatingSortValues.map((value) => ({ value, label: t(`reviews.filters.sort.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('reviews.filters.sortDir')}
        placeholder={all}
        data={reviewSortDirections.map((value) => ({ value, label: t(`reviews.filters.direction.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
