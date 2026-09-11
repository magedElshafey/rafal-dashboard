// context
import { useFormWrapperContext } from '@/components/core/FormWrapper'
import { useFormContext } from 'react-hook-form'

// ui components
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Combobox, ComboboxProps } from '@/components/ui/combobox'

interface FormComboboxProps<T> extends Omit<ComboboxProps<T>, 'onChange'> {
  name: string
  label?: string
  onChange?: (value: T) => void
}

export function FormCombobox<T>({
  name,
  label,
  data,
  valueKey,
  labelKey,
  onChange,
  onSearch, // if onSearch is provided, the combobox will be controlled and you can add server search you want
  onToggle,
  ...props
}: FormComboboxProps<T>) {
  const { control } = useFormContext()
  const { errors } = useFormWrapperContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Combobox
              {...field}
              {...props}
              data={data}
              valueKey={valueKey}
              labelKey={labelKey}
              aria-invalid={!!errors[name]}
              hasError={!!errors[name]}
              onChange={(newValue) => {
                field.onChange(newValue)
                onChange && onChange(newValue as T)
              }}
              {...(!!onSearch && { onSearch })}
              {...(!!onToggle && { onToggle })}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
