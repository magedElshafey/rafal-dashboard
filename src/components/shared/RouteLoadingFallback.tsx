import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'

export function RouteLoadingFallback() {
  const { t } = useTranslation()

  return (
    <main className="min-w-0 bg-background">
      <div role="status" aria-live="polite">
        <span className="sr-only">{t('routeLoading.label')}</span>
        <div aria-hidden="true" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <Skeleton className="h-8 w-48 max-w-full" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="space-y-3 border-b border-border p-5">
              <Skeleton className="h-5 w-36 max-w-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-border p-5 last:border-b-0">
                <div className="min-w-0 flex-1 space-y-3">
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-3 w-72 max-w-full" />
                </div>
                <Skeleton className="size-8 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
