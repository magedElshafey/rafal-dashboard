import { memo } from 'react'
import { Bell, Menu, Settings, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
// import { GlobalSearch } from '@/modules/teachers/search'
import { PortalLink } from '@/components/core/portal-link/components/PortalLink'
import { AccountDropdown } from '@/modules/users/layout/navbar/user-dropdown/AccountDropdown'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/getInitials'
import type { UsersNavItem } from '@/modules/users/types/navbar/nav.types'

const TEACHER_ACCOUNT_ITEMS: UsersNavItem[] = [{ labelKey: 'settings.title', path: '/settings', icon: Settings }]
const ASSISTANT_ACCOUNT_ITEMS: UsersNavItem[] = [
  { labelKey: 'profile.title', path: '/profile', icon: UserRound },
  ...TEACHER_ACCOUNT_ITEMS,
]

type DashboardNavbarProps = {
  unreadCount?: number
  showNotifications?: boolean
  onOpenMobileSidebar: () => void
}

const DashboardNavbar = memo(function DashboardNavbar({
  unreadCount = 0,
  showNotifications = false,
  onOpenMobileSidebar,
}: DashboardNavbarProps) {
  const { t } = useTranslation()
  const role = useAuth((state) => state.role)
  const storedUserName = useAuth((state) => state.user?.name)
  const userName = storedUserName || t('users_layout.user')
  const accountItems = role === 'assistant' ? ASSISTANT_ACCOUNT_ITEMS : TEACHER_ACCOUNT_ITEMS

  return (
    <header className="sticky top-0 z-30 h-18 border-b border-border-subtle bg-white/95 backdrop-blur lg:col-start-2 lg:row-start-1">
      <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenMobileSidebar}
          aria-label={t('teachers_layout.open_sidebar')}
          className="shrink-0 lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>

        {/* <GlobalSearch className="hidden md:flex" /> */}

        <div className="ms-auto flex items-center gap-4">
          {showNotifications && <NotificationsLink unreadCount={unreadCount} />}
          <AccountDropdown
            userName={userName}
            userRoleLabel={role || ''}
            initials={getInitials(userName)}
            items={accountItems}
          />
        </div>
      </div>
    </header>
  )
})

export default DashboardNavbar

function NotificationsLink({ unreadCount }: { unreadCount: number }) {
  const { t } = useTranslation()
  const hasUnread = unreadCount > 0

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        'relative flex size-9 rounded-full text-content-primary hover:bg-black-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2'
      )}
    >
      <PortalLink
        to="/notifications"
        aria-label={
          hasUnread
            ? t('shared.notification.aria.triggerWithUnread', { count: unreadCount })
            : t('shared.notification.aria.trigger')
        }
      >
        <Bell className="size-5" aria-hidden />
        {hasUnread && (
          <span
            className="absolute end-2 top-2 flex size-2.5 items-center justify-center rounded-full bg-error-600 text-[8px] font-medium text-white"
            aria-hidden
          ></span>
        )}
      </PortalLink>
    </Button>
  )
}
