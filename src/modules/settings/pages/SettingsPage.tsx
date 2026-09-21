import { useTranslation } from 'react-i18next'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { SettingsForm } from '@/modules/settings/components/SettingsForm'
import { SettingsFormSkeleton } from '@/modules/settings/components/SettingsFormSkeleton'
import { useSettings } from '@/modules/settings/hooks/useSettings'
import { useUpdateSettings } from '@/modules/settings/hooks/useUpdateSettings'

function SettingsPage() {
  const { t } = useTranslation()
  const query = useSettings()
  const update = useUpdateSettings()

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('settings.title')} description={t('settings.description')} />
      <QueryStateBoundary
        loadingFallback={<SettingsFormSkeleton />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? (
          <SettingsForm settings={query.data} isSubmitting={update.isPending} onSubmit={update.mutateAsync} />
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}

export default SettingsPage
