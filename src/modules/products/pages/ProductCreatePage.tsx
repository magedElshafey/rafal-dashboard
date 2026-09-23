import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { ProductCreateForm } from '@/modules/products/components/ProductCreateForm'
import { useCreateProduct } from '@/modules/products/hooks/useCreateProduct'
import { Routes } from '@/routes/routes'

function ProductCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateProduct()

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('products.create.title')} description={t('products.create.description')} />
      <ProductCreateForm
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const created = await create.mutateAsync(payload)
          navigate(Routes.productEditPath(created.id))
        }}
      />
    </main>
  )
}

export default ProductCreatePage
