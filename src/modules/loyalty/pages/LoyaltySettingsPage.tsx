import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import QueryTabsFilter from '@/components/shared/tabs/QueryTabsFilter'
import { LoyaltySettingsForm } from '@/modules/loyalty/components/LoyaltySettingsForm'
import { LoyaltySettingsHistory } from '@/modules/loyalty/components/LoyaltySettingsHistory'
import { LoyaltySettingsSkeleton } from '@/modules/loyalty/components/LoyaltySettingsSkeleton'
import { useLoyaltySettings } from '@/modules/loyalty/hooks/useLoyaltySettings'
import { useUpdateLoyaltySettings } from '@/modules/loyalty/hooks/useUpdateLoyaltySettings'
import { readLoyaltyPage } from '@/modules/loyalty/utils/loyalty-pagination'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'

type LoyaltyTab = 'settings' | 'history'

function LoyaltySettingsContent() {
  const { t } = useTranslation()
  const { forwardAddQuery, forwardQuery } = useQuery()
  const activeTab: LoyaltyTab = forwardQuery?.tab === 'history' ? 'history' : 'settings'
  const rawPage = forwardQuery?.page
  const page = readLoyaltyPage(rawPage)
  useEffect(() => {
    if (activeTab === 'history' && rawPage !== undefined && rawPage !== String(page)) {
      forwardAddQuery({ page: String(page) }, { replace: true })
    }
  }, [activeTab, forwardAddQuery, page, rawPage])
  const query = useLoyaltySettings()
  const update = useUpdateLoyaltySettings()
  const tabs = [
    { value: 'settings' as const, label: t('loyalty.tabs.settings') },
    { value: 'history' as const, label: t('loyalty.tabs.history') },
  ]

  return (
    <main className="min-w-0 space-y-5">
      <DashboardPageHeader title={t('loyalty.title')} description={t('loyalty.description')} />
      <QueryTabsFilter
        name="tab"
        tabs={tabs}
        value={activeTab}
        defaultValue="settings"
        variant="underline"
        ariaLabel={t('loyalty.tabs.label')}
        id="loyalty-settings-tabs"
        panelId="loyalty-active-panel"
        queryUpdateOptions={{ resetQueryNames: ['page'] }}
      />
      <section id="loyalty-active-panel" role="tabpanel" aria-labelledby={`loyalty-settings-tabs-tab-${activeTab}`}>
        <div hidden={activeTab !== 'settings'}>
          <QueryStateBoundary
            loadingFallback={<LoyaltySettingsSkeleton />}
            isLoading={query.isLoading}
            isLoadingError={query.isError && !query.data}
            isRefetchError={query.isRefetchError}
            isPaused={query.isPaused}
            isFetching={query.isFetching}
            hasData={Boolean(query.data)}
            onRetry={query.refetch}
          >
            {query.data ? (
              <LoyaltySettingsForm
                settings={query.data}
                isSubmitting={update.isPending}
                onSubmit={update.mutateAsync}
                onReloadConflict={query.refetch}
              />
            ) : null}
          </QueryStateBoundary>
        </div>
        {activeTab === 'history' ? <LoyaltySettingsHistory page={page} /> : null}
      </section>
    </main>
  )
}

export default function LoyaltySettingsPage() {
  return (
    <QueryProvider>
      <LoyaltySettingsContent />
    </QueryProvider>
  )
}
