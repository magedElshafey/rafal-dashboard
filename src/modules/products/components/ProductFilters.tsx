import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  productSortDirections,
  productSortValues,
  readProductsFilters,
  validProductCreatedRange,
  validProductPriceRange,
} from '../utils/product-filters'

export function ProductFilters() {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const filters = readProductsFilters(forwardQuery)
  const validPriceRange = validProductPriceRange(filters)
  const validCreatedRange = validProductCreatedRange(filters)
  const all = t('products.filters.all')
  const booleanOptions = [
    { value: '1', label: t('products.filters.yes') },
    { value: '0', label: t('products.filters.no') },
  ]
  const sortOptions = productSortValues.map((value) => ({ value, label: t(`products.filters.sort.${value}`) }))
  const directionOptions = productSortDirections.map((value) => ({
    value,
    label: t(`products.filters.direction.${value}`),
  }))

  return (
    <div className="space-y-4">
      {(['is_personalizable', 'is_new_arrival', 'has_discount'] as const).map((name) => (
        <FilterSelect
          key={name}
          name={name}
          label={t(`products.filters.${name}`)}
          placeholder={all}
          data={booleanOptions}
          valueKey="value"
          labelKey="label"
        />
      ))}
      {(['price_min', 'price_max'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2 text-foreground" htmlFor={`products-${name}`}>
            {t(`products.filters.${name}`)}
          </Label>
          <Input
            id={`products-${name}`}
            type="number"
            min="0"
            step="any"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={!validPriceRange}
            aria-describedby={!validPriceRange ? 'products-price-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {!validPriceRange && (
        <p id="products-price-range-error" role="alert">
          {t('products.filters.invalidRange')}
        </p>
      )}
      {(['created_from', 'created_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2 text-foreground" htmlFor={`products-${name}`}>
            {t(`products.filters.${name}`)}
          </Label>
          <Input
            id={`products-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={!validCreatedRange}
            aria-describedby={!validCreatedRange ? 'products-created-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {!validCreatedRange && (
        <p id="products-created-range-error" role="alert">
          {t('products.filters.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('products.filters.sortBy')}
        placeholder={all}
        data={sortOptions}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('products.filters.sortDir')}
        placeholder={all}
        data={directionOptions}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
