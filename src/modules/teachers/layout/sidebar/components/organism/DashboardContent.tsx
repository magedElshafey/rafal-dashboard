import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import AppLogo from '@/components/shared/AppLogo'
import { TSidebarItem } from '@/modules/teachers/layout/constants/sidebar-items'
import SidebarItemsList from '@/modules/teachers/layout/sidebar/components/molecules/SidebarItemsList'

type DashboardContentProps = {
  sidebarItems: TSidebarItem[]
  onNavigate?: () => void
}

const DashboardContent = memo(function DashboardContent({ sidebarItems, onNavigate }: DashboardContentProps) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col bg-white py-5 ps-3">
      <div className="flex items-center justify-center">
        <AppLogo size="md" priority />
      </div>

      <nav
        aria-label={t('teachers_layout.dashboard_navigation')}
        className="mt-5 md:mt-7 lg:mt-8 xl:mt-12 min-h-0 flex-1 overflow-y-auto"
      >
        <SidebarItemsList sidebarItems={sidebarItems} onNavigate={onNavigate} />
      </nav>
    </div>
  )
})

export default DashboardContent
