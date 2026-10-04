import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { useWarehouses } from '@/modules/warehouses/hooks/useWarehouses'
import { useOrderStatuses } from '../hooks/useOrders'
import { paymentFilterValues, readOrdersFilters, validOrdersDateRange } from '../utils/order-filters'
import { orderStatusLabel, paymentLabel } from '../utils/order-presentation'

export function OrderFilters() {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const statuses = useOrderStatuses()
  const warehouses = useWarehouses()
  const invalid = !validOrdersDateRange(readOrdersFilters(forwardQuery))
  const all = t('orders.all')
  return (
    <div className="space-y-4">
      <FilterSelect
        name="status"
        label={t('orders.fields.status')}
        placeholder={all}
        data={(statuses.data ?? []).map((item) => ({
          value: item.value,
          label: orderStatusLabel(item.value, statuses.data ?? [], t),
        }))}
        valueKey="value"
        labelKey="label"
        isLoading={statuses.isLoading}
      />
      {statuses.isError && (
        <QueryStateNotice
          kind="loading-error"
          onRetry={() => void statuses.refetch()}
          isRetrying={statuses.isFetching}
        />
      )}
      <FilterSelect
        name="payment_status"
        label={t('orders.fields.paymentStatus')}
        placeholder={all}
        data={paymentFilterValues.map((value) => ({ value, label: paymentLabel(value, t) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="warehouse_id"
        label={t('orders.fields.warehouse')}
        placeholder={all}
        data={warehouses.data?.pages.flatMap((page) => page.items) ?? []}
        valueKey="id"
        labelKey="name"
        isLoading={warehouses.isLoading}
        isFetchingNextPage={warehouses.isFetchingNextPage}
        hasNextPage={warehouses.hasNextPage && !warehouses.isFetchNextPageError}
        onLoadMore={() => warehouses.fetchNextPage({ cancelRefetch: false })}
      />
      {warehouses.isError && (
        <QueryStateNotice
          kind="loading-error"
          onRetry={() => void (warehouses.isFetchNextPageError ? warehouses.fetchNextPage() : warehouses.refetch())}
          isRetrying={warehouses.isFetching}
        />
      )}
      {(['is_gift', 'is_guest'] as const).map((name) => (
        <label key={name} className="block text-sm">
          {t(name === 'is_gift' ? 'orders.fields.gift' : 'orders.guest')}
          <select
            className="mt-2 w-full rounded-md border bg-background p-3 focus-visible:ring-2"
            value={forwardQuery?.[name] ?? ''}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          >
            <option value="">{all}</option>
            <option value="1">{t('orders.yes')}</option>
            <option value="0">{t('orders.no')}</option>
          </select>
        </label>
      ))}
      {(['date_from', 'date_to'] as const).map((name) => (
        <label key={name} className="block text-sm">
          {t(name === 'date_from' ? 'orders.dateFrom' : 'orders.dateTo')}
          <Input
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={invalid}
            aria-describedby={invalid ? 'orders-date-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </label>
      ))}
      {invalid && (
        <p id="orders-date-error" role="alert">
          {t('orders.invalidDates')}
        </p>
      )}
    </div>
  )
}
