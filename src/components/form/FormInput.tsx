import type { ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'prefix' | 'suffix'> {
  name: string
  label?: string
  onChange?: (newValue: string) => void
  suffix?: ReactNode
  prefix?: ReactNode
  controlSize?: 'default' | 'compact'

  itemClassName?: string
  labelClassName?: string
  containerClassName?: string
  messageClassName?: string
}

export function FormInput({
  name,
  label,
  onChange,
  suffix,
  prefix,
  controlSize,
  itemClassName,
  labelClassName,
  containerClassName,
  messageClassName,
  required,
  ...props
}: FormInputProps) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={itemClassName}>
          {label && (
            <FormLabel className={labelClassName}>
              {label}
              {required && (
                <span aria-hidden="true" className="ms-1 text-destructive">
                  *
                </span>
              )}
            </FormLabel>
          )}

          <FormControl>
            <Input
              {...field}
              {...props}
              required={required}
              value={field.value ?? ''}
              onChange={(event) => {
                field.onChange(event)
                onChange?.(event.target.value)
              }}
              containerClassName={containerClassName}
              controlSize={controlSize}
              suffix={suffix}
              prefix={prefix}
            />
          </FormControl>

          <FormMessage className={messageClassName} />
        </FormItem>
      )}
    />
  )
}
