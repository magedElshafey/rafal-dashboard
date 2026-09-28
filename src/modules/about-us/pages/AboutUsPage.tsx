import { useTranslation } from 'react-i18next'

import { QueryStateBoundary } from '@/components/shared/query-state'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { AboutUsForm } from '@/modules/about-us/components/AboutUsForm'
import { AboutUsFormSkeleton } from '@/modules/about-us/components/AboutUsFormSkeleton'
import { useAboutUs } from '@/modules/about-us/hooks/useAboutUs'
import { useUpdateAboutUs } from '@/modules/about-us/hooks/useUpdateAboutUs'

function AboutUsPage() {
  const { t } = useTranslation()
  const query = useAboutUs()
  const update = useUpdateAboutUs()

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('aboutUs.title')} description={t('aboutUs.description')} />
      <QueryStateBoundary
        loadingFallback={<AboutUsFormSkeleton />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? (
          <AboutUsForm aboutUs={query.data} isSubmitting={update.isPending} onSubmit={update.mutateAsync} />
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}

export default AboutUsPage
