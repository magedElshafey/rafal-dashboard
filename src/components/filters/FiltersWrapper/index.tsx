import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Funnel, X } from 'lucide-react'

import SearchFilter from '@/components/filters/SearchFilter'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import type { FilterDialogProps, FiltersWrapperProps } from '@/components/filters/FiltersWrapper/types'
import { useQuery } from '@/store/queryContext/useQueryContext'
import QueryProvider from '@/store/queryContext/queryContext'

const EMPTY_FILTER_NAMES: string[] = []
const pickQueryByNames = (
  query: Record<string, string> | null | undefined,
  names: string[]
): Record<string, string> | null => {
  const pickedQuery: Record<string, string> = {}

  names.forEach((name) => {
    const value = query?.[name]

    if (value) {
      pickedQuery[name] = value
    }
  })

  return Object.keys(pickedQuery).length ? pickedQuery : null
}

const FiltersWrapperDialog = ({
  open,
  onOpenChange,
  title,
  children,
  resetLabel,
  applyLabel,
  closeLabel,
  onCancel,
  onReset,
  onApply,
  className = 'sm:max-w-120 sm:rounded-s-3xl',
  bodyClassName = 'space-y-5 bg-surface-page px-6 py-6',
}: FilterDialogProps) => {
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          'flex h-dvh max-h-dvh w-full max-w-none flex-col items-stretch gap-0 overflow-hidden rounded-none! border-0 bg-surface p-0 shadow-xl sm:max-w-107',
          className
        )}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between bg-black-50  px-5 py-5">
            <h2 className="text-lg text-neutral-800 font-semibold flex items-center gap-2">
              {typeof title === 'string' ? (
                <>
                  <Funnel aria-hidden="true" className="size-4" />
                  {title}
                </>
              ) : (
                title
              )}
            </h2>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 text-content-muted hover:bg-black-100"
              aria-label={closeLabel ?? t('common.close')}
              onClick={() => onOpenChange(false)}
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </header>

          <div className={cn('min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5', bodyClassName)}>{children}</div>

          <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-border bg-surface px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-border text-foreground"
              onClick={onCancel ?? onReset}
            >
              {resetLabel ?? t('button.reset')}
            </Button>

            <Button type="button" className="h-11 rounded-lg bg-brand-500" onClick={onApply}>
              {applyLabel ?? t('button.apply')}
            </Button>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const FiltersWrapper = ({
  showTrigger = true,
  showSearch = true,
  showFilterTrigger = true,
  searchName = 'search',
  searchPlaceholder,
  searchLabel,
  filterLabel,
  filterNames = EMPTY_FILTER_NAMES,
  children,
  dialogTitle,
  open,
  onOpenChange,
  onFilter,
  onCancel,
  onReset,
  onApply,
  resetQueryNamesOnChange,
  resetLabel,
  applyLabel,
  closeLabel,
  className,
  searchClassName,
  buttonClassName,
  dialogClassName,
  dialogBodyClassName,
}: FiltersWrapperProps) => {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const [draftQuery, setDraftQuery] = useState<Record<string, string> | null>(null)

  const { forwardQuery, forwardReplaceQueries } = useQuery()
  const resolvedFilterLabel = filterLabel ?? t('button.filter')

  const isDialogControlled = typeof open === 'boolean'
  const isOpen = open ?? internalOpen
  const wasOpenRef = useRef(false)
  const filterNamesKey = filterNames.join('\u0000')
  const managedFilterNames = useMemo(
    () => (filterNamesKey ? filterNamesKey.split('\u0000') : EMPTY_FILTER_NAMES),
    [filterNamesKey]
  )
  const hasResetQueryNamesConfig = resetQueryNamesOnChange !== undefined
  const resetQueryNamesKey = resetQueryNamesOnChange?.join('\u0000') ?? ''
  const appliedResetQueryNames = useMemo(
    () => (hasResetQueryNamesConfig ? (resetQueryNamesKey ? resetQueryNamesKey.split('\u0000') : []) : undefined),
    [hasResetQueryNamesConfig, resetQueryNamesKey]
  )
  const queryUpdateOptions = useMemo(
    () => (appliedResetQueryNames ? { resetQueryNames: appliedResetQueryNames } : undefined),
    [appliedResetQueryNames]
  )

  const syncDraftFromRouteQuery = useCallback(() => {
    setDraftQuery(pickQueryByNames(forwardQuery, managedFilterNames))
  }, [forwardQuery, managedFilterNames])

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      syncDraftFromRouteQuery()
    }

    wasOpenRef.current = isOpen
  }, [isOpen, syncDraftFromRouteQuery])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        syncDraftFromRouteQuery()
      }

      if (!isDialogControlled) {
        setInternalOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [isDialogControlled, onOpenChange, syncDraftFromRouteQuery]
  )

  const handleFilterClick = useCallback(() => {
    onFilter?.()
    handleOpenChange(true)
  }, [handleOpenChange, onFilter])

  const handleResetDraft = useCallback(() => {
    setDraftQuery(null)
    onReset?.()
    forwardReplaceQueries(managedFilterNames, null, queryUpdateOptions)
  }, [forwardReplaceQueries, managedFilterNames, onReset, queryUpdateOptions])

  const handleCancel = useCallback(() => {
    onCancel?.()
    handleOpenChange(false)
  }, [handleOpenChange, onCancel])

  const handleApply = useCallback(() => {
    const nextDraftQuery = onApply?.(draftQuery) ?? draftQuery

    forwardReplaceQueries(managedFilterNames, nextDraftQuery, queryUpdateOptions)
    handleOpenChange(false)
  }, [draftQuery, forwardReplaceQueries, handleOpenChange, managedFilterNames, onApply, queryUpdateOptions])

  const shouldRenderSearch = showTrigger && showSearch
  const shouldRenderFilterTrigger = showTrigger && showFilterTrigger
  const shouldRenderTriggerRow = shouldRenderSearch || shouldRenderFilterTrigger

  return (
    <>
      {shouldRenderTriggerRow && (
        <div className={cn('flex flex-col gap-4 md:flex-row', className)}>
          {shouldRenderSearch && (
            <SearchFilter
              className={cn('flex-1 min-h-12', searchClassName)}
              name={searchName}
              label={searchLabel}
              placeholder={searchPlaceholder}
              resetQueryNamesOnChange={appliedResetQueryNames}
            />
          )}

          {shouldRenderFilterTrigger && (
            <button
              type="button"
              onClick={handleFilterClick}
              className={cn(
                'flex   items-center justify-center gap-1  rounded-lg  bg-black-50  text-sm text-neutral-800 font-semibold cursor-pointer min-h-12 w-full  px-5 md:w-auto',
                buttonClassName
              )}
            >
              {resolvedFilterLabel}
            </button>
          )}
        </div>
      )}

      {children && dialogTitle && (
        <FiltersWrapperDialog
          open={isOpen}
          onOpenChange={handleOpenChange}
          title={dialogTitle}
          resetLabel={resetLabel}
          applyLabel={applyLabel}
          closeLabel={closeLabel}
          onCancel={onCancel ? handleCancel : undefined}
          onReset={handleResetDraft}
          onApply={handleApply}
          className={dialogClassName}
          bodyClassName={dialogBodyClassName}
        >
          <QueryProvider isRouteQuery={false} initialQuery={draftQuery} onQueryChange={setDraftQuery}>
            {children}
          </QueryProvider>
        </FiltersWrapperDialog>
      )}
    </>
  )
}

export default FiltersWrapper
