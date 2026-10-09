import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrders } from '@/modules/orders/hooks/useOrders'
import { emptyOrdersFilters } from '@/modules/orders/utils/order-filters'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  readReturnRequestsFilters,
  returnRequestSortDirections,
  returnRequestSortValues,
  validReturnRequestsDateRange,
} from '../utils/return-request-filters'

type ReturnRequestFiltersProps = {
  showValidation: boolean
}

type OrderOption = { id: number; label: string }

export function ReturnRequestFilters({ showValidation }: ReturnRequestFiltersProps) {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const ordersQuery = useOrders(emptyOrdersFilters)
  const orders = useMemo(() => ordersQuery.data?.pages.flatMap((page) => page.items) ?? [], [ordersQuery.data])
  const orderOptions = useMemo<OrderOption[]>(
    () => orders.map((order) => ({ id: order.id, label: order.displayNumber || order.orderNumber })),
    [orders]
  )
  const validDateRange = validReturnRequestsDateRange(readReturnRequestsFilters(forwardQuery))
  const showDateRangeError = showValidation && !validDateRange
  const all = t('returnRequests.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="order_id"
        label={t('returnRequests.filters.order')}
        placeholder={all}
        data={orderOptions}
        valueKey="id"
        labelKey="label"
        isLoading={ordersQuery.isLoading}
        isFetchingNextPage={ordersQuery.isFetchingNextPage}
        hasNextPage={ordersQuery.hasNextPage}
        onLoadMore={ordersQuery.fetchNextPage}
        emptyMessage={t('returnRequests.filters.ordersEmpty')}
        loadingMessage={t('returnRequests.filters.ordersLoading')}
        loadMoreMessage={t('returnRequests.filters.ordersLoadMore')}
        clearLabel={t('returnRequests.filters.clearOrder')}
      />
      {(['date_from', 'date_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2 text-foreground" htmlFor={`return-requests-${name}`}>
            {t(`returnRequests.filters.${name}`)}
          </Label>
          <Input
            id={`return-requests-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={showDateRangeError}
            aria-describedby={showDateRangeError ? 'return-requests-date-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {showDateRangeError && (
        <p id="return-requests-date-range-error" role="alert">
          {t('returnRequests.filters.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('returnRequests.filters.sortBy')}
        placeholder={all}
        data={returnRequestSortValues.map((value) => ({
          value,
          label: t(`returnRequests.filters.sort.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('returnRequests.filters.sortDir')}
        placeholder={all}
        data={returnRequestSortDirections.map((value) => ({
          value,
          label: t(`returnRequests.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
