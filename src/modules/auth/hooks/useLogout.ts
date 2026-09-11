import { useNavigate } from 'react-router-dom'

import { clearQueryClientAtAuthBoundary } from '@/lib/react-query/query-client'
import { Routes } from '@/routes/routes'
import { useAuth } from '@/store/auth'

export function useLogout() {
  const navigate = useNavigate()

  return function logoutUser() {
    const { logout } = useAuth.getState()

    clearQueryClientAtAuthBoundary()

    logout()

    navigate(Routes.login, {
      replace: true,
    })
  }
}
