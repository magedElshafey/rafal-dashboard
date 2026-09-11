import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import env from '@/config/env'
import { Routes } from '@/routes/routes'
import { useAuth } from '@/store/auth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isAuthenticated = useAuth((state) => state.isAuthenticated)

  if (!env.AUTH_BYPASS && !isAuthenticated) {
    return <Navigate to={Routes.login} replace state={{ from: location.pathname }} />
  }

  return children
}
