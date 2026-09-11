import { useRef, type CSSProperties, type ReactNode } from 'react'

import { DashboardSidebar } from '@/modules/dashboard/layout/DashboardSidebar'
import { DASHBOARD_SIDEBAR_COLLAPSED_WIDTH } from '@/modules/dashboard/layout/sidebar.constants'
import { useSidebarPreferences } from '@/modules/dashboard/layout/useSidebarPreferences'

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const { collapsed, width, toggleCollapsed, commitWidth } = useSidebarPreferences()
  const shellStyle = {
    '--dashboard-sidebar-width': `${collapsed ? DASHBOARD_SIDEBAR_COLLAPSED_WIDTH : width}px`,
  } as CSSProperties

  return (
    <div
      ref={shellRef}
      data-testid="dashboard-shell"
      style={shellStyle}
      className="grid min-h-dvh grid-cols-[4rem_minmax(0,1fr)] bg-page md:grid-cols-[var(--dashboard-sidebar-width)_minmax(0,1fr)]"
    >
      <DashboardSidebar
        collapsed={collapsed}
        width={width}
        shellRef={shellRef}
        onToggleCollapsed={toggleCollapsed}
        onResizeCommit={commitWidth}
      />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
