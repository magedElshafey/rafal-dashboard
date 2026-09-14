import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { Navigate, Outlet } from 'react-router-dom'

import { RequireAuth } from '@/modules/auth/guards/RequireAuth'
import { DashboardShell } from '@/modules/dashboard/layout/DashboardShell'
import { Routes } from '@/routes/routes'

const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'))
const RolesPage = lazy(() => import('@/modules/roles/pages/RolesPage'))
const AdminsPage = lazy(() => import('@/modules/admins/pages/AdminsPage'))
const BannersPage = lazy(() => import('@/modules/banners/pages/BannersPage'))
const CategoriesPage = lazy(() => import('@/modules/categories/pages/CategoriesPage'))

export const PrivateRoutes: RouteObject[] = [
  {
    path: Routes.root,
    element: <Navigate to={Routes.dashboard} replace />,
  },
  {
    element: (
      <RequireAuth>
        <DashboardShell>
          <Outlet />
        </DashboardShell>
      </RequireAuth>
    ),
    children: [
      { path: Routes.dashboard, Component: DashboardPage },
      { path: Routes.roles, Component: RolesPage },
      { path: Routes.admins, Component: AdminsPage },
      { path: Routes.banners, Component: BannersPage },
      { path: Routes.categories, Component: CategoriesPage },
    ],
  },
]
