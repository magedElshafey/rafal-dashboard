import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export interface FormPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  name: string
  label?: string
  containerClassName?: string
  itemClassName?: string
  labelClassName?: string
  messageClassName?: string
  controlSize?: 'default' | 'compact'
  showPasswordLabel?: string
  hidePasswordLabel?: string
  reserveMessageSpace?: boolean
  onChange?: (newValue: string) => void
}

export function FormPasswordInput({
  name,
  label,
  containerClassName,
  itemClassName,
  labelClassName,
  messageClassName,
  controlSize,
  showPasswordLabel,
  hidePasswordLabel,
  reserveMessageSpace = false,
  onChange,
  disabled,
  ...props
}: FormPasswordInputProps) {
  const { control } = useFormContext()
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const resolvedShowLabel = showPasswordLabel ?? t('label.show_password')
  const resolvedHideLabel = hidePasswordLabel ?? t('label.hide_password')

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={itemClassName}>
          {label && <FormLabel className={labelClassName}>{label}</FormLabel>}
          <FormControl>
            <Input
              {...field}
              {...props}
              disabled={disabled}
              type={showPassword ? 'text' : 'password'}
              containerClassName={containerClassName}
              controlSize={controlSize}
              aria-invalid={fieldState.invalid}
              onChange={(event) => {
                field.onChange(event)
                onChange?.(event.target.value)
              }}
              suffix={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={showPassword ? resolvedHideLabel : resolvedShowLabel}
                  aria-pressed={showPassword}
                  className="size-10 shrink-0 rounded-lg text-black-400 hover:bg-black-100 disabled:opacity-100"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              }
            />
          </FormControl>
          {reserveMessageSpace ? (
            <div data-slot="form-message-slot" className="min-h-10 sm:min-h-5">
              <FormMessage className={messageClassName} />
            </div>
          ) : (
            <FormMessage className={messageClassName} />
          )}
        </FormItem>
      )}
    />
  )
}
