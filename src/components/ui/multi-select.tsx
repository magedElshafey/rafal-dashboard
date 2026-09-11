import * as React from 'react'
import { CheckIcon, ChevronDownIcon, Loader2Icon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

type MultiSelectOptionValue = string | number

type MultiSelectIcon = React.ComponentType<{
  className?: string
}>

export interface MultiSelectProps<T> extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'onToggle'
> {
  data: T[]
  valueKey: keyof T
  labelKey: keyof T
  iconKey?: keyof T

  value?: string[]
  defaultValue?: string[]

  placeholder?: string
  searchPlaceholder?: string

  maxCount?: number
  modalPopover?: boolean
  showSelectAll?: boolean

  onValueChange?: (value: string[]) => void
  onToggle?: (isOpen: boolean) => void
  onSearch?: (value: string) => void
  onClear?: () => void

  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  onLoadMore?: () => void | Promise<unknown>

  emptyMessage?: React.ReactNode
  loadingMessage?: React.ReactNode
  loadMoreMessage?: React.ReactNode
  selectAllLabel?: React.ReactNode
  clearLabel?: string

  scrollThreshold?: number

  triggerClassName?: string
  contentClassName?: string
  searchClassName?: string
  optionClassName?: string
  badgeClassName?: string
  statusClassName?: string
}

type MultiSelectStatusRowProps = {
  children: React.ReactNode
  isLoading?: boolean
  className?: string
}

function MultiSelectStatusRow({ children, isLoading, className }: MultiSelectStatusRowProps) {
  return (
    <div
      role="status"
      className={cn('flex min-h-9 items-center gap-2 rounded-xl px-3 py-2', 'text-sm text-content-muted', className)}
    >
      {isLoading && <Loader2Icon className="size-4 shrink-0 animate-spin" />}

      <span>{children}</span>
    </div>
  )
}

function MultiSelectComponent<T>(
  {
    data,
    valueKey,
    labelKey,
    iconKey,

    value,
    defaultValue = [],

    placeholder,
    searchPlaceholder,

    maxCount = 3,
    modalPopover = false,
    showSelectAll = true,

    onValueChange,
    onToggle,
    onSearch,
    onClear,

    isLoading = false,
    isFetchingNextPage = false,
    hasNextPage = false,
    onLoadMore,

    emptyMessage,
    loadingMessage,
    loadMoreMessage,
    selectAllLabel,
    clearLabel,

    scrollThreshold = 48,

    className,
    triggerClassName,
    contentClassName,
    searchClassName,
    optionClassName,
    badgeClassName,
    statusClassName,

    disabled,
    onBlur,
    ...triggerProps
  }: MultiSelectProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {
    t,
    i18n: { dir },
  } = useTranslation()

  const direction = dir()
  const isControlled = value !== undefined

  const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue)

  const [isOpen, setIsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  const loadMoreLockRef = React.useRef(false)

  const selectedValues = value ?? internalValue
  const visibleSelectedValues = selectedValues.slice(0, Math.max(maxCount, 0))

  const optionValues = data.map((option) => String(option[valueKey] as MultiSelectOptionValue))

  const allVisibleOptionsSelected =
    optionValues.length > 0 && optionValues.every((optionValue) => selectedValues.includes(optionValue))

  const showInitialLoading = isLoading && data.length === 0

  React.useEffect(() => {
    if (!isFetchingNextPage) {
      loadMoreLockRef.current = false
    }
  }, [isFetchingNextPage])

  React.useEffect(() => {
    if (disabled) setIsOpen(false)
  }, [disabled])

  const updateValue = (newValue: string[]) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }

    onValueChange?.(newValue)
  }

  const handleOpenChange = (open: boolean) => {
    if (disabled) {
      setIsOpen(false)
      return
    }
    setIsOpen(open)
    onToggle?.(open)
  }

  const handleClear = () => {
    updateValue([])
    onClear?.()
  }

  const handleToggleOption = (optionValue: string) => {
    const isSelected = selectedValues.includes(optionValue)

    const newValue = isSelected
      ? selectedValues.filter((selectedValue) => selectedValue !== optionValue)
      : [...selectedValues, optionValue]

    updateValue(newValue)

    if (newValue.length === 0) {
      onClear?.()
    }
  }

  const handleToggleAll = () => {
    const visibleOptionsSet = new Set(optionValues)

    if (allVisibleOptionsSelected) {
      const newValue = selectedValues.filter((selectedValue) => !visibleOptionsSet.has(selectedValue))

      updateValue(newValue)

      if (newValue.length === 0) {
        onClear?.()
      }

      return
    }

    updateValue(Array.from(new Set([...selectedValues, ...optionValues])))
  }

  const handleSearchChange = (newSearchValue: string) => {
    setSearchValue(newSearchValue)
    onSearch?.(newSearchValue)
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !event.currentTarget.value && selectedValues.length > 0) {
      const newValue = selectedValues.slice(0, -1)

      updateValue(newValue)

      if (newValue.length === 0) {
        onClear?.()
      }
    }
  }

  const handleListScroll = async (event: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || !hasNextPage || isLoading || isFetchingNextPage || loadMoreLockRef.current) {
      return
    }

    const target = event.currentTarget

    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight

    if (distanceToBottom > scrollThreshold) {
      return
    }

    loadMoreLockRef.current = true

    try {
      await onLoadMore()
    } finally {
      loadMoreLockRef.current = false
    }
  }

  const getOptionByValue = (optionValue: string) =>
    data.find((option) => String(option[valueKey] as MultiSelectOptionValue) === optionValue)

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal={modalPopover}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            data-slot="multi-select-trigger"
            dir={direction}
            disabled={disabled}
            onBlur={onBlur}
            className={cn(
              [
                'relative flex min-h-14 w-full items-center',
                'rounded-2xl border border-black-50',
                'bg-black-50 px-4 py-3',
                'text-start text-sm text-neutral-600',
                'outline-none transition-all',
                'shadow-none',
                'hover:border-black-100',
                'focus-visible:border-brand-500',
                'focus-visible:ring-3 focus-visible:ring-brand-500/20',
                'aria-invalid:border-error-500',
                'aria-invalid:ring-3 aria-invalid:ring-error-500/20',
                'disabled:cursor-not-allowed disabled:border-black-100 disabled:bg-black-100 disabled:text-content-secondary disabled:opacity-100',
                '[&_svg]:pointer-events-none [&_svg]:shrink-0',
              ].join(' '),
              selectedValues.length > 0 ? 'pe-20' : 'pe-11',
              className,
              triggerClassName
            )}
            {...triggerProps}
          >
            {selectedValues.length > 0 ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {visibleSelectedValues.map((selectedValue) => {
                  const option = getOptionByValue(selectedValue)

                  const optionLabel = option ? String(option[labelKey]) : selectedValue

                  const Icon = iconKey ? (option?.[iconKey] as MultiSelectIcon | undefined) : undefined

                  return (
                    <span
                      key={selectedValue}
                      className={cn(
                        [
                          'flex max-w-full items-center gap-1.5',
                          'rounded-full',
                          'bg-white text-neutral-700 p-2',
                          'text-xs font-medium ',
                        ].join(' '),
                        badgeClassName
                      )}
                    >
                      {Icon && <Icon className="size-3.5" />}

                      <span className="max-w-40 truncate">{optionLabel}</span>
                    </span>
                  )
                })}

                {selectedValues.length > maxCount && (
                  <span
                    className={cn(
                      [
                        'rounded-lg border border-border-subtle',
                        'bg-surface-card px-2 py-1',
                        'text-xs font-medium text-content-secondary',
                      ].join(' '),
                      badgeClassName
                    )}
                  >
                    +{selectedValues.length - maxCount} {t('label.more')}
                  </span>
                )}
              </div>
            ) : (
              <span className="truncate text-content-muted">{placeholder}</span>
            )}

            <ChevronDownIcon
              className={cn(
                'absolute end-4 top-1/2 size-4 -translate-y-1/2',
                'text-content-muted transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </PopoverTrigger>

        {selectedValues.length > 0 && !disabled && (
          <button
            type="button"
            aria-label={clearLabel ?? t('label.clear_selection')}
            onClick={handleClear}
            className={cn(
              [
                'absolute end-10 top-1/2 z-10',
                'flex size-7 -translate-y-1/2 items-center justify-center',
                'rounded-lg text-content-muted',
                'transition-colors',
                'hover:bg-brand-50 hover:text-brand-700',
                'focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-brand/20',
              ].join(' ')
            )}
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      <PopoverContent
        data-slot="multi-select-content"
        dir={direction}
        align="start"
        sideOffset={4}
        className={cn(
          [
            'z-50 w-[var(--radix-popover-trigger-width)]',
            'min-w-[var(--radix-popover-trigger-width)]',
            'overflow-hidden p-1',
            'rounded-2xl border border-border-subtle',
            'bg-surface-card text-content-primary',
            'shadow-dropdown',
            'data-[state=open]:animate-in',
            'data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0',
            'data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95',
            'data-[state=open]:zoom-in-95',
          ].join(' '),
          contentClassName
        )}
      >
        <Command dir={direction} shouldFilter={!onSearch} className="bg-transparent">
          <CommandInput
            surface="field"
            value={searchValue}
            placeholder={searchPlaceholder ?? t('label.search')}
            onValueChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className={searchClassName}
          />

          <CommandList
            role="listbox"
            aria-multiselectable="true"
            className="max-h-64 overflow-y-auto"
            onScroll={handleListScroll}
          >
            {showInitialLoading ? (
              <MultiSelectStatusRow isLoading className={statusClassName}>
                {loadingMessage ?? t('label.loading')}
              </MultiSelectStatusRow>
            ) : (
              <>
                <CommandEmpty>
                  <MultiSelectStatusRow className={statusClassName}>
                    {emptyMessage ?? t('label.no_results')}
                  </MultiSelectStatusRow>
                </CommandEmpty>

                <CommandGroup>
                  {showSelectAll && data.length > 0 && !searchValue.trim() && (
                    <CommandItem
                      value="select-all"
                      onSelect={handleToggleAll}
                      className={cn(
                        [
                          'cursor-pointer rounded-xl px-3 py-2',
                          'text-sm text-neutral-700',
                          'transition-colors',
                          'data-[selected=true]:bg-brand-50',
                          'data-[selected=true]:text-brand-700',
                        ].join(' '),
                        optionClassName
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          ['flex size-4 shrink-0 items-center justify-center', 'rounded border border-brand'].join(' '),
                          allVisibleOptionsSelected ? 'bg-brand text-white' : 'bg-surface-card text-transparent'
                        )}
                      >
                        <CheckIcon className={cn('size-3.5', allVisibleOptionsSelected && 'text-white')} />
                      </span>

                      <span>{selectAllLabel ?? t('label.select_all')}</span>
                    </CommandItem>
                  )}

                  {data.map((option) => {
                    const optionValue = String(option[valueKey] as MultiSelectOptionValue)

                    const optionLabel = String(option[labelKey])

                    const isSelected = selectedValues.includes(optionValue)

                    const Icon = iconKey ? (option[iconKey] as MultiSelectIcon | undefined) : undefined

                    return (
                      <CommandItem
                        key={optionValue}
                        value={`${optionValue} ${optionLabel}`}
                        aria-selected={isSelected}
                        onSelect={() => handleToggleOption(optionValue)}
                        className={cn(
                          [
                            'cursor-pointer rounded-xl px-3 py-2',
                            'text-sm text-content-primary',
                            'transition-colors',
                            'data-[selected=true]:bg-brand-50',
                            'data-[selected=true]:text-brand-700',
                          ].join(' '),
                          optionClassName
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            ['flex size-4 shrink-0 items-center justify-center', 'rounded border border-brand'].join(
                              ' '
                            ),
                            isSelected ? 'bg-brand-500 text-white' : 'bg-surface-card text-transparent'
                          )}
                        >
                          <CheckIcon className={cn('size-3.5', isSelected && 'text-white')} />
                        </span>

                        {Icon && <Icon className="size-4 text-content-muted" />}

                        <span className="min-w-0 flex-1 truncate">{optionLabel}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>

                {data.length > 0 && isFetchingNextPage && (
                  <MultiSelectStatusRow isLoading className={statusClassName}>
                    {loadingMessage ?? t('label.loading')}
                  </MultiSelectStatusRow>
                )}

                {data.length > 0 && hasNextPage && !isFetchingNextPage && !isLoading && (
                  <MultiSelectStatusRow className={statusClassName}>
                    {loadMoreMessage ?? t('label.load_more')}
                  </MultiSelectStatusRow>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const ForwardedMultiSelect = React.forwardRef(MultiSelectComponent)

ForwardedMultiSelect.displayName = 'MultiSelect'

export const MultiSelect = ForwardedMultiSelect as unknown as <T>(
  props: MultiSelectProps<T> & {
    ref?: React.ForwardedRef<HTMLButtonElement>
  }
) => React.ReactElement
