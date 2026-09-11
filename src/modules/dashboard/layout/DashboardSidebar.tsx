import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useDirection } from '@/hooks/useDirection'
import { cn } from '@/lib/utils'
import { DashboardNavItem } from '@/modules/dashboard/layout/DashboardNavItem'
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
  mobileOpen: boolean
  isDesktop: boolean
  shellRef: RefObject<HTMLDivElement | null>
  onMobileClose: () => void
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
  mobileOpen,
  isDesktop,
  shellRef,
  onMobileClose,
  onToggleCollapsed,
  onResizeCommit,
}: DashboardSidebarProps) {
  const { t } = useTranslation()
  const direction = useDirection()
  const resizeSessionRef = useRef<ResizeSession | null>(null)
  const previousBodyStylesRef = useRef<{ cursor: string; userSelect: string } | null>(null)
  const directionMultiplier = direction === 'rtl' ? -1 : 1

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
    <aside
      aria-hidden={!isDesktop && !mobileOpen}
      inert={!isDesktop && !mobileOpen}
      data-direction={direction}
      data-mobile-open={mobileOpen}
      className={cn(
        'dashboard-sidebar fixed inset-y-0 start-0 z-50 flex w-72 min-w-0 flex-col overflow-hidden border-e border-border bg-sidebar shadow-xl transition-transform duration-200',
        'md:z-auto md:w-auto md:shadow-none bg-page'
      )}
    >
      <div className="inline-flex h-16 shrink-0 items-center gap-3 border-b border-border px-3 whitespace-nowrap">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
          {t('dashboard.sidebar.brandMark')}
        </span>
        <span className={cn('truncate font-semibold text-foreground', collapsed && 'md:hidden')}>
          {t('dashboard.sidebar.brand')}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ms-auto md:hidden"
          aria-label={t('dashboard.sidebar.close')}
          onClick={onMobileClose}
        >
          <X className="size-5" aria-hidden />
        </Button>
      </div>

      <nav aria-label={t('dashboard.sidebar.navigation')} className="flex flex-1 flex-col gap-1 p-3">
        {dashboardNavigation.map((item) => (
          <DashboardNavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onMobileClose} />
        ))}
      </nav>

      <div className="hidden border-t border-border p-3 md:block">
        <Button
          type="button"
          variant="ghost"
          className={cn('w-full min-w-0 justify-start text-muted-foreground', collapsed && 'justify-center px-0')}
          aria-expanded={!collapsed}
          aria-label={t(collapsed ? 'dashboard.sidebar.expand' : 'dashboard.sidebar.collapse')}
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
          ) : (
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
          )}
          <span className={cn(collapsed && 'hidden')}>
            {t(collapsed ? 'dashboard.sidebar.expand' : 'dashboard.sidebar.collapse')}
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
          className="dashboard-sidebar-resize-handle absolute inset-y-0 end-0 z-10 hidden w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:start-1/2 after:w-px after:bg-transparent hover:after:bg-primary focus-visible:after:bg-primary md:block"
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
