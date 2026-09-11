import { lazy } from 'react'
import type { RouteObject } from 'react-router'

import { GuestOnlyOutlet } from '@/modules/auth/guards/GuestOnlyOutlet'
import { Routes } from '@/routes/routes'

export const AuthRoutes: RouteObject[] = [
  {
    Component: GuestOnlyOutlet,
    children: [
      {
        path: Routes.login,
        handle: { title: 'auth.login.default.title' },
        Component: lazy(() => import('@/modules/auth/login/pages/LoginPage')),
      },
    ],
  },
]
