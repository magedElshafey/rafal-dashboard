import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  customerSortDirections,
  customerSortValues,
  readCustomersFilters,
  validCustomersDateRange,
} from '../utils/customer-filters'

type CustomerFiltersProps = {
  showValidation: boolean
}

export function CustomerFilters({ showValidation }: CustomerFiltersProps) {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const validDateRange = validCustomersDateRange(readCustomersFilters(forwardQuery))
  const showDateRangeError = showValidation && !validDateRange
  const all = t('customers.filters.all')

  return (
    <div className="space-y-4">
      {(['date_from', 'date_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2 text-foreground" htmlFor={`customers-${name}`}>
            {t(`customers.filters.${name}`)}
          </Label>
          <Input
            id={`customers-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={showDateRangeError}
            aria-describedby={showDateRangeError ? 'customers-date-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {showDateRangeError && (
        <p id="customers-date-range-error" role="alert">
          {t('customers.filters.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('customers.filters.sortBy')}
        placeholder={all}
        data={customerSortValues.map((value) => ({ value, label: t(`customers.filters.sort.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('customers.filters.sortDir')}
        placeholder={all}
        data={customerSortDirections.map((value) => ({
          value,
          label: t(`customers.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
