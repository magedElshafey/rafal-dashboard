import { Navigate, Outlet } from 'react-router-dom'

import { Routes } from '@/routes/routes'
import { useAuth } from '@/store/auth'

export function GuestOnlyOutlet() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={Routes.dashboard} replace />
  }

  return <Outlet />
}
