import { memo } from 'react'
import { useMatch } from 'react-router-dom'

import { useTeacherUnreadNotificationCount } from '@/modules/teachers/shared/notifications/hooks/useTeacherNotifications'
import { useAuth } from '@/store/auth'
import DashboardNavbar from '@/modules/teachers/layout/navbar/DashboardNavbar'

type DashboardNavbarContainerProps = {
  onOpenMobileSidebar: () => void
}

const DashboardNavbarContainer = memo(function DashboardNavbarContainer({
  onOpenMobileSidebar,
}: DashboardNavbarContainerProps) {
  const role = useAuth((state) => state.role)
  const canUseNotifications = role === 'admin' || role === 'assistant' || role === 'teacher'
  const isNotificationsRoute = useMatch({ path: '/teacher/notifications', end: true }) !== null
  const { unreadCount } = useTeacherUnreadNotificationCount({
    enabled: canUseNotifications && !isNotificationsRoute,
  })

  return (
    <DashboardNavbar
      showNotifications={canUseNotifications}
      unreadCount={unreadCount}
      onOpenMobileSidebar={onOpenMobileSidebar}
    />
  )
})

export default DashboardNavbarContainer
