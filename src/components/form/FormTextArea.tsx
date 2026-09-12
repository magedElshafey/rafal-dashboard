import { useFormContext } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

interface FormTextAreaProps extends Omit<React.ComponentProps<'textarea'>, 'onChange'> {
  name: string
  label?: string
  onChange?: (newValue: string) => void

  itemClassName?: string
  labelClassName?: string
  messageClassName?: string
}

export function FormTextArea({
  name,
  label,
  onChange,
  itemClassName,
  labelClassName,
  messageClassName,
  required,
  ...props
}: FormTextAreaProps) {
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
            <Textarea
              {...field}
              {...props}
              required={required}
              value={field.value ?? ''}
              onChange={(event) => {
                field.onChange(event)
                onChange?.(event.target.value)
              }}
            />
          </FormControl>

          <FormMessage className={messageClassName} />
        </FormItem>
      )}
    />
  )
}
