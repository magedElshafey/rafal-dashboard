import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { blogCategorySortValues } from '@/modules/blogs/utils/blog-category-filters'
export function BlogCategoryFilters() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <FilterSelect
        name="sort_by"
        label={t('blogCategories.sortBy')}
        data={blogCategorySortValues.map((value) => ({ value, label: t(`blogCategories.fields.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('blogCategories.sortDir')}
        data={['asc', 'desc'].map((value) => ({ value, label: t(`blogCategories.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
