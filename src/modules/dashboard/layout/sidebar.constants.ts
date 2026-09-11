export const DASHBOARD_SIDEBAR_COLLAPSED_WIDTH = 64
export const DASHBOARD_SIDEBAR_DEFAULT_WIDTH = 256
export const DASHBOARD_SIDEBAR_MIN_WIDTH = 220
export const DASHBOARD_SIDEBAR_MAX_WIDTH = 360
export const DASHBOARD_SIDEBAR_KEYBOARD_STEP = 8
export const DASHBOARD_SIDEBAR_STORAGE_KEY = 'rafal-dashboard-sidebar'

export function clampDashboardSidebarWidth(width: number) {
  return Math.min(DASHBOARD_SIDEBAR_MAX_WIDTH, Math.max(DASHBOARD_SIDEBAR_MIN_WIDTH, width))
}
