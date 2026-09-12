import type { ReactNode } from 'react'
import { type FieldPathByValue, type FieldValues, useFormContext } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { MultiSelect, type MultiSelectProps } from '@/components/ui/multi-select'

interface FormMultiSelectProps<TData, TFieldValues extends FieldValues> extends Omit<
  MultiSelectProps<TData>,
  'name' | 'value' | 'defaultValue' | 'onValueChange' | 'onBlur'
> {
  name: FieldPathByValue<TFieldValues, string[]>

  data: TData[]
  valueKey: keyof TData
  labelKey: keyof TData
  iconKey?: keyof TData

  label?: string
  required?: boolean

  onChange?: (newValue: string[]) => void

  itemClassName?: string
  labelClassName?: string
  messageClassName?: string

  emptyMessage?: ReactNode
  loadingMessage?: ReactNode
  loadMoreMessage?: ReactNode
}

export function FormMultiSelect<TData, TFieldValues extends FieldValues>({
  name,
  data,
  valueKey,
  labelKey,
  iconKey,

  label,
  required,

  onChange,

  itemClassName,
  labelClassName,
  messageClassName,

  ...multiSelectProps
}: FormMultiSelectProps<TData, TFieldValues>) {
  const { control } = useFormContext<TFieldValues>()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldValue = Array.isArray(field.value) ? field.value.map(String) : []

        return (
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
              <MultiSelect
                {...multiSelectProps}
                ref={field.ref}
                name={field.name}
                value={fieldValue}
                data={data}
                valueKey={valueKey}
                labelKey={labelKey}
                iconKey={iconKey}
                aria-invalid={fieldState.invalid}
                aria-required={required}
                onBlur={field.onBlur}
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                  onChange?.(newValue)
                }}
              />
            </FormControl>

            <FormMessage className={messageClassName} />
          </FormItem>
        )
      }}
    />
  )
}
