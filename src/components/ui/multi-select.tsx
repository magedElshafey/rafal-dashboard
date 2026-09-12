import * as React from 'react'
import { CheckIcon, ChevronDownIcon, Loader2Icon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'

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
  searchable?: boolean

  maxCount?: number
  modalPopover?: boolean
  showSelectAll?: boolean

  onValueChange?: (value: string[]) => void
  onToggle?: (isOpen: boolean) => void
  onSearch?: (value: string) => void
  onClear?: () => void

  isLoading?: boolean
  isFetchingNextPage?: boolean
  isError?: boolean
  isRetrying?: boolean
  hasNextPage?: boolean
  onLoadMore?: () => void | Promise<unknown>
  onRetry?: () => void | Promise<unknown>

  emptyMessage?: React.ReactNode
  loadingMessage?: React.ReactNode
  loadMoreMessage?: React.ReactNode
  errorMessage?: React.ReactNode
  retryLabel?: React.ReactNode
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
      className={cn('flex min-h-9 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground', className)}
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
    searchable = true,

    maxCount = 3,
    modalPopover = false,
    showSelectAll = true,

    onValueChange,
    onToggle,
    onSearch,
    onClear,

    isLoading = false,
    isFetchingNextPage = false,
    isError = false,
    isRetrying = false,
    hasNextPage = false,
    onLoadMore,
    onRetry,

    emptyMessage,
    loadingMessage,
    loadMoreMessage,
    errorMessage,
    retryLabel,
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

  const requestLoadMore = React.useCallback(async () => {
    if (!onLoadMore || !hasNextPage || isLoading || isFetchingNextPage || isError || loadMoreLockRef.current) return

    loadMoreLockRef.current = true
    try {
      await onLoadMore()
    } finally {
      loadMoreLockRef.current = false
    }
  }, [hasNextPage, isError, isFetchingNextPage, isLoading, onLoadMore])

  const loadMoreRef = useInfiniteScroll({
    enabled: isOpen && hasNextPage && !isLoading && !isFetchingNextPage && !isError,
    onLoadMore: requestLoadMore,
    operationKey: data.length,
    rootMargin: '48px 0px',
  })

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
    const target = event.currentTarget

    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight

    if (distanceToBottom > scrollThreshold) {
      return
    }

    await requestLoadMore()
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
                'rounded-2xl border border-border',
                'bg-black-50 px-4 py-3',
                'text-start text-sm text-foreground',
                'outline-none transition-all',
                'shadow-none',
                'hover:border-ring',
                'focus-visible:border-ring',
                'focus-visible:ring-3 focus-visible:ring-ring/20',
                'aria-invalid:border-destructive',
                'aria-invalid:ring-3 aria-invalid:ring-destructive/20',
                'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100',
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
                          'bg-muted p-2 text-foreground',
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
                        'rounded-lg border border-border',
                        'bg-background px-2 py-1',
                        'text-xs font-medium text-muted-foreground',
                      ].join(' '),
                      badgeClassName
                    )}
                  >
                    +{selectedValues.length - maxCount} {t('label.more')}
                  </span>
                )}
              </div>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )}

            <ChevronDownIcon
              className={cn(
                'absolute end-4 top-1/2 size-4 -translate-y-1/2',
                'text-muted-foreground transition-transform',
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
                'rounded-lg text-muted-foreground',
                'transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/50',
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
            'rounded-2xl border border-border',
            'bg-popover text-popover-foreground',
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
        <Command dir={direction} shouldFilter={searchable && !onSearch} className="bg-transparent">
          {searchable ? (
            <CommandInput
              surface="field"
              value={searchValue}
              placeholder={searchPlaceholder ?? t('label.search')}
              onValueChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className={searchClassName}
            />
          ) : null}

          <CommandList
            role="listbox"
            aria-multiselectable="true"
            aria-busy={showInitialLoading || isFetchingNextPage || isRetrying}
            className="max-h-64 overflow-y-auto"
            onScroll={handleListScroll}
          >
            {isError && data.length === 0 ? (
              <div
                role="alert"
                className="flex min-h-16 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-destructive"
              >
                <span>{errorMessage}</span>
                {onRetry && retryLabel ? (
                  <button
                    type="button"
                    disabled={isRetrying}
                    className="shrink-0 rounded-md px-2 py-1 font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
                    onClick={() => void onRetry()}
                  >
                    {retryLabel}
                  </button>
                ) : null}
              </div>
            ) : showInitialLoading ? (
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
                      aria-checked={allVisibleOptionsSelected}
                      data-checked={allVisibleOptionsSelected}
                      onSelect={handleToggleAll}
                      className={cn(
                        [
                          'cursor-pointer rounded-xl px-3 py-2',
                          'text-sm text-foreground',
                          'transition-colors',
                          'data-[selected=true]:bg-accent',
                          'data-[selected=true]:text-accent-foreground',
                        ].join(' '),
                        optionClassName
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          ['flex size-4 shrink-0 items-center justify-center', 'rounded border border-ring'].join(' '),
                          allVisibleOptionsSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-transparent'
                        )}
                      >
                        <CheckIcon className="size-3.5" />
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
                        aria-checked={isSelected}
                        data-checked={isSelected}
                        onSelect={() => handleToggleOption(optionValue)}
                        className={cn(
                          [
                            'cursor-pointer rounded-xl px-3 py-2',
                            'text-sm text-foreground',
                            'transition-colors',
                            'data-[selected=true]:bg-accent',
                            'data-[selected=true]:text-accent-foreground',
                          ].join(' '),
                          optionClassName
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            ['flex size-4 shrink-0 items-center justify-center', 'rounded border border-ring'].join(
                              ' '
                            ),
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-background text-transparent'
                          )}
                        >
                          <CheckIcon className="size-3.5" />
                        </span>

                        {Icon && <Icon className="size-4 text-muted-foreground" />}

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
                  <div ref={loadMoreRef} data-slot="multi-select-load-more">
                    <MultiSelectStatusRow className={statusClassName}>
                      {loadMoreMessage ?? t('label.load_more')}
                    </MultiSelectStatusRow>
                  </div>
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
