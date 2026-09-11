import { useFormContext } from 'react-hook-form'
import { Switch } from '../ui/switch'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ComponentProps } from 'react'
import { Root } from '@radix-ui/react-switch'

interface FormSwitchProps extends Omit<ComponentProps<typeof Root>, 'onChange'> {
  name: string
  label?: string
  onChange?: (checked: boolean) => void
}

export function FormSwitch({ name, label, onChange, ...props }: FormSwitchProps) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center self-start">
          <FormControl>
            <Switch
              {...field}
              {...props}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked)
                onChange && onChange(checked)
              }}
            />
          </FormControl>
          {label && <FormLabel>{label}</FormLabel>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
