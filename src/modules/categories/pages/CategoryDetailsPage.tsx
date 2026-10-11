import { isAxiosError } from 'axios'
import { FolderTree } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { CategoryDetailsHeader } from '@/modules/categories/components/CategoryDetailsHeader'
import { CategoryDetailsLayout } from '@/modules/categories/components/CategoryDetailsLayout'
import { useCategory } from '@/modules/categories/hooks/useCategory'

function CategoryNotFound() {
  const { t } = useTranslation()
  return (
    <main className="min-w-0">
      <CategoryDetailsHeader />
      <EmptyState
        icon={<FolderTree />}
        title={t('categories.details.notFound.title')}
        description={t('categories.details.notFound.description')}
      />
    </main>
  )
}

function CategoryDetails({ id }: { id: number }) {
  const query = useCategory(id, true)
  if (!query.data && isAxiosError(query.error) && query.error.response?.status === 404) return <CategoryNotFound />

  return (
    <main className="min-w-0">
      {!query.data && (query.isError || query.isPaused) ? <CategoryDetailsHeader /> : null}
      <QueryStateBoundary
        loadingFallback={<CategoryDetailsLayout />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? <CategoryDetailsLayout category={query.data.data} /> : null}
      </QueryStateBoundary>
    </main>
  )
}

export default function CategoryDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const categoryId = Number(id)
  if (!/^\d+$/.test(id ?? '') || !Number.isSafeInteger(categoryId) || categoryId <= 0) return <CategoryNotFound />
  return <CategoryDetails id={categoryId} />
}
