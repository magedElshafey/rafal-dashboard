import { memo } from 'react'

import { SidePanelStack } from '@/components/core/layout/SidePanelStack'
import { TSidebarItem } from '@/modules/teachers/layout/constants/sidebar-items'
import DashboardContent from '@/modules/teachers/layout/sidebar/components/organism/DashboardContent'

type DashboardSidebarProps = {
  sidebarItems: TSidebarItem[]
}

const DashboardSidebar = memo(function DashboardSidebar({ sidebarItems }: DashboardSidebarProps) {
  return (
    <SidePanelStack className="hidden border-e border-border-subtle bg-white lg:sticky lg:top-0 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block lg:h-dvh">
      <DashboardContent sidebarItems={sidebarItems} />
    </SidePanelStack>
  )
})

export default DashboardSidebar
