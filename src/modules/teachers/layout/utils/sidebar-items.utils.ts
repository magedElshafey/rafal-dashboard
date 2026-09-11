import { AppRole } from '@/modules/auth/types/auth.types'
import { isTeachersRole } from '@/modules/auth/types/auth.types'
import { SIDEBAR_FALLBACK_ITEMS, SIDEBAR_ITEMS_BY_ROLE } from '@/modules/teachers/layout/constants/sidebar-items'
import { getRoleBasedValue } from '@/utils/getRoleBasedValue'
export function getSidebarItems(role: AppRole | null | undefined) {
  if (!role) return []
  if (!isTeachersRole(role)) return []
  return getRoleBasedValue(role, SIDEBAR_ITEMS_BY_ROLE, SIDEBAR_FALLBACK_ITEMS)
}
