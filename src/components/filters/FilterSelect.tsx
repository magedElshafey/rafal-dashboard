import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRtl } from '@/hooks/useRtl'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { Root } from '@radix-ui/react-select'
import { X } from 'lucide-react'
import { useCallback } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

export interface FilterSelectProps<T> extends React.ComponentProps<typeof Root> {
  label?: string
  name: string
  data: T[]
  placeholder?: string
  valueKey: keyof T & string
  labelKey: keyof T & string
  onFilterChange?: (value: string | null) => void
  resetQueryNamesOnChange?: string[]
  resetQueryNamesOnClear?: boolean
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  onLoadMore?: () => void | Promise<unknown>
  emptyMessage?: ReactNode
  loadingMessage?: ReactNode
  loadMoreMessage?: ReactNode
  triggerClassName?: string
  clearLabel?: string
}

const FilterSelect = <T,>({
  label,
  name,
  data,
  valueKey,
  labelKey,
  placeholder,
  onFilterChange,
  resetQueryNamesOnChange,
  resetQueryNamesOnClear = false,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  emptyMessage,
  loadingMessage,
  loadMoreMessage,
  triggerClassName,
  clearLabel,
  ...props
}: FilterSelectProps<T>) => {
  const { forwardAddQuery, forwardDeleteQuery, forwardQuery } = useQuery()
  const selectedValue = forwardQuery?.[name] ?? ''
  const { t } = useTranslation()
  const { isRtl } = useRtl()

  const handleSelectFilter = useCallback(
    (value: string) => {
      forwardAddQuery(
        { [name]: value },
        resetQueryNamesOnChange ? { resetQueryNames: resetQueryNamesOnChange } : undefined
      )
      onFilterChange?.(value)
    },
    [forwardAddQuery, name, onFilterChange, resetQueryNamesOnChange]
  )

  const handleRemoveFilter = useCallback(() => {
    if (resetQueryNamesOnClear && resetQueryNamesOnChange) {
      forwardDeleteQuery(name, { resetQueryNames: resetQueryNamesOnChange })
    } else {
      forwardDeleteQuery(name)
    }
    onFilterChange?.(null)
  }, [forwardDeleteQuery, name, onFilterChange, resetQueryNamesOnChange, resetQueryNamesOnClear])

  return (
    <div>
      {label && (
        <Label className="mb-2 text-neutral-800" htmlFor={`${name}-select`}>
          {label}
        </Label>
      )}

      <div className="relative">
        <Select value={selectedValue} onValueChange={handleSelectFilter} {...props}>
          <SelectTrigger className={triggerClassName} id={`${name}-select`} dir={isRtl ? 'rtl' : 'ltr'}>
            <SelectValue placeholder={placeholder ?? t('label.select_option')} />
          </SelectTrigger>

          <SelectContent
            dir={isRtl ? 'rtl' : 'ltr'}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onLoadMore={onLoadMore}
            emptyMessage={emptyMessage}
            loadingMessage={loadingMessage}
            loadMoreMessage={loadMoreMessage}
          >
            {data.map((item, index) => (
              <SelectItem key={`${item[valueKey]}-${index}`} value={String(item[valueKey])}>
                {String(item[labelKey])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!!selectedValue && (
          <Button
            variant="ghost"
            type="button"
            onClick={handleRemoveFilter}
            className="absolute inset-e-6 top-1/2 z-10 -translate-y-1/2 p-1 text-muted-foreground hover:bg-transparent"
            aria-label={clearLabel ?? t('label.clear_selection')}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
export default FilterSelect
