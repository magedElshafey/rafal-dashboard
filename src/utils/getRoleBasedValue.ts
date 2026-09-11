import type { AppRole } from '@/modules/auth/types/auth.types'

export function getRoleBasedValue<TRole extends AppRole, TValue>(
  role: AppRole | null | undefined,
  valuesByRole: Partial<Record<TRole, TValue>>,
  fallback: TValue
): TValue {
  if (!role) {
    return fallback
  }

  const hasRoleValue = Object.prototype.hasOwnProperty.call(valuesByRole, role)

  if (!hasRoleValue) {
    return fallback
  }

  return valuesByRole[role as TRole] ?? fallback
}
