import { useCallback, useState } from 'react'

import {
  clampDashboardSidebarWidth,
  DASHBOARD_SIDEBAR_DEFAULT_WIDTH,
  DASHBOARD_SIDEBAR_STORAGE_KEY,
} from '@/modules/dashboard/layout/sidebar.constants'

type SidebarPreferences = {
  collapsed: boolean
  width: number
}

const DEFAULT_PREFERENCES: SidebarPreferences = {
  collapsed: false,
  width: DASHBOARD_SIDEBAR_DEFAULT_WIDTH,
}

function readSidebarPreferences(): SidebarPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES

  try {
    const storedPreferences: unknown = JSON.parse(localStorage.getItem(DASHBOARD_SIDEBAR_STORAGE_KEY) ?? 'null')

    if (!storedPreferences || typeof storedPreferences !== 'object') return DEFAULT_PREFERENCES

    const { collapsed, width } = storedPreferences as Partial<SidebarPreferences>

    return {
      collapsed: typeof collapsed === 'boolean' ? collapsed : DEFAULT_PREFERENCES.collapsed,
      width:
        typeof width === 'number' && Number.isFinite(width)
          ? clampDashboardSidebarWidth(width)
          : DEFAULT_PREFERENCES.width,
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

function persistSidebarPreferences(preferences: SidebarPreferences) {
  try {
    localStorage.setItem(DASHBOARD_SIDEBAR_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Storage can be unavailable in privacy modes. The in-memory preference still works.
  }
}

export function useSidebarPreferences() {
  const [preferences, setPreferences] = useState(readSidebarPreferences)

  const toggleCollapsed = useCallback(() => {
    setPreferences((currentPreferences) => {
      const nextPreferences = { ...currentPreferences, collapsed: !currentPreferences.collapsed }
      persistSidebarPreferences(nextPreferences)
      return nextPreferences
    })
  }, [])

  const commitWidth = useCallback((width: number) => {
    setPreferences((currentPreferences) => {
      const nextWidth = clampDashboardSidebarWidth(width)
      if (currentPreferences.width === nextWidth) return currentPreferences

      const nextPreferences = { ...currentPreferences, width: nextWidth }
      persistSidebarPreferences(nextPreferences)
      return nextPreferences
    })
  }, [])

  return { ...preferences, toggleCollapsed, commitWidth }
}
