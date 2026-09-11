// utils
import { cn } from '@/lib/utils'

// hooks
import useDatePicker from '@/components/filters/DatePickerFilter/useDatePicker'

// components
import { DatePicker } from '@/components/ui/datePicker'

// types
import type { IDatePickerProps } from '@/components/filters/DatePickerFilter/types'

export default function DatePickerFilter({
  className,
  label,
  name,
  queryName,
  mode = 'range',
  placeholder,
}: IDatePickerProps) {
  const resolvedQueryName = queryName ?? (mode === 'range' ? { start: `${name}_from`, end: `${name}_to` } : name)

  const { t, handleSelect, removeQueryFilter, getValue } = useDatePicker({
    name,
    queryName: resolvedQueryName,
    mode,
  })

  return (
    <DatePicker
      label={label}
      placeholder={placeholder || t('label.select_date')}
      mode={mode}
      onChange={(date) => handleSelect(date)}
      className={cn('w-full', className)}
      onClear={removeQueryFilter}
      value={getValue()}
    />
  )
}
