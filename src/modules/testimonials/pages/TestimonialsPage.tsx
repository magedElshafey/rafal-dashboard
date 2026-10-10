import { MessageSquareQuote, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import FiltersWrapper from '@/components/filters/FiltersWrapper'
import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { useEntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { TestimonialDrawer } from '@/modules/testimonials/components/TestimonialDrawer'
import { TestimonialFilters } from '@/modules/testimonials/components/TestimonialFilters'
import { TestimonialsList } from '@/modules/testimonials/components/TestimonialsList'
import { TestimonialsListSkeleton } from '@/modules/testimonials/components/TestimonialsListSkeleton'
import { useDeleteTestimonial } from '@/modules/testimonials/hooks/useDeleteTestimonial'
import { useTestimonials } from '@/modules/testimonials/hooks/useTestimonials'
import type { Testimonial } from '@/modules/testimonials/types/testimonial.types'
import { getLocalizedTestimonialValue } from '@/modules/testimonials/utils/testimonial.utils'
import {
  readTestimonialsFilters,
  testimonialFilterNames,
  validTestimonialsCreatedRange,
} from '@/modules/testimonials/utils/testimonial-filters'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'

function TestimonialsContent() {
  const { t, i18n } = useTranslation()
  const { forwardQuery } = useQuery()
  const filters = readTestimonialsFilters(forwardQuery)
  const drawer = useEntityFormDrawer<number>()
  const query = useTestimonials(filters)
  const deleteTestimonial = useDeleteTestimonial()
  const alertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [testimonialToEdit, setTestimonialToEdit] = useState<Testimonial | null>(null)
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null)
  const [showFilterValidation, setShowFilterValidation] = useState(false)
  const testimonials = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? testimonials.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })

  useEffect(() => {
    if (testimonialToDelete) alertRef.current?.handleOpen(true)
  }, [testimonialToDelete])

  const openCreate = () => {
    setTestimonialToEdit(null)
    drawer.openCreate()
  }
  const openEdit = (testimonial: Testimonial) => {
    setTestimonialToEdit(testimonial)
    drawer.openEdit(testimonial.id)
  }
  const handleDrawerOpenChange = (open: boolean) => {
    drawer.setOpen(open)
    if (!open) setTestimonialToEdit(null)
  }
  const createButton = (
    <Button onClick={openCreate}>
      <Plus aria-hidden="true" />
      {t('testimonials.createTestimonial')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('testimonials.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('testimonials.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout
      header={listHeader}
      isEmpty={false}
      empty={null}
      isLoading
      loading={<TestimonialsListSkeleton />}
    >
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!testimonialToDelete || deleteTestimonial.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteTestimonial.mutateAsync(testimonialToDelete.id)
      alertRef.current?.close()
      setTestimonialToDelete(null)
    } catch {
      // The hook owns safe localized feedback; retain the dialog and row for retry.
    } finally {
      deleteLockRef.current = false
    }
  }

  const deleteName = testimonialToDelete ? getLocalizedTestimonialValue(testimonialToDelete.name, i18n.language) : ''
  const deleteTitle = testimonialToDelete ? getLocalizedTestimonialValue(testimonialToDelete.title, i18n.language) : ''

  return (
    <main className="min-w-0">
      <DashboardPageHeader
        title={t('testimonials.title')}
        description={t('testimonials.description')}
        actions={createButton}
      />
      <div className="mb-4">
        <FiltersWrapper
          showSearch={false}
          filterNames={testimonialFilterNames}
          resetQueryNamesOnChange={['page']}
          dialogTitle={t('testimonials.filters.title')}
          onFilter={() => setShowFilterValidation(false)}
          onReset={() => setShowFilterValidation(false)}
          onApply={(draftQuery) => {
            const valid = validTestimonialsCreatedRange(readTestimonialsFilters(draftQuery))
            setShowFilterValidation(!valid)
            return valid ? undefined : false
          }}
        >
          <TestimonialFilters showValidation={showFilterValidation} />
        </FiltersWrapper>
      </div>
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={testimonials.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={testimonials} isLoading={query.isLoading} refetch={query.refetch} name="testimonials">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={testimonials.length === 0}
            empty={
              <EmptyState
                icon={<MessageSquareQuote />}
                title={t('testimonials.empty.title')}
                description={t('testimonials.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <TestimonialsList
              testimonials={testimonials}
              onEdit={openEdit}
              onDelete={setTestimonialToDelete}
              actionsDisabled={deleteTestimonial.isPending}
            />
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
                  <span className="sr-only">{t('testimonials.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>

      <TestimonialDrawer
        open={drawer.open}
        mode={drawer.mode}
        testimonial={testimonialToEdit}
        onOpenChange={handleDrawerOpenChange}
      />
      <DeleteAlert
        ref={alertRef}
        title={t('testimonials.delete.title')}
        body={t('testimonials.delete.description', {
          name: deleteName,
          title: deleteTitle,
          id: testimonialToDelete?.id ?? '',
        })}
        confirmLabel={t('testimonials.actions.delete')}
        cancelLabel={t('testimonials.actions.cancel')}
        pendingLabel={t('testimonials.actions.deleting')}
        isPending={deleteTestimonial.isPending}
        onDelete={handleDelete}
        onCancel={() => setTestimonialToDelete(null)}
      />
    </main>
  )
}

export default function TestimonialsPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <TestimonialsContent />
    </QueryProvider>
  )
}
