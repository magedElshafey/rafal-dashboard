import { Routes } from '@/routes/routes'
import { lazy } from 'react'
import type { RouteObject } from 'react-router'

const ErrorRoutes: RouteObject[] = [
  {
    path: Routes.errors.unAuthorized,
    Component: lazy(() => import('@/modules/errors/pages/401')),
  },
  {
    path: Routes.errors.forbidden,
    Component: lazy(() => import('@/modules/errors/pages/Forbidden')),
  },
  {
    path: Routes.errors.internalServerError,
    Component: lazy(() => import('@/modules/errors/pages/InternalServerError')),
  },
  {
    path: Routes.errors.maintenanceError,
    Component: lazy(() => import('@/modules/errors/pages/MaintenanceError')),
  },
  {
    path: '*',
    Component: lazy(() => import('@/modules/errors/pages/NotFound')),
  },
]

export { ErrorRoutes }
