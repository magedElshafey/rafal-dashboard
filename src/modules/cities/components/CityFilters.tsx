import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { citySortDirections, citySortValues } from '../utils/city-filters'

export function CityFilters() {
  const { t } = useTranslation()
  const all = t('cities.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="is_active"
        label={t('cities.filters.is_active')}
        placeholder={all}
        data={[
          { value: '1', label: t('cities.filters.yes') },
          { value: '0', label: t('cities.filters.no') },
        ]}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_by"
        label={t('cities.filters.sortBy')}
        placeholder={all}
        data={citySortValues.map((value) => ({ value, label: t(`cities.filters.sort.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('cities.filters.sortDir')}
        placeholder={all}
        data={citySortDirections.map((value) => ({
          value,
          label: t(`cities.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
