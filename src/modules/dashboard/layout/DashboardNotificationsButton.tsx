import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

type DashboardNotificationsButtonProps = {
  unreadCount?: number
}

export function DashboardNotificationsButton({ unreadCount = 0 }: DashboardNotificationsButtonProps) {
  const { t } = useTranslation()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={
        unreadCount > 0
          ? t('dashboard.topbar.notificationsUnread', { count: unreadCount })
          : t('dashboard.topbar.notifications')
      }
    >
      <Bell className="size-5" aria-hidden />
      {unreadCount > 0 ? (
        <span className="absolute end-2 top-2 size-2 rounded-full bg-primary ring-2 ring-surface" aria-hidden />
      ) : null}
    </Button>
  )
}
