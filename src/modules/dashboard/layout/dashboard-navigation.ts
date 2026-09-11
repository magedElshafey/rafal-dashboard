import { LayoutDashboard } from 'lucide-react'

import { Routes } from '@/routes/routes'

export const dashboardNavigation = [
  {
    to: Routes.dashboard,
    labelKey: 'dashboard.sidebar.dashboard',
    icon: LayoutDashboard,
  },
] as const
