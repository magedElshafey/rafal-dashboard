import { memo, useId } from 'react'
import { Phone } from 'lucide-react'
import { useController, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  CountryDropdown,
  getCountryOptionPhoneCode,
  type Country,
  type CountryDropdownOption,
  type CountryDropdownVariant,
} from '@/components/ui/country-dropdown'
import { cn } from '@/lib/utils'
import type { CountryDdlOption } from '@/types/country-ddl.types'

export type FormPhoneInputProps = {
  phoneName: string
  countryName: string
  label?: string
  placeholder?: string
  containerClassName?: string
  inputClassName?: string
  labelClassName?: string
  variant?: CountryDropdownVariant
  size?: 'default' | 'compact'
  disabled?: boolean
  autoComplete?: string
  countryOptions?: CountryDdlOption[]
  selectedCountryIso2?: string
  onCountryChange?: (country: CountryDdlOption | Country) => void
  required?: boolean
}

export const FormPhoneInput = memo(function FormPhoneInput({
  phoneName,
  countryName,
  label,
  placeholder,
  containerClassName,
  inputClassName,
  labelClassName,
  variant = 'default',
  size = 'default',
  disabled = false,
  autoComplete = 'tel-national',
  countryOptions,
  selectedCountryIso2,
  onCountryChange,
  required = false,
}: FormPhoneInputProps) {
  const { t } = useTranslation()
  const { control } = useFormContext()
  const generatedId = useId()

  const { field: phoneField, fieldState: phoneFieldState } = useController({
    name: phoneName,
    control,
  })

  const { field: countryField, fieldState: countryFieldState } = useController({
    name: countryName,
    control,
  })

  const error = phoneFieldState.error ?? countryFieldState.error
  const errorMessage = error?.message ? String(error.message) : undefined
  const hasError = Boolean(error)
  const phoneInputId = `${generatedId}-phone`
  const labelId = `${generatedId}-label`
  const messageId = `${generatedId}-message`
  const resolvedLabel = label ?? t('label.phone')
  const resolvedPlaceholder = placeholder ?? t('label.phone_placeholder')

  return (
    <div
      className={cn('flex w-full flex-col gap-2', containerClassName)}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={errorMessage ? messageId : undefined}
    >
      <label
        id={labelId}
        htmlFor={phoneInputId}
        className={cn('text-base font-normal leading-6 text-foreground', labelClassName)}
      >
        {resolvedLabel}
        {required && (
          <span aria-hidden="true" className="ms-1 text-destructive">
            *
          </span>
        )}
      </label>

      <div
        data-slot="phone-input-container"
        className={cn(
          'flex h-14 w-full overflow-hidden rounded-2xl border border-border bg-background',
          'transition-all duration-200 ease-out hover:border-ring',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20',
          hasError &&
            'border-destructive ring-3 ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20',
          disabled && 'cursor-not-allowed bg-muted text-muted-foreground',
          size === 'compact' && 'h-12 rounded-xl'
        )}
      >
        <CountryDropdown<CountryDropdownOption>
          ref={countryField.ref}
          slim
          size={size}
          variant={variant}
          options={countryOptions}
          selectedIso2={selectedCountryIso2}
          defaultValue={countryField.value == null ? undefined : String(countryField.value)}
          disabled={disabled}
          aria-label={t('label.select_country')}
          aria-invalid={Boolean(countryFieldState.error)}
          aria-required={required}
          aria-describedby={errorMessage ? messageId : undefined}
          onBlur={countryField.onBlur}
          onChange={(country) => {
            countryField.onChange(getCountryOptionPhoneCode(country))
            onCountryChange?.(country)
          }}
        />

        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
          <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

          <input
            ref={phoneField.ref}
            id={phoneInputId}
            name={phoneField.name}
            value={phoneField.value ?? ''}
            type="tel"
            inputMode="tel"
            autoComplete={autoComplete}
            placeholder={resolvedPlaceholder}
            disabled={disabled}
            aria-invalid={Boolean(phoneFieldState.error)}
            aria-required={required}
            aria-describedby={errorMessage ? messageId : undefined}
            onBlur={phoneField.onBlur}
            onChange={phoneField.onChange}
            className={cn(
              'h-full min-w-0 flex-1 bg-transparent text-sm font-normal text-foreground outline-none',
              'placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed disabled:text-muted-foreground',
              inputClassName
            )}
          />
        </div>
      </div>

      {errorMessage && (
        <p id={messageId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  )
})
