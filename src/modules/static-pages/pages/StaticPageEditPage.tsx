import { FileWarning } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { StaticPageForm } from '@/modules/static-pages/components/StaticPageForm'
import { StaticPageFormSkeleton } from '@/modules/static-pages/components/StaticPageFormSkeleton'
import { useStaticPage } from '@/modules/static-pages/hooks/useStaticPage'
import { useUpdateStaticPage } from '@/modules/static-pages/hooks/useUpdateStaticPage'
import { Routes } from '@/routes/routes'

function StaticPageEditPage() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const parsedId = Number(params.id)
  const id = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
  const query = useStaticPage(id)
  const update = useUpdateStaticPage(id ?? 0)

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('staticPages.edit.title')} description={t('staticPages.edit.description')} />
      {id === null ? (
        <EmptyState
          icon={<FileWarning />}
          title={t('staticPages.invalid.title')}
          description={t('staticPages.invalid.description')}
          primaryAction={
            <Button asChild>
              <Link to={Routes.staticPages}>{t('staticPages.actions.backToPages')}</Link>
            </Button>
          }
        />
      ) : (
        <QueryStateBoundary
          loadingFallback={<StaticPageFormSkeleton />}
          isLoading={query.isLoading}
          isLoadingError={query.isError && !query.data}
          isRefetchError={query.isRefetchError}
          isPaused={query.isPaused}
          isFetching={query.isFetching}
          hasData={Boolean(query.data)}
          onRetry={query.refetch}
        >
          {query.data ? (
            <StaticPageForm
              mode="edit"
              page={query.data}
              isSubmitting={update.isPending}
              onSubmit={update.mutateAsync}
            />
          ) : null}
        </QueryStateBoundary>
      )}
    </main>
  )
}

export default StaticPageEditPage
