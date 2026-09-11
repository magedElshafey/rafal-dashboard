import { UserRole } from '@/modules/auth/types/auth.types'
import { ReactNode } from 'react'

export type TRoleAccess = {
  allowedRoles: UserRole[]
  children: ReactNode
}
