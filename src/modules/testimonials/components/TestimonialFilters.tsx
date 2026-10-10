import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  readTestimonialsFilters,
  testimonialRatingValues,
  testimonialSortDirections,
  testimonialSortValues,
  validTestimonialsCreatedRange,
} from '@/modules/testimonials/utils/testimonial-filters'

export function TestimonialFilters({ showValidation }: { showValidation: boolean }) {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const showError = showValidation && !validTestimonialsCreatedRange(readTestimonialsFilters(forwardQuery))
  const all = t('testimonials.filters.all')
  return (
    <div className="space-y-4">
      <FilterSelect
        name="rating"
        label={t('testimonials.filters.rating')}
        placeholder={all}
        data={testimonialRatingValues.map((value) => ({ value: String(value), label: String(value) }))}
        valueKey="value"
        labelKey="label"
      />
      {(['created_from', 'created_to'] as const).map((name) => (
        <div key={name}>
          <Label htmlFor={`testimonials-${name}`}>{t(`testimonials.filters.${name}`)}</Label>
          <Input
            id={`testimonials-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={showError}
            aria-describedby={showError ? 'testimonials-created-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {showError && (
        <p id="testimonials-created-range-error" role="alert">
          {t('testimonials.filters.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('testimonials.filters.sortBy')}
        placeholder={all}
        data={testimonialSortValues.map((value) => ({ value, label: t(`testimonials.filters.sort.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('testimonials.filters.sortDir')}
        placeholder={all}
        data={testimonialSortDirections.map((value) => ({
          value,
          label: t(`testimonials.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
