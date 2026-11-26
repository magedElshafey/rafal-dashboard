import { isAffiliateFeatureEnabled } from '../config/affiliate-feature'
import { useTranslation } from 'react-i18next'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { AffiliateSettingsForm } from '@/modules/affiliates/components/AffiliateSettingsForm'
import { AffiliateSettingsSkeleton } from '@/modules/affiliates/components/AffiliateSettingsSkeleton'
import { useAffiliateSettings } from '@/modules/affiliates/hooks/useAffiliateSettings'
import { useUpdateAffiliateSettings } from '@/modules/affiliates/hooks/useUpdateAffiliateSettings'

export default function AffiliateSettingsPage() {
  const { t } = useTranslation()
  const query = useAffiliateSettings()
  const update = useUpdateAffiliateSettings()
  if (!isAffiliateFeatureEnabled) return null
  return (
    <main className="min-w-0 space-y-5">
      <QueryStateBoundary
        loadingFallback={<AffiliateSettingsSkeleton />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? (
          <AffiliateSettingsForm settings={query.data} isSubmitting={update.isPending} onSubmit={update.mutateAsync} />
        ) : (
          <DashboardPageHeader title={t('affiliates.settings.title')} />
        )}
      </QueryStateBoundary>
    </main>
  )
}
