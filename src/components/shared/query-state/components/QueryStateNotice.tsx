import { useId } from 'react'

import { LoaderCircle, RefreshCcw, TriangleAlert, WifiOff, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { QueryStateNoticeKind } from '@/components/shared/query-state/types/query-state.types'

type QueryStateNoticeProps = {
  kind: QueryStateNoticeKind
  isRetrying: boolean
  onRetry: () => void
}

type QueryStateNoticeConfig = {
  role: 'alert' | 'status'
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
  isInline: boolean
  iconClassName: string
}

const QUERY_STATE_NOTICE_CONFIG = {
  offline: {
    role: 'status',
    icon: WifiOff,
    titleKey: 'queryState.offline.title',
    descriptionKey: 'queryState.offline.description',
    isInline: false,
    iconClassName: 'text-muted-foreground',
  },
  'loading-error': {
    role: 'alert',
    icon: TriangleAlert,
    titleKey: 'queryState.loadingError.title',
    descriptionKey: 'queryState.loadingError.description',
    isInline: false,
    iconClassName: 'text-destructive',
  },
  'refetch-error': {
    role: 'status',
    icon: TriangleAlert,
    titleKey: 'queryState.refetchError.title',
    descriptionKey: 'queryState.refetchError.description',
    isInline: true,
    iconClassName: 'text-destructive',
  },
} satisfies Record<QueryStateNoticeKind, QueryStateNoticeConfig>

export function QueryStateNotice({ kind, isRetrying, onRetry }: QueryStateNoticeProps) {
  const { t } = useTranslation()

  const titleId = useId()
  const descriptionId = useId()

  const config = QUERY_STATE_NOTICE_CONFIG[kind]
  const Icon = config.icon

  return (
    <section
      data-state={kind}
      data-testid={`query-state-${kind}`}
      className={cn(
        'w-full rounded-xl border',
        config.isInline
          ? [
              'mb-4 flex flex-col gap-4 p-4',
              'sm:flex-row sm:items-center sm:justify-between',
              'border-destructive/30 bg-destructive/5',
            ]
          : ['flex min-h-72 flex-col items-center', 'justify-center gap-6 p-6 text-center', 'bg-card']
      )}
    >
      <div
        role={config.role}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn('flex min-w-0 gap-3', config.isInline ? 'items-start text-start' : 'flex-col items-center')}
      >
        <div
          aria-hidden="true"
          className={cn(
            'flex size-11 shrink-0 items-center',
            'justify-center rounded-full bg-muted',
            config.iconClassName
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 space-y-1">
          <p id={titleId} className="font-semibold text-foreground">
            {t(config.titleKey)}
          </p>

          <p id={descriptionId} className="text-sm leading-6 text-muted-foreground">
            {t(config.descriptionKey)}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant={config.isInline ? 'outline' : 'default'}
        disabled={isRetrying}
        onClick={onRetry}
        className="shrink-0"
      >
        {isRetrying ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <RefreshCcw aria-hidden="true" className="size-4" />
        )}

        <span>{t('queryState.actions.retry')}</span>
      </Button>
    </section>
  )
}
