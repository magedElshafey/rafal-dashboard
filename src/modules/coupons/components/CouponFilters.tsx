import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  couponSortDirections,
  couponSortValues,
  couponTypeValues,
  readCouponsFilters,
  validCouponsDateRange,
} from '../utils/coupon-filters'

type CouponFiltersProps = {
  showValidation: boolean
}

export function CouponFilters({ showValidation }: CouponFiltersProps) {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const showDateRangeError = showValidation && !validCouponsDateRange(readCouponsFilters(forwardQuery))
  const all = t('coupons.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="type"
        label={t('coupons.filters.type')}
        placeholder={all}
        data={couponTypeValues.map((value) => ({ value, label: t(`coupons.types.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="is_currently_valid"
        label={t('coupons.filters.isCurrentlyValid')}
        placeholder={all}
        data={[
          { value: '1', label: t('coupons.filters.yes') },
          { value: '0', label: t('coupons.filters.no') },
        ]}
        valueKey="value"
        labelKey="label"
      />
      {(['date_from', 'date_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2 text-foreground" htmlFor={`coupons-${name}`}>
            {t(`coupons.filters.${name}`)}
          </Label>
          <Input
            id={`coupons-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={showDateRangeError}
            aria-describedby={showDateRangeError ? 'coupons-date-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {showDateRangeError && (
        <p id="coupons-date-range-error" role="alert">
          {t('coupons.filters.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('coupons.filters.sortBy')}
        placeholder={all}
        data={couponSortValues.map((value) => ({
          value,
          label: t(`coupons.filters.sort.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('coupons.filters.sortDir')}
        placeholder={all}
        data={couponSortDirections.map((value) => ({
          value,
          label: t(`coupons.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
