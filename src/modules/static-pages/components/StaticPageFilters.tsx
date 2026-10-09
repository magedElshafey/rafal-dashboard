import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { staticPageSortDirections, staticPageSortValues } from '@/modules/static-pages/utils/static-page-filters'

export function StaticPageFilters() {
  const { t } = useTranslation()
  const all = t('staticPages.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="is_published"
        label={t('staticPages.filters.isPublished')}
        placeholder={all}
        data={[
          { value: '1', label: t('staticPages.filters.published') },
          { value: '0', label: t('staticPages.filters.unpublished') },
        ]}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_by"
        label={t('staticPages.filters.sortBy')}
        placeholder={all}
        data={staticPageSortValues.map((value) => ({
          value,
          label: t(`staticPages.filters.sort.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('staticPages.filters.sortDir')}
        placeholder={all}
        data={staticPageSortDirections.map((value) => ({
          value,
          label: t(`staticPages.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
