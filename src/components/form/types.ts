import { DateRange, Mode } from 'react-day-picker'

export interface FormDatePickerProps {
  name: string
  label?: string
  placeholder?: string
  onChange?: (newValue: Date | Date[] | DateRange | undefined) => void
  mode?: Mode
  labelClassName?: string
  className?: string
  disabled?: boolean
}
