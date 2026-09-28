import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { StaticPageForm } from '@/modules/static-pages/components/StaticPageForm'
import { useCreateStaticPage } from '@/modules/static-pages/hooks/useCreateStaticPage'
import { Routes } from '@/routes/routes'

function StaticPageCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateStaticPage()

  return (
    <main className="min-w-0">
      <DashboardPageHeader
        title={t('staticPages.create.title')}
        description={t('staticPages.create.description')}
      />
      <StaticPageForm
        mode="create"
        isSubmitting={create.isPending}
        onSubmit={async (payload) => {
          const created = await create.mutateAsync(payload)
          navigate(Routes.staticPages)
          return created
        }}
      />
    </main>
  )
}

export default StaticPageCreatePage
