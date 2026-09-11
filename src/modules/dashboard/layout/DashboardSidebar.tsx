import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useLogout } from '@/modules/auth/hooks/useLogout'
import { dashboardNavigation } from '@/modules/dashboard/layout/dashboard-navigation'
import {
  clampDashboardSidebarWidth,
  DASHBOARD_SIDEBAR_KEYBOARD_STEP,
  DASHBOARD_SIDEBAR_MAX_WIDTH,
  DASHBOARD_SIDEBAR_MIN_WIDTH,
} from '@/modules/dashboard/layout/sidebar.constants'

type DashboardSidebarProps = {
  collapsed: boolean
  width: number
  shellRef: RefObject<HTMLDivElement | null>
  onToggleCollapsed: () => void
  onResizeCommit: (width: number) => void
}

type ResizeSession = {
  pointerId: number
  startPosition: number
  startWidth: number
  latestWidth: number
}

export function DashboardSidebar({
  collapsed,
  width,
  shellRef,
  onToggleCollapsed,
  onResizeCommit,
}: DashboardSidebarProps) {
  const { t, i18n } = useTranslation()
  const logout = useLogout()
  const resizeSessionRef = useRef<ResizeSession | null>(null)
  const previousBodyStylesRef = useRef<{ cursor: string; userSelect: string } | null>(null)
  const directionMultiplier = i18n.dir() === 'rtl' ? -1 : 1

  const updateShellWidth = (nextWidth: number) => {
    shellRef.current?.style.setProperty('--dashboard-sidebar-width', `${nextWidth}px`)
  }

  const restoreBodyStyles = () => {
    const previousStyles = previousBodyStylesRef.current
    if (!previousStyles) return

    document.body.style.cursor = previousStyles.cursor
    document.body.style.userSelect = previousStyles.userSelect
    previousBodyStylesRef.current = null
  }

  useEffect(() => restoreBodyStyles, [])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (collapsed) return

    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    resizeSessionRef.current = {
      pointerId: event.pointerId,
      startPosition: event.clientX,
      startWidth: width,
      latestWidth: width,
    }
    previousBodyStylesRef.current = {
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const resizeSession = resizeSessionRef.current
    if (!resizeSession || resizeSession.pointerId !== event.pointerId) return

    const nextWidth = clampDashboardSidebarWidth(
      resizeSession.startWidth + (event.clientX - resizeSession.startPosition) * directionMultiplier
    )
    resizeSession.latestWidth = nextWidth
    updateShellWidth(nextWidth)
  }

  const finishResize = (event: PointerEvent<HTMLDivElement>) => {
    const resizeSession = resizeSessionRef.current
    if (!resizeSession || resizeSession.pointerId !== event.pointerId) return

    event.currentTarget.releasePointerCapture?.(event.pointerId)
    resizeSessionRef.current = null
    restoreBodyStyles()
    onResizeCommit(resizeSession.latestWidth)
  }

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextWidth = width

    if (event.key === 'Home') nextWidth = DASHBOARD_SIDEBAR_MIN_WIDTH
    else if (event.key === 'End') nextWidth = DASHBOARD_SIDEBAR_MAX_WIDTH
    else if (event.key === 'ArrowLeft') nextWidth = width - DASHBOARD_SIDEBAR_KEYBOARD_STEP * directionMultiplier
    else if (event.key === 'ArrowRight') nextWidth = width + DASHBOARD_SIDEBAR_KEYBOARD_STEP * directionMultiplier
    else return

    event.preventDefault()
    nextWidth = clampDashboardSidebarWidth(nextWidth)
    updateShellWidth(nextWidth)
    onResizeCommit(nextWidth)
  }

  return (
    <aside className="relative flex min-h-dvh min-w-0 flex-col overflow-hidden border-e border-border bg-background">
      <div className="flex h-16 shrink-0 items-center justify-center gap-2 border-b border-border px-3 md:justify-between">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground',
            collapsed && 'md:hidden'
          )}
        >
          {t('dashboard.sidebar.brandMark')}
        </span>
        <span
          className={cn('hidden min-w-0 truncate font-semibold text-foreground md:block', collapsed && 'md:hidden')}
        >
          {t('dashboard.brand')}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('hidden shrink-0 md:inline-flex', collapsed && 'mx-auto')}
          aria-expanded={!collapsed}
          aria-label={t(collapsed ? 'dashboard.sidebar.expand' : 'dashboard.sidebar.collapse')}
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
          ) : (
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
          )}
        </Button>
      </div>

      <nav aria-label={t('dashboard.sidebar.navigation')} className="flex flex-1 flex-col gap-1 p-3">
        {dashboardNavigation.map(({ to, labelKey, icon: Icon }) => {
          const label = t(labelKey)

          return (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  end
                  aria-label={label}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 min-w-0 items-center justify-center gap-3 rounded-lg px-0 text-sm font-medium text-muted-foreground outline-none transition-colors md:justify-start md:px-3',
                      'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                      isActive && 'bg-accent text-accent-foreground',
                      collapsed && 'md:justify-center md:px-0'
                    )
                  }
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  <span className={cn('hidden truncate md:inline', collapsed && 'md:hidden')}>{label}</span>
                </NavLink>
              </TooltipTrigger>
              {collapsed ? <TooltipContent side="right">{label}</TooltipContent> : null}
            </Tooltip>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'w-full min-w-0 justify-center px-0 text-destructive hover:bg-destructive/10 hover:text-destructive md:justify-start md:px-4',
            collapsed && 'md:justify-center md:px-0'
          )}
          aria-label={t('dashboard.sidebar.logout')}
          onClick={logout}
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          <span className={cn('hidden truncate md:inline', collapsed && 'md:hidden')}>
            {t('dashboard.sidebar.logout')}
          </span>
        </Button>
      </div>

      {!collapsed ? (
        <div
          role="separator"
          tabIndex={0}
          aria-label={t('dashboard.sidebar.resize')}
          aria-orientation="vertical"
          aria-valuemin={DASHBOARD_SIDEBAR_MIN_WIDTH}
          aria-valuemax={DASHBOARD_SIDEBAR_MAX_WIDTH}
          aria-valuenow={width}
          className="absolute inset-y-0 end-0 z-10 hidden w-2 translate-x-1/2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:start-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent hover:after:bg-primary focus-visible:after:bg-primary md:block"
          onKeyDown={handleResizeKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishResize}
          onPointerCancel={finishResize}
        />
      ) : null}
    </aside>
  )
}
