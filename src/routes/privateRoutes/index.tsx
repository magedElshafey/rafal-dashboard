import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { Navigate, Outlet } from 'react-router-dom'

import { RequireAuth } from '@/modules/auth/guards/RequireAuth'
import { Routes } from '@/routes/routes'

const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'))

export const PrivateRoutes: RouteObject[] = [
  {
    path: Routes.root,
    element: <Navigate to={Routes.dashboard} replace />,
  },
  {
    element: (
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    ),
    children: [{ path: Routes.dashboard, Component: DashboardPage }],
  },
]
