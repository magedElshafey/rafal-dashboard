import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCities } from '@/modules/cities/hooks/useCities'
import { getLocalizedName } from '@/modules/cities/utils/city.utils'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  readWarehousesFilters,
  validWarehousesCreatedRange,
  warehouseSortDirections,
  warehouseSortValues,
} from '../utils/warehouse-filters'

type WarehouseFiltersProps = {
  showValidation: boolean
}

type CityOption = { id: number; label: string }

export function WarehouseFilters({ showValidation }: WarehouseFiltersProps) {
  const { t, i18n } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const citiesQuery = useCities()
  const cities = useMemo(() => citiesQuery.data?.pages.flatMap((page) => page.items) ?? [], [citiesQuery.data])
  const cityOptions = useMemo<CityOption[]>(
    () => cities.map((city) => ({ id: city.id, label: getLocalizedName(city.name, i18n.language) })),
    [cities, i18n.language]
  )
  const validCreatedRange = validWarehousesCreatedRange(readWarehousesFilters(forwardQuery))
  const showCreatedRangeError = showValidation && !validCreatedRange
  const all = t('warehouses.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="city_id"
        label={t('warehouses.filters.city')}
        placeholder={all}
        data={cityOptions}
        valueKey="id"
        labelKey="label"
        isLoading={citiesQuery.isLoading}
        isFetchingNextPage={citiesQuery.isFetchingNextPage}
        hasNextPage={citiesQuery.hasNextPage}
        onLoadMore={citiesQuery.fetchNextPage}
        emptyMessage={t('warehouses.filters.citiesEmpty')}
        loadingMessage={t('warehouses.filters.citiesLoading')}
        loadMoreMessage={t('warehouses.filters.citiesLoadMore')}
        clearLabel={t('warehouses.filters.clearCity')}
      />
      {(['created_from', 'created_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2 text-foreground" htmlFor={`warehouses-${name}`}>
            {t(`warehouses.filters.${name}`)}
          </Label>
          <Input
            id={`warehouses-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={showCreatedRangeError}
            aria-describedby={showCreatedRangeError ? 'warehouses-created-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {showCreatedRangeError && (
        <p id="warehouses-created-range-error" role="alert">
          {t('warehouses.filters.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('warehouses.filters.sortBy')}
        placeholder={all}
        data={warehouseSortValues.map((value) => ({ value, label: t(`warehouses.filters.sort.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('warehouses.filters.sortDir')}
        placeholder={all}
        data={warehouseSortDirections.map((value) => ({
          value,
          label: t(`warehouses.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
