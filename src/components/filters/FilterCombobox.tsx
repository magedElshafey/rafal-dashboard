import { useQuery } from '@/store/queryContext/useQueryContext'
import { Combobox, ComboboxProps } from '../ui/combobox'
import { Label } from '../ui/label'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo } from 'react'

export interface FilterComboboxProps<T extends { label: string; value: string }> extends ComboboxProps<T> {
  name: string
  label?: string
  placeholder?: string
}

const FilterCombobox = ({
  name,
  label,
  placeholder,
  ...props
}: FilterComboboxProps<{ label: string; value: string }>) => {
  const { forwardAddQuery, forwardDeleteQuery, forwardQuery } = useQuery()
  const { t } = useTranslation()

  const selectedValue = forwardQuery?.[name]
  const selectedOption = useMemo(
    () =>
      props.data.find((option) => String(option[props.valueKey]) === selectedValue) ??
      (selectedValue ? { label: selectedValue, value: selectedValue } : null),
    [props.data, props.valueKey, selectedValue]
  )

  const handleSelectFilter = useCallback(
    (value: { label: string; value: string } | null) => {
      if (value) {
        forwardAddQuery({ [name]: String(value[props.valueKey]) })
      } else {
        forwardDeleteQuery(name)
      }
    },
    [forwardAddQuery, forwardDeleteQuery, name, props.valueKey]
  )

  const handleClearFilter = useCallback(() => {
    forwardDeleteQuery(name)
  }, [forwardDeleteQuery, name])

  return (
    <>
      {label && <Label htmlFor={name}>{label}</Label>}
      <Combobox
        className="w-full"
        name={name}
        {...props}
        value={selectedOption}
        onClear={handleClearFilter}
        onChange={handleSelectFilter}
        placeholder={placeholder || t('label.select_option')}
      />
    </>
  )
}

export default FilterCombobox
