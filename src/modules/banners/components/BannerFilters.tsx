import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { bannerPlatformValues, bannerSortDirections, bannerSortValues } from '@/modules/banners/utils/banner-filters'

export function BannerFilters() {
  const { t } = useTranslation()
  const all = t('banners.filters.all')
  const booleanOptions = [
    { value: '1', label: t('banners.filters.yes') },
    { value: '0', label: t('banners.filters.no') },
  ]

  return (
    <div className="space-y-4">
      <FilterSelect
        name="platform"
        label={t('banners.filters.platform')}
        placeholder={all}
        data={bannerPlatformValues.map((value) => ({
          value,
          label: t(`banners.platforms.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="is_active"
        label={t('banners.filters.active')}
        placeholder={all}
        data={booleanOptions}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="active_now"
        label={t('banners.filters.activeNow')}
        placeholder={all}
        data={booleanOptions}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_by"
        label={t('banners.filters.sortBy')}
        placeholder={all}
        data={bannerSortValues.map((value) => ({
          value,
          label: t(`banners.filters.sort.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('banners.filters.sortDir')}
        placeholder={all}
        data={bannerSortDirections.map((value) => ({
          value,
          label: t(`banners.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
