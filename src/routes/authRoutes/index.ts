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
      {
        path: Routes.forgotPassword,
        handle: { title: 'auth.forgot_password.title' },
        Component: lazy(() => import('@/modules/auth/forgot-password/page/ForgotPasswordPage')),
      },
      {
        path: Routes.resetPasswordVerification,
        handle: { title: 'auth.otp.title' },
        Component: lazy(() => import('@/modules/auth/otp/page/OtpPage')),
      },
      {
        path: Routes.resetPassword,
        handle: { title: 'auth.reset_password.title' },
        Component: lazy(() => import('@/modules/auth/reset-password/page/ResetPasswordPage')),
      },
    ],
  },
]
