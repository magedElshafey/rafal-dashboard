import { useMemo, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Skeleton } from '@/components/ui/skeleton'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { ContactMessageDeleteDialog } from '../components/ContactMessageDeleteDialog'
import { ContactMessagesList, ContactMessagesListSkeleton } from '../components/ContactMessagesList'
import { useContactMessages } from '../hooks/useContactMessages'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import type { ContactMessage } from '../types/contact-message.types'

export default function ContactMessagesPage() {
  const { t } = useTranslation()
  const query = useContactMessages()
  const [target, setTarget] = useState<ContactMessage | null>(null)
  const mutating = useIsMutating({ mutationKey: contactMessagesKeys.all }) > 0
  const messages = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const meta = query.data?.pages.at(-1)?.extra
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetching && !query.isFetchNextPageError),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })
  return (
    <main className="min-w-0 space-y-4">
      <DashboardPageHeader
        title={t('contactMessages.title')}
        description={meta ? t('contactMessages.newCount', { count: meta.newCount }) : undefined}
      />
      <QueryStateBoundary
        isLoading={query.isLoading}
        loadingFallback={<ContactMessagesListSkeleton />}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError && !query.isFetchNextPageError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        <TableProvider name="contact-messages" data={messages} isLoading={query.isLoading} refetch={query.refetch}>
          <ResponsiveDataLayout
            header={<h2 className="font-semibold">{t('contactMessages.total', { count: meta?.total ?? 0 })}</h2>}
            isEmpty={messages.length === 0}
            empty={
              <EmptyState title={t('contactMessages.empty')} description={t('contactMessages.emptyDescription')} />
            }
          >
            <ContactMessagesList messages={messages} onDelete={setTarget} disabled={mutating} />
            {query.isFetchNextPageError ? (
              <div className="p-4">
                <QueryStateNotice
                  kind="refetch-error"
                  isRetrying={query.isFetchingNextPage}
                  onRetry={() => void query.fetchNextPage()}
                />
              </div>
            ) : null}
            <div ref={loadMoreRef} className="min-h-1 p-4" aria-live="polite">
              {query.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('contactMessages.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
      {target ? (
        <ContactMessageDeleteDialog
          key={target.id}
          target={target}
          onClose={() => setTarget(null)}
          onDeleted={() => setTarget(null)}
        />
      ) : null}
    </main>
  )
}
