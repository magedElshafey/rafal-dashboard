import { DateRange, Mode } from 'react-day-picker'
import type { ComponentProps } from 'react'

export type DatePickerValue =
  | Date // for 'single'
  | Date[] // for 'multiple'
  | DateRange // for 'range'
  | undefined // undefined by default

export interface DatePickerProps extends Omit<ComponentProps<'button'>, 'defaultValue' | 'onChange' | 'value'> {
  label?: string
  placeholder?: string
  defaultValue?: DatePickerValue
  value?: DatePickerValue
  onChange?: (date: DatePickerValue) => void
  mode?: Mode
  className?: string
  onClear?: () => void
  clearLabel?: string
}
