import { getSidebarItems } from '@/modules/teachers/layout/utils/sidebar-items.utils'
import { useAuth } from '@/store/auth'
import { useMemo } from 'react'

const useSidebarActions = () => {
  const role = useAuth((state) => state.role)
  const sidebarItems = useMemo(() => {
    return getSidebarItems(role)
  }, [role])
  return {
    sidebarItems,
  }
}

export default useSidebarActions
