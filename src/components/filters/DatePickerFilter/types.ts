import { DatePickerValue } from '@/components/ui/datePicker/types'
import { ComponentProps } from 'react'
import { Mode } from 'react-day-picker'

export interface IDatePickerProps extends ComponentProps<'input'> {
  label?: string
  name: string
  queryName?: string | { start: string; end: string }
  mode?: Mode
}

export interface ICalendarProps {
  mode: Mode
}

export type TDatePickerValueTemplate = string | string[] | Record<string, string>

export interface DatePickerHookReturn {
  t: any
  handleSelect: (day: DatePickerValue) => void
  removeQueryFilter: () => void
  getValue: () => DatePickerValue
}
