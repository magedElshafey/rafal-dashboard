import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { roleSortDirections, roleSortValues } from '@/modules/roles/utils/role-filters'

export function RoleFilters() {
  const { t } = useTranslation()
  const all = t('roles.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="sort_by"
        label={t('roles.filters.sortBy')}
        placeholder={all}
        data={roleSortValues.map((value) => ({
          value,
          label: t(`roles.filters.sort.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('roles.filters.sortDir')}
        placeholder={all}
        data={roleSortDirections.map((value) => ({
          value,
          label: t(`roles.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
