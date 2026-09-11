import { RoleAccess, TRoleAccess } from '@/modules/auth/guards/RoleAccess'

export function RoleOnly({ allowedRoles, children }: TRoleAccess) {
  return <RoleAccess allowedRoles={allowedRoles}>{children}</RoleAccess>
}
