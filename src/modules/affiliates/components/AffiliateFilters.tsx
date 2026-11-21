import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { affiliateStatuses } from '@/modules/affiliates/utils/affiliate-filters'

export function AffiliateFilters() {
  const { t } = useTranslation()
  const options = affiliateStatuses.map((value) => ({ value, label: t(`affiliates.status.${value}`) }))

  return (
    <FilterSelect
      name="status"
      label={t('affiliates.filters.status')}
      placeholder={t('affiliates.filters.allStatuses')}
      data={options}
      valueKey="value"
      labelKey="label"
      resetQueryNamesOnChange={['page']}
      resetQueryNamesOnClear
      clearLabel={t('affiliates.filters.clearStatus')}
    />
  )
}
