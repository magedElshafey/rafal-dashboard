import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DashboardLanguageToggle } from '@/modules/dashboard/layout/DashboardLanguageToggle'
import { DashboardNotificationsButton } from '@/modules/dashboard/layout/DashboardNotificationsButton'
import { DashboardFullscreenToggle } from '@/modules/dashboard/layout/DashboardFullscreenToggle'
import { DashboardThemeToggle } from '@/modules/dashboard/layout/DashboardThemeToggle'
import { DashboardUserMenu } from '@/modules/dashboard/layout/DashboardUserMenu'

type DashboardTopbarProps = {
  onOpenNavigation: () => void
}

export function DashboardTopbar({ onOpenNavigation }: DashboardTopbarProps) {
  const { t } = useTranslation()

  return (
    <header className="sticky  top-0 z-30 flex h-16 w-full min-w-0 items-center border-b border-border bg-surface/95 px-3 backdrop-blur sm:px-5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t('dashboard.topbar.openNavigation')}
        onClick={onOpenNavigation}
      >
        <Menu className="size-5" aria-hidden />
      </Button>
      <div className="ms-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <DashboardNotificationsButton />
        <DashboardLanguageToggle />
        <DashboardThemeToggle />
        <DashboardFullscreenToggle />
        <DashboardUserMenu />
      </div>
    </header>
  )
}
