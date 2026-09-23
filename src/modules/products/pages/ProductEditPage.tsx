import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { ProductEditForm } from '@/modules/products/components/ProductEditForm'
import { ProductVariantsSection } from '@/modules/products/components/ProductVariantsSection'
import { useProduct } from '@/modules/products/hooks/useProduct'
import { useUpdateProduct } from '@/modules/products/hooks/useUpdateProduct'
import { useDeleteProductMedia } from '@/modules/products/hooks/useDeleteProductMedia'

function ProductEditPage() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const parsedId = Number(params.id)
  const id = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
  const query = useProduct(id)
  const update = useUpdateProduct(id ?? 0)
  const deleteMedia = useDeleteProductMedia(id ?? 0)

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('products.edit.title')} description={t('products.edit.description')} />
      {id === null || (query.isError && !query.data) ? (
        <QueryStateNotice kind="loading-error" isRetrying={query.isFetching} onRetry={() => void query.refetch()} />
      ) : query.isLoading || !query.data ? (
        <DashboardCard className="min-h-72 animate-pulse bg-muted/30" padding="lg" />
      ) : (
        <>
          <ProductEditForm
            key={query.data.id}
            product={query.data}
            isSubmitting={update.isPending}
            onSubmit={update.mutateAsync}
            onDeleteImage={deleteMedia.mutateAsync}
            deletingImageId={deleteMedia.isPending ? (deleteMedia.variables ?? null) : null}
          />
          <ProductVariantsSection product={query.data} />
        </>
      )}
    </main>
  )
}

export default ProductEditPage
