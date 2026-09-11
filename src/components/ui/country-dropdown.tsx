import * as React from 'react'
import { CheckIcon, ChevronDownIcon, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CircleFlag } from 'react-circle-flags'
import { countries } from 'country-data-list'

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { CountryDdlOption } from '@/types/country-ddl.types'

export interface Country {
  alpha2: string
  alpha3: string
  countryCallingCodes: string[]
  currencies: string[]
  emoji?: string
  ioc: string
  languages: string[]
  name: string
  status: string
}

export type CountryDropdownOption = Country | CountryDdlOption
export type CountryDropdownVariant = 'default' | 'auth'

export type CountryDropdownProps<TOption extends CountryDropdownOption = Country> = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'defaultValue' | 'onChange' | 'value'
> & {
  options?: readonly TOption[]
  onChange?: (country: TOption) => void
  /** Exact controlled option. Prefer this when the complete option is available. */
  value?: TOption | null
  /** Exact controlled identity for options loaded from a DDL. */
  selectedIso2?: string
  /** Legacy uncontrolled calling-code initialization. */
  defaultValue?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  slim?: boolean
  size?: 'default' | 'compact'
  variant?: CountryDropdownVariant
}

const DEFAULT_COUNTRIES: readonly Country[] = countries.all.filter(
  (country: Country) => country.emoji && country.status !== 'deleted' && country.ioc !== 'PRK'
)

export function getCountryOptionIso2(country: CountryDropdownOption): string {
  return ('iso2' in country ? country.iso2 : country.alpha2).trim().toUpperCase()
}

export function getCountryOptionPhoneCode(country: CountryDropdownOption): string {
  return ('phone_code' in country ? country.phone_code : (country.countryCallingCodes[0] ?? '')).trim()
}

export function getCountryOptionLabel(country: CountryDropdownOption): string {
  return 'label' in country ? country.label : country.name
}

function CountryDropdownComponent<TOption extends CountryDropdownOption = Country>(
  {
    options,
    onChange,
    value: controlledValue,
    selectedIso2,
    defaultValue,
    disabled = false,
    placeholder,
    searchPlaceholder,
    emptyMessage,
    slim = false,
    size = 'default',
    variant = 'default',
    className,
    onBlur,
    ...triggerProps
  }: CountryDropdownProps<TOption>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {
    t,
    i18n: { dir },
  } = useTranslation()
  const resolvedOptions = (options ?? DEFAULT_COUNTRIES) as readonly CountryDropdownOption[]
  const isControlled = controlledValue !== undefined || selectedIso2 !== undefined

  const findByIso2 = React.useCallback(
    (iso2?: string) => {
      const normalizedIso2 = iso2?.trim().toUpperCase()
      if (!normalizedIso2) return undefined
      return resolvedOptions.find((option) => getCountryOptionIso2(option) === normalizedIso2)
    },
    [resolvedOptions]
  )

  const findByCallingCode = React.useCallback(
    (callingCode?: string) => {
      const normalizedCallingCode = callingCode?.trim()
      if (!normalizedCallingCode) return undefined
      return resolvedOptions.find((option) => getCountryOptionPhoneCode(option) === normalizedCallingCode)
    },
    [resolvedOptions]
  )

  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState<CountryDropdownOption | undefined>(() =>
    findByCallingCode(defaultValue)
  )

  const selectedCountry = React.useMemo(() => {
    if (controlledValue !== undefined) return controlledValue ?? undefined
    if (selectedIso2 !== undefined) return findByIso2(selectedIso2)
    return internalValue
  }, [controlledValue, findByIso2, internalValue, selectedIso2])

  React.useEffect(() => {
    if (isControlled || !defaultValue) return

    const nextCountry = findByCallingCode(defaultValue)
    const nextIso2 = nextCountry ? getCountryOptionIso2(nextCountry) : undefined
    const currentIso2 = internalValue ? getCountryOptionIso2(internalValue) : undefined

    if (nextIso2 !== currentIso2) {
      setInternalValue(nextCountry)
    }
  }, [defaultValue, findByCallingCode, internalValue, isControlled])

  React.useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (disabled) {
        setOpen(false)
        return
      }
      setOpen(nextOpen)
    },
    [disabled]
  )

  const handleSelect = React.useCallback(
    (country: CountryDropdownOption) => {
      if (!isControlled) setInternalValue(country)
      onChange?.(country as TOption)
      setOpen(false)
    },
    [isControlled, onChange]
  )

  const resolvedPlaceholder = placeholder ?? t('label.select_country')
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('label.search_country')
  const resolvedEmptyMessage = emptyMessage ?? t('label.no_country_found')

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        {...triggerProps}
        ref={ref}
        type="button"
        role="combobox"
        dir={dir()}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onBlur={onBlur}
        className={cn(
          'flex h-14 min-w-0 cursor-pointer items-center justify-between gap-2 rounded-2xl border border-black-50 bg-black-50 px-4 py-3 text-sm text-content-primary outline-none transition-all',
          'hover:border-black-100',
          'focus-visible:border-brand-500 focus-visible:ring-3 focus-visible:ring-brand-500/20',
          'aria-invalid:border-error-500 aria-invalid:ring-3 aria-invalid:ring-error-500/20',
          'disabled:cursor-not-allowed disabled:border-black-100 disabled:bg-black-100 disabled:text-content-secondary disabled:opacity-100',
          size === 'compact' && 'h-12 rounded-xl py-2',
          slim && 'h-full min-h-14 w-auto min-w-23 justify-center rounded-none border-0 border-e border-black-100 px-3',
          slim && size === 'compact' && 'min-h-12',
          variant === 'auth' && 'bg-surface-muted',
          className
        )}
      >
        {selectedCountry ? (
          <span className="flex min-w-0 items-center gap-2 overflow-hidden">
            <span className="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm">
              <CircleFlag countryCode={getCountryOptionIso2(selectedCountry).toLowerCase()} height={20} />
            </span>
            <span className="shrink-0 font-normal">{getCountryOptionPhoneCode(selectedCountry)}</span>
            {!slim && <span className="truncate">{getCountryOptionLabel(selectedCountry)}</span>}
          </span>
        ) : (
          <span className="truncate text-content-muted">
            {slim ? <Globe className="size-5" /> : resolvedPlaceholder}
          </span>
        )}
        {!slim && <ChevronDownIcon className="size-4 shrink-0 text-content-muted" aria-hidden="true" />}
      </PopoverTrigger>

      <PopoverContent
        collisionPadding={10}
        side="bottom"
        align="start"
        dir={dir()}
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
      >
        <Command className="max-h-72 w-full">
          <CommandInput surface="field" placeholder={resolvedSearchPlaceholder} />
          <CommandList role="listbox">
            <CommandEmpty>{resolvedEmptyMessage}</CommandEmpty>
            <CommandGroup>
              {resolvedOptions.map((option) => {
                const iso2 = getCountryOptionIso2(option)
                const label = getCountryOptionLabel(option)
                const phoneCode = getCountryOptionPhoneCode(option)
                const isSelected = iso2 === (selectedCountry ? getCountryOptionIso2(selectedCountry) : undefined)

                return (
                  <CommandItem
                    key={iso2}
                    value={`${label} ${iso2} ${phoneCode}`}
                    aria-selected={isSelected}
                    className="flex w-full items-center gap-2"
                    onSelect={() => handleSelect(option)}
                  >
                    <span className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      <CircleFlag countryCode={iso2.toLowerCase()} height={20} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    <span className="shrink-0 text-content-secondary">{phoneCode}</span>
                    <CheckIcon className={cn('size-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const ForwardedCountryDropdown = React.forwardRef(CountryDropdownComponent)

ForwardedCountryDropdown.displayName = 'CountryDropdown'

export const CountryDropdown = ForwardedCountryDropdown as unknown as <TOption extends CountryDropdownOption = Country>(
  props: CountryDropdownProps<TOption> & React.RefAttributes<HTMLButtonElement>
) => React.ReactElement
