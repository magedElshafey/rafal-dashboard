import { Outlet } from 'react-router-dom'

import type { AppRole } from '@/modules/auth/types/auth.types'
import { RoleAccess } from '@/modules/auth/guards/RoleAccess'

type RoleGuardProps = {
  allowedRoles: AppRole[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  return (
    <RoleAccess allowedRoles={allowedRoles}>
      <Outlet />
    </RoleAccess>
  )
}
