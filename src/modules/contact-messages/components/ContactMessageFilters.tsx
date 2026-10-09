import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery } from '@/store/queryContext/useQueryContext'
import {
  contactMessageSortDirections,
  contactMessageSortValues,
  readContactMessagesFilters,
  validContactMessagesCreatedRange,
} from '../utils/contact-message-filters'

type ContactMessageFiltersProps = {
  showValidation: boolean
}

export function ContactMessageFilters({ showValidation }: ContactMessageFiltersProps) {
  const { t } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const validCreatedRange = validContactMessagesCreatedRange(readContactMessagesFilters(forwardQuery))
  const showCreatedRangeError = showValidation && !validCreatedRange
  const all = t('contactMessages.filters.all')

  return (
    <div className="space-y-4">
      {(['created_from', 'created_to'] as const).map((name) => (
        <div key={name}>
          <Label className="mb-2 text-foreground" htmlFor={`contact-messages-${name}`}>
            {t(`contactMessages.filters.${name}`)}
          </Label>
          <Input
            id={`contact-messages-${name}`}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={showCreatedRangeError}
            aria-describedby={showCreatedRangeError ? 'contact-messages-created-range-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {showCreatedRangeError && (
        <p id="contact-messages-created-range-error" role="alert">
          {t('contactMessages.filters.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('contactMessages.filters.sortBy')}
        placeholder={all}
        data={contactMessageSortValues.map((value) => ({
          value,
          label: t(`contactMessages.filters.sort.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('contactMessages.filters.sortDir')}
        placeholder={all}
        data={contactMessageSortDirections.map((value) => ({
          value,
          label: t(`contactMessages.filters.direction.${value}`),
        }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
