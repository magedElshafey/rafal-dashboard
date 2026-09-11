// react hook form
import { useFormContext } from 'react-hook-form'

// context
import { useFormWrapperContext } from '@/components/core/FormWrapper'

// ui components
import { DatePicker } from '@/components/ui/datePicker'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

// types
import { FormDatePickerProps } from '@/components/form/types'
import { DatePickerValue } from '@/components/ui/datePicker/types'

function FormDatePicker({
  name,
  mode = 'single',
  label,
  placeholder,
  onChange,
  labelClassName,
  ...props
}: FormDatePickerProps) {
  const { control } = useFormContext()
  const { errors } = useFormWrapperContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel className={labelClassName}>{label}</FormLabel>}
          <FormControl>
            <DatePicker
              {...field}
              {...props}
              placeholder={placeholder}
              aria-invalid={!!errors[name]}
              onChange={(newValue: DatePickerValue) => {
                field.onChange(newValue)
                onChange && onChange(newValue)
              }}
              mode={mode}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { FormDatePicker }
