import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  categorySortDirections,
  categorySortValues,
  readCategoriesFilters,
  validCategoriesCreatedRange,
} from '../utils/category-filters'

type CategoryFiltersProps = {
  showValidation: boolean
}

export function CategoryFilters({ showValidation }: CategoryFiltersProps) {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const validCreatedRange = validCategoriesCreatedRange(readCategoriesFilters(forwardQuery))
  const showCreatedRangeError = showValidation && !validCreatedRange
  const all = t('categories.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="is_active"
        label={t('categories.filters.is_active')}
        placeholder={all}
        data={[
          { value: '1', label: t('categories.filters.yes') },
          { value: '0', label: t('categories.filters.no') },
        ]}
        valueKey="value"
        labelKey="label"
      />
      {(['created_from', 'created_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2 text-foreground" htmlFor={`categories-${name}`}>
            {t(`categories.filters.${name}`)}
          </Label>
          <Input
            id={`categories-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={showCreatedRangeError}
            aria-describedby={showCreatedRangeError ? 'categories-created-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {showCreatedRangeError && (
        <p id="categories-created-range-error" role="alert">
          {t('categories.filters.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('categories.filters.sortBy')}
        placeholder={all}
        data={categorySortValues.map((value) => ({ value, label: t(`categories.filters.sort.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('categories.filters.sortDir')}
        placeholder={all}
        data={categorySortDirections.map((value) => ({
          value,
          label: t(`categories.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
