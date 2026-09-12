import { useFormContext } from 'react-hook-form'

import { Checkbox, type CheckboxProps } from '@/components/ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export interface FormCheckboxProps extends Omit<CheckboxProps, 'onChange'> {
  name: string
  label?: string
  onChange?: (newValue: string | boolean) => void
}

export function FormCheckbox({ name, onChange, label, ...props }: FormCheckboxProps) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <FormItem>
            <div className="flex flex-row items-center gap-2">
              <FormControl>
                <Checkbox
                  {...field}
                  {...props}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    onChange && onChange(checked)
                  }}
                />
              </FormControl>
              {label && <FormLabel className="cursor-pointer text-sm font-medium text-foreground">{label}</FormLabel>}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
