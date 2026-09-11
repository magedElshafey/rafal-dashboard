import { useTranslation } from 'react-i18next'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'

export default function DashboardPage() {
  const { t } = useTranslation()

  return (
    <main className="p-6 sm:p-10">
      <DashboardPageHeader intro={t('dashboard.brand')} title={t('dashboard.title')} />
    </main>
  )
}
