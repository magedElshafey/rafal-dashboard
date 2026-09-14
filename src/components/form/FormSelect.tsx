import { useFormContext } from 'react-hook-form'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRtl } from '@/hooks/useRtl'

type SelectOptionValue = string | number

interface FormSelectProps<T> {
  data: T[]
  name: string
  valueKey: keyof T
  labelKey: keyof T
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  size?: 'sm' | 'default'
  onChange?: (newValue: string) => void
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  onLoadMore?: () => void | Promise<unknown>
  emptyMessage?: ReactNode
  loadingMessage?: ReactNode
  loadMoreMessage?: ReactNode
  isError?: boolean
  isRetrying?: boolean
  errorMessage?: ReactNode
  retryLabel?: ReactNode
  onRetry?: () => void | Promise<unknown>
  serializeValue?: (value: unknown) => string
  deserializeValue?: (value: string) => unknown

  itemClassName?: string
  labelClassName?: string
  triggerClassName?: string
  contentClassName?: string
  messageClassName?: string
  clearable?: boolean
  clearLabel?: string
}

export function FormSelect<T>({
  name,
  data,
  labelKey,
  valueKey,
  label,
  placeholder,
  required,
  disabled,
  size,
  onChange,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  emptyMessage,
  loadingMessage,
  loadMoreMessage,
  isError,
  isRetrying,
  errorMessage,
  retryLabel,
  onRetry,
  serializeValue = (value) => (value != null ? String(value) : ''),
  deserializeValue = (value) => value,
  itemClassName,
  labelClassName,
  triggerClassName,
  contentClassName,
  messageClassName,
  clearable = false,
  clearLabel,
}: FormSelectProps<T>) {
  const { control } = useFormContext()
  const { isRtl } = useRtl()
  const { t } = useTranslation()

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

          <div className="relative">
            <Select
              name={field.name}
              value={serializeValue(field.value)}
              disabled={disabled}
              onValueChange={(newValue) => {
                field.onChange(deserializeValue(newValue))
                onChange?.(newValue)
              }}
            >
              <FormControl>
                <SelectTrigger
                  ref={field.ref}
                  className={clearable && field.value ? `${triggerClassName ?? ''} pe-12` : triggerClassName}
                  size={size}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  aria-busy={isLoading}
                  aria-required={required}
                  onBlur={field.onBlur}
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>

              <SelectContent
                className={contentClassName}
                dir={isRtl ? 'rtl' : 'ltr'}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                onLoadMore={onLoadMore}
                emptyMessage={emptyMessage}
                loadingMessage={loadingMessage}
                loadMoreMessage={loadMoreMessage}
                isError={isError}
                isRetrying={isRetrying}
                errorMessage={errorMessage}
                retryLabel={retryLabel}
                onRetry={onRetry}
              >
                {data.map((item) => {
                  const value = String(item[valueKey] as SelectOptionValue)
                  const label = String(item[labelKey])

                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {clearable && field.value ? (
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-e-8 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label={clearLabel ?? t('label.clear_selection')}
                onClick={() => {
                  field.onChange(deserializeValue(''))
                  onChange?.('')
                }}
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>

          <FormMessage className={messageClassName} />
        </FormItem>
      )}
    />
  )
}
