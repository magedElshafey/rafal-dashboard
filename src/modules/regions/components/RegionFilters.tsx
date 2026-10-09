import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { regionSortDirections, regionSortValues } from '../utils/region-filters'

export function RegionFilters() {
  const { t } = useTranslation()
  const all = t('regions.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="is_active"
        label={t('regions.filters.is_active')}
        placeholder={all}
        data={[
          { value: '1', label: t('regions.filters.yes') },
          { value: '0', label: t('regions.filters.no') },
        ]}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_by"
        label={t('regions.filters.sortBy')}
        placeholder={all}
        data={regionSortValues.map((value) => ({ value, label: t(`regions.filters.sort.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('regions.filters.sortDir')}
        placeholder={all}
        data={regionSortDirections.map((value) => ({
          value,
          label: t(`regions.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
