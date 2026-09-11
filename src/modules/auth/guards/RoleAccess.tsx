import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { getLoginPathByPathname } from '@/config/auth.helpers'
import { useAuth } from '@/store/auth'

import type { AppRole } from '@/modules/auth/types/auth.types'

export type TRoleAccess = {
  allowedRoles: AppRole[]
  children: ReactNode
}

export function RoleAccess({ allowedRoles, children }: TRoleAccess) {
  const location = useLocation()

  const role = useAuth((state) => state.role)
  const isAuthenticated = useAuth((state) => state.isAuthenticated)

  if (!isAuthenticated || !role) {
    return <Navigate to={getLoginPathByPathname(location.pathname)} replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />
  }

  return children
}
