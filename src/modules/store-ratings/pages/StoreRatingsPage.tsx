import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
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
import { ReviewsListSkeleton } from '@/modules/reviews/components/ReviewsListSkeleton'
import type { ReviewModerationTarget } from '@/modules/reviews/types/review.types'
import { getReviewerDisplayName } from '@/modules/reviews/utils/review.utils'
import { validReviewsDateRange, validReviewsRatingRange } from '@/modules/reviews/utils/review-filters'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { StoreRatingFilters } from '../components/StoreRatingFilters'
import {
  StoreRatingModerationDialog,
  type StoreRatingModerationTarget,
} from '../components/StoreRatingModerationDialog'
import { StoreRatingsList } from '../components/StoreRatingsList'
import { useStoreRatings } from '../hooks/useStoreRatings'
import type { StoreRating } from '../types/store-rating.types'
import {
  readStoreRatingsFilters,
  storeRatingFilterNames,
  validStoreRatingsFilters,
} from '../utils/store-rating-filters'

function StoreRatingsContent() {
  const { t } = useTranslation()
  const { forwardQuery } = useQuery()
  const filters = readStoreRatingsFilters(forwardQuery)
  const valid = validStoreRatingsFilters(filters)
  const query = useStoreRatings(filters)
  const [showValidation, setShowValidation] = useState(false)
  const [target, setTarget] = useState<StoreRatingModerationTarget | null>(null)
  const ratings = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? ratings.length
  const loadMoreRef = useInfiniteScroll({
    enabled: valid && Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })
  const header = (
    <div>
      <h2 className="font-semibold text-foreground">{t('storeRatings.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('storeRatings.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout header={header} isEmpty={false} empty={null} isLoading loading={<ReviewsListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )
  const moderate = (rating: StoreRating, status: ReviewModerationTarget) => {
    if (rating.status !== 'pending') return
    setTarget({
      id: rating.id,
      name: getReviewerDisplayName(rating.user, t('reviews.reviewerFallback', { id: rating.user.id })),
      order: rating.order.orderNumber,
      status,
    })
  }
  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('storeRatings.title')} description={t('storeRatings.description')} />
      <div className="mb-4">
        <FiltersWrapper
          showSearch={false}
          filterNames={storeRatingFilterNames}
          resetQueryNamesOnChange={['page']}
          dialogTitle={t('storeRatings.filters.title')}
          onFilter={() => setShowValidation(!valid)}
          onReset={() => setShowValidation(false)}
          onApply={(draft) => {
            const validDraft = validStoreRatingsFilters(readStoreRatingsFilters(draft))
            setShowValidation(!validDraft)
            return validDraft ? undefined : false
          }}
        >
          <StoreRatingFilters showValidation={showValidation} />
        </FiltersWrapper>
      </div>
      {!valid ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-5">
          {!validReviewsRatingRange(filters) ? <p role="alert">{t('reviews.filters.invalidRatingRange')}</p> : null}
          {!validReviewsDateRange(filters) ? <p role="alert">{t('storeRatings.filters.invalidDateRange')}</p> : null}
        </div>
      ) : (
        <QueryStateBoundary
          loadingFallback={loading}
          isLoading={query.isLoading}
          isLoadingError={query.isError && !query.data}
          isRefetchError={query.isRefetchError}
          isPaused={query.isPaused}
          isFetching={query.isFetching}
          hasData={Boolean(query.data)}
          onRetry={query.refetch}
        >
          <TableProvider data={ratings} isLoading={query.isLoading} refetch={query.refetch} name="store-ratings">
            <ResponsiveDataLayout
              header={header}
              isEmpty={ratings.length === 0}
              empty={
                <EmptyState
                  icon={<Star />}
                  title={t('storeRatings.empty.title')}
                  description={t('storeRatings.empty.description')}
                />
              }
            >
              <StoreRatingsList ratings={ratings} onModerate={moderate} />
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
                    <span className="sr-only">{t('storeRatings.loadingMore')}</span>
                    <Skeleton aria-hidden="true" className="h-8 w-40" />
                  </>
                ) : null}
              </div>
            </ResponsiveDataLayout>
          </TableProvider>
        </QueryStateBoundary>
      )}
      <StoreRatingModerationDialog target={target} onClose={() => setTarget(null)} />
    </main>
  )
}

export default function StoreRatingsPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <StoreRatingsContent />
    </QueryProvider>
  )
}
