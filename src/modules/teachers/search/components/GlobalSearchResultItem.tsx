import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { GLOBAL_SEARCH_TYPE_META } from '../constants/global-search.constants'
import type { GlobalSearchResult } from '../types/global-search.types'
import { cn } from '@/lib/utils'

type GlobalSearchResultItemProps = {
  result: GlobalSearchResult
}

export const GlobalSearchResultItem = memo(function GlobalSearchResultItem({ result }: GlobalSearchResultItemProps) {
  const { t } = useTranslation()
  const meta = GLOBAL_SEARCH_TYPE_META[result.type]
  const Icon = meta.icon

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          'bg-surface-muted text-content-secondary'
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-content-primary">{result.title}</p>

        {result.subtitle ? <p className="truncate text-xs text-content-tertiary">{result.subtitle}</p> : null}
      </div>

      <span className="shrink-0 rounded-lg bg-surface-muted px-2 py-1 text-xs font-medium text-content-secondary">
        {t(meta.labelKey)}
      </span>
    </div>
  )
})
