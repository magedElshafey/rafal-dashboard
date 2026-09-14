import { FolderTree, Images, LayoutDashboard, ShieldCheck, UsersRound } from 'lucide-react'

import { Routes } from '@/routes/routes'

export type DashboardNavigationItem = {
  to: string
  labelKey: string
  icon: typeof LayoutDashboard
  match: 'exact' | 'prefix'
}

export const dashboardNavigation: readonly DashboardNavigationItem[] = [
  {
    to: Routes.dashboard,
    labelKey: 'dashboard.sidebar.dashboard',
    icon: LayoutDashboard,
    match: 'exact',
  },
  {
    to: Routes.roles,
    labelKey: 'dashboard.sidebar.roles',
    icon: ShieldCheck,
    match: 'prefix',
  },
  {
    to: Routes.admins,
    labelKey: 'dashboard.sidebar.admins',
    icon: UsersRound,
    match: 'prefix',
  },
  {
    to: Routes.banners,
    labelKey: 'dashboard.sidebar.banners',
    icon: Images,
    match: 'prefix',
  },
  {
    to: Routes.categories,
    labelKey: 'dashboard.sidebar.categories',
    icon: FolderTree,
    match: 'prefix',
  },
]
