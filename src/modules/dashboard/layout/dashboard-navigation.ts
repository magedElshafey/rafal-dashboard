import {
  Building2,
  FolderTree,
  Images,
  LayoutDashboard,
  MapPinned,
  Package,
  Settings,
  ShieldCheck,
  UsersRound,
  Warehouse,
  Truck,
} from 'lucide-react'

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
  {
    to: Routes.products,
    labelKey: 'dashboard.sidebar.products',
    icon: Package,
    match: 'prefix',
  },
  {
    to: Routes.warehouses,
    labelKey: 'dashboard.sidebar.warehouses',
    icon: Warehouse,
    match: 'prefix',
  },
  {
    to: Routes.regions,
    labelKey: 'dashboard.sidebar.regions',
    icon: MapPinned,
    match: 'prefix',
  },
  {
    to: Routes.cities,
    labelKey: 'dashboard.sidebar.cities',
    icon: Building2,
    match: 'prefix',
  },
  {
    to: Routes.settings,
    labelKey: 'dashboard.sidebar.settings',
    icon: Settings,
    match: 'prefix',
  },
  {
    to: Routes.shippingMethods,
    labelKey: 'dashboard.sidebar.shippingMethods',
    icon: Truck,
    match: 'prefix',
  },
]
