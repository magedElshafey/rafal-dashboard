import { ComponentProps } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Root } from '@radix-ui/react-radio-group'
import { useRtl } from '@/hooks/useRtl'

interface FormRadioInputProps extends Omit<ComponentProps<typeof Root>, 'onChange'> {
  name: string
  label?: string
  onChange?: (newValue: string) => void
  options: { label: string; value: string }[]
}

export function FormRadioInput({ name, label, onChange, options, ...props }: FormRadioInputProps) {
  const { control } = useFormContext()
  const { isRtl } = useRtl()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, formState }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <RadioGroup
              dir={isRtl ? 'rtl' : 'ltr'}
              {...field}
              {...props}
              aria-invalid={!!formState.errors}
              onValueChange={(newValue) => {
                field.onChange(newValue)
                onChange && onChange?.(newValue)
              }}
            >
              {options.map((opt) => {
                return (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem id={`${name}-${opt.value}`} value={opt.value} />
                    <Label htmlFor={`${name}-${opt.value}`}>{opt.label}</Label>
                  </div>
                )
              })}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
