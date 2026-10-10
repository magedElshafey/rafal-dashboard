import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCustomers } from '@/modules/customers/hooks/useCustomers'
import { getCustomerDisplayName } from '@/modules/customers/utils/customer.utils'
import { useProducts } from '@/modules/products/hooks/useProducts'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'
import { emptyProductsFilters } from '@/modules/products/utils/product-filters'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  readReviewsFilters,
  reviewRatingValues,
  reviewSortDirections,
  reviewSortValues,
  validReviewsDateRange,
  validReviewsRatingRange,
} from '../utils/review-filters'

export function ReviewFilters({ showValidation }: { showValidation: boolean }) {
  const { t, i18n } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const productsQuery = useProducts(emptyProductsFilters)
  const usersQuery = useCustomers()
  const products = useMemo(() => productsQuery.data?.pages.flatMap((page) => page.items) ?? [], [productsQuery.data])
  const users = useMemo(() => usersQuery.data?.pages.flatMap((page) => page.items) ?? [], [usersQuery.data])
  const productOptions = useMemo(
    () => products.map((product) => ({ id: product.id, label: getLocalizedProductName(product.name, i18n.language) })),
    [products, i18n.language]
  )
  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        id: user.id,
        label: getCustomerDisplayName(user, t('reviews.filters.userFallback', { id: user.id })),
      })),
    [users, t]
  )
  const filters = readReviewsFilters(forwardQuery)
  const dateInvalid = showValidation && !validReviewsDateRange(filters)
  const ratingInvalid = showValidation && !validReviewsRatingRange(filters)
  const all = t('reviews.filters.all')
  const remote = (query: typeof productsQuery) => ({
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage && !query.isFetchNextPageError,
    onLoadMore: () => query.fetchNextPage({ cancelRefetch: false }),
  })
  return (
    <div className="space-y-4">
      <FilterSelect
        name="product_id"
        label={t('reviews.filters.product')}
        placeholder={all}
        data={productOptions}
        valueKey="id"
        labelKey="label"
        {...remote(productsQuery)}
      />
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
        data={reviewRatingValues.map((value) => ({ value: String(value), label: String(value) }))}
        valueKey="value"
        labelKey="label"
      />
      <div
        role="group"
        aria-invalid={ratingInvalid}
        aria-describedby={ratingInvalid ? 'reviews-rating-range-error' : undefined}
        className="space-y-3"
      >
        {(['rating_min', 'rating_max'] as const).map((name) => (
          <FilterSelect
            key={name}
            name={name}
            label={t(`reviews.filters.${name}`)}
            placeholder={all}
            data={reviewRatingValues.map((value) => ({ value: String(value), label: String(value) }))}
            valueKey="value"
            labelKey="label"
          />
        ))}
      </div>
      {ratingInvalid && (
        <p id="reviews-rating-range-error" role="alert">
          {t('reviews.filters.invalidRatingRange')}
        </p>
      )}
      {(['date_from', 'date_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2" htmlFor={`reviews-${name}`}>
            {t(`reviews.filters.${name}`)}
          </Label>
          <Input
            id={`reviews-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={dateInvalid}
            aria-describedby={dateInvalid ? 'reviews-date-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {dateInvalid && (
        <p id="reviews-date-range-error" role="alert">
          {t('reviews.filters.invalidDateRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('reviews.filters.sortBy')}
        placeholder={all}
        data={reviewSortValues.map((value) => ({ value, label: t(`reviews.filters.sort.${value}`) }))}
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
