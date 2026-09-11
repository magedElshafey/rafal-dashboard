import { useNavigate } from 'react-router-dom'

import { getDefaultLoginPath, getLoginPathByPortal } from '@/config/auth.helpers'
import { clearQueryClientAtAuthBoundary } from '@/lib/react-query/query-client'
import { useAuth } from '@/store/auth'

export function useLogout() {
  const navigate = useNavigate()

  return function logoutUser() {
    const { portal, logout } = useAuth.getState()

    const loginPath = portal ? getLoginPathByPortal(portal) : getDefaultLoginPath()

    clearQueryClientAtAuthBoundary()

    logout()

    navigate(loginPath, {
      replace: true,
    })
  }
}
