import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { DashboardSidebar } from '@/modules/dashboard/layout/DashboardSidebar'
import { DashboardTopbar } from '@/modules/dashboard/layout/DashboardTopbar'
import { DASHBOARD_SIDEBAR_COLLAPSED_WIDTH } from '@/modules/dashboard/layout/sidebar.constants'
import { useIsDesktop } from '@/modules/dashboard/layout/useIsDesktop'
import { useSidebarPreferences } from '@/modules/dashboard/layout/useSidebarPreferences'

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { t } = useTranslation()
  const shellRef = useRef<HTMLDivElement>(null)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const isDesktop = useIsDesktop()
  const { collapsed, width, toggleCollapsed, commitWidth } = useSidebarPreferences()
  const shellStyle = {
    '--dashboard-sidebar-width': `${collapsed ? DASHBOARD_SIDEBAR_COLLAPSED_WIDTH : width}px`,
  } as CSSProperties

  useEffect(() => {
    if (isDesktop || !mobileNavigationOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavigationOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isDesktop, mobileNavigationOpen])

  return (
    <div
      ref={shellRef}
      data-testid="dashboard-shell"
      style={shellStyle}
      className="dashboard-shell grid min-h-dvh w-full "
    >
      {!isDesktop && mobileNavigationOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-xs md:hidden"
          aria-label={t('dashboard.sidebar.close')}
          onClick={() => setMobileNavigationOpen(false)}
        />
      ) : null}
      <DashboardSidebar
        collapsed={collapsed}
        width={width}
        mobileOpen={mobileNavigationOpen}
        isDesktop={isDesktop}
        shellRef={shellRef}
        onMobileClose={() => setMobileNavigationOpen(false)}
        onToggleCollapsed={toggleCollapsed}
        onResizeCommit={commitWidth}
      />
      <div data-testid="dashboard-application" className="dashboard-application min-w-0">
        <DashboardTopbar onOpenNavigation={() => setMobileNavigationOpen(true)} />
        <div className="dashboard-content mx-auto min-w-0 bg-background p-6">{children}</div>
      </div>
    </div>
  )
}
