// hooks
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

// icons
import { Check, ChevronDownIcon } from 'lucide-react'

// utils
import { cn } from '@/lib/utils'

// types
import type { ComponentProps, ReactNode, UIEvent } from 'react'

// ui imports
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface ComboboxProps<T> extends Omit<
  ComponentProps<'button'>,
  'defaultValue' | 'onChange' | 'onToggle' | 'value'
> {
  data: T[]
  valueKey: keyof T
  labelKey: keyof T
  placeholder?: string
  value?: T | null
  onChange?: (value: T | null) => void
  onSearch?: (value: string) => void
  pagination?: {
    hasNextPage: boolean
    isFetching: boolean
    isLoading: boolean
    isError: boolean
    onLoadMore: () => void | Promise<unknown>
    onRetry: () => void | Promise<unknown>
    loadingMessage: ReactNode
    moreMessage: ReactNode
    errorMessage: ReactNode
    retryLabel: string
  }
  hasError?: boolean
  /** Callback when the popover opens/closes */
  onToggle?: (isOpen: boolean) => void
  onClear?: () => void
}

function Combobox<T>({
  data,
  labelKey,
  valueKey,
  placeholder,
  value: controlledValue,
  onChange,
  onSearch,
  hasError,
  pagination,
  className,
  onToggle,
  onClear,
  disabled,
  'aria-invalid': ariaInvalid,
  ...props
}: ComboboxProps<T>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const paginationLock = useRef(false)
  const requestedHeight = useRef<number | null>(null)
  const lastScrollTop = useRef(0)

  const requestPage = (retry = false) => {
    if (!open || disabled || !pagination || pagination.isFetching || paginationLock.current) return
    if (!retry && (!pagination.hasNextPage || pagination.isLoading || pagination.isError)) return
    paginationLock.current = true
    const request = retry ? pagination.onRetry : pagination.onLoadMore
    void Promise.resolve().then(request).catch(() => undefined).finally(() => {
      paginationLock.current = false
    })
  }

  const handleOptionsScroll = (event: UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget
    const movingDown = viewport.scrollTop > lastScrollTop.current
    lastScrollTop.current = viewport.scrollTop
    if (!open || disabled || !pagination || !pagination.hasNextPage || pagination.isFetching ||
      pagination.isLoading || pagination.isError || paginationLock.current || !movingDown) return
    if (viewport.scrollHeight <= viewport.clientHeight ||
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight > 48 ||
      requestedHeight.current === viewport.scrollHeight) return
    // One request per content extent; appending or opening alone never requests a page.
    requestedHeight.current = viewport.scrollHeight
    requestPage()
  }
  const [internalValue, setInternalValue] = useState<T | null>(controlledValue ?? null)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const setValue = (newValue: T | null) => {
    if (!isControlled) setInternalValue(newValue)
    onChange?.(newValue)
  }

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const handleOpenChange = (next: boolean) => {
    if (disabled) {
      setOpen(false)
      return
    }
    requestedHeight.current = null
    lastScrollTop.current = 0
    setOpen(next)
    onToggle?.(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={hasError || ariaInvalid || undefined}
          disabled={disabled}
          className={cn(
            'h-14 w-full justify-between rounded-2xl border border-black-50 bg-black-50 px-4 py-3 text-sm font-normal text-content-primary shadow-none',
            'hover:border-black-100 hover:bg-black-50 hover:text-content-primary',
            'focus-visible:border-brand-500 focus-visible:ring-3 focus-visible:ring-brand-500/20',
            'aria-invalid:border-error-500 aria-invalid:ring-3 aria-invalid:ring-error-500/20',
            'disabled:cursor-not-allowed disabled:border-black-100 disabled:bg-black-100 disabled:text-content-secondary disabled:opacity-100',
            className
          )}
          {...props}
        >
          {value ? (
            (value[labelKey] as string)
          ) : (
            <span className="text-muted-foreground font-normal">{placeholder}</span>
          )}
          <ChevronDownIcon className="opacity-50 ml-2 size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command
          {...(!!onSearch && {
            filter: (_, search) => {
              onSearch(search)
              return 1
            },
          })}
        >
          <CommandInput surface="field" placeholder={t('label.search')} />
          <CommandList
            onScroll={pagination ? handleOptionsScroll : undefined}
            className={pagination ? 'overscroll-contain' : undefined}
            aria-busy={pagination ? pagination.isFetching : undefined}
          >
            <CommandEmpty>
              {pagination?.isLoading || pagination?.isFetching ? pagination.loadingMessage
                : pagination?.hasNextPage || pagination?.isError ? null : t('label.no_data')}
            </CommandEmpty>
            <CommandGroup>
              {data.map((item) => {
                const itemValue = String(item[valueKey])
                const itemLabel = String(item[labelKey])
                const isSelected = value && String(value[valueKey]) === itemValue

                return (
                  <CommandItem
                    key={itemValue}
                    value={itemLabel}
                    className="capitalize"
                    onSelect={() => {
                      const selectedItem = item
                      const isSame = value && String(value[valueKey]) === String(selectedItem[valueKey])
                      isSame ? (onClear?.(), setValue(null)) : setValue(selectedItem)
                      setOpen(false)
                    }}
                  >
                    {itemLabel}
                    <Check className={cn('ml-auto size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {pagination && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {pagination.isFetching && <p role="status">{pagination.loadingMessage}</p>}
                {pagination.isError ? (
                  <div role="alert" className="space-y-2">
                    <p>{pagination.errorMessage}</p>
                    <Button type="button" variant="outline" disabled={pagination.isFetching}
                      onClick={() => requestPage(true)}>{pagination.retryLabel}</Button>
                  </div>
                ) : pagination.hasNextPage && !pagination.isFetching ? <p>{pagination.moreMessage}</p> : null}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
