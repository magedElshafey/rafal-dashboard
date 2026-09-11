import { memo, useCallback, useState } from 'react'

import useSidebarActions from '@/modules/teachers/layout/containers/sidebar/useSidebarActions'
import DashboardSidebar from '@/modules/teachers/layout/sidebar/components/templates/DashboardSidebar'
import MobileDashboardSidebar from '@/modules/teachers/layout/sidebar/components/templates/MobileDashboardSidebar'
import DashboardNavbarContainer from '@/modules/teachers/layout/navbar/DashboardNavbarContainer'

const DashboardChrome = memo(function DashboardChrome() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const { sidebarItems } = useSidebarActions()

  const openMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(true)
  }, [])

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false)
  }, [])

  return (
    <>
      <DashboardSidebar sidebarItems={sidebarItems} />

      <MobileDashboardSidebar
        open={isMobileSidebarOpen}
        sidebarItems={sidebarItems}
        onOpenChange={setIsMobileSidebarOpen}
        onNavigate={closeMobileSidebar}
      />

      <DashboardNavbarContainer onOpenMobileSidebar={openMobileSidebar} />
    </>
  )
})

export default DashboardChrome
