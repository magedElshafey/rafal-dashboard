import { memo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { GLOBAL_SEARCH_MIN_QUERY_LENGTH } from '../constants/global-search.constants'
import { useGlobalSearch } from '../hooks/useGlobalSearch'
import type { GlobalSearchResult } from '../types/global-search.types'
import { GlobalSearchResultItem } from './GlobalSearchResultItem'
import { cn } from '@/lib/utils'

type GlobalSearchProps = {
  className?: string
}

export const GlobalSearch = memo(function GlobalSearch({ className }: GlobalSearchProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { results, isIdle, isLoading, isError, isSuccess, canSearch } = useGlobalSearch(query)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setQuery('')
    }
  }

  function handleSelect(result: GlobalSearchResult) {
    setOpen(false)
    setQuery('')
    navigate(result.url)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-12.5 min-w-0 w-full max-w-189 flex-1 shrink justify-start gap-2.5 rounded-lg',
            'border border-neutral-200 hover:bg-neutral-50 bg-neutral-50 px-4 shadow-none',
            'text-neutral-400 text-sm font-normal',

            'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            className
          )}
          aria-label={t('teachers_layout.search.open_global_search')}
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />

          <span className="truncate text-sm font-normal leading-none">{t('teachers_layout.search.trigger_label')}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          'w-(--radix-popover-trigger-width) overflow-hidden rounded-xl',
          'border border-[#E5E5E5] bg-white p-0 shadow-lg'
        )}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t('teachers_layout.search.placeholder')}
            className="h-12 text-sm"
          />

          <CommandList className="max-h-96">
            {isIdle ? (
              <div className="px-4 py-6 text-center text-sm text-content-tertiary">
                {t('teachers_layout.search.minimum_query', { count: GLOBAL_SEARCH_MIN_QUERY_LENGTH })}
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-content-secondary">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t('teachers_layout.search.searching')}
              </div>
            ) : null}

            {isError ? (
              <div className="px-4 py-6 text-center text-sm text-error-600">{t('teachers_layout.search.error')}</div>
            ) : null}

            {isSuccess && canSearch && results.length === 0 ? (
              <CommandEmpty>{t('teachers_layout.search.no_results')}</CommandEmpty>
            ) : null}

            {results.length > 0 ? (
              <CommandGroup heading={t('teachers_layout.search.results')}>
                {results.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer px-3 py-2"
                  >
                    <GlobalSearchResultItem result={result} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
