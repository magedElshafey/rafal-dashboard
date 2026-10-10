import { useMemo, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import FiltersWrapper from '@/components/filters/FiltersWrapper'

import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Skeleton } from '@/components/ui/skeleton'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import {
  ReviewModerationDialog,
  type ReviewModerationTargetState,
} from '@/modules/reviews/components/ReviewModerationDialog'
import { ReviewsList } from '@/modules/reviews/components/ReviewsList'
import { ReviewsListSkeleton } from '@/modules/reviews/components/ReviewsListSkeleton'
import { ReviewFilters } from '@/modules/reviews/components/ReviewFilters'
import { useReviews } from '@/modules/reviews/hooks/useReviews'
import type { ReviewListItem, ReviewModerationTarget } from '@/modules/reviews/types/review.types'
import { getReviewerDisplayName } from '@/modules/reviews/utils/review.utils'
import { readReviewsFilters, reviewFilterNames, validReviewsFilters } from '@/modules/reviews/utils/review-filters'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'

function ReviewsContent() {
  const { t } = useTranslation()
  const { forwardQuery } = useQuery()
  const filters = readReviewsFilters(forwardQuery)
  const query = useReviews(filters)
  const [showFilterValidation, setShowFilterValidation] = useState(false)
  const [moderationTarget, setModerationTarget] = useState<ReviewModerationTargetState | null>(null)
  const reviews = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? reviews.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })
  const header = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('reviews.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('reviews.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout header={header} isEmpty={false} empty={null} isLoading loading={<ReviewsListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )
  const openModeration = (review: ReviewListItem, status: ReviewModerationTarget) => {
    if (review.status !== 'pending') return
    setModerationTarget({
      id: review.id,
      reviewerName: getReviewerDisplayName(review.reviewer, t('reviews.reviewerFallback', { id: review.reviewer.id })),
      productName: review.product.name,
      status,
    })
  }

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('reviews.title')} description={t('reviews.description')} />
      <div className="mb-4">
        <FiltersWrapper
          searchName="search"
          filterNames={reviewFilterNames}
          resetQueryNamesOnChange={['page']}
          dialogTitle={t('reviews.filters.title')}
          onFilter={() => setShowFilterValidation(false)}
          onReset={() => setShowFilterValidation(false)}
          onApply={(draftQuery) => {
            const valid = validReviewsFilters(readReviewsFilters(draftQuery))
            setShowFilterValidation(!valid)
            return valid ? undefined : false
          }}
        >
          <ReviewFilters showValidation={showFilterValidation} />
        </FiltersWrapper>
      </div>
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={reviews.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={reviews} isLoading={query.isLoading} refetch={query.refetch} name="reviews">
          <ResponsiveDataLayout
            header={header}
            isEmpty={reviews.length === 0}
            empty={
              <EmptyState
                icon={<MessageSquareText />}
                title={t('reviews.empty.title')}
                description={t('reviews.empty.description')}
              />
            }
          >
            <ReviewsList reviews={reviews} onModerate={openModeration} />
            {query.isFetchNextPageError ? (
              <div className="p-4">
                <QueryStateNotice
                  kind="refetch-error"
                  isRetrying={query.isFetchingNextPage}
                  onRetry={() => void query.fetchNextPage()}
                />
              </div>
            ) : null}
            <div ref={loadMoreRef} className="flex min-h-1 justify-center p-4" aria-live="polite">
              {query.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('reviews.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
      <ReviewModerationDialog target={moderationTarget} onClose={() => setModerationTarget(null)} />
    </main>
  )
}

export default function ReviewsPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <ReviewsContent />
    </QueryProvider>
  )
}
