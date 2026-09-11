import { useQuery } from '@/store/queryContext/useQueryContext'
import { Label } from '../ui/label'
import { MultiSelect, MultiSelectProps } from '../ui/multi-select'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo } from 'react'

export interface FilterMultiSelectProps<T> extends MultiSelectProps<T> {
  label?: string
  name: string
  placeholder?: string
  onFilterChange?: (value: string[]) => void
  resetQueryNamesOnChange?: string[]
  resetQueryNamesOnClear?: boolean | string[]
}

const FilterMultiSelect = <T,>({
  label,
  data,
  name,
  placeholder,
  onFilterChange,
  resetQueryNamesOnChange,
  resetQueryNamesOnClear,
  ...props
}: FilterMultiSelectProps<T>) => {
  const { forwardAddQuery, forwardQuery, forwardDeleteQuery } = useQuery()
  const { t } = useTranslation()
  const selectedValues = useMemo(() => forwardQuery?.[name]?.split(',').filter(Boolean) ?? [], [forwardQuery, name])
  const clearResetQueryNames = Array.isArray(resetQueryNamesOnClear)
    ? resetQueryNamesOnClear
    : resetQueryNamesOnClear
      ? resetQueryNamesOnChange
      : undefined

  const handleSelectFilter = useCallback(
    (value: string[]) => {
      onFilterChange?.(value)

      if (!value.length) {
        forwardDeleteQuery(name, { resetQueryNames: clearResetQueryNames })
        return
      }

      forwardAddQuery({ [name]: value.join(',') }, { resetQueryNames: resetQueryNamesOnChange })
    },
    [clearResetQueryNames, forwardAddQuery, forwardDeleteQuery, name, onFilterChange, resetQueryNamesOnChange]
  )

  const handleClearFilter = useCallback(() => {
    onFilterChange?.([])
    forwardDeleteQuery(name, { resetQueryNames: clearResetQueryNames })
  }, [clearResetQueryNames, forwardDeleteQuery, name, onFilterChange])

  return (
    <>
      {label && <Label htmlFor={`${name}-multi-select`}>{label}</Label>}
      <MultiSelect
        id={`${name}-multi-select`}
        data={data}
        placeholder={placeholder || t('label.select_options')}
        value={selectedValues}
        onValueChange={handleSelectFilter}
        onClear={handleClearFilter}
        {...props}
      />
    </>
  )
}

export default FilterMultiSelect
