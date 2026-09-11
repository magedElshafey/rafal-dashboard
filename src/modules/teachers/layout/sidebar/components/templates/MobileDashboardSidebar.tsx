import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { TSidebarItem } from '@/modules/teachers/layout/constants/sidebar-items'
import DashboardContent from '@/modules/teachers/layout/sidebar/components/organism/DashboardContent'

type MobileDashboardSidebarProps = {
  open: boolean
  sidebarItems: TSidebarItem[]
  onOpenChange: (open: boolean) => void
  onNavigate: () => void
}

const MobileDashboardSidebar = memo(function MobileDashboardSidebar({
  open,
  sidebarItems,
  onOpenChange,
  onNavigate,
}: MobileDashboardSidebarProps) {
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 border-e border-border-subtle p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('teachers_layout.dashboard_sidebar')}</SheetTitle>
          <SheetDescription>{t('teachers_layout.teacher_dashboard_navigation_menu')}</SheetDescription>
        </SheetHeader>

        <DashboardContent sidebarItems={sidebarItems} onNavigate={onNavigate} />
      </SheetContent>
    </Sheet>
  )
})

export default MobileDashboardSidebar
