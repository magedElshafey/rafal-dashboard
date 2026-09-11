import { ChevronDown, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LogoutBtn from '@/modules/auth/components/LogoutBtn'
import { useAuth } from '@/store/auth'

export function DashboardUserMenu() {
  const { t, i18n } = useTranslation()
  const user = useAuth((state) => state.user)
  const displayName = user?.name || t('dashboard.topbar.guest')
  const identity = user?.email || user?.phone

  return (
    <DropdownMenu dir={i18n.dir()}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-11 min-w-0 gap-2 px-2 sm:px-3"
          aria-label={t('dashboard.topbar.userMenu')}
        >
          <Avatar className="size-8 border border-border">
            {user?.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback className="bg-accent text-accent-foreground">
              <UserRound className="size-4" aria-hidden />
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-36 truncate text-sm sm:inline">{displayName}</span>
          <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-surface-elevated" align="end">
        <DropdownMenuLabel className="normal-case">
          <span className="block truncate text-sm font-semibold text-foreground">{displayName}</span>
          {identity ? (
            <span className="block truncate text-xs font-normal text-muted-foreground">{identity}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <LogoutBtn variant="dropdown" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
