import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import {
  shippingMethodSortDirections,
  shippingMethodSortValues,
} from '@/modules/shipping-methods/utils/shipping-method-filters'

export function ShippingMethodFilters() {
  const { t } = useTranslation()
  const all = t('shippingMethods.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="sort_by"
        label={t('shippingMethods.filters.sortBy')}
        placeholder={all}
        data={shippingMethodSortValues.map((value) => ({
          value,
          label: t(`shippingMethods.filters.sort.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('shippingMethods.filters.sortDir')}
        placeholder={all}
        data={shippingMethodSortDirections.map((value) => ({
          value,
          label: t(`shippingMethods.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
